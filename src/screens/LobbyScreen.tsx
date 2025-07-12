import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  SafeAreaView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ref, update } from 'firebase/database';
import { database } from '../config/firebase';
import { RootStackParamList, Room } from '../types';
import { useGame } from '../contexts/GameContext';
import SalaItem from '../components/common/SalaItem';
import ChatModal from '../components/common/ChatModal';
import {
  createRoom,
  joinRoom,
  listRoomsByDeck,
  leaveRoom,
  listenToRoom,
} from '../services/firebaseService';
import { addBotToRoom, removeBotFromRoom, getBotPlayers } from '../services/botService';
import { validateRoomCode, formatRoomCode } from '../utils/roomUtils';

type LobbyNavigationProp = StackNavigationProp<RootStackParamList, 'Lobby'>;

interface Props {
  navigation: LobbyNavigationProp;
}

const LobbyScreen: React.FC<Props> = ({ navigation }) => {
  const { state, setCurrentRoom } = useGame();
  const [publicRooms, setPublicRooms] = useState<Room[]>([]);
  const [roomCode, setRoomCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  
  // Ref para evitar múltiplas execuções
  const currentRoomIdRef = useRef<string | null>(null);

  useEffect(() => {
    loadPublicRooms();
  }, [state.selectedDeck]);

  // useEffect corrigido para escutar mudanças na sala
  useEffect(() => {
    const roomId = state.currentRoom?.id;
    
    // Se não há sala ou o ID não mudou, não faz nada
    if (!roomId || currentRoomIdRef.current === roomId) {
      return;
    }
    
    // Atualiza a referência
    currentRoomIdRef.current = roomId;
    
    console.log('🎯 Iniciando escuta da sala:', roomId);
    
    const unsubscribe = listenToRoom(roomId, (updatedRoom) => {
      console.log('📡 Sala atualizada:', updatedRoom?.code || 'null');
      
      if (!updatedRoom) {
        // Sala foi deletada
        console.log('🗑️ Sala foi deletada');
        currentRoomIdRef.current = null;
        setCurrentRoom(null);
        Alert.alert('Aviso', 'A sala foi encerrada.');
        return;
      }
      
      // Atualiza a sala no contexto
      setCurrentRoom(updatedRoom);
      
      // Se o jogo iniciou, navega para a tela de jogo
      if (updatedRoom.status === 'playing') {
        console.log('🎮 Jogo iniciado, navegando...');
        navigation.navigate('Game', { roomId: updatedRoom.id });
      }
    });

    // Cleanup function
    return () => {
      console.log('🧹 Limpando escuta da sala:', roomId);
      unsubscribe();
    };
  }, [state.currentRoom?.id, setCurrentRoom, navigation]);

  // Cleanup quando sair da sala
  useEffect(() => {
    if (!state.currentRoom) {
      currentRoomIdRef.current = null;
    }
  }, [state.currentRoom]);

  const loadPublicRooms = async () => {
    if (!state.selectedDeck) return;

    try {
      const rooms = await listRoomsByDeck(state.selectedDeck.id);
      setPublicRooms(rooms);
    } catch (error) {
      console.error('Erro ao carregar salas:', error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadPublicRooms();
    setIsRefreshing(false);
  };

  const handleCreateRoom = async (isPrivate: boolean = false) => {
    if (!state.selectedDeck) {
      Alert.alert('Erro', 'Nenhum baralho selecionado');
      return;
    }

    setIsLoading(true);
    try {
      const room = await createRoom(
        state.playerNickname,
        state.selectedDeck.id,
        state.selectedDeck.name,
        isPrivate
      );
      
      setCurrentRoom(room);
      Alert.alert(
        'Sala Criada!',
        `Código da sala: ${room.code}\n\nCompartilhe este código com outros jogadores.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível criar a sala');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinRoom = async (room?: Room) => {
    setIsLoading(true);
    try {
      let targetRoom: Room;
      
      if (room) {
        // Entrando via lista de salas públicas
        targetRoom = await joinRoom(room.code, state.playerNickname);
      } else {
        // Entrando via código
        if (!validateRoomCode(roomCode)) {
          Alert.alert('Erro', 'Código inválido. Use 6 caracteres (letras e números).');
          return;
        }
        
        targetRoom = await joinRoom(roomCode, state.playerNickname);
      }
      
      setCurrentRoom(targetRoom);
      setRoomCode('');
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Não foi possível entrar na sala');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeaveRoom = async () => {
    if (!state.currentRoom) return;

    Alert.alert(
      'Sair da Sala',
      'Tem certeza que deseja sair da sala?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            try {
              await leaveRoom(state.currentRoom!.id, state.playerNickname);
              setCurrentRoom(null);
            } catch (error) {
              console.error('Erro ao sair da sala:', error);
            }
          },
        },
      ]
    );
  };

  // Função para alternar status de "pronto"
  const toggleReadyStatus = async () => {
    if (!state.currentRoom) return;

    const currentStatus = state.currentRoom.players[state.playerNickname]?.isReady || false;
    
    try {
      const updates = {
        [`rooms/${state.currentRoom.id}/players/${state.playerNickname}/isReady`]: !currentStatus,
        [`rooms/${state.currentRoom.id}/lastActivity`]: new Date().toISOString(),
      };

      await update(ref(database), updates);
    } catch (error) {
      console.error('Erro ao alterar status:', error);
    }
  };

  // Função para iniciar o jogo
  const handleStartGame = async () => {
    if (!state.currentRoom) return;

    // Verificar se há pelo menos 2 jogadores
    const playerCount = Object.keys(state.currentRoom.players).length;
    if (playerCount < 2) {
      Alert.alert(
        'Jogadores Insuficientes',
        'É necessário pelo menos 2 jogadores para iniciar o jogo.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Verificar se todos os jogadores estão prontos (opcional)
    const allReady = Object.values(state.currentRoom.players).every(player => player.isReady);
    if (!allReady) {
      Alert.alert(
        'Confirmar Início',
        'Nem todos os jogadores estão marcados como "prontos". Deseja iniciar mesmo assim?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Iniciar', onPress: () => startGameNow() }
        ]
      );
      return;
    }

    startGameNow();
  };

  const startGameNow = async () => {
    if (!state.currentRoom) return;

    setIsLoading(true);
    try {
      // Atualizar status da sala para "playing"
      const updates = {
        [`rooms/${state.currentRoom.id}/status`]: 'playing',
        [`rooms/${state.currentRoom.id}/lastActivity`]: new Date().toISOString(),
      };

      await update(ref(database), updates);

      // Navegar para a tela do jogo
      navigation.navigate('Game', { roomId: state.currentRoom.id });
    } catch (error) {
      console.error('Erro ao iniciar jogo:', error);
      Alert.alert(
        'Erro',
        'Não foi possível iniciar o jogo. Tente novamente.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  // FUNÇÕES DOS BOTS
  const handleAddBot = async (difficulty: 'easy' | 'medium' | 'hard' = 'medium') => {
    if (!state.currentRoom) return;

    const currentPlayerCount = Object.keys(state.currentRoom.players).length;
    if (currentPlayerCount >= state.currentRoom.maxPlayers) {
      Alert.alert('Sala Lotada', 'Não é possível adicionar mais jogadores.');
      return;
    }

    setIsLoading(true);
    try {
      const botName = await addBotToRoom(state.currentRoom.id, difficulty);
      console.log(`Bot ${botName} adicionado com sucesso`);
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Não foi possível adicionar o bot');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveBot = async () => {
    if (!state.currentRoom) return;

    const bots = getBotPlayers(state.currentRoom.players);
    if (bots.length === 0) {
      Alert.alert('Aviso', 'Não há bots na sala para remover.');
      return;
    }

    // Se há apenas um bot, remove diretamente
    if (bots.length === 1) {
      const botName = bots[0].nickname;
      confirmRemoveBot(botName);
      return;
    }

    // Se há múltiplos bots, mostra opções
    const botOptions = bots.map(bot => ({
      text: bot.nickname,
      onPress: () => confirmRemoveBot(bot.nickname),
    }));

    Alert.alert(
      'Remover Bot',
      'Selecione qual bot deseja remover:',
      [
        ...botOptions,
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  };

  const confirmRemoveBot = (botName: string) => {
    Alert.alert(
      'Confirmar Remoção',
      `Deseja remover o bot "${botName}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: () => executeRemoveBot(botName),
        },
      ]
    );
  };

  const executeRemoveBot = async (botName: string) => {
    if (!state.currentRoom) return;

    setIsLoading(true);
    try {
      await removeBotFromRoom(state.currentRoom.id, botName);
      console.log(`Bot ${botName} removido com sucesso`);
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Não foi possível remover o bot');
    } finally {
      setIsLoading(false);
    }
  };

  // Se estiver em uma sala, mostra interface da sala
  if (state.currentRoom && state.currentRoom.players) {
    const players = state.currentRoom.players || {};
    const playerCount = Object.keys(players).length;
    const maxPlayers = state.currentRoom.maxPlayers || 4;

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.roomContainer}>
          {/* Header da sala */}
          <View style={styles.roomHeader}>
            <View>
              <Text style={styles.roomTitle}>
                Sala {state.currentRoom.code || 'N/A'}
              </Text>
              <Text style={styles.roomSubtitle}>
                {state.currentRoom.deckName || 'Baralho não definido'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.leaveButton}
              onPress={handleLeaveRoom}
            >
              <Text style={styles.leaveButtonText}>Sair</Text>
            </TouchableOpacity>
          </View>

          {/* Controles de Bot (apenas para o host) */}
          {state.currentRoom.hostNickname === state.playerNickname && (
            <View style={styles.botControlsSection}>
              <Text style={styles.sectionTitle}>Controles de Bot</Text>
              
              <View style={styles.botButtonsContainer}>
                <TouchableOpacity
                  style={[
                    styles.botButton,
                    styles.addBotButton,
                    Object.keys(state.currentRoom.players).length >= state.currentRoom.maxPlayers && styles.botButtonDisabled
                  ]}
                  onPress={() => {
                    Alert.alert(
                      'Adicionar Bot',
                      'Escolha a dificuldade do bot:',
                      [
                        { text: 'Fácil', onPress: () => handleAddBot('easy') },
                        { text: 'Médio', onPress: () => handleAddBot('medium') },
                        { text: 'Difícil', onPress: () => handleAddBot('hard') },
                        { text: 'Cancelar', style: 'cancel' },
                      ]
                    );
                  }}
                  disabled={Object.keys(state.currentRoom.players).length >= state.currentRoom.maxPlayers || isLoading}
                >
                  <Text style={styles.botButtonText}>🤖 Adicionar Bot</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.botButton,
                    styles.removeBotButton,
                    getBotPlayers(state.currentRoom.players).length === 0 && styles.botButtonDisabled
                  ]}
                  onPress={handleRemoveBot}
                  disabled={getBotPlayers(state.currentRoom.players).length === 0 || isLoading}
                >
                  <Text style={styles.botButtonText}>🗑️ Remover Bot</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.botInfo}>
                Bots: {getBotPlayers(state.currentRoom.players).length} | 
                Humanos: {Object.values(state.currentRoom.players).filter(p => !p.isBot).length}
              </Text>
            </View>
          )}

          {/* Lista de jogadores - COM VERIFICAÇÕES */}
          <View style={styles.playersSection}>
            <Text style={styles.sectionTitle}>
              Jogadores ({playerCount}/{maxPlayers})
            </Text>
            <ScrollView style={styles.playersList}>
              {playerCount > 0 ? (
                Object.values(players).map((player) => (
                  <View key={player.nickname} style={styles.playerItem}>
                    <Text style={styles.playerName}>
                      {player.nickname}
                      {player.isHost && ' 👑'}
                      {player.isBot && ' 🤖'}
                    </Text>
                    <Text style={[
                      styles.playerStatus,
                      player.isReady && styles.playerReady
                    ]}>
                      {player.isBot ? 
                        `Bot (${player.botDifficulty || 'medium'})` : 
                        (player.isReady ? 'Pronto' : 'Aguardando')
                      }
                    </Text>
                  </View>
                ))
              ) : (
                <View style={styles.emptyPlayersContainer}>
                  <Text style={styles.emptyPlayersText}>
                    Carregando jogadores...
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>

          {/* Botões de ação */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={styles.chatButton}
              onPress={() => setShowChatModal(true)}
            >
              <Text style={styles.chatButtonText}>💬 Chat</Text>
            </TouchableOpacity>

            {/* Botão "Pronto" para jogadores não-host */}
            {state.currentRoom.hostNickname !== state.playerNickname && (
              <TouchableOpacity
                style={[
                  styles.readyButton,
                  state.currentRoom.players[state.playerNickname]?.isReady && styles.readyButtonActive
                ]}
                onPress={toggleReadyStatus}
              >
                <Text style={[
                  styles.readyButtonText,
                  state.currentRoom.players[state.playerNickname]?.isReady && styles.readyButtonTextActive
                ]}>
                  {state.currentRoom.players[state.playerNickname]?.isReady ? '✓ Pronto' : 'Marcar como Pronto'}
                </Text>
              </TouchableOpacity>
            )}
            
            {/* Botão "Iniciar Jogo" apenas para o host */}
            {state.currentRoom.hostNickname === state.playerNickname && (
              <TouchableOpacity
                style={[
                  styles.startButton,
                  isLoading && styles.startButtonDisabled
                ]}
                onPress={handleStartGame}
                disabled={isLoading}
              >
                <Text style={styles.startButtonText}>
                  {isLoading ? 'Iniciando...' : 'Iniciar Jogo'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Chat Modal */}
        <ChatModal
          visible={showChatModal}
          onClose={() => setShowChatModal(false)}
          roomId={state.currentRoom.id}
          playerNickname={state.playerNickname}
        />
      </SafeAreaView>
    );
  }

  // Interface principal do lobby
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🎮 Lobby</Text>
        <Text style={styles.subtitle}>
          {state.playerNickname} • {state.selectedDeck?.name}
        </Text>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Criar Sala */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Criar Nova Sala</Text>
          <View style={styles.createButtons}>
            <TouchableOpacity
              style={[styles.button, styles.buttonPrimary]}
              onPress={() => handleCreateRoom(false)}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>
                {isLoading ? 'Criando...' : 'Sala Pública'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.buttonSecondary]}
              onPress={() => handleCreateRoom(true)}
              disabled={isLoading}
            >
              <Text style={styles.buttonTextSecondary}>
                {isLoading ? 'Criando...' : 'Sala Privada'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Entrar com Código */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Entrar com Código</Text>
          <View style={styles.joinContainer}>
            <TextInput
              style={styles.codeInput}
              value={roomCode}
              onChangeText={(text) => setRoomCode(formatRoomCode(text))}
              placeholder="Digite o código"
              placeholderTextColor="#999"
              maxLength={6}
              autoCapitalize="characters"
              returnKeyType="join"
              onSubmitEditing={() => handleJoinRoom()}
            />
            <TouchableOpacity
              style={[
                styles.joinButton,
                (!validateRoomCode(roomCode) || isLoading) && styles.joinButtonDisabled
              ]}
              onPress={() => handleJoinRoom()}
              disabled={!validateRoomCode(roomCode) || isLoading}
            >
              <Text style={styles.joinButtonText}>
                {isLoading ? '...' : 'Entrar'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Salas Públicas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Salas Públicas ({publicRooms.length})
          </Text>
          {publicRooms.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                Nenhuma sala pública disponível.{'\n'}
                Seja o primeiro a criar uma!
              </Text>
            </View>
          ) : (
            publicRooms.map((room) => (
              <SalaItem
                key={room.id}
                room={room}
                onJoin={handleJoinRoom}
                isLoading={isLoading}
              />
            ))
          )}
        </View>
      </ScrollView>

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    padding: 24,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 24,
    backgroundColor: '#FFF',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  createButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonPrimary: {
    backgroundColor: '#007AFF',
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  buttonTextSecondary: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  joinContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  codeInput: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: 'monospace',
    textAlign: 'center',
  },
  joinButton: {
    paddingHorizontal: 24,
    height: 48,
    backgroundColor: '#007AFF',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  joinButtonDisabled: {
    backgroundColor: '#CCC',
  },
  joinButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    lineHeight: 24,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Estilos para quando está em uma sala
  roomContainer: {
    flex: 1,
    padding: 24,
  },
  roomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#FFF',
    borderRadius: 12,
  },
  roomTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  roomSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  leaveButton: {
    backgroundColor: '#F44336',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  leaveButtonText: {
    color: '#FFF',
    fontWeight: '600',
  },
  // Estilos para controles de bot
  botControlsSection: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  botButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  botButton: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBotButton: {
    backgroundColor: '#4CAF50',
  },
  removeBotButton: {
    backgroundColor: '#F44336',
  },
  botButtonDisabled: {
    backgroundColor: '#CCC',
    opacity: 0.6,
  },
  botButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  botInfo: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  playersSection: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  playersList: {
    maxHeight: 200,
  },
  playerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  playerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  playerStatus: {
    fontSize: 14,
    color: '#999',
  },
  playerReady: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  emptyPlayersContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyPlayersText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  chatButton: {
    flex: 1,
    height: 48,
    backgroundColor: '#FF9800',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  readyButton: {
    flex: 1,
    height: 48,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#4CAF50',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  readyButtonActive: {
    backgroundColor: '#4CAF50',
  },
  readyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
  },
  readyButtonTextActive: {
    color: '#FFF',
  },
  startButton: {
    flex: 2,
    height: 48,
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  startButtonDisabled: {
    backgroundColor: '#CCC',
    opacity: 0.6,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});

export default LobbyScreen;
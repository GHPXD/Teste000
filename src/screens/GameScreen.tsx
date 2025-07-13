// src/screens/GameScreen.tsx

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, GameState, Card, RoundResult } from '../types';
import { useGame } from '../contexts/GameContext';
import {
  startGame,
  playCard,
  selectAttribute,
  processRoundResult,
  startNextRound,
  listenToGameState,
} from '../services/gameService';
import { getDeckCards } from '../data/decks';
import Carta from '../components/game/Carta';
import RodadaInfo from '../components/game/RodadaInfo';
import ResultadoModal from '../components/game/ResultadoModal';
import SpinWheel from '../components/game/SpinWheel';
import BotController from '../components/game/BotController';

type GameScreenRouteProp = RouteProp<RootStackParamList, 'Game'>;
type GameScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Game'>;

interface Props {
  route: GameScreenRouteProp;
  navigation: GameScreenNavigationProp;
}

const GameScreen: React.FC<Props> = ({ route, navigation }) => {
  const { roomId } = route.params;
  const { state } = useGame();

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [allCards, setAllCards] = useState<Card[]>([]);
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [currentRoundResult, setCurrentRoundResult] = useState<RoundResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const isProcessingRound = useRef(false);

  const handleStartGame = useCallback(async (cards: Card[]) => {
    if (!state.currentRoom || !state.currentRoom.players) {
        Alert.alert('Erro', 'Dados da sala não estão disponíveis');
        return;
    }
    const players = Object.keys(state.currentRoom.players);
    if (players.length < 2) {
        Alert.alert('Erro', 'É necessário pelo menos 2 jogadores para iniciar');
        return;
    }

    setIsLoading(true);
    try {
        await startGame(roomId, players, cards);
    } catch (error) {
        Alert.alert('Erro', 'Não foi possível iniciar o jogo');
    } finally {
        setIsLoading(false);
    }
  }, [roomId, state.currentRoom]);

  const updatePlayerHand = useCallback((currentGameState: GameState | null, cards: Card[]) => {
    if (!currentGameState || !cards.length || !currentGameState.playerCards || !state.playerNickname) {
        setPlayerHand([]);
        return;
    }
    if (currentGameState.gamePhase === 'spinning') {
        return;
    }

    const playerCardIds = currentGameState.playerCards[state.playerNickname] || [];
    const hand = playerCardIds.map(id => cards.find(card => card.id === id)).filter(Boolean) as Card[];
      
    setPlayerHand(prevHand => {
        if (JSON.stringify(prevHand.map(c => c.id)) !== JSON.stringify(hand.map(c => c.id))) {
            return hand;
        }
        return prevHand;
    });
  }, [state.playerNickname]);

  useEffect(() => {
    if (!state.selectedDeck) {
      navigation.goBack();
      return;
    }
    setAllCards(getDeckCards(state.selectedDeck.id));
  }, [state.selectedDeck, navigation]);

  useEffect(() => {
    if (!state.currentRoom || !state.currentRoom.players || Object.keys(state.currentRoom.players).length === 0) {
      navigation.goBack();
    }
  }, [state.currentRoom, navigation]);

  useEffect(() => {
    if (!state.currentRoom || !allCards.length || gameState) {
      return;
    }
    if (state.currentRoom.hostNickname === state.playerNickname) {
      handleStartGame(allCards);
    }
  }, [state.currentRoom, allCards, gameState, state.playerNickname, handleStartGame]);

  useEffect(() => {
    const unsubscribe = listenToGameState(roomId, setGameState);
    return () => unsubscribe();
  }, [roomId]);

  useEffect(() => {
    updatePlayerHand(gameState, allCards);
  }, [gameState, allCards, updatePlayerHand]);

  useEffect(() => {
    if (gameState?.gamePhase === 'revealing' && !isProcessingRound.current) {
        const allPlayersPlayed = Object.keys(gameState.currentRoundCards).length === Object.keys(state.currentRoom?.players || {}).length;

        if (allPlayersPlayed && gameState.selectedAttribute) {
            isProcessingRound.current = true;
            processRoundResult(roomId, gameState, allCards).finally(() => {
                isProcessingRound.current = false;
            });
        }
    }

    if ((gameState?.gamePhase === 'comparing' || gameState?.gamePhase === 'finished') && gameState.roundHistory.length > 0) {
        const lastResult = gameState.roundHistory[gameState.roundHistory.length - 1];
        if (lastResult.roundNumber === gameState.currentRound) {
            setCurrentRoundResult(lastResult);
            setShowResultModal(true);
        }
    }
  }, [gameState, roomId, allCards, state.currentRoom?.players]);

  const handleCardSelect = (card: Card) => {
    if (!gameState || gameState.gamePhase !== 'selecting' || (gameState.currentRoundCards && gameState.currentRoundCards[state.playerNickname])) return;
    setSelectedCardId(card.id);
  };

  const handlePlayCard = async () => {
    if (!selectedCardId || !gameState) return;
    setIsLoading(true);
    try {
      await playCard(roomId, state.playerNickname, selectedCardId);
      setSelectedCardId(null);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível jogar a carta');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAttributeSelect = async (attribute: string) => {
    if (!gameState || gameState.currentPlayer !== state.playerNickname) return;
    setIsLoading(true);
    try {
      await selectAttribute(roomId, attribute);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível selecionar o atributo');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNextRound = async () => {
    if (state.playerNickname !== state.currentRoom?.hostNickname) {
      Alert.alert("Aguarde", "Apenas o host da sala pode iniciar a próxima rodada.");
      return;
    }
    setIsLoading(true);
    try {
      await startNextRound(roomId);
      setShowResultModal(false);
    } catch (error) {
      Alert.alert("Erro", "Não foi possível iniciar a próxima rodada.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCloseModal = () => {
    if (gameState?.gameWinner) {
      navigation.goBack();
    }
  };
  
  if (!state.currentRoom || !state.currentRoom.players || !gameState) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Carregando jogo...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  const players = Object.keys(state.currentRoom.players);
  const isCurrentPlayer = gameState.currentPlayer === state.playerNickname;
  const hasPlayedCard = !!(gameState.currentRoundCards && gameState.currentRoundCards[state.playerNickname]);

  if (gameState.gamePhase === 'spinning') {
    return (
      <SafeAreaView style={styles.container}>
        <SpinWheel players={players} selectedPlayer={gameState.currentPlayer} isSpinning onSpinComplete={() => {}} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <RodadaInfo gameState={gameState} playerNickname={state.playerNickname} playerCount={players.length} />

      <BotController roomId={roomId} gameState={gameState} players={state.currentRoom.players} allCards={allCards} />

      <ScrollView style={styles.gameArea} contentContainerStyle={styles.gameContent}>
        {players.length > 0 && (
          <View style={styles.opponentsArea}>
            <Text style={styles.sectionTitle}>Outros Jogadores</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {players.filter(p => p !== state.playerNickname).map(player => {
                const playerData = state.currentRoom?.players?.[player];
                if (!playerData) return null;
                
                return (
                  <View key={player} style={styles.opponentCard}>
                    <Text style={styles.opponentName}>
                      {player}
                      {playerData.isBot && ' 🤖'}
                    </Text>
                    <View style={styles.opponentCardBack}>
                      <Text style={styles.cardCount}>
                        {gameState.playerCards?.[player]?.length || 0}
                      </Text>
                      <Text style={styles.cardCountLabel}>cartas</Text>
                    </View>
                    {gameState.currentRoundCards?.[player] && (
                      <View style={styles.playedCardIndicator}>
                        <Text style={styles.playedCardText}>✓ Jogou</Text>
                      </View>
                    )}
                    {playerData.isBot && gameState.currentPlayer === player && (
                      <View style={styles.botThinkingIndicator}>
                        <Text style={styles.botThinkingText}>💭 Pensando...</Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </ScrollView>
          </View>
        )}

        {Object.keys(gameState.currentRoundCards || {}).length > 0 && (gameState.gamePhase === 'revealing' || gameState.gamePhase === 'comparing') && (
          <View style={styles.revealedCardsArea}>
            <Text style={styles.sectionTitle}>Cartas da Rodada</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {Object.entries(gameState.currentRoundCards || {}).map(([player, cardId]) => {
                const card = allCards.find(c => c.id === cardId);
                return card ? (
                  <View key={player} style={styles.revealedCardContainer}>
                    <Text style={styles.revealedPlayerName}>{player}</Text>
                    <Carta
                      card={card}
                      isRevealed={true}
                      isSelected={false}
                      isSelectable={false}
                      selectedAttribute={gameState.selectedAttribute || undefined}
                    />
                  </View>
                ) : null;
              })}
            </ScrollView>
          </View>
        )}

        <View style={styles.playerHandArea}>
          <Text style={styles.sectionTitle}>Suas Cartas ({playerHand.length})</Text>
          {gameState.gamePhase === 'selecting' && !hasPlayedCard && (
            <Text style={styles.instruction}>
              {isCurrentPlayer ? 'Escolha uma carta e depois selecione o atributo' : 'Escolha uma carta para jogar'}
            </Text>
          )}
          {gameState.gamePhase === 'selecting' && hasPlayedCard && (
            <Text style={styles.waitingText}>Aguardando outros jogadores...</Text>
          )}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {playerHand.map(card => (
              <Carta
                key={card.id}
                card={card}
                isRevealed={selectedCardId === card.id}
                isSelected={selectedCardId === card.id}
                isSelectable={gameState.gamePhase === 'selecting' && !hasPlayedCard}
                selectedAttribute={gameState.selectedAttribute || undefined}
                onSelect={() => handleCardSelect(card)}
              />
            ))}
          </ScrollView>
        </View>

        {selectedCardId && isCurrentPlayer && !gameState.selectedAttribute && (
          <View style={styles.attributeSelectionArea}>
            <Text style={styles.sectionTitle}>Escolha o Atributo</Text>
            <Text style={styles.instruction}>Selecione qual atributo será usado para comparar as cartas</Text>
            {allCards.find(c => c.id === selectedCardId) && (
              <View style={styles.attributeButtons}>
                {Object.keys(allCards.find(c => c.id === selectedCardId)!.attributes).map(attribute => (
                  <TouchableOpacity
                    key={attribute}
                    style={styles.attributeButton}
                    onPress={() => handleAttributeSelect(attribute)}
                    disabled={isLoading}
                  >
                    <Text style={styles.attributeButtonText}>{attribute}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      <View style={styles.actionArea}>
        {gameState.gamePhase === 'selecting' && selectedCardId && !hasPlayedCard && (
          <TouchableOpacity style={[styles.actionButton, styles.playButton]} onPress={handlePlayCard} disabled={isLoading}>
            <Text style={styles.actionButtonText}>{isLoading ? 'Jogando...' : 'Jogar Carta'}</Text>
          </TouchableOpacity>
        )}
      </View>

      <ResultadoModal
        visible={showResultModal}
        roundResult={currentRoundResult}
        allCards={allCards}
        playerNickname={state.playerNickname}
        onClose={handleCloseModal}
        onNextRound={handleNextRound}
        isGameFinished={!!gameState.gameWinner}
        gameWinner={gameState.gameWinner || undefined}
        // CORREÇÃO APLICADA AQUI:
        isHost={state.playerNickname === state.currentRoom.hostNickname}
      />

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#FFF" />
          <Text style={styles.loadingOverlayText}>Processando...</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F5F5' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
    loadingText: { fontSize: 18, color: '#666', marginBottom: 16, textAlign: 'center' },
    gameArea: { flex: 1 },
    gameContent: { padding: 16, paddingBottom: 24 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 12, textAlign: 'center' },
    instruction: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 16, fontStyle: 'italic' },
    waitingText: { fontSize: 14, color: '#4CAF50', textAlign: 'center', marginBottom: 16, fontWeight: '600' },
    opponentsArea: { marginBottom: 24 },
    opponentCard: { alignItems: 'center', marginRight: 16, padding: 12, backgroundColor: '#FFF', borderRadius: 8, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
    opponentName: { fontSize: 12, fontWeight: '600', color: '#333', marginBottom: 8 },
    opponentCardBack: { width: 60, height: 80, backgroundColor: '#1a237e', borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    cardCount: { fontSize: 16, fontWeight: 'bold', color: '#FFF' },
    cardCountLabel: { fontSize: 10, color: '#FFF' },
    playedCardIndicator: { backgroundColor: '#4CAF50', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, marginTop: 4 },
    playedCardText: { fontSize: 10, color: '#FFF', fontWeight: 'bold' },
    botThinkingIndicator: { backgroundColor: '#FF9800', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginTop: 4 },
    botThinkingText: { fontSize: 9, color: '#FFF', fontWeight: 'bold' },
    revealedCardsArea: { marginBottom: 24 },
    revealedCardContainer: { alignItems: 'center', marginRight: 16 },
    revealedPlayerName: { fontSize: 12, fontWeight: '600', color: '#333', marginBottom: 8 },
    playerHandArea: { marginBottom: 24 },
    attributeSelectionArea: { backgroundColor: '#FFF', padding: 16, borderRadius: 12, marginBottom: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
    attributeButtons: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
    attributeButton: { backgroundColor: '#2196F3', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 8, minWidth: 120 },
    attributeButtonText: { color: '#FFF', fontSize: 14, fontWeight: '600', textAlign: 'center' },
    actionArea: { padding: 16, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#E0E0E0' },
    actionButton: { height: 56, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    playButton: { backgroundColor: '#4CAF50' },
    actionButtonText: { fontSize: 18, fontWeight: '600', color: '#FFF' },
    loadingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.7)', justifyContent: 'center', alignItems: 'center' },
    loadingOverlayText: { color: '#FFF', fontSize: 16, marginTop: 16 },
});

export default GameScreen;
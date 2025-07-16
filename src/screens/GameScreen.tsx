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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const insets = useSafeAreaInsets();

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [allCards, setAllCards] = useState<Card[]>([]);
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [tentativeAttribute, setTentativeAttribute] = useState<string | null>(null);
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
    if (gameState?.gamePhase === 'selecting') {
      setSelectedCardId(null);
      setTentativeAttribute(null);
    }
  }, [gameState?.currentRound, gameState?.gamePhase]);

  useEffect(() => {
    if (gameState?.gamePhase === 'revealing' && !isProcessingRound.current) {
        const activePlayersCount = Object.values(state.currentRoom?.players || {}).filter(p => p.status === 'active').length;
        if (Object.keys(gameState.currentRoundCards).length === activePlayersCount && gameState.selectedAttribute) {
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

  const handleNextRound = useCallback(async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      await startNextRound(roomId);
      setShowResultModal(false);
    } catch (error) {
      Alert.alert("Erro", "Não foi possível iniciar a próxima rodada.");
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, roomId]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showResultModal && gameState?.gamePhase === 'comparing' && state.currentRoom?.hostNickname === state.playerNickname) {
      timer = setTimeout(() => {
        handleNextRound();
      }, 5000);
    }
    return () => clearTimeout(timer);
  }, [showResultModal, gameState, state.currentRoom, state.playerNickname, handleNextRound]);

  const handleCardSelect = (card: Card) => {
    if (hasPlayedCard) return; // Não faz nada se já jogou

    const cardId = card.id;
    const isCurrentPlayer = gameState?.currentPlayer === state.playerNickname;

    // Lógica para o jogador da vez (mandante)
    if (isCurrentPlayer) {
        if (selectedCardId === cardId) {
            setSelectedCardId(null); // Des-seleciona ao clicar de novo
            setTentativeAttribute(null);
        } else {
            setSelectedCardId(cardId); // Seleciona a carta
            setTentativeAttribute(null); // Reseta o atributo
        }
    } else {
        // Lógica para jogador normal: seleciona e joga de uma vez
        setSelectedCardId(cardId);
        handlePlayCardForNonCurrentPlayer(cardId);
    }
  };
  
  const handlePlayCardForNonCurrentPlayer = async (cardId: string) => {
    setIsLoading(true);
    try {
      await playCard(roomId, state.playerNickname, cardId);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível jogar a carta');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmTurn = async () => {
    if (!selectedCardId || !tentativeAttribute) return;
    setIsLoading(true);
    try {
      await playCard(roomId, state.playerNickname, selectedCardId);
      await selectAttribute(roomId, tentativeAttribute);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível confirmar a jogada.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCloseModal = () => {
    setShowResultModal(false);
    if (gameState?.gameWinner) {
      navigation.goBack();
    }
  };
  
  if (!state.currentRoom || !state.currentRoom.players || !gameState) {
    return (<SafeAreaView style={styles.container}><View style={styles.loadingContainer}><ActivityIndicator size="large" color="#007AFF" /><Text style={styles.loadingText}>Carregando jogo...</Text></View></SafeAreaView>);
  }
  
  const players = Object.values(state.currentRoom.players);
  const isCurrentPlayer = gameState.currentPlayer === state.playerNickname;
  const hasPlayedCard = !!(gameState.currentRoundCards && gameState.currentRoundCards[state.playerNickname]);

  if (gameState.gamePhase === 'spinning') {
    return (<SafeAreaView style={styles.container}><SpinWheel players={Object.keys(state.currentRoom.players)} selectedPlayer={gameState.currentPlayer} isSpinning onSpinComplete={() => {}} /></SafeAreaView>);
  }
  
  const shouldShowFullHand = !selectedCardId || hasPlayedCard;

  return (
    <SafeAreaView style={styles.container}>
      <RodadaInfo gameState={gameState} playerNickname={state.playerNickname} playerCount={players.filter(p => p.status === 'active').length} />
      <BotController roomId={roomId} gameState={gameState} players={state.currentRoom.players} allCards={allCards} />
      <ScrollView style={styles.gameArea} contentContainerStyle={styles.gameContent}>
        {players.length > 0 && (<View style={styles.opponentsArea}><Text style={styles.sectionTitle}>Outros Jogadores</Text><ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {players.filter(p => p.nickname !== state.playerNickname).map(player => {
            const isEliminated = player.status === 'eliminated';
            return (<View key={player.nickname} style={[styles.opponentCard, isEliminated && styles.eliminatedOpponent]}><Text style={styles.opponentName}>{player.nickname}{player.isBot && ' 🤖'}</Text><View style={styles.opponentCardBack}><Text style={styles.cardCount}>{gameState.playerCards?.[player.nickname]?.length || 0}</Text><Text style={styles.cardCountLabel}>cartas</Text></View>{isEliminated ? (<View style={styles.eliminatedOverlay}><Text style={styles.eliminatedText}>ELIMINADO</Text></View>) : (<>{gameState.currentRoundCards?.[player.nickname] && (<View style={styles.playedCardIndicator}><Text style={styles.playedCardText}>✓ Jogou</Text></View>)}{player.isBot && gameState.currentPlayer === player.nickname && (<View style={styles.botThinkingIndicator}><Text style={styles.botThinkingText}>💭 Pensando...</Text></View>)}</>)}</View>);
            })}</ScrollView></View>)}
        {Object.keys(gameState.currentRoundCards || {}).length > 0 && (gameState.gamePhase === 'revealing' || gameState.gamePhase === 'comparing') && (<View style={styles.revealedCardsArea}><Text style={styles.sectionTitle}>Cartas da Rodada</Text><ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {Object.entries(gameState.currentRoundCards || {}).map(([player, cardId]) => {
            const card = allCards.find(c => c.id === cardId);
            return card ? (<View key={player} style={styles.revealedCardContainer}><Text style={styles.revealedPlayerName}>{player}</Text><Carta card={card} isRevealed={true} isSelected={false} isSelectable={false} selectedAttribute={gameState.selectedAttribute || undefined} /></View>) : null;
            })}</ScrollView></View>)}
        <View style={styles.playerHandArea}>
          <Text style={styles.sectionTitle}>Suas Cartas ({playerHand.length})</Text>
          {gameState.gamePhase === 'selecting' && !hasPlayedCard && (<Text style={styles.instruction}>{isCurrentPlayer ? 'Vire sua carta e escolha um atributo' : 'Vire sua carta para jogar'}</Text>)}
          {gameState.gamePhase === 'selecting' && hasPlayedCard && (<Text style={styles.waitingText}>Aguardando outros jogadores...</Text>)}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.handScroll}>
            {playerHand.map(card => {
                if (!shouldShowFullHand && card.id !== selectedCardId) return null;
                return (
                    <Carta
                        key={card.id}
                        card={card}
                        isRevealed={selectedCardId === card.id || hasPlayedCard}
                        isSelected={selectedCardId === card.id}
                        isSelectable={!hasPlayedCard}
                        onSelect={() => handleCardSelect(card)}
                        isAttributeSelectable={isCurrentPlayer && selectedCardId === card.id && !hasPlayedCard}
                        onAttributeSelect={setTentativeAttribute}
                        selectedAttribute={isCurrentPlayer && selectedCardId === card.id ? (tentativeAttribute || undefined) : undefined}
                    />
                );
            })}
          </ScrollView>
        </View>
      </ScrollView>
      <View style={[styles.actionArea, { paddingBottom: insets.bottom || 16 }]}>
        {isCurrentPlayer && selectedCardId && tentativeAttribute && !hasPlayedCard && (<TouchableOpacity style={[styles.actionButton, styles.confirmButton]} onPress={handleConfirmTurn} disabled={isLoading}><Text style={styles.actionButtonText}>{isLoading ? 'Confirmando...' : 'Confirmar Jogada'}</Text></TouchableOpacity>)}
      </View>
      <ResultadoModal visible={showResultModal} roundResult={currentRoundResult} allCards={allCards} playerNickname={state.playerNickname} onClose={handleCloseModal} onNextRound={handleNextRound} isGameFinished={!!gameState.gameWinner} gameWinner={gameState.gameWinner || undefined} isHost={state.playerNickname === state.currentRoom.hostNickname} />
      {isLoading && (<View style={styles.loadingOverlay}><ActivityIndicator size="large" color="#FFF" /><Text style={styles.loadingOverlayText}>Processando...</Text></View>)}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F5F5' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
    loadingText: { fontSize: 18, color: '#666', marginBottom: 16, textAlign: 'center' },
    gameArea: { flex: 1 },
    gameContent: { paddingBottom: 24 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 12, textAlign: 'center', paddingHorizontal: 16 },
    instruction: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 16, fontStyle: 'italic', paddingHorizontal: 16 },
    waitingText: { fontSize: 14, color: '#4CAF50', textAlign: 'center', marginBottom: 16, fontWeight: '600' },
    opponentsArea: { marginBottom: 24, paddingLeft: 16 },
    opponentCard: { alignItems: 'center', marginRight: 16, padding: 12, backgroundColor: '#FFF', borderRadius: 8, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, position: 'relative' },
    eliminatedOpponent: { opacity: 0.5 },
    eliminatedOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(50, 50, 50, 0.7)', borderRadius: 8 },
    eliminatedText: { color: '#FFF', fontWeight: 'bold', fontSize: 14, transform: [{ rotate: '-15deg' }] },
    opponentName: { fontSize: 12, fontWeight: '600', color: '#333', marginBottom: 8 },
    opponentCardBack: { width: 60, height: 80, backgroundColor: '#1a237e', borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    cardCount: { fontSize: 16, fontWeight: 'bold', color: '#FFF' },
    cardCountLabel: { fontSize: 10, color: '#FFF' },
    playedCardIndicator: { backgroundColor: '#4CAF50', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, marginTop: 4 },
    playedCardText: { fontSize: 10, color: '#FFF', fontWeight: 'bold' },
    botThinkingIndicator: { backgroundColor: '#FF9800', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginTop: 4 },
    botThinkingText: { fontSize: 9, color: '#FFF', fontWeight: 'bold' },
    revealedCardsArea: { marginBottom: 24, paddingLeft: 16 },
    revealedCardContainer: { alignItems: 'center', marginRight: 16 },
    revealedPlayerName: { fontSize: 12, fontWeight: '600', color: '#333', marginBottom: 8 },
    playerHandArea: { marginBottom: 24 },
    handScroll: { paddingHorizontal: 16, alignItems: 'center' },
    actionArea: { paddingHorizontal: 16, paddingTop: 16, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#E0E0E0' },
    actionButton: { height: 56, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    playButton: { backgroundColor: '#4CAF50' },
    confirmButton: { backgroundColor: '#FF9800' },
    actionButtonText: { fontSize: 18, fontWeight: '600', color: '#FFF' },
    loadingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.7)', justifyContent: 'center', alignItems: 'center' },
    loadingOverlayText: { color: '#FFF', fontSize: 16, marginTop: 16 },
});
export default GameScreen;
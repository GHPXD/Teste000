// src/screens/GameScreen.tsx

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
  Image,
  Animated,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Orientation from 'react-native-orientation-locker';
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
import ResultadoModal from '../components/game/ResultadoModal';
import BotController from '../components/game/BotController';
import TurnTimer from '../components/game/TurnTimer';
import PlayerPosition from '../components/game/PlayerPosition';

type GameScreenRouteProp = RouteProp<RootStackParamList, 'Game'>;
type GameScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Game'>;

interface Props {
  route: GameScreenRouteProp;
  navigation: GameScreenNavigationProp;
}

const { width, height } = Dimensions.get('window');
const H_WIDTH = Math.max(width, height);
const H_HEIGHT = Math.min(width, height);

const PLAYER_CARD_WIDTH = H_WIDTH * 0.11;
const PLAYER_CARD_HEIGHT = PLAYER_CARD_WIDTH * 1.5;
const ZOOMED_CARD_WIDTH = H_WIDTH * 0.25;
const ZOOMED_CARD_HEIGHT = ZOOMED_CARD_WIDTH * 1.5;
const OPPONENT_AVATAR_SIZE = H_HEIGHT * 0.15;
const OPPONENT_CARD_WIDTH = H_WIDTH * 0.05;
const OPPONENT_CARD_HEIGHT = OPPONENT_CARD_WIDTH * 1.5;

const GameScreen: React.FC<Props> = ({ route, navigation }) => {
  const { roomId } = route.params;
  const { state } = useGame();

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [allCards, setAllCards] = useState<Card[]>([]);
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [tentativeAttribute, setTentativeAttribute] = useState<string | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [currentRoundResult, setCurrentRoundResult] = useState<RoundResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const isProcessingRound = useRef(false);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [timeUpTrigger, setTimeUpTrigger] = useState(false);

  useEffect(() => {
    Orientation.lockToLandscape();
    return () => { Orientation.unlockAllOrientations(); };
  }, []);

  const handleStartGame = useCallback(async (cards: Card[]) => {
    if (!state.currentRoom || !state.currentRoom.players) return;
    const players = Object.keys(state.currentRoom.players);
    if (players.length < 2) return;
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
    const playerCardIds = currentGameState.playerCards[state.playerNickname] || [];
    const hand = playerCardIds.map(id => cards.find(card => card.id === id)).filter(Boolean) as Card[];
    setPlayerHand(hand);
  }, [state.playerNickname]);

  useEffect(() => {
    if (!state.selectedDeck) {
      navigation.goBack();
      return;
    }
    setAllCards(getDeckCards(state.selectedDeck.id));
  }, [state.selectedDeck, navigation]);

  useEffect(() => {
    if (roomId !== 'SOLO_GAME_ROOM' && state.currentRoom && allCards.length > 0 && !gameState) {
      if (state.currentRoom.hostNickname === state.playerNickname) {
        handleStartGame(allCards);
      }
    }
  }, [state.currentRoom, allCards, gameState, state.playerNickname, handleStartGame, roomId]);

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
    } catch (error) { Alert.alert("Erro", "Não foi possível iniciar a próxima rodada."); } 
    finally { setIsLoading(false); }
  }, [isLoading, roomId]);

  const isCurrentPlayer = gameState?.currentPlayer === state.playerNickname;
  const hasPlayedCard = !!(gameState?.currentRoundCards && gameState?.currentRoundCards[state.playerNickname]);
  
  const handleConfirmTurn = useCallback(async () => {
    if (!selectedCardId || !tentativeAttribute) return;
    setIsLoading(true);
    try {
      await playCard(roomId, state.playerNickname, selectedCardId);
      await selectAttribute(roomId, tentativeAttribute);
    } catch (error) { Alert.alert('Erro', 'Não foi possível confirmar a jogada.'); } 
    finally { setIsLoading(false); }
  },[roomId, state.playerNickname, selectedCardId, tentativeAttribute]);
  
  const handlePlayCardForNonCurrentPlayer = useCallback(async () => {
    if (!selectedCardId) return;
    setIsLoading(true);
    try {
      await playCard(roomId, state.playerNickname, selectedCardId);
    } catch (error) { Alert.alert('Erro', 'Não foi possível jogar a carta'); } 
    finally { setIsLoading(false); }
  }, [roomId, state.playerNickname, selectedCardId]);

  useEffect(() => {
    if (timeUpTrigger) {
      if (!hasPlayedCard && playerHand.length > 0 && !isCurrentPlayer) {
        const randomCard = playerHand[Math.floor(Math.random() * playerHand.length)];
        // A jogada automática aqui é apenas selecionar a carta, não confirmar
        setSelectedCardId(randomCard.id);
      }
      setTimeUpTrigger(false); 
    }
  }, [timeUpTrigger, hasPlayedCard, playerHand, isCurrentPlayer]);
  
  useEffect(() => {
    setIsTimerActive(gameState?.gamePhase === 'selecting' && !hasPlayedCard && playerHand.length > 0);
  }, [gameState?.gamePhase, hasPlayedCard, playerHand.length]);

  const handleCardSelect = (card: Card) => {
    if (hasPlayedCard) return;
    setSelectedCardId(card.id);
    // Para jogadores que não são o da vez, a jogada é enviada imediatamente
    if (!isCurrentPlayer) {
      handlePlayCardForNonCurrentPlayer();
    }
  };
  
  const handleCloseModal = () => {
    setShowResultModal(false);
    if (gameState?.gameWinner) { navigation.goBack(); }
  };

  const getOpponentPositions = () => {
    const players = Object.values(state.currentRoom?.players || {});
    if (players.length < 2) return [];

    const opponents = players.filter(p => p.nickname !== state.playerNickname && p.status === 'active');
    const positionMap: { [key: number]: StyleProp<ViewStyle>[] } = {
        1: [ { top: H_HEIGHT * 0.05, alignSelf: 'center' } ],
        2: [ { top: H_HEIGHT * 0.3, left: 15 }, { top: H_HEIGHT * 0.3, right: 15 } ],
        3: [ { top: H_HEIGHT * 0.3, left: 15 }, { top: H_HEIGHT * 0.05, alignSelf: 'center' }, { top: H_HEIGHT * 0.3, right: 15 } ]
    };
    const positions = positionMap[opponents.length] || [];
    return opponents.map((player, index) => ({ player, positionStyle: positions[index] }));
  };

  if (!state.currentRoom || !state.currentRoom.players || !gameState) {
    return (<SafeAreaView style={styles.container}><View style={styles.loadingContainer}><ActivityIndicator size="large" color="#007AFF" /><Text style={styles.loadingText}>Carregando jogo...</Text></View></SafeAreaView>);
  }

  const selectedCardObject = allCards.find(c => c.id === selectedCardId);
  const lastPlayedCard = gameState.currentRoundCards && Object.values(gameState.currentRoundCards).length > 0 
    ? allCards.find(c => c.id === Object.values(gameState.currentRoundCards)[Object.values(gameState.currentRoundCards).length - 1])
    : null;
    
  return (
    <View style={styles.gameTable}>
      <BotController roomId={roomId} gameState={gameState} players={state.currentRoom.players} allCards={allCards} />
      {isTimerActive && <View style={styles.timerContainer}><TurnTimer duration={15} isPlaying={isTimerActive} onTimeEnd={() => setTimeUpTrigger(true)} /></View>}
      {getOpponentPositions().map(({ player, positionStyle }) => (
        <PlayerPosition key={player.nickname} player={player} cardCount={gameState.playerCards?.[player.nickname]?.length || 0} style={positionStyle} avatarSize={OPPONENT_AVATAR_SIZE} cardWidth={OPPONENT_CARD_WIDTH} cardHeight={OPPONENT_CARD_HEIGHT} />
      ))}
      <View style={styles.centerArea}>
        <Image source={require('../assets/images/logo-verso.png')} style={styles.drawPile} />
        <View style={styles.discardPileContainer}>
          {lastPlayedCard ? <Carta card={lastPlayedCard} isRevealed={true} isSelected={false} isSelectable={false} width={PLAYER_CARD_WIDTH} height={PLAYER_CARD_HEIGHT}/> : <View style={styles.placeholderPile} />}
        </View>
      </View>

      {!selectedCardObject ? (
        <View style={styles.playerHandContainer}>
          {playerHand.map((card, index) => {
            const totalCards = playerHand.length;
            const middleIndex = (totalCards - 1) / 2;
            const angle = (index - middleIndex) * 8;
            const translateY = Math.abs(index - middleIndex) * 12;
            return (
              <Animated.View key={card.id} style={[ styles.cardWrapper, { transform: [{ translateY }, { rotate: `${angle}deg` }], marginLeft: index > 0 ? -PLAYER_CARD_WIDTH * 0.65 : 0 } ]}>
                <Carta card={card} isRevealed={true} isSelected={false} isSelectable={!hasPlayedCard} onSelect={() => handleCardSelect(card)} width={PLAYER_CARD_WIDTH} height={PLAYER_CARD_HEIGHT} />
              </Animated.View>
            );
          })}
        </View>
      ) : (
        <View style={styles.zoomedCardContainer}>
            <View style={{width: ZOOMED_CARD_WIDTH}}>
                <Carta
                  card={selectedCardObject}
                  isRevealed={true}
                  isSelected={true}
                  isSelectable={false}
                  isAttributeSelectable={isCurrentPlayer && !hasPlayedCard}
                  onAttributeSelect={setTentativeAttribute}
                  selectedAttribute={tentativeAttribute || undefined}
                  width={ZOOMED_CARD_WIDTH}
                  height={ZOOMED_CARD_HEIGHT}
                />
            </View>
            {isCurrentPlayer && !hasPlayedCard && (
              <View style={styles.actionButtonsContainer}>
                <TouchableOpacity 
                    style={[styles.confirmButton, !tentativeAttribute && styles.disabledButton]} 
                    onPress={handleConfirmTurn} 
                    disabled={!tentativeAttribute}
                >
                    <Text style={styles.buttonText}>Confirmar Jogada</Text>
                </TouchableOpacity>
              </View>
            )}
        </View>
      )}
      <TouchableOpacity style={styles.unoButton}><Text style={styles.unoButtonText}>TRUNFIA!</Text></TouchableOpacity>
      <ResultadoModal visible={showResultModal} roundResult={currentRoundResult} allCards={allCards} playerNickname={state.playerNickname} onClose={handleCloseModal} onNextRound={handleNextRound} isGameFinished={!!gameState.gameWinner} gameWinner={gameState.gameWinner || undefined} isHost={state.playerNickname === state.currentRoom.hostNickname} />
      {isLoading && (<View style={styles.loadingOverlay}><ActivityIndicator size="large" color="#FFF" /><Text style={styles.loadingOverlayText}>Processando...</Text></View>)}
    </View>
  );
};

const styles = StyleSheet.create({
  gameTable: { flex: 1, backgroundColor: '#2c3e50' },
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 18, color: '#666', marginBottom: 16 },
  timerContainer: { position: 'absolute', top: 20, left: 20, zIndex: 10 },
  centerArea: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: PLAYER_CARD_WIDTH * 2 + 20,
    transform: [{ translateX: -(PLAYER_CARD_WIDTH + 10)}, { translateY: -(PLAYER_CARD_HEIGHT / 2) }],
    flexDirection: 'row',
    alignItems: 'center',
  },
  drawPile: { width: PLAYER_CARD_WIDTH, height: PLAYER_CARD_HEIGHT, borderRadius: 8, resizeMode: 'contain' },
  discardPileContainer: { marginLeft: 20 },
  placeholderPile: { width: PLAYER_CARD_WIDTH, height: PLAYER_CARD_HEIGHT, borderRadius: 8, borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)', borderStyle: 'dashed' },
  playerHandContainer: {
    position: 'absolute',
    bottom: -H_HEIGHT * 0.05,
    left: 0,
    right: 0,
    height: H_HEIGHT * 0.5,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardWrapper: {},
  unoButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: H_HEIGHT * 0.2,
    height: H_HEIGHT * 0.2,
    borderRadius: H_HEIGHT * 0.1,
    backgroundColor: '#e74c3c',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
  },
  unoButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  loadingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  loadingOverlayText: { color: '#FFF', fontSize: 16, marginTop: 16 },
  zoomedCardContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    marginTop: 20,
  },
  confirmButton: {
    backgroundColor: '#2ecc71',
    paddingVertical: 14,
    paddingHorizontal: 35,
    borderRadius: 30,
    marginHorizontal: 10,
  },
  disabledButton: {
    backgroundColor: '#95a5a6',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default GameScreen;
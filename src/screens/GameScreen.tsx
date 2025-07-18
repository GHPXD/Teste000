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
  Animated,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Orientation from 'react-native-orientation-locker';
import { RootStackParamList, GameState, Card, Player } from '../types';
import { useGame } from '../contexts/GameContext';
import {
  startGame,
  playCard,
  listenToGameState,
  selectAttributeAndProcess,
} from '../services/gameService';
import { getDeckCards } from '../data/decks';
import Carta from '../components/game/Carta';
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

// Componente para a carta animada no centro da mesa
const AnimatedPlayedCard: React.FC<{
  card: Card;
  player: Player;
  winnerNickname?: string;
  gamePhase: GameState['gamePhase'];
  initialPosition: { x: number; y: number };
  winnerPosition: { x: number; y: number };
}> = ({ card, player, winnerNickname, gamePhase, initialPosition, winnerPosition }) => {
    const anim = useRef(new Animated.ValueXY(initialPosition)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (gamePhase === 'comparing-on-table' && player.nickname === winnerNickname) {
            // Animação para destacar a carta vencedora
            Animated.sequence([
                Animated.timing(scaleAnim, { toValue: 1.15, duration: 300, useNativeDriver: false }),
                Animated.timing(scaleAnim, { toValue: 1, duration: 300, useNativeDriver: false }),
            ]).start();
        } else if (gamePhase === 'animating-win') {
            // Animação para mover a carta para o vencedor
            Animated.timing(anim, {
                toValue: winnerPosition,
                duration: 800,
                useNativeDriver: false,
            }).start();
        }
    }, [gamePhase, player.nickname, winnerNickname, anim, scaleAnim, winnerPosition]);

    return (
        <Animated.View style={[anim.getLayout(), styles.playedCard, { transform: [{ scale: scaleAnim }] }]}>
            <Carta
                card={card}
                isRevealed={true}
                isSelected={player.nickname === winnerNickname}
                isSelectable={false}
                width={PLAYER_CARD_WIDTH}
                height={PLAYER_CARD_HEIGHT}
            />
        </Animated.View>
    );
};


const GameScreen: React.FC<Props> = ({ route, navigation }) => {
  const { roomId } = route.params;
  const { state, setCurrentRoom } = useGame();

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [allCards, setAllCards] = useState<Card[]>([]);
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [tentativeAttribute, setTentativeAttribute] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
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
        navigation.goBack();
    } finally {
        setIsLoading(false);
    }
  }, [roomId, state.currentRoom, navigation]);

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
      Alert.alert("Erro", "Nenhum baralho selecionado. Voltando ao lobby.");
      navigation.goBack();
      return;
    }
    setAllCards(getDeckCards(state.selectedDeck.id));
  }, [state.selectedDeck, navigation]);

  useEffect(() => {
    if (roomId && state.currentRoom && allCards.length > 0 && !gameState) {
      if (state.currentRoom.hostNickname === state.playerNickname) {
        handleStartGame(allCards);
      }
    }
  }, [state.currentRoom, allCards, gameState, state.playerNickname, handleStartGame, roomId]);

  useEffect(() => {
    const unsubscribe = listenToGameState(roomId, (newGameState) => {
        setGameState(newGameState);
        if (newGameState?.gameWinner) {
            setTimeout(() => {
                Alert.alert("Fim de Jogo!", `O vencedor é ${newGameState.gameWinner}!`, [
                    { text: "OK", onPress: () => {
                        setCurrentRoom(null);
                        navigation.navigate('Lobby');
                    }}
                ]);
            }, 3000);
        }
    });
    return () => unsubscribe();
  }, [roomId, navigation, setCurrentRoom]);

  useEffect(() => {
    updatePlayerHand(gameState, allCards);
  }, [gameState, allCards, updatePlayerHand]);
  
  useEffect(() => {
    if (gameState?.gamePhase === 'selecting') {
      setSelectedCardId(null);
      setTentativeAttribute(null);
    }
  }, [gameState?.currentRound, gameState?.gamePhase]);
  
  const isCurrentPlayer = gameState?.currentPlayer === state.playerNickname;
  const hasPlayedCard = !!(gameState?.currentRoundCards && gameState?.currentRoundCards[state.playerNickname]);
  
  const handleConfirmTurn = useCallback(async () => {
    if (!selectedCardId || !tentativeAttribute) return;
    setIsLoading(true);
    try {
      await playCard(roomId, state.playerNickname, selectedCardId);
      // CORREÇÃO: Passa allCards para a função
      await selectAttributeAndProcess(roomId, tentativeAttribute, allCards);
    } catch (error) { Alert.alert('Erro', 'Não foi possível confirmar a jogada.'); } 
    finally { setIsLoading(false); }
  },[roomId, state.playerNickname, selectedCardId, tentativeAttribute, allCards]);
  
  const handlePlayCardForNonCurrentPlayer = useCallback(async (cardId: string) => {
    if (hasPlayedCard) return;
    setIsLoading(true);
    try {
      await playCard(roomId, state.playerNickname, cardId);
    } catch (error) { Alert.alert('Erro', 'Não foi possível jogar a carta'); } 
    finally { setIsLoading(false); }
  }, [roomId, state.playerNickname, hasPlayedCard]);

  useEffect(() => {
    if (timeUpTrigger) {
      if (!hasPlayedCard && playerHand.length > 0) {
        const randomCard = playerHand[Math.floor(Math.random() * playerHand.length)];
        setSelectedCardId(randomCard.id);
        handlePlayCardForNonCurrentPlayer(randomCard.id);
      }
      setTimeUpTrigger(false); 
    }
  }, [timeUpTrigger, hasPlayedCard, playerHand, handlePlayCardForNonCurrentPlayer]);
  
  useEffect(() => {
    setIsTimerActive(gameState?.gamePhase === 'selecting' && !hasPlayedCard && playerHand.length > 0);
  }, [gameState?.gamePhase, hasPlayedCard, playerHand.length]);

  const handleCardSelect = (card: Card) => {
    if (hasPlayedCard) return;
    setSelectedCardId(card.id);
    if (!isCurrentPlayer) {
      handlePlayCardForNonCurrentPlayer(card.id);
    }
  };
  
  const getPlayerPositions = () => {
    const players = Object.values(state.currentRoom?.players || {});
    if (players.length === 0) return { mainPlayer: null, opponents: [] };

    const mainPlayer = players.find(p => p.nickname === state.playerNickname);
    const opponents = players.filter(p => p.nickname !== state.playerNickname);
    
    const opponentPositions: { [key: number]: ViewStyle[] } = {
        1: [ { top: H_HEIGHT * 0.05, alignSelf: 'center' } ],
        2: [ { top: H_HEIGHT * 0.3, left: 15 }, { top: H_HEIGHT * 0.3, right: 15 } ],
        3: [ { top: H_HEIGHT * 0.3, left: 15 }, { top: H_HEIGHT * 0.05, alignSelf: 'center' }, { top: H_HEIGHT * 0.3, right: 15 } ]
    };

    const positions = opponentPositions[opponents.length] || [];
    return {
        mainPlayer,
        opponents: opponents.map((player, index) => ({ player, positionStyle: positions[index] }))
    };
  };

  const { opponents } = getPlayerPositions();

  if (!state.currentRoom || !state.currentRoom.players || !gameState) {
    return (<SafeAreaView style={styles.container}><View style={styles.loadingContainer}><ActivityIndicator size="large" color="#007AFF" /><Text style={styles.loadingText}>Carregando jogo...</Text></View></SafeAreaView>);
  }

  const selectedCardObject = allCards.find(c => c.id === selectedCardId);

  const renderPlayedCards = () => {
    if (!gameState || !state.currentRoom?.players) return null;
    const { gamePhase, currentRoundCards, roundWinner } = gameState;
    if (gamePhase !== 'animating-play' && gamePhase !== 'comparing-on-table' && gamePhase !== 'animating-win') return null;

    const winnerData = Object.values(state.currentRoom.players).find(p => p.nickname === roundWinner);
    const winnerIsMainPlayer = winnerData?.nickname === state.playerNickname;
    const winnerOpponentData = opponents.find(o => o.player.nickname === roundWinner);
    
    const flatWinnerStyle = winnerOpponentData ? StyleSheet.flatten(winnerOpponentData.positionStyle) : {};

    const winnerPosition = winnerIsMainPlayer 
        ? { x: H_WIDTH / 2 - PLAYER_CARD_WIDTH / 2, y: H_HEIGHT }
        : { 
            x: typeof flatWinnerStyle.left === 'number' ? flatWinnerStyle.left : (H_WIDTH / 2 - OPPONENT_AVATAR_SIZE / 2), 
            y: typeof flatWinnerStyle.top === 'number' ? flatWinnerStyle.top : (H_HEIGHT / 2 - OPPONENT_AVATAR_SIZE / 2) 
          };

    const centerPositions = [
        { x: H_WIDTH / 2 - PLAYER_CARD_WIDTH * 1.2, y: H_HEIGHT / 2 - PLAYER_CARD_HEIGHT / 2 },
        { x: H_WIDTH / 2 + PLAYER_CARD_WIDTH * 0.2, y: H_HEIGHT / 2 - PLAYER_CARD_HEIGHT / 2 },
        { x: H_WIDTH / 2 - PLAYER_CARD_WIDTH * 1.2, y: H_HEIGHT / 2 + 10 },
        { x: H_WIDTH / 2 + PLAYER_CARD_WIDTH * 0.2, y: H_HEIGHT / 2 + 10 },
    ];

    return Object.keys(currentRoundCards).map((nickname, index) => {
        const card = allCards.find(c => c.id === currentRoundCards[nickname]);
        const player = Object.values(state.currentRoom!.players).find(p => p.nickname === nickname);
        if (!card || !player) return null;
        
        return (
            <AnimatedPlayedCard
                key={card.id}
                card={card}
                player={player}
                winnerNickname={roundWinner || undefined}
                gamePhase={gamePhase}
                initialPosition={centerPositions[index % 4]}
                winnerPosition={winnerPosition}
            />
        );
    });
  };
    
  return (
    <View style={styles.gameTable}>
      <BotController roomId={roomId} gameState={gameState} players={state.currentRoom.players} allCards={allCards} />
      {isTimerActive && <View style={styles.timerContainer}><TurnTimer duration={15} isPlaying={isTimerActive} onTimeEnd={() => setTimeUpTrigger(true)} /></View>}
      
      {opponents.map(({ player, positionStyle }) => (
        <PlayerPosition key={player.nickname} player={player} cardCount={gameState.playerCards?.[player.nickname]?.length || 0} style={positionStyle} avatarSize={OPPONENT_AVATAR_SIZE} cardWidth={OPPONENT_CARD_WIDTH} cardHeight={OPPONENT_CARD_HEIGHT} />
      ))}

      <View style={styles.centerTableArea}>
          {renderPlayedCards()}
      </View>

      {!selectedCardObject && !hasPlayedCard && gameState.gamePhase === 'selecting' ? (
        <View style={styles.playerHandContainer}>
          {playerHand.map((card, index) => {
            const totalCards = playerHand.length;
            const middleIndex = (totalCards - 1) / 2;
            const angle = (index - middleIndex) * 8;
            const translateY = Math.abs(index - middleIndex) * 12;
            const cardStyle = {
                transform: [{ translateY }, { rotate: `${angle}deg` }],
                marginLeft: index > 0 ? -PLAYER_CARD_WIDTH * 0.65 : 0,
            };
            return (
              <Animated.View key={card.id} style={[ styles.cardWrapper, cardStyle ]}>
                <Carta card={card} isRevealed={true} isSelected={false} isSelectable={!hasPlayedCard} onSelect={() => handleCardSelect(card)} width={PLAYER_CARD_WIDTH} height={PLAYER_CARD_HEIGHT} />
              </Animated.View>
            );
          })}
        </View>
      ) : selectedCardObject && gameState.gamePhase === 'selecting' && (
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
                    disabled={!tentativeAttribute || isLoading}
                >
                    <Text style={styles.buttonText}>Confirmar Jogada</Text>
                </TouchableOpacity>
              </View>
            )}
        </View>
      )}
      
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
  centerTableArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  playedCard: {
    position: 'absolute',
  },
});

export default GameScreen;
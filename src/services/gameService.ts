// src/services/gameService.ts

import { ref, update, get, onValue, off } from 'firebase/database';
import { database } from '../config/firebase';
import { GameState, Card, RoundResult, Room, Player } from '../types';
import { distributeCards, selectRandomPlayer, compareCards, checkGameEnd, shuffleArray } from '../utils/gameUtils';

const GAMES_PATH = 'games';
const ROOMS_PATH = 'rooms';

/**
 * Inicia um novo jogo.
 */
export const startGame = async (
  roomId: string,
  players: string[],
  cards: Card[]
): Promise<GameState> => {
  console.log('🎯 Iniciando jogo:', { roomId, players: players.length, cards: cards.length });

  try {
    const playerCards = distributeCards(cards, players);
    const firstPlayer = selectRandomPlayer(players);

    const roomRef = ref(database, `${ROOMS_PATH}/${roomId}/players`);
    const playersSnapshot = await get(roomRef);
    const playersData = playersSnapshot.val() as { [key: string]: Player };

    Object.keys(playersData).forEach(p => {
      playersData[p].status = 'active';
    });

    const gameState: GameState = {
      currentRound: 1,
      currentPlayer: firstPlayer,
      gamePhase: 'spinning',
      playerCards,
      currentRoundCards: {},
      selectedAttribute: null,
      roundWinner: null,
      gameWinner: null,
      roundHistory: [],
      spinResult: firstPlayer,
    };

    const updates = {
      [`${ROOMS_PATH}/${roomId}/status`]: 'playing',
      [`${ROOMS_PATH}/${roomId}/players`]: playersData,
      [`${GAMES_PATH}/${roomId}`]: gameState,
    };

    await update(ref(database), updates);

    setTimeout(async () => {
      try {
        await update(ref(database), {
          [`${GAMES_PATH}/${roomId}/gamePhase`]: 'selecting',
        });
      } catch (error) {
        console.error('❌ Erro na transição para "selecting":', error);
      }
    }, 4000);

    return gameState;
  } catch (error) {
    console.error('❌ Erro detalhado ao iniciar jogo:', error);
    throw new Error('Não foi possível iniciar o jogo');
  }
};

/**
 * Jogador seleciona uma carta.
 */
export const playCard = async (
  roomId: string,
  playerNickname: string,
  cardId: string
): Promise<void> => {
  try {
    const roomRef = ref(database, `${ROOMS_PATH}/${roomId}`);
    const roomSnapshot = await get(roomRef);
    if (!roomSnapshot.exists()) return;
    const room: Room = roomSnapshot.val();
    
    const activePlayers = Object.values(room.players).filter(p => p.status === 'active');
    const totalActivePlayers = activePlayers.length;

    const gameRef = ref(database, `${GAMES_PATH}/${roomId}`);
    const gameSnapshot = await get(gameRef);
    if (!gameSnapshot.exists()) return;
    const gameState: GameState = gameSnapshot.val();

    await update(ref(database), {
      [`${GAMES_PATH}/${roomId}/currentRoundCards/${playerNickname}`]: cardId,
    });

    const updatedCards = { ...gameState.currentRoundCards, [playerNickname]: cardId };
    
    if (Object.keys(updatedCards).length === totalActivePlayers) {
      await update(ref(database), {
        [`${GAMES_PATH}/${roomId}/gamePhase`]: 'animating-play',
      });
    }
  } catch (error) {
    console.error('Erro ao jogar carta:', error);
    throw new Error('Não foi possível jogar a carta');
  }
};

/**
 * Seleciona atributo e dispara o processo de comparação da rodada.
 */
export const selectAttributeAndProcess = async (
  roomId: string,
  attribute: string,
  allCards: Card[],
): Promise<void> => {
    try {
        await update(ref(database), {
            [`${GAMES_PATH}/${roomId}/selectedAttribute`]: attribute,
        });

        setTimeout(() => {
            processRoundResult(roomId, allCards);
        }, 1500); // Delay para jogadores verem o atributo

    } catch (error) {
        console.error('Erro ao selecionar atributo:', error);
        throw new Error('Não foi possível selecionar o atributo');
    }
};

/**
 * Processa o resultado, determina o vencedor e transiciona para a fase de comparação na mesa.
 */
export const processRoundResult = async (
  roomId: string,
  allCards: Card[]
): Promise<void> => {
  try {
    const gameRef = ref(database, `${GAMES_PATH}/${roomId}`);
    const gameSnapshot = await get(gameRef);
    if (!gameSnapshot.exists()) return;
    const gameState: GameState = gameSnapshot.val();

    if (!gameState.selectedAttribute) throw new Error('Atributo não selecionado');
    
    const { winner } = compareCards(
      gameState.currentRoundCards,
      gameState.selectedAttribute,
      allCards
    );

    await update(ref(database), {
        [`${GAMES_PATH}/${roomId}/roundWinner`]: winner,
        [`${GAMES_PATH}/${roomId}/gamePhase`]: 'comparing-on-table',
    });
    
    setTimeout(() => {
        collectWinningsAndPrepareNextRound(roomId, allCards);
    }, 3000); // Delay para visualizar as cartas e o vencedor

  } catch (error) {
    console.error('Erro ao processar resultado:', error);
    throw new Error('Não foi possível processar o resultado');
  }
};

/**
 * Coleta as cartas para o vencedor, atualiza os baralhos e prepara a próxima rodada.
 */
export const collectWinningsAndPrepareNextRound = async (
    roomId: string,
    allCards: Card[]
) => {
    const gameRef = ref(database, `${GAMES_PATH}/${roomId}`);
    const gameSnapshot = await get(gameRef);
    if (!gameSnapshot.exists()) return;
    const gameState: GameState = gameSnapshot.val();
    
    const roomPlayersRef = ref(database, `${ROOMS_PATH}/${roomId}/players`);
    const playersSnapshot = await get(roomPlayersRef);
    const players: { [key: string]: Player } = playersSnapshot.val();

    const winner = gameState.roundWinner;
    if (!winner || !gameState.selectedAttribute) return;

    const { results } = compareCards(
        gameState.currentRoundCards,
        gameState.selectedAttribute,
        allCards
    );

    const roundResult: RoundResult = {
        roundNumber: gameState.currentRound,
        selectedAttribute: gameState.selectedAttribute,
        playerCards: results,
        winner,
        timestamp: new Date().toISOString(),
    };

    const updatedPlayerCards = { ...gameState.playerCards };
    const playedCards = Object.values(gameState.currentRoundCards);

    Object.keys(gameState.currentRoundCards).forEach(player => {
        const cardId = gameState.currentRoundCards[player];
        updatedPlayerCards[player] = updatedPlayerCards[player].filter(id => id !== cardId);
    });

    updatedPlayerCards[winner] = shuffleArray([
        ...(updatedPlayerCards[winner] || []),
        ...playedCards
    ]);

    Object.keys(players).forEach(p => {
        if (updatedPlayerCards[p]?.length === 0 && players[p].status === 'active') {
            players[p].status = 'eliminated';
        }
    });

    const gameWinner = checkGameEnd(players);

    await update(ref(database), {
        [`${GAMES_PATH}/${roomId}/playerCards`]: updatedPlayerCards,
        [`${GAMES_PATH}/${roomId}/roundHistory`]: [...(gameState.roundHistory || []), roundResult],
        [`${GAMES_PATH}/${roomId}/gamePhase`]: 'animating-win',
        [`${ROOMS_PATH}/${roomId}/players`]: players,
        [`${GAMES_PATH}/${roomId}/gameWinner`]: gameWinner,
    });

    setTimeout(async () => {
        if (gameWinner) {
            await update(ref(database), { [`${GAMES_PATH}/${roomId}/gamePhase`]: 'finished' });
        } else {
            await startNextRound(roomId);
        }
    }, 2000); // Duração da animação das cartas indo para o vencedor
};

/**
 * Inicia a próxima rodada.
 */
export const startNextRound = async (roomId: string): Promise<void> => {
  try {
    const gameRef = ref(database, `${GAMES_PATH}/${roomId}`);
    const snapshot = await get(gameRef);
    if (!snapshot.exists()) return;
    const gameState: GameState = snapshot.val();

    const updates = {
      [`${GAMES_PATH}/${roomId}/currentRound`]: gameState.currentRound + 1,
      [`${GAMES_PATH}/${roomId}/currentPlayer`]: gameState.roundWinner,
      [`${GAMES_PATH}/${roomId}/gamePhase`]: 'selecting',
      [`${GAMES_PATH}/${roomId}/currentRoundCards`]: {},
      [`${GAMES_PATH}/${roomId}/selectedAttribute`]: null,
      [`${GAMES_PATH}/${roomId}/roundWinner`]: null,
    };

    await update(ref(database), updates);
  } catch (error) {
    console.error('Erro ao iniciar próxima rodada:', error);
    throw new Error('Não foi possível iniciar a próxima rodada');
  }
};

/**
 * Escuta mudanças no estado do jogo.
 */
export const listenToGameState = (
  roomId: string,
  callback: (gameState: GameState | null) => void
): (() => void) => {
  const gameRef = ref(database, `${GAMES_PATH}/${roomId}`);
  
  const unsubscribe = onValue(gameRef, (snapshot) => {
    const room = snapshot.exists() ? snapshot.val() : null;
    callback(room);
  });

  return () => off(gameRef, 'value', unsubscribe);
};
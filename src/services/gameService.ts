// src/services/gameService.ts

import { ref, update, get, onValue, off } from 'firebase/database';
import { database } from '../config/firebase';
import { GameState, Card, RoundResult, Room } from '../types';
import { distributeCards, selectRandomPlayer, compareCards, checkGameEnd } from '../utils/gameUtils';

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
      [`${ROOMS_PATH}/${roomId}/gameState`]: gameState,
      [`${GAMES_PATH}/${roomId}`]: gameState,
    };

    await update(ref(database), updates);
    console.log('✅ Jogo salvo no Firebase com sucesso');

    setTimeout(async () => {
      try {
        await update(ref(database), {
          [`${GAMES_PATH}/${roomId}/gamePhase`]: 'selecting',
        });
        console.log('✅ Transição para selecting concluída');
      } catch (error) {
        console.error('❌ Erro na transição automática para "selecting":', error);
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
    const totalPlayers = Object.keys(room.players).length;

    const gameRef = ref(database, `${GAMES_PATH}/${roomId}`);
    const gameSnapshot = await get(gameRef);
    if (!gameSnapshot.exists()) return;
    const gameState: GameState = gameSnapshot.val();

    const updates = {
      [`${GAMES_PATH}/${roomId}/currentRoundCards/${playerNickname}`]: cardId,
    };
    await update(ref(database), updates);

    const updatedCards = { ...gameState.currentRoundCards, [playerNickname]: cardId };
    if (Object.keys(updatedCards).length === totalPlayers) {
      console.log('✅ Todos os jogadores jogaram. Avançando para fase de revelação.');
      await update(ref(database), {
        [`${GAMES_PATH}/${roomId}/gamePhase`]: 'revealing',
      });
    }
  } catch (error) {
    console.error('Erro ao jogar carta:', error);
    throw new Error('Não foi possível jogar a carta');
  }
};

/**
 * Seleciona atributo para comparação (apenas o jogador da vez).
 */
export const selectAttribute = async (
  roomId: string,
  attribute: string
): Promise<void> => {
  try {
    const updates = {
      [`${GAMES_PATH}/${roomId}/selectedAttribute`]: attribute,
    };
    await update(ref(database), updates);
  } catch (error) {
    console.error('Erro ao selecionar atributo:', error);
    throw new Error('Não foi possível selecionar o atributo');
  }
};

/**
 * Processa resultado da rodada.
 */
export const processRoundResult = async (
  roomId: string,
  gameState: GameState,
  allCards: Card[]
): Promise<void> => {
  try {
    if (!gameState.selectedAttribute) {
      throw new Error('Atributo não selecionado');
    }

    const { winner, results } = compareCards(
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

    updatedPlayerCards[winner] = [...(updatedPlayerCards[winner] || []), ...playedCards];

    const gameWinner = checkGameEnd(updatedPlayerCards);

    const updates = {
      [`${GAMES_PATH}/${roomId}/roundWinner`]: winner,
      [`${GAMES_PATH}/${roomId}/gameWinner`]: gameWinner,
      [`${GAMES_PATH}/${roomId}/playerCards`]: updatedPlayerCards,
      [`${GAMES_PATH}/${roomId}/roundHistory`]: [...(gameState.roundHistory || []), roundResult],
      [`${GAMES_PATH}/${roomId}/gamePhase`]: gameWinner ? 'finished' : 'comparing',
      [`${GAMES_PATH}/${roomId}/currentPlayer`]: winner,
    };

    await update(ref(database), updates);
  } catch (error) {
    console.error('Erro ao processar resultado:', error);
    throw new Error('Não foi possível processar o resultado');
  }
};

/**
 * Inicia próxima rodada (chamado pelo host).
 */
export const startNextRound = async (roomId: string): Promise<void> => {
  try {
    const gameRef = ref(database, `${GAMES_PATH}/${roomId}`);
    const snapshot = await get(gameRef);
    if (!snapshot.exists()) return;

    const gameState: GameState = snapshot.val();

    const updates = {
      [`${GAMES_PATH}/${roomId}/currentRound`]: gameState.currentRound + 1,
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
    const gameState = snapshot.exists() ? snapshot.val() : null;
    callback(gameState);
  });

  return () => off(gameRef, 'value', unsubscribe);
};
import { ref, update, get, onValue, off } from 'firebase/database';
import { database } from '../config/firebase';
import { GameState, Card, RoundResult } from '../types';
import { distributeCards, selectRandomPlayer, compareCards, checkGameEnd } from '../utils/gameUtils';

const GAMES_PATH = 'games';

/**
 * Inicia um novo jogo
 */
export const startGame = async (
  roomId: string,
  players: string[],
  cards: Card[]
): Promise<GameState> => {
  console.log('🎯 Iniciando jogo:', { roomId, players: players.length, cards: cards.length });
  
  try {
    const playerCards = distributeCards(cards, players);
    console.log('🃏 Cartas distribuídas para', players.length, 'jogadores');
    
    const firstPlayer = selectRandomPlayer(players);
    console.log('🎲 Primeiro jogador sorteado:', firstPlayer);

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

    console.log('💾 Tentando salvar no Firebase...');

    const updates = {
      [`rooms/${roomId}/status`]: 'playing',
      [`rooms/${roomId}/gameState`]: gameState,
      [`games/${roomId}`]: gameState,
    };

    await update(ref(database), updates);
    console.log('✅ Jogo salvo no Firebase com sucesso');

    // ✅ IMPORTANTE: Agendar transição automática para 'selecting' após 4 segundos
    setTimeout(async () => {
      try {
        console.log('⏰ Transição automática para fase selecting');
        const transitionUpdates = {
          [`games/${roomId}/gamePhase`]: 'selecting',
        };
        await update(ref(database), transitionUpdates);
        console.log('✅ Transição para selecting concluída');
      } catch (error) {
        console.error('❌ Erro na transição automática:', error);
      }
    }, 4000);
    
    return gameState;
  } catch (error) {
    console.error('❌ Erro detalhado ao iniciar jogo:', error);
    throw new Error('Não foi possível iniciar o jogo');
  }
};


/**
 * Jogador seleciona uma carta
 */
export const playCard = async (
  roomId: string,
  playerNickname: string,
  cardId: string
): Promise<void> => {
  try {
    const updates = {
      [`${GAMES_PATH}/${roomId}/currentRoundCards/${playerNickname}`]: cardId,
    };

    await update(ref(database), updates);
  } catch (error) {
    console.error('Erro ao jogar carta:', error);
    throw new Error('Não foi possível jogar a carta');
  }
};

/**
 * Seleciona atributo para comparação (apenas o jogador da vez)
 */
export const selectAttribute = async (
  roomId: string,
  attribute: string
): Promise<void> => {
  try {
    const updates = {
      [`${GAMES_PATH}/${roomId}/selectedAttribute`]: attribute,
      [`${GAMES_PATH}/${roomId}/gamePhase`]: 'revealing',
    };

    await update(ref(database), updates);
  } catch (error) {
    console.error('Erro ao selecionar atributo:', error);
    throw new Error('Não foi possível selecionar o atributo');
  }
};

/**
 * Processa resultado da rodada
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

    // Criar resultado da rodada
    const roundResult: RoundResult = {
      roundNumber: gameState.currentRound,
      selectedAttribute: gameState.selectedAttribute,
      playerCards: results,
      winner,
      timestamp: new Date().toISOString(),
    };

    // Atualizar cartas dos jogadores (vencedor recebe todas as cartas da rodada)
    const updatedPlayerCards = { ...gameState.playerCards };
    const playedCards = Object.values(gameState.currentRoundCards);
    
    // Remove cartas jogadas de todos os jogadores
    Object.keys(gameState.currentRoundCards).forEach(player => {
      const cardId = gameState.currentRoundCards[player];
      updatedPlayerCards[player] = updatedPlayerCards[player].filter(id => id !== cardId);
    });
    
    // Adiciona todas as cartas ao vencedor
    updatedPlayerCards[winner] = [...updatedPlayerCards[winner], ...playedCards];

    // Verificar se o jogo terminou
    const gameWinner = checkGameEnd(updatedPlayerCards);

    const updates = {
      [`${GAMES_PATH}/${roomId}/roundWinner`]: winner,
      [`${GAMES_PATH}/${roomId}/gameWinner`]: gameWinner,
      [`${GAMES_PATH}/${roomId}/playerCards`]: updatedPlayerCards,
      [`${GAMES_PATH}/${roomId}/roundHistory`]: [...gameState.roundHistory, roundResult],
      [`${GAMES_PATH}/${roomId}/gamePhase`]: gameWinner ? 'finished' : 'comparing',
      [`${GAMES_PATH}/${roomId}/currentPlayer`]: winner, // Vencedor joga na próxima rodada
    };

    await update(ref(database), updates);
  } catch (error) {
    console.error('Erro ao processar resultado:', error);
    throw new Error('Não foi possível processar o resultado');
  }
};

/**
 * Inicia próxima rodada
 */
export const startNextRound = async (roomId: string): Promise<void> => {
  try {
    const gameRef = ref(database, `${GAMES_PATH}/${roomId}`);
    const snapshot = await get(gameRef);
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
 * Escuta mudanças no estado do jogo
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
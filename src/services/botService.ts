import { ref, update, get } from 'firebase/database';
import { database } from '../config/firebase';
import { Player, GameState, Card, BotDecision } from '../types';
import { generateBotName, selectBestCard, getBotThinkingTime } from '../utils/botUtils';
import { playCard, selectAttribute } from './gameService';

/**
 * Adiciona um bot à sala
 */
export const addBotToRoom = async (
  roomId: string,
  difficulty: 'easy' | 'medium' | 'hard' = 'medium'
): Promise<string> => {
  try {
    // Buscar dados atuais da sala
    const roomRef = ref(database, `rooms/${roomId}`);
    const roomSnapshot = await get(roomRef);
    
    if (!roomSnapshot.exists()) {
      throw new Error('Sala não encontrada');
    }

    const roomData = roomSnapshot.val();
    const currentPlayers = roomData.players || {};
    const playerCount = Object.keys(currentPlayers).length;

    // Verificar limite máximo de jogadores
    if (playerCount >= (roomData.maxPlayers || 4)) {
      throw new Error('Sala lotada');
    }

    // Gerar nome único para o bot
    const existingPlayerNames = Object.keys(currentPlayers);
    const botName = generateBotName(existingPlayerNames);

    // Criar dados do bot
    const botPlayer: Player = {
      nickname: botName,
      isHost: false,
      joinedAt: new Date().toISOString(),
      isReady: true,
      isBot: true,
      botDifficulty: difficulty,
    };

    // Adicionar bot à sala
    const updates = {
      [`rooms/${roomId}/players/${botName}`]: botPlayer,
      [`rooms/${roomId}/lastActivity`]: new Date().toISOString(),
    };

    await update(ref(database), updates);
    return botName;
  } catch (error) {
    console.error('Erro ao adicionar bot:', error);
    throw error;
  }
};

/**
 * Remove um bot da sala
 */
export const removeBotFromRoom = async (roomId: string, botName: string): Promise<void> => {
  try {
    // Verificar se é realmente um bot
    const playerRef = ref(database, `rooms/${roomId}/players/${botName}`);
    const playerSnapshot = await get(playerRef);
    
    if (!playerSnapshot.exists()) {
      throw new Error('Jogador não encontrado');
    }

    const playerData = playerSnapshot.val();
    if (!playerData.isBot) {
      throw new Error('Não é possível remover jogadores humanos');
    }

    // Remover bot da sala
    const updates = {
      [`rooms/${roomId}/players/${botName}`]: null,
      [`rooms/${roomId}/lastActivity`]: new Date().toISOString(),
    };

    await update(ref(database), updates);
  } catch (error) {
    console.error('Erro ao remover bot:', error);
    throw error;
  }
};

/**
 * Executa ação do bot baseada no estado atual do jogo
 */
export const executeBotAction = async (
  roomId: string,
  botName: string,
  gameState: GameState,
  allCards: Card[]
): Promise<void> => {
  try {
    // Verificar se é a vez do bot
    if (gameState.currentPlayer !== botName) {
      return;
    }

    // Buscar dados do bot
    const playerRef = ref(database, `rooms/${roomId}/players/${botName}`);
    const playerSnapshot = await get(playerRef);
    
    if (!playerSnapshot.exists()) {
      return;
    }

    const botData = playerSnapshot.val();
    if (!botData.isBot) {
      return;
    }

    const difficulty = botData.botDifficulty || 'medium';
    const thinkingTime = getBotThinkingTime(difficulty);

    // Simular tempo de pensamento
    await new Promise(resolve => setTimeout(resolve, thinkingTime));

    // Executar ação baseada na fase do jogo
    switch (gameState.gamePhase) {
      case 'selecting':
        await handleBotCardSelection(roomId, botName, gameState, allCards, difficulty);
        break;
      
      case 'revealing':
        await handleBotAttributeSelection(roomId, botName, gameState, allCards, difficulty);
        break;
      
      default:
        console.log(`Bot ${botName}: Aguardando fase ${gameState.gamePhase}`);
        break;
    }
  } catch (error) {
    console.error(`Erro na ação do bot ${botName}:`, error);
  }
};

/**
 * Bot seleciona uma carta para jogar
 */
const handleBotCardSelection = async (
  roomId: string,
  botName: string,
  gameState: GameState,
  allCards: Card[],
  difficulty: 'easy' | 'medium' | 'hard'
): Promise<void> => {
  try {
    // Verificar se o bot já jogou nesta rodada
    if (gameState.currentRoundCards[botName]) {
      return;
    }

    // Obter cartas do bot
    const botCards = gameState.playerCards[botName] || [];
    if (botCards.length === 0) {
      console.warn(`Bot ${botName} não tem cartas`);
      return;
    }

    // Selecionar melhor carta
    const decision = selectBestCard(botCards, allCards, difficulty);
    
    console.log(`Bot ${botName} selecionou carta ${decision.selectedCardId} - ${decision.reasoning}`);

    // Jogar a carta
    await playCard(roomId, botName, decision.selectedCardId);
  } catch (error) {
    console.error(`Erro na seleção de carta do bot ${botName}:`, error);
  }
};

/**
 * Bot seleciona atributo (apenas se for o primeiro jogador da rodada)
 */
const handleBotAttributeSelection = async (
  roomId: string,
  botName: string,
  gameState: GameState,
  allCards: Card[],
  difficulty: 'easy' | 'medium' | 'hard'
): Promise<void> => {
  try {
    // Verificar se já foi selecionado um atributo
    if (gameState.selectedAttribute) {
      return;
    }

    // Verificar se é o bot que deve escolher o atributo
    if (gameState.currentPlayer !== botName) {
      return;
    }

    // Obter carta jogada pelo bot
    const botCardId = gameState.currentRoundCards[botName];
    if (!botCardId) {
      return;
    }

    const botCard = allCards.find(card => card.id === botCardId);
    if (!botCard) {
      return;
    }

    // Selecionar melhor atributo da carta
    let selectedAttribute: string;
    
    if (difficulty === 'easy') {
      // Atributo aleatório
      const attributes = Object.keys(botCard.attributes);
      selectedAttribute = attributes[Math.floor(Math.random() * attributes.length)];
    } else {
      // Melhor atributo (maior valor)
      let bestAttribute = '';
      let bestValue = -1;
      
      Object.entries(botCard.attributes).forEach(([attribute, value]) => {
        if (value > bestValue) {
          bestValue = value;
          bestAttribute = attribute;
        }
      });
      
      selectedAttribute = bestAttribute;
    }

    console.log(`Bot ${botName} selecionou atributo ${selectedAttribute}`);

    // Selecionar atributo
    await selectAttribute(roomId, selectedAttribute);
  } catch (error) {
    console.error(`Erro na seleção de atributo do bot ${botName}:`, error);
  }
};

/**
 * Lista todos os bots em uma sala
 */
export const getBotPlayers = (players: { [key: string]: Player }): Player[] => {
  return Object.values(players).filter(player => player.isBot);
};

/**
 * Verifica se um jogador é um bot
 */
export const isBot = (player: Player): boolean => {
  return player.isBot === true;
};
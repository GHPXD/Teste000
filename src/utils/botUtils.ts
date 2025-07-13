// src/utils/botUtils.ts

import { Card, BotDecision } from '../types';

/**
 * Gera nomes aleatórios para bots
 */
const BOT_NAMES = [
  'Bot Alpha', 'Bot Beta', 'Bot Gamma', 'Bot Delta',
  'Bot Sigma', 'Bot Omega', 'Bot Prime', 'Bot Neo',
  'Bot Zeta', 'Bot Kappa', 'Bot Lambda', 'Bot Theta'
];

export const generateBotName = (existingPlayers: string[]): string => {
  const availableNames = BOT_NAMES.filter(name => !existingPlayers.includes(name));
  
  if (availableNames.length === 0) {
    let counter = 1;
    let botName = `Bot ${counter}`;
    while (existingPlayers.includes(botName)) {
      counter++;
      botName = `Bot ${counter}`;
    }
    return botName;
  }
  
  const randomIndex = Math.floor(Math.random() * availableNames.length);
  return availableNames[randomIndex];
};

/**
 * Encontra o melhor atributo de uma carta (maior valor)
 */
export const findBestAttribute = (card: Card): { attribute: string; value: number } => {
  let bestAttribute = '';
  let bestValue = -1;
  
  Object.entries(card.attributes).forEach(([attribute, value]) => {
    if (value > bestValue) {
      bestValue = value;
      bestAttribute = attribute;
    }
  });
  
  return { attribute: bestAttribute, value: bestValue };
};

/**
 * Estratégia de seleção de carta para bots
 * CORREÇÃO: A seleção da CARTA agora é sempre aleatória. A dificuldade influencia a escolha do ATRIBUTO.
 */
export const selectBestCard = (
  playerCards: string[],
  allCards: Card[],
  difficulty: 'easy' | 'medium' | 'hard' = 'medium'
): BotDecision => {
  const availableCards = playerCards
    .map(cardId => allCards.find(card => card.id === cardId))
    .filter(Boolean) as Card[];

  if (availableCards.length === 0) {
    throw new Error('Nenhuma carta disponível para o bot');
  }

  // A escolha da carta é sempre aleatória, independentemente da dificuldade.
  const selectedCard = availableCards[Math.floor(Math.random() * availableCards.length)];
  let reasoning: string;
  let confidence: number;

  switch (difficulty) {
    case 'easy':
      reasoning = 'Seleção aleatória de carta (dificuldade fácil)';
      confidence = 0.3;
      break;
    case 'hard':
       reasoning = 'Seleção aleatória de carta, melhor atributo (dificuldade difícil)';
       confidence = 0.9;
      break;
    case 'medium':
    default:
      reasoning = 'Seleção aleatória de carta, melhor atributo (dificuldade média)';
      confidence = 0.7;
      break;
  }

  // A inteligência do bot agora está em escolher o melhor atributo da carta que ele pegou.
  const bestAttribute = findBestAttribute(selectedCard);

  return {
    selectedCardId: selectedCard.id,
    selectedAttribute: bestAttribute.attribute, // O bot já "pensa" no melhor atributo para usar
    confidence,
    reasoning,
  };
};

/**
 * Calcula tempo de "pensamento" do bot baseado na dificuldade
 */
export const getBotThinkingTime = (difficulty: 'easy' | 'medium' | 'hard' = 'medium'): number => {
  switch (difficulty) {
    case 'easy':
      return Math.random() * 1000 + 500; // 0.5-1.5s
    case 'hard':
      return Math.random() * 2000 + 2000; // 2-4s
    case 'medium':
    default:
      return Math.random() * 1500 + 1000; // 1-2.5s
  }
};

/**
 * Gera mensagem de chat ocasional para bots (opcional)
 */
const BOT_MESSAGES = [
  'Boa jogada!',
  'Interessante...',
  'Vamos ver...',
  'Essa foi difícil!',
  'Parabéns!',
  'Próxima rodada!',
];

export const generateBotChatMessage = (): string | null => {
  // 20% de chance de enviar uma mensagem
  if (Math.random() < 0.2) {
    const randomIndex = Math.floor(Math.random() * BOT_MESSAGES.length);
    return BOT_MESSAGES[randomIndex];
  }
  return null;
};
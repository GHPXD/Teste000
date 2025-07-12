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
    // Se todos os nomes estão em uso, gera um nome numerado
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
 * Calcula o valor total de uma carta (soma de todos os atributos)
 */
export const calculateCardTotalValue = (card: Card): number => {
  return Object.values(card.attributes).reduce((sum, value) => sum + value, 0);
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

  let selectedCard: Card;
  let reasoning: string;
  let confidence: number;

  switch (difficulty) {
    case 'easy':
      // Estratégia simples: carta aleatória
      selectedCard = availableCards[Math.floor(Math.random() * availableCards.length)];
      reasoning = 'Seleção aleatória (dificuldade fácil)';
      confidence = 0.3;
      break;

    case 'hard':
      // Estratégia avançada: carta com melhor valor no atributo mais forte
      selectedCard = availableCards.reduce((best, current) => {
        const bestAttr = findBestAttribute(best);
        const currentAttr = findBestAttribute(current);
        return currentAttr.value > bestAttr.value ? current : best;
      });
      reasoning = 'Carta com o melhor atributo individual';
      confidence = 0.9;
      break;

    case 'medium':
    default:
      // Estratégia balanceada: carta com maior valor total
      selectedCard = availableCards.reduce((best, current) => {
        const bestTotal = calculateCardTotalValue(best);
        const currentTotal = calculateCardTotalValue(current);
        return currentTotal > bestTotal ? current : best;
      });
      reasoning = 'Carta com maior valor total';
      confidence = 0.7;
      break;
  }

  const bestAttribute = findBestAttribute(selectedCard);

  return {
    selectedCardId: selectedCard.id,
    selectedAttribute: bestAttribute.attribute,
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
import { Card, Player, RoundResult } from '../types';

/**
 * Embaralha um array usando algoritmo Fisher-Yates
 */
export const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

/**
 * Distribui cartas entre jogadores
 */
export const distributeCards = (cards: Card[], players: string[]): { [playerNickname: string]: string[] } => {
  const shuffledCards = shuffleArray(cards);
  const cardsPerPlayer = Math.floor(shuffledCards.length / players.length);
  const playerCards: { [playerNickname: string]: string[] } = {};

  players.forEach((player, index) => {
    const startIndex = index * cardsPerPlayer;
    const endIndex = startIndex + cardsPerPlayer;
    playerCards[player] = shuffledCards.slice(startIndex, endIndex).map(card => card.id);
  });

  return playerCards;
};

/**
 * Seleciona jogador aleatório para começar
 */
export const selectRandomPlayer = (players: string[]): string => {
  const randomIndex = Math.floor(Math.random() * players.length);
  return players[randomIndex];
};

/**
 * Compara cartas e determina vencedor da rodada
 */
export const compareCards = (
  roundCards: { [playerNickname: string]: string },
  attribute: string,
  allCards: Card[]
): { winner: string; results: { [playerNickname: string]: { cardId: string; value: number } } } => {
  const results: { [playerNickname: string]: { cardId: string; value: number } } = {};
  let maxValue = -1;
  let winner = '';

  Object.entries(roundCards).forEach(([playerNickname, cardId]) => {
    const card = allCards.find(c => c.id === cardId);
    if (card && card.attributes[attribute] !== undefined) {
      const value = card.attributes[attribute];
      results[playerNickname] = { cardId, value };
      
      if (value > maxValue) {
        maxValue = value;
        winner = playerNickname;
      }
    }
  });

  return { winner, results };
};

/**
 * Calcula próximo jogador na ordem
 */
export const getNextPlayer = (currentPlayer: string, players: string[]): string => {
  const currentIndex = players.indexOf(currentPlayer);
  const nextIndex = (currentIndex + 1) % players.length;
  return players[nextIndex];
};

/**
 * Verifica se o jogo terminou (alguém ficou sem cartas)
 */
export const checkGameEnd = (playerCards: { [playerNickname: string]: string[] }): string | null => {
  const playersWithCards = Object.entries(playerCards).filter(([_, cards]) => cards.length > 0);
  
  if (playersWithCards.length === 1) {
    return playersWithCards[0][0]; // Retorna o vencedor
  }
  
  return null;
};

/**
 * Formata valores para exibição
 */
export const formatAttributeValue = (attribute: string, value: number): string => {
  switch (attribute) {
    case 'População':
      return value >= 1000000 
        ? `${(value / 1000000).toFixed(1)}M` 
        : `${(value / 1000).toFixed(0)}K`;
    case 'Área':
    case 'Área Urbana':
      return `${value.toLocaleString()} km²`;
    case 'PIB':
      return `$${(value / 1000).toFixed(0)}B`;
    case 'IDH':
      return `${(value / 1000).toFixed(3)}`;
    case 'Altitude':
      return `${value}m`;
    case 'Fundação':
      return value.toString();
    default:
      return value.toLocaleString();
  }
};

/**
 * Gera delay aleatório para simular "pensamento" de bots
 */
export const getBotThinkingDelay = (): number => {
  return Math.random() * 2000 + 1000; // 1-3 segundos
};
// src/types/index.ts

// Tipos principais da aplicação
export interface User {
  nickname: string;
  avatar?: string; // NOVO: Avatar do usuário
  createdAt: string;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export interface Deck {
  id: string;
  name:string;
  description: string;
  imageSource: any;
  totalCards: number;
  categories: string[];
}

export interface Room {
  id: string;
  code: string;
  hostNickname: string;
  deckId: string;
  deckName: string;
  players: { [key: string]: Player };
  status: 'waiting' | 'playing' | 'finished';
  isPrivate: boolean;
  maxPlayers: number;
  createdAt: string;
  lastActivity: string;
  gameState?: GameState;
}

export interface Player {
  nickname: string;
  avatar?: string; // NOVO: Avatar do jogador na sala
  isHost: boolean;
  joinedAt: string;
  isReady: boolean;
  status?: 'active' | 'eliminated';
  isBot?: boolean;
  botDifficulty?: 'easy' | 'medium' | 'hard';
  cardsCount?: number;
}

export interface ChatMessage {
  id: string;
  nickname: string;
  message: string;
  timestamp: string;
}

export interface Card {
  id: string;
  name: string;
  image?: string;
  attributes: { [key: string]: number };
  description?: string;
}

export interface GameState {
  currentRound: number;
  currentPlayer: string;
  gamePhase: 'spinning' | 'selecting' | 'revealing' | 'comparing' | 'finished';
  playerCards: { [playerNickname: string]: string[] };
  currentRoundCards: { [playerNickname: string]: string };
  selectedAttribute: string | null;
  roundWinner: string | null;
  gameWinner: string | null;
  roundHistory: RoundResult[];
  spinResult?: string;
  botActions?: { [playerNickname: string]: BotAction };
}

export interface RoundResult {
  roundNumber: number;
  selectedAttribute: string;
  playerCards: { [playerNickname: string]: { cardId: string; value: number } };
  winner: string;
  timestamp: string;
}

export interface BotAction {
  type: 'thinking' | 'selecting_card' | 'selecting_attribute' | 'waiting';
  timestamp: string;
  cardId?: string;
  attribute?: string;
}

export interface BotDecision {
  selectedCardId: string;
  selectedAttribute?: string;
  confidence: number;
  reasoning: string;
}

// CORREÇÃO: Propriedade 'playerAvatar' adicionada
export interface GameContextState {
  selectedDeck: Deck | null;
  playerNickname: string;
  playerAvatar: string | null; // Adicionado aqui
  currentRoom: Room | null;
  isInRoom: boolean;
  gameCards: Card[];
  playerHand: Card[];
}

export type RootStackParamList = {
  Login: undefined;
  DeckSelection: undefined;
  Lobby: undefined;
  Game: { roomId: string };
};
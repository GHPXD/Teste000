import React, { createContext, useContext, useReducer, ReactNode, useCallback } from 'react';
import { Deck, GameContextState, Room } from '../types'; // Importe GameContextState em vez de GameState

// Ações do contexto
type GameAction =
  | { type: 'SET_SELECTED_DECK'; payload: Deck | null } // Permite nulo para reset
  | { type: 'SET_PLAYER_NICKNAME'; payload: string }
  | { type: 'SET_CURRENT_ROOM'; payload: Room | null }
  | { type: 'SET_IN_ROOM'; payload: boolean }
  | { type: 'RESET_GAME' };

// Estado inicial - Use a interface correta aqui
const initialState: GameContextState = {
  selectedDeck: null,
  playerNickname: '',
  currentRoom: null,
  isInRoom: false,
  gameCards: [], // Adicione os campos que faltavam
  playerHand: [], // Adicione os campos que faltavam
};

// Reducer para gerenciar estado - Use a interface correta aqui
const gameReducer = (state: GameContextState, action: GameAction): GameContextState => {
  switch (action.type) {
    case 'SET_SELECTED_DECK':
      return {
        ...state,
        selectedDeck: action.payload,
      };
    case 'SET_PLAYER_NICKNAME':
      return {
        ...state,
        playerNickname: action.payload,
      };
    case 'SET_CURRENT_ROOM':
      return {
        ...state,
        currentRoom: action.payload,
        isInRoom: action.payload !== null,
      };
    case 'SET_IN_ROOM':
      return {
        ...state,
        isInRoom: action.payload,
      };
    case 'RESET_GAME':
      // Garante que o estado inicial completo seja retornado
      return {
        ...initialState,
        playerNickname: state.playerNickname, // Mantém o nickname ao resetar
      };
    default:
      return state;
  }
};

// Interface do contexto - Use a interface correta aqui
interface GameContextType {
  state: GameContextState;
  setSelectedDeck: (deck: Deck | null) => void;
  setPlayerNickname: (nickname: string) => void;
  setCurrentRoom: (room: Room | null) => void;
  setInRoom: (inRoom: boolean) => void;
  resetGame: () => void;
}

// Criação do contexto
const GameContext = createContext<GameContextType | undefined>(undefined);

// Provider do contexto
interface GameProviderProps {
  children: ReactNode;
}

export const GameProvider: React.FC<GameProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  const setSelectedDeck = useCallback((deck: Deck | null) => {
    dispatch({ type: 'SET_SELECTED_DECK', payload: deck });
  }, []);

  const setPlayerNickname = useCallback((nickname: string) => {
    dispatch({ type: 'SET_PLAYER_NICKNAME', payload: nickname });
  }, []);

  const setCurrentRoom = useCallback((room: Room | null) => {
    dispatch({ type: 'SET_CURRENT_ROOM', payload: room });
  }, []);

  const setInRoom = useCallback((inRoom: boolean) => {
    dispatch({ type: 'SET_IN_ROOM', payload: inRoom });
  }, []);

  const resetGame = useCallback(() => {
    dispatch({ type: 'RESET_GAME' });
  }, []);

  const value = React.useMemo(() => ({
    state,
    setSelectedDeck,
    setPlayerNickname,
    setCurrentRoom,
    setInRoom,
    resetGame,
  }), [state, setSelectedDeck, setPlayerNickname, setCurrentRoom, setInRoom, resetGame]);

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
};

// Hook personalizado para usar o contexto
export const useGame = (): GameContextType => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame deve ser usado dentro de um GameProvider');
  }
  return context;
};
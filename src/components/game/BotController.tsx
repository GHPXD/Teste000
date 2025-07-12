import React, { useEffect, useRef, useCallback } from 'react';
import { GameState, Card, Player } from '../../types';
import { executeBotAction, getBotPlayers } from '../../services/botService';

interface BotControllerProps {
  roomId: string;
  gameState: GameState | null; // Permite que gameState seja nulo inicialmente
  players: { [key: string]: Player } | null; // Permite que players seja nulo
  allCards: Card[];
}

const BotController: React.FC<BotControllerProps> = ({
  roomId,
  gameState,
  players,
  allCards,
}) => {
  const lastGamePhase = useRef<string>('');
  const lastCurrentPlayer = useRef<string>('');
  const lastRound = useRef<number>(0);
  const processedActions = useRef<Set<string>>(new Set());

  const handleBotActions = useCallback(async () => {
    // As verificações foram movidas para dentro da função que depende delas
    if (!gameState || !players || !allCards.length || gameState.gamePhase === 'spinning') {
      return;
    }

    const bots = getBotPlayers(players);
    if (bots.length === 0) {
      return;
    }

    const currentPlayer = players[gameState.currentPlayer];
    if (!currentPlayer || !currentPlayer.isBot) {
      return;
    }
    
    const actionKey = `${gameState.currentPlayer}-${gameState.gamePhase}-${gameState.currentRound}`;
    if (processedActions.current.has(actionKey)) {
      return;
    }
    processedActions.current.add(actionKey);

    console.log(`🤖 Bot ${gameState.currentPlayer} deve agir na fase ${gameState.gamePhase}`);

    try {
      await executeBotAction(roomId, gameState.currentPlayer, gameState, allCards);
    } catch (error) {
      console.error('Erro na execução da ação do bot:', error);
      processedActions.current.delete(actionKey);
    }
  }, [gameState, players, allCards, roomId]);

  useEffect(() => {
    if (!gameState) return;

    const gamePhaseChanged = lastGamePhase.current !== gameState.gamePhase;
    const currentPlayerChanged = lastCurrentPlayer.current !== gameState.currentPlayer;
    const roundChanged = lastRound.current !== gameState.currentRound;

    if (gamePhaseChanged || currentPlayerChanged || roundChanged) {
      if (gamePhaseChanged || roundChanged) {
        processedActions.current.clear();
      }

      lastGamePhase.current = gameState.gamePhase;
      lastCurrentPlayer.current = gameState.currentPlayer;
      lastRound.current = gameState.currentRound;

      handleBotActions();
    }
  }, [gameState, handleBotActions]);

  return null;
};

export default BotController;
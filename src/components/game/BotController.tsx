// src/components/game/BotController.tsx

import React, { useEffect, useRef, useCallback } from 'react';
import { GameState, Card, Player } from '../../types';
import { executeBotAction, getBotPlayers } from '../../services/botService';

interface BotControllerProps {
  roomId: string;
  gameState: GameState | null;
  players: { [key: string]: Player } | null;
  allCards: Card[];
}

const BotController: React.FC<BotControllerProps> = ({
  roomId,
  gameState,
  players,
  allCards,
}) => {
  const processedActions = useRef<Set<string>>(new Set());

  const handleBotActions = useCallback(async () => {
    if (!gameState || !players || !allCards.length || !gameState.currentPlayer) {
      return;
    }
    
    // CORREÇÃO: Garante que só bots ajam e que a fase seja a correta
    const currentPlayerInfo = players[gameState.currentPlayer];
    if (!currentPlayerInfo || !currentPlayerInfo.isBot) {
      return;
    }
    
    if (gameState.gamePhase !== 'selecting') {
        return;
    }
    
    // Cria uma chave única para a ação (jogador + rodada) para evitar repetições
    const actionKey = `${gameState.currentPlayer}-${gameState.currentRound}`;
    if (processedActions.current.has(actionKey)) {
        return;
    }

    // Marca a ação como processada para não ser executada novamente
    processedActions.current.add(actionKey);

    console.log(`🤖 Bot ${gameState.currentPlayer} deve agir na fase ${gameState.gamePhase}`);

    try {
      await executeBotAction(roomId, gameState.currentPlayer, gameState, allCards);
    } catch (error) {
      console.error('Erro na execução da ação do bot:', error);
      // Permite que o bot tente novamente em caso de erro
      processedActions.current.delete(actionKey);
    }
  }, [gameState, players, allCards, roomId, processedActions]);
  
  // CORREÇÃO: useEffect simplificado para monitorar o estado do jogo
  useEffect(() => {
    // Limpa as ações processadas quando uma nova rodada começa
    if(gameState && gameState.currentRound !== processedActions.current.size) {
        processedActions.current.clear();
    }
    handleBotActions();
  }, [gameState, handleBotActions]);

  return null; // Este componente não renderiza nada
};

export default BotController;
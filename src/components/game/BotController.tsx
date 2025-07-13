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
    if (!gameState || !players || !allCards.length) {
      return;
    }

    // Pega todos os bots ativos na sala
    const bots = getBotPlayers(players).filter(p => p.status === 'active');
    if (bots.length === 0) return;
    
    // Itera sobre cada bot para ver se ele precisa agir
    for (const bot of bots) {
      const botName = bot.nickname;
      const actionKey = `${botName}-${gameState.currentRound}-${gameState.gamePhase}`;

      if (processedActions.current.has(actionKey)) {
        continue; // Ação já processada para este bot nesta fase/rodada
      }

      // Um bot precisa agir se:
      // 1. A fase é 'selecting' e ele ainda não jogou.
      // 2. A fase é 'revealing', é a vez dele e nenhum atributo foi escolhido ainda.
      const needsToPlayCard = gameState.gamePhase === 'selecting' && !gameState.currentRoundCards[botName];
      const needsToSelectAttribute = gameState.gamePhase === 'revealing' && gameState.currentPlayer === botName && !gameState.selectedAttribute;

      if (needsToPlayCard || needsToSelectAttribute) {
        console.log(`🤖 Bot ${botName} precisa agir na fase ${gameState.gamePhase}`);
        processedActions.current.add(actionKey); // Marca como processado
        
        try {
          await executeBotAction(roomId, botName, gameState, allCards);
        } catch (error) {
          console.error(`Erro na ação do bot ${botName}:`, error);
          processedActions.current.delete(actionKey); // Permite tentar de novo em caso de erro
        }
      }
    }
  }, [gameState, players, allCards, roomId]);

  // Limpa as ações processadas quando uma nova rodada começa
  useEffect(() => {
    const firstAction = processedActions.current.values().next().value;
    const currentRoundFromActions = firstAction ? parseInt(firstAction.split('-')[1], 10) : 0;
    
    if (gameState && gameState.currentRound !== currentRoundFromActions) {
        processedActions.current.clear();
    }
    handleBotActions();
  }, [gameState, handleBotActions]);

  return null; // Este componente não renderiza nada
};

export default BotController;
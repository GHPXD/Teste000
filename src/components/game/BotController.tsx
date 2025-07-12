import React, { useEffect, useRef } from 'react';
import { GameState, Card, Player } from '../../types';
import { executeBotAction, getBotPlayers } from '../../services/botService';

interface BotControllerProps {
  roomId: string;
  gameState: GameState;
  players: { [key: string]: Player };
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
  const lastRound = useRef<number>(0); // ✅ Adicionar controle de rodada
  const processedActions = useRef<Set<string>>(new Set());

  // ✅ Verificação inicial para evitar execução desnecessária
  if (!gameState || !players || !allCards.length) {
    return null;
  }

  // ✅ Não executar ações na fase spinning
  if (gameState.gamePhase === 'spinning') {
    return null;
  }

  useEffect(() => {
    // ✅ CORRETO: Verificações mais específicas para evitar loops
    const gamePhaseChanged = lastGamePhase.current !== gameState.gamePhase;
    const currentPlayerChanged = lastCurrentPlayer.current !== gameState.currentPlayer;
    const roundChanged = lastRound.current !== gameState.currentRound;

    if (gamePhaseChanged || currentPlayerChanged || roundChanged) {
      // Limpar ações processadas apenas quando necessário
      if (gamePhaseChanged || roundChanged) {
        processedActions.current.clear();
      }

      // Atualizar referências
      lastGamePhase.current = gameState.gamePhase;
      lastCurrentPlayer.current = gameState.currentPlayer;
      lastRound.current = gameState.currentRound;

      // Processar ações dos bots
      handleBotActions();
    }
  }, [gameState.gamePhase, gameState.currentPlayer, gameState.currentRound]); // ✅ Dependências específicas

  const handleBotActions = async () => {
    const bots = getBotPlayers(players);
    
    if (bots.length === 0) {
      return;
    }

    // Verificar se é a vez de algum bot agir
    const currentPlayer = players[gameState.currentPlayer];
    if (!currentPlayer || !currentPlayer.isBot) {
      return;
    }

    // Criar chave única para esta ação
    const actionKey = `${gameState.currentPlayer}-${gameState.gamePhase}-${gameState.currentRound}`;
    
    // Evitar processar a mesma ação múltiplas vezes
    if (processedActions.current.has(actionKey)) {
      return;
    }

    processedActions.current.add(actionKey);

    console.log(`🤖 Bot ${gameState.currentPlayer} deve agir na fase ${gameState.gamePhase}`);

    try {
      await executeBotAction(roomId, gameState.currentPlayer, gameState, allCards);
    } catch (error) {
      console.error('Erro na execução da ação do bot:', error);
      // Remove da lista para tentar novamente
      processedActions.current.delete(actionKey);
    }
  };

  // Este componente não renderiza nada visualmente
  return null;
};

export default BotController;
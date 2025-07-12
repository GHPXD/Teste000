import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { GameState } from '../../types';

interface RodadaInfoProps {
  gameState: GameState;
  playerNickname: string;
  playerCount: number;
}

const RodadaInfo: React.FC<RodadaInfoProps> = ({
  gameState,
  playerNickname,
  playerCount,
}) => {
  const getPhaseText = () => {
    switch (gameState.gamePhase) {
      case 'spinning':
        return '🎯 Girando a roleta...';
      case 'selecting':
        return '🎴 Escolhendo cartas';
      case 'revealing':
        return '👁️ Revelando cartas';
      case 'comparing':
        return '⚔️ Comparando valores';
      case 'finished':
        return '🏆 Jogo finalizado!';
      default:
        return '🎮 Aguardando...';
    }
  };

  const isCurrentPlayer = gameState.currentPlayer === playerNickname;
  const playedCount = Object.keys(gameState.currentRoundCards).length;

  return (
    <View style={styles.container}>
      {/* Header da rodada */}
      <View style={styles.header}>
        <Text style={styles.roundNumber}>
          Rodada {gameState.currentRound}
        </Text>
        <Text style={styles.phaseText}>
          {getPhaseText()}
        </Text>
      </View>

      {/* Informações do jogador atual */}
      <View style={styles.currentPlayerContainer}>
        <Text style={styles.currentPlayerLabel}>
          {gameState.gamePhase === 'selecting' ? 'Vez de:' : 'Iniciador:'}
        </Text>
        <Text style={[
          styles.currentPlayerName,
          isCurrentPlayer && styles.isYou,
        ]}>
          {gameState.currentPlayer}
          {isCurrentPlayer && ' (Você)'}
        </Text>
      </View>

      {/* Progresso das jogadas */}
      {gameState.gamePhase === 'selecting' && (
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            Cartas jogadas: {playedCount}/{playerCount}
          </Text>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill,
                { width: `${(playedCount / playerCount) * 100}%` }
              ]} 
            />
          </View>
        </View>
      )}

      {/* Atributo selecionado */}
      {gameState.selectedAttribute && (
        <View style={styles.attributeContainer}>
          <Text style={styles.attributeLabel}>Atributo escolhido:</Text>
          <Text style={styles.attributeName}>
            {gameState.selectedAttribute}
          </Text>
        </View>
      )}

      {/* Vencedor da rodada */}
      {gameState.roundWinner && (
        <View style={styles.winnerContainer}>
          <Text style={styles.winnerLabel}>🏆 Vencedor da rodada:</Text>
          <Text style={styles.winnerName}>
            {gameState.roundWinner}
            {gameState.roundWinner === playerNickname && ' (Você)'}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  roundNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  phaseText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  currentPlayerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  currentPlayerLabel: {
    fontSize: 14,
    color: '#666',
  },
  currentPlayerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  isYou: {
    color: '#2196f3',
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    textAlign: 'center',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4caf50',
    borderRadius: 3,
  },
  attributeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  attributeLabel: {
    fontSize: 14,
    color: '#1976d2',
  },
  attributeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976d2',
  },
  winnerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff3e0',
    padding: 8,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ff9800',
  },
  winnerLabel: {
    fontSize: 14,
    color: '#f57c00',
  },
  winnerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f57c00',
  },
});

export default RodadaInfo;
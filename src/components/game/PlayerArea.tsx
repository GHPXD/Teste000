// src/components/game/PlayerArea.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { Player } from '../../types';

interface PlayerAreaProps {
  player: Player;
  cardCount: number;
  hasPlayedCard: boolean;
  isCurrentPlayer: boolean;
  isYou: boolean;
}

const PlayerArea: React.FC<PlayerAreaProps> = ({
  player,
  cardCount,
  hasPlayedCard,
  isCurrentPlayer,
  isYou,
}) => {
  return (
    <View style={[
      styles.container,
      isCurrentPlayer && styles.currentPlayerContainer,
      isYou && styles.yourContainer,
    ]}>
      <Text style={[
        styles.playerName,
        isCurrentPlayer && styles.currentPlayerName,
        isYou && styles.yourName,
      ]}>
        {player.nickname}
        {isYou && ' (Você)'}
        {player.isHost && ' 👑'}
      </Text>
      
      <View style={styles.cardInfo}>
        <Text style={styles.cardCount}>{cardCount} cartas</Text>
        {hasPlayedCard && (
          <Text style={styles.playedStatus}>✓ Jogou</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  currentPlayerContainer: {
    borderWidth: 2,
    borderColor: '#FF9800',
    backgroundColor: '#FFF3E0',
  },
  yourContainer: {
    borderWidth: 2,
    borderColor: '#2196F3',
    backgroundColor: '#E3F2FD',
  },
  playerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  currentPlayerName: {
    color: '#F57C00',
  },
  yourName: {
    color: '#1976D2',
  },
  cardInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardCount: {
    fontSize: 12,
    color: '#666',
  },
  playedStatus: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
  },
});

export default PlayerArea;
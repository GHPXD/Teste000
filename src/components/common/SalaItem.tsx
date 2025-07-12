import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Room } from '../../types';
import { getPlayerCount } from '../../utils/roomUtils';

interface SalaItemProps {
  room: Room;
  onJoin: (room: Room) => void;
  isLoading?: boolean;
}

const SalaItem: React.FC<SalaItemProps> = ({ room, onJoin, isLoading = false }) => {
  const playerCount = getPlayerCount(room);
  const isFull = playerCount >= room.maxPlayers;

  return (
    <TouchableOpacity
      style={[styles.container, isFull && styles.containerDisabled]}
      onPress={() => !isFull && !isLoading && onJoin(room)}
      disabled={isFull || isLoading}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.codeContainer}>
          <Text style={styles.code}>{room.code}</Text>
        </View>
        <View style={styles.playersContainer}>
          <Text style={styles.playersText}>
            {playerCount}/{room.maxPlayers}
          </Text>
        </View>
      </View>

      <View style={styles.info}>
        <Text style={styles.hostText}>
          Host: {room.hostNickname}
        </Text>
        <Text style={styles.deckText}>
          Baralho: {room.deckName}
        </Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.timeText}>
          Criada há {getTimeAgo(room.createdAt)}
        </Text>
        {isFull && (
          <Text style={styles.fullText}>LOTADA</Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const getTimeAgo = (timestamp: string): string => {
  const now = new Date();
  const created = new Date(timestamp);
  const diffInMinutes = Math.floor((now.getTime() - created.getTime()) / (1000 * 60));

  if (diffInMinutes < 1) return 'agora';
  if (diffInMinutes < 60) return `${diffInMinutes}m`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}d`;
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  containerDisabled: {
    opacity: 0.6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  codeContainer: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  code: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
    fontFamily: 'monospace',
  },
  playersContainer: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  playersText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  info: {
    marginBottom: 8,
  },
  hostText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  deckText: {
    fontSize: 12,
    color: '#666',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 11,
    color: '#999',
  },
  fullText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#F44336',
  },
});

export default SalaItem;
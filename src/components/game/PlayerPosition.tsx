// src/components/game/PlayerPosition.tsx

import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Player } from '../../types';

interface PlayerPositionProps {
  player: Player;
  cardCount: number;
  style: StyleProp<ViewStyle>;
  avatarSize: number;
  cardWidth: number;
  cardHeight: number;
}

const PlayerPosition: React.FC<PlayerPositionProps> = ({ player, cardCount, style, avatarSize, cardWidth, cardHeight }) => {
  
  // Estilos dinâmicos calculados a partir das props
  const dynamicStyles = {
    avatarContainer: {
      width: avatarSize,
      height: avatarSize,
      borderRadius: avatarSize / 2,
    },
    avatarText: {
      fontSize: avatarSize * 0.5,
    },
    playerName: {
      fontSize: avatarSize * 0.22,
    },
    opponentHand: {
      height: cardHeight + 10,
    },
    cardBack: {
      width: cardWidth,
      height: cardHeight,
    }
  };

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.avatarContainer, dynamicStyles.avatarContainer]}>
        <Text style={dynamicStyles.avatarText}>{player.avatar}</Text>
      </View>
      <Text style={[styles.playerName, dynamicStyles.playerName]}>{player.nickname}</Text>
      
      <View style={[styles.opponentHand, dynamicStyles.opponentHand]}>
        {Array.from({ length: cardCount }).map((_, index) => {
          const totalCards = cardCount;
          const middleIndex = (totalCards - 1) / 2;
          const angle = (index - middleIndex) * 15;
          const translateY = Math.abs(index - middleIndex) * 2;
          
          const cardStyle = {
            transform: [{ translateY }, { rotate: `${angle}deg` }],
            marginLeft: index > 0 ? -cardWidth * 0.75 : 0,
          };

          return (
            <View
              key={index}
              style={[
                styles.cardBack,
                dynamicStyles.cardBack,
                cardStyle,
              ]}
            />
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignItems: 'center',
    width: 120, 
    height: 120,
  },
  avatarContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    elevation: 5,
  },
  avatarText: {},
  playerName: {
    color: '#fff',
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    marginTop: 5,
  },
  opponentHand: {
    flexDirection: 'row',
    marginTop: 5,
  },
  cardBack: {
    backgroundColor: '#1A237E',
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#fff',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 2,
    shadowOffset: {width: 0, height: 1},
  },
});

export default PlayerPosition;
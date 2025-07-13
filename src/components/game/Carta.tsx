// src/components/game/Carta.tsx

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Image,
} from 'react-native';
import { Card } from '../../types';
import { formatAttributeValue } from '../../utils/gameUtils';

interface CartaProps {
  card: Card;
  isRevealed: boolean;
  isSelected: boolean;
  isSelectable: boolean;
  selectedAttribute?: string;
  onSelect?: () => void;
}

const { width } = Dimensions.get('window');
// Ajuste para um tamanho de carta um pouco maior na tela
const CARD_WIDTH = width * 0.45;
const CARD_HEIGHT = CARD_WIDTH * 1.5;

const Carta: React.FC<CartaProps> = ({
  card,
  isRevealed,
  isSelected,
  isSelectable,
  selectedAttribute,
  onSelect,
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isRevealed) {
      Animated.timing(animatedValue, {
        toValue: 180,
        duration: 600,
        useNativeDriver: true,
      }).start();
    } else {
      animatedValue.setValue(0);
    }
  }, [isRevealed, animatedValue]);

  const handlePress = () => {
    if (isSelectable && onSelect) {
      onSelect();
    }
  };

  const frontAnimatedStyle = {
    transform: [
      {
        rotateY: animatedValue.interpolate({
          inputRange: [0, 180],
          outputRange: ['0deg', '180deg'],
        }),
      },
    ],
  };

  const backAnimatedStyle = {
    transform: [
      {
        rotateY: animatedValue.interpolate({
          inputRange: [0, 180],
          outputRange: ['180deg', '360deg'],
        }),
      },
    ],
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        isSelected && styles.selectedContainer,
        !isSelectable && styles.disabledContainer,
      ]}
      onPress={handlePress}
      disabled={!isSelectable}
      activeOpacity={0.8}
    >
      {/* Verso da carta */}
      {!isRevealed && (
        <Animated.View style={[styles.cardBase, styles.cardBack, backAnimatedStyle]}>
          <View style={styles.backPattern}>
            <Text style={styles.backText}>🎴</Text>
            <Text style={styles.backTitle}>TRUNFIA</Text>
          </View>
        </Animated.View>
      )}

      {/* Frente da carta */}
      <Animated.View style={[styles.cardBase, styles.cardFront, frontAnimatedStyle]}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle} numberOfLines={1}>{card.name}</Text>
        </View>

        <View style={styles.imageContainer}>
          {card.image ? (
            <Image 
              source={{ uri: card.image }} 
              style={styles.cardImage}
              resizeMode="cover"
            />
          ) : (
            <Text style={styles.imagePlaceholder}>🌍</Text>
          )}
        </View>

        <View style={styles.attributesWrapper}>
            <View style={styles.attributesContainer}>
                {Object.entries(card.attributes).map(([key, value]) => (
                <View
                    key={key}
                    style={[
                    styles.attributeRow,
                    selectedAttribute === key && styles.selectedAttribute,
                    ]}
                >
                    <Text style={[
                    styles.attributeName,
                    selectedAttribute === key && styles.selectedAttributeText,
                    ]}>
                    {key}:
                    </Text>
                    <Text style={[
                    styles.attributeValue,
                    selectedAttribute === key && styles.selectedAttributeText,
                    ]}>
                    {formatAttributeValue(key, value)}
                    </Text>
                </View>
                ))}
            </View>
        </View>
      </Animated.View>

      {isSelected && (
        <View style={styles.selectionIndicator}>
          <Text style={styles.selectionIcon}>✓</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    margin: 8,
  },
  selectedContainer: {
    transform: [{ scale: 1.05 }],
    shadowColor: '#007AFF',
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  disabledContainer: {
    opacity: 0.6,
  },
  cardBase: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    borderRadius: 12,
    backfaceVisibility: 'hidden',
    borderWidth: 1,
    borderColor: '#DDD',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  cardBack: {
    backgroundColor: '#1a237e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardFront: {
    backgroundColor: '#f8f9fa',
    overflow: 'hidden',
  },
  backPattern: {
    alignItems: 'center',
  },
  backText: {
    fontSize: 48,
    marginBottom: 8,
  },
  backTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
    letterSpacing: 2,
  },
  cardHeader: {
    backgroundColor: '#3f51b5',
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
  },
  imageContainer: {
    height: '20%', // 20% da altura da carta
    width: '100%',  // 100% da largura da carta
    backgroundColor: '#e9ecef',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    fontSize: 24,
    textAlign: 'center',
    lineHeight: CARD_HEIGHT * 0.2, // Centraliza verticalmente
  },
  attributesWrapper: {
    height: '80%', // 80% da altura da carta
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  attributesContainer: {
    width: '90%', // 90% da largura do wrapper
    height: '95%',
    justifyContent: 'space-around', // Distribui os atributos
  },
  attributeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  selectedAttribute: {
    backgroundColor: '#e3f2fd',
  },
  attributeName: {
    fontSize: 11,
    fontWeight: '500',
    color: '#495057',
    flex: 1,
  },
  attributeValue: {
    fontSize: 11,
    fontWeight: '700',
    color: '#212529',
    textAlign: 'right',
  },
  selectedAttributeText: {
    color: '#1976d2',
    fontWeight: 'bold',
  },
  selectionIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#4caf50',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  selectionIcon: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default Carta;
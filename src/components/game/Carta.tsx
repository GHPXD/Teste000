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
  isAttributeSelectable?: boolean;
  onAttributeSelect?: (attribute: string) => void;
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.45;
const CARD_HEIGHT = CARD_WIDTH * 1.5;

const Carta: React.FC<CartaProps> = ({
  card,
  isRevealed,
  isSelected,
  isSelectable,
  selectedAttribute,
  onSelect,
  isAttributeSelectable = false,
  onAttributeSelect,
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // CORREÇÃO: Invertemos a lógica. 0 = verso, 180 = frente.
    const toValue = isRevealed ? 180 : 0;
    Animated.timing(animatedValue, {
      toValue,
      duration: 400, // Animação um pouco mais rápida
      useNativeDriver: true,
    }).start();
  }, [isRevealed, animatedValue]);

  const handlePress = () => {
    if (isSelectable && onSelect) {
      onSelect();
    }
  };

  // O verso começa visível (0deg) e vira para trás (180deg)
  const backAnimatedStyle = {
    transform: [
      {
        rotateY: animatedValue.interpolate({
          inputRange: [0, 180],
          outputRange: ['0deg', '180deg'],
        }),
      },
    ],
  };
  
  // A frente começa virada para trás (-180deg) e vira para frente (0deg)
  const frontAnimatedStyle = {
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
      ]}
      onPress={handlePress}
      disabled={!isSelectable}
      activeOpacity={0.9}
    >
      <Animated.View style={[styles.cardBase, styles.cardBack, backAnimatedStyle]}>
        <View style={styles.backPattern}>
          <Image source={require('../../assets/images/logo-verso.png.png')} style={styles.logoImage} />
          <Text style={styles.backTitle}>TRUNFIA</Text>
        </View>
      </Animated.View>

      <Animated.View style={[styles.cardBase, styles.cardFront, frontAnimatedStyle]}>
        <View style={styles.imageContainer}>
          {card.image ? (
            <Image 
              source={{ uri: card.image }} 
              style={styles.cardImage}
              resizeMode="cover"
            />
          ) : (
            <Text style={styles.imagePlaceholder}>{card.name}</Text>
          )}
        </View>

        <View style={styles.attributesWrapper}>
          <View style={styles.attributesContainer}>
              {Object.entries(card.attributes).map(([key, value]) => (
              <TouchableOpacity
                  key={key}
                  style={[
                    styles.attributeRow,
                    isAttributeSelectable && styles.attributeSelectable,
                    selectedAttribute === key && styles.selectedAttribute,
                  ]}
                  onPress={() => onAttributeSelect?.(key)}
                  disabled={!isAttributeSelectable}
              >
                  <Text style={styles.attributeName}>{key}:</Text>
                  <Text style={styles.attributeValue}>{formatAttributeValue(key, value)}</Text>
              </TouchableOpacity>
              ))}
          </View>
        </View>
      </Animated.View>

      {isSelected && !isRevealed && (
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
  cardBase: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    borderRadius: 12,
    backfaceVisibility: 'hidden',
    borderWidth: 1,
    borderColor: '#CCC',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  cardBack: {
    backgroundColor: '#2c3e50', // Cor mais escura
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
  logoImage: {
    width: 60,
    height: 60,
    marginBottom: 10,
  },
  backTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    letterSpacing: 3,
  },
  imageContainer: {
    height: '35%', // Aumentado para dar mais destaque à imagem
    width: '100%',
    backgroundColor: '#e9ecef',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#6c757d',
    paddingTop: 20
  },
  attributesWrapper: {
    height: '65%',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 5,
  },
  attributesContainer: {
    width: '90%',
    height: '100%',
    justifyContent: 'space-around',
  },
  attributeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#f8f9fa',
  },
  attributeSelectable: {
    backgroundColor: '#FFF',
  },
  selectedAttribute: {
    backgroundColor: '#d1ecf1',
    borderColor: '#007bff',
    transform: [{ scale: 1.05 }],
    elevation: 2,
  },
  attributeName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#495057',
  },
  attributeValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#212529',
  },
  selectionIndicator: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#28a745',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    borderWidth: 1,
    borderColor: '#FFF',
  },
  selectionIcon: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default Carta;
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
  width?: number; // Prop para largura dinâmica
  height?: number; // Prop para altura dinâmica
  selectedAttribute?: string;
  onSelect?: () => void;
  isAttributeSelectable?: boolean;
  onAttributeSelect?: (attribute: string) => void;
}

const FALLBACK_WIDTH = Dimensions.get('window').width * 0.25;

const Carta: React.FC<CartaProps> = ({
  card,
  isRevealed,
  isSelected,
  isSelectable,
  width = FALLBACK_WIDTH,
  height = width * 1.5,
  selectedAttribute,
  onSelect,
  isAttributeSelectable = false,
  onAttributeSelect,
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const toValue = isRevealed ? 180 : 0;
    Animated.timing(animatedValue, {
      toValue,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isRevealed, animatedValue]);

  const handlePress = () => {
    if (isSelectable && onSelect) {
      onSelect();
    }
  };

  const backAnimatedStyle = {
    transform: [{ rotateY: animatedValue.interpolate({ inputRange: [0, 180], outputRange: ['0deg', '180deg'] }) }],
  };
  
  const frontAnimatedStyle = {
    transform: [{ rotateY: animatedValue.interpolate({ inputRange: [0, 180], outputRange: ['180deg', '360deg'] }) }],
  };

  // Estilos dinâmicos baseados no tamanho da carta
  const dynamicStyles = {
    container: { width, height },
    cardNameText: { fontSize: width * 0.12 },
    attributeName: { fontSize: width * 0.09 },
    attributeValue: { fontSize: width * 0.09 },
    attributeRow: { paddingVertical: height * 0.025 },
  };

  return (
    <TouchableOpacity
      style={[styles.container, dynamicStyles.container, isSelected && styles.selectedContainer]}
      onPress={handlePress}
      disabled={!isSelectable && !isAttributeSelectable}
      activeOpacity={0.9}
    >
      <Animated.View style={[styles.cardBase, styles.cardBack, backAnimatedStyle]}>
        <Image source={require('../../assets/images/logo-verso.png')} style={styles.logoImage} />
      </Animated.View>

      <Animated.View style={[styles.cardBase, styles.cardFront, frontAnimatedStyle]}>
        <View style={styles.imageContainer}>
          {card.image ? (
            <Image source={{ uri: card.image }} style={styles.cardImage} resizeMode="cover" />
          ) : (
            <Text style={styles.imagePlaceholder}>{card.name}</Text>
          )}
          <View style={styles.cardNameContainer}>
            <Text style={[styles.cardNameText, dynamicStyles.cardNameText]}>{card.name}</Text>
          </View>
        </View>

        <View style={styles.attributesWrapper}>
          <View style={styles.attributesContainer}>
              {Object.entries(card.attributes).map(([key, value]) => (
              <TouchableOpacity
                  key={key}
                  style={[ styles.attributeRow, dynamicStyles.attributeRow, isAttributeSelectable && styles.attributeSelectable, selectedAttribute === key && styles.selectedAttribute ]}
                  onPress={() => onAttributeSelect?.(key)}
                  disabled={!isAttributeSelectable}
              >
                  <Text style={[styles.attributeName, dynamicStyles.attributeName]}>{key}:</Text>
                  <Text style={[styles.attributeValue, dynamicStyles.attributeValue]}>{formatAttributeValue(key, value)}</Text>
              </TouchableOpacity>
              ))}
          </View>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 4,
  },
  selectedContainer: {
    transform: [{ scale: 1.08 }, { translateY: -15 }],
    shadowColor: '#f1c40f',
    shadowOpacity: 0.8,
    shadowRadius: 12,
    elevation: 12,
  },
  cardBase: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    borderRadius: 10,
    backfaceVisibility: 'hidden',
    borderWidth: 2,
    borderColor: '#fff',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  cardBack: {
    backgroundColor: '#2c3e50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardFront: {
    backgroundColor: '#ecf0f1',
    overflow: 'hidden',
  },
  logoImage: {
    width: '70%',
    height: '70%',
    resizeMode: 'contain',
  },
  imageContainer: {
    height: '40%',
    width: '100%',
    backgroundColor: '#bdc3c7',
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardNameContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: 4,
  },
  cardNameText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  imagePlaceholder: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#2c3e50',
    padding: 5,
  },
  attributesWrapper: {
    height: '60%',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  attributesContainer: {
    width: '100%',
    flex: 1,
    justifyContent: 'space-around',
  },
  attributeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  attributeSelectable: {
    backgroundColor: '#fff',
    borderColor: '#ccc',
  },
  selectedAttribute: {
    backgroundColor: '#f1c40f',
    borderColor: '#f39c12',
    transform: [{ scale: 1.05 }],
    elevation: 3,
  },
  attributeName: {
    fontWeight: '600',
    color: '#34495e',
  },
  attributeValue: {
    fontWeight: 'bold',
    color: '#2c3e50',
  },
});

export default Carta;
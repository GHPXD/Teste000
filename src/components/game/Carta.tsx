import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
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
const CARD_WIDTH = width * 0.4;
const CARD_HEIGHT = CARD_WIDTH * 1.4;

const Carta: React.FC<CartaProps> = ({
  card,
  isRevealed,
  isSelected,
  isSelectable,
  selectedAttribute,
  onSelect,
}) => {
  // ✅ CORRETO: Criar animatedValue internamente com useRef
  const animatedValue = useRef(new Animated.Value(0)).current;

  // ✅ CORRETO: useEffect com dependências específicas
  useEffect(() => {
    if (isRevealed) {
      Animated.timing(animatedValue, {
        toValue: 180,
        duration: 600,
        useNativeDriver: true,
      }).start();
    } else {
      // Reset animation when card is hidden
      animatedValue.setValue(0);
    }
  }, [isRevealed, animatedValue]);

  const handlePress = () => {
    if (isSelectable && onSelect) {
      onSelect();
    }
  };

  // Animação de flip
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
        <Animated.View style={[styles.cardBack, backAnimatedStyle]}>
          <View style={styles.backPattern}>
            <Text style={styles.backText}>🎴</Text>
            <Text style={styles.backTitle}>TRUNFIA</Text>
          </View>
        </Animated.View>
      )}

      {/* Frente da carta */}
      {isRevealed && (
        <Animated.View style={[styles.cardFront, frontAnimatedStyle]}>
          {/* Header da carta */}
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{card.name}</Text>
          </View>

          {/* Imagem placeholder */}
          <View style={styles.imageContainer}>
            <Text style={styles.imagePlaceholder}>🌍</Text>
          </View>

          {/* Atributos */}
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

          {/* Descrição */}
          {card.description && (
            <View style={styles.descriptionContainer}>
              <Text style={styles.description}>{card.description}</Text>
            </View>
          )}
        </Animated.View>
      )}

      {/* Indicador de seleção */}
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
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  selectedContainer: {
    elevation: 8,
    shadowOpacity: 0.4,
    transform: [{ scale: 1.05 }],
  },
  disabledContainer: {
    opacity: 0.6,
  },
  cardBack: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1a237e',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backfaceVisibility: 'hidden',
  },
  cardFront: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FFF',
    borderRadius: 12,
    overflow: 'hidden',
    backfaceVisibility: 'hidden',
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
    padding: 12,
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
  },
  imageContainer: {
    height: 80,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholder: {
    fontSize: 32,
  },
  attributesContainer: {
    flex: 1,
    padding: 8,
  },
  attributeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginBottom: 2,
  },
  selectedAttribute: {
    backgroundColor: '#e3f2fd',
    borderWidth: 1,
    borderColor: '#2196f3',
  },
  attributeName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  attributeValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
    textAlign: 'right',
  },
  selectedAttributeText: {
    color: '#1976d2',
  },
  descriptionContainer: {
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  description: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
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
  },
  selectionIcon: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default Carta;
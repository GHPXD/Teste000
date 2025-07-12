import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Deck } from '../../types';

interface BaralhoCardProps {
  deck: Deck;
  isSelected: boolean;
  onSelect: (deck: Deck) => void;
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2; // 2 cards per row with margins

const BaralhoCard: React.FC<BaralhoCardProps> = ({ 
  deck, 
  isSelected, 
  onSelect 
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.card,
        isSelected && styles.cardSelected
      ]}
      onPress={() => onSelect(deck)}
      activeOpacity={0.8}
    >
      {/* Imagem do baralho */}
      <View style={styles.imageContainer}>
        <Image
          source={deck.imageSource}
          style={styles.image}
          resizeMode="cover"
        />
        {isSelected && (
          <View style={styles.selectedOverlay}>
            <Text style={styles.selectedIcon}>✓</Text>
          </View>
        )}
      </View>

      {/* Informações do baralho */}
      <View style={styles.info}>
        <Text style={[
          styles.title,
          isSelected && styles.titleSelected
        ]}>
          {deck.name}
        </Text>
        
        <Text style={styles.description}>
          {deck.description}
        </Text>
        
        <View style={styles.stats}>
          <Text style={styles.statsText}>
            {deck.totalCards} cartas
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#FFF',
    borderRadius: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  cardSelected: {
    borderWidth: 3,
    borderColor: '#007AFF',
    elevation: 6,
    shadowOpacity: 0.2,
  },
  imageContainer: {
    position: 'relative',
    height: 120,
    backgroundColor: '#F0F0F0',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  selectedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 122, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedIcon: {
    fontSize: 32,
    color: '#FFF',
    fontWeight: 'bold',
  },
  info: {
    padding: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  titleSelected: {
    color: '#007AFF',
  },
  description: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
    marginBottom: 8,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statsText: {
    fontSize: 11,
    color: '#999',
    fontWeight: '500',
  },
});

export default BaralhoCard;
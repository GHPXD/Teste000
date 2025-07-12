import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, Deck } from '../types';
import { useGame } from '../contexts/GameContext';
import BaralhoCard from '../components/common/BaralhoCard';
import { getUserNickname } from '../services/storageService';

type DeckSelectionNavigationProp = StackNavigationProp<RootStackParamList, 'DeckSelection'>;

interface Props {
  navigation: DeckSelectionNavigationProp;
}

// Dados dos baralhos disponíveis
const AVAILABLE_DECKS: Deck[] = [
  {
    id: 'paises',
    name: 'Países',
    description: 'Explore o mundo com dados de países como população, área e PIB',
    imageSource: require('../assets/images/paises-deck.png'),
    totalCards: 32,
    categories: ['População', 'Área', 'PIB', 'IDH'],
  },
  {
    id: 'capitais',
    name: 'Capitais',
    description: 'Descubra capitais mundiais com população, altitude e fundação',
    imageSource: require('../assets/images/capitais-deck.png'),
    totalCards: 28,
    categories: ['População', 'Altitude', 'Fundação', 'Área Urbana'],
  },
];

const DeckSelectionScreen: React.FC<Props> = ({ navigation }) => {
  const { state, setSelectedDeck, setPlayerNickname } = useGame();
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Carrega nickname do usuário ao iniciar
  useEffect(() => {
    loadUserNickname();
  }, []);

  const loadUserNickname = async () => {
    try {
      const nickname = await getUserNickname();
      if (nickname) {
        setPlayerNickname(nickname);
      }
    } catch (error) {
      console.error('Erro ao carregar nickname:', error);
    }
  };

  const handleDeckSelect = (deck: Deck) => {
    setSelectedDeckId(deck.id);
    setSelectedDeck(deck);
  };

  const handleContinue = async () => {
    if (!state.selectedDeck) {
      Alert.alert('Atenção', 'Por favor, selecione um baralho para continuar.');
      return;
    }

    setIsLoading(true);
    
    try {
      // Simula um pequeno delay para feedback visual
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Navega para a tela de lobby
      navigation.navigate('Lobby');
    } catch (error) {
      Alert.alert('Erro', 'Ocorreu um erro. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🎴 Escolha seu Baralho</Text>
        <Text style={styles.subtitle}>
          Olá, {state.playerNickname}! Selecione um baralho para começar:
        </Text>
      </View>

      {/* Lista de baralhos */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.decksContainer}>
          {AVAILABLE_DECKS.map((deck) => (
            <BaralhoCard
              key={deck.id}
              deck={deck}
              isSelected={selectedDeckId === deck.id}
              onSelect={handleDeckSelect}
            />
          ))}
        </View>

        {/* Informações adicionais */}
        {state.selectedDeck && (
          <View style={styles.selectedInfo}>
            <Text style={styles.selectedTitle}>
              Baralho Selecionado: {state.selectedDeck.name}
            </Text>
            <Text style={styles.selectedDescription}>
              Categorias: {state.selectedDeck.categories.join(', ')}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Botão de continuar */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            state.selectedDeck ? styles.continueButtonEnabled : styles.continueButtonDisabled
          ]}
          onPress={handleContinue}
          disabled={!state.selectedDeck || isLoading}
        >
          <Text style={styles.continueButtonText}>
            {isLoading ? 'Carregando...' : 'Continuar'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  decksContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  selectedInfo: {
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  selectedTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976D2',
    marginBottom: 4,
  },
  selectedDescription: {
    fontSize: 14,
    color: '#1565C0',
  },
  footer: {
    padding: 24,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  continueButton: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueButtonEnabled: {
    backgroundColor: '#007AFF',
  },
  continueButtonDisabled: {
    backgroundColor: '#CCC',
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
  },
});

export default DeckSelectionScreen;

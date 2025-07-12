import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
} from 'react-native';
import { RoundResult, Card } from '../../types';
import { formatAttributeValue } from '../../utils/gameUtils';

interface ResultadoModalProps {
  visible: boolean;
  roundResult: RoundResult | null;
  allCards: Card[];
  playerNickname: string;
  onClose: () => void;
  onNextRound?: () => void;
  isGameFinished?: boolean;
  gameWinner?: string;
}

const ResultadoModal: React.FC<ResultadoModalProps> = ({
  visible,
  roundResult,
  allCards,
  playerNickname,
  onClose,
  onNextRound,
  isGameFinished = false,
  gameWinner,
}) => {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const scaleValue = new Animated.Value(0);

  React.useEffect(() => {
    if (visible) {
      Animated.spring(scaleValue, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    }
  }, [scaleValue, visible]);

  if (!roundResult) return null;

  const getCardName = (cardId: string): string => {
    const card = allCards.find(c => c.id === cardId);
    return card?.name || 'Carta desconhecida';
  };

  const sortedResults = Object.entries(roundResult.playerCards)
    .sort(([, a], [, b]) => b.value - a.value);

  const isWinner = roundResult.winner === playerNickname;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View 
          style={[
            styles.container,
            { transform: [{ scale: scaleValue }] }
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            {isGameFinished ? (
              <>
                <Text style={styles.title}>🏆 Jogo Finalizado!</Text>
                <Text style={styles.subtitle}>
                  Vencedor: {gameWinner}
                  {gameWinner === playerNickname && ' (Você!)'}
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.title}>
                  {isWinner ? '🎉 Você venceu!' : '😔 Você perdeu!'}
                </Text>
                <Text style={styles.subtitle}>
                  Resultado da Rodada {roundResult.roundNumber}
                </Text>
              </>
            )}
          </View>

          {/* Atributo usado */}
          <View style={styles.attributeSection}>
            <Text style={styles.attributeLabel}>Atributo comparado:</Text>
            <Text style={styles.attributeValue}>
              {roundResult.selectedAttribute}
            </Text>
          </View>

          {/* Resultados */}
          <ScrollView style={styles.resultsContainer}>
            <Text style={styles.resultsTitle}>Resultados:</Text>
            {sortedResults.map(([player, result], index) => (
              <View 
                key={player}
                style={[
                  styles.resultRow,
                  index === 0 && styles.winnerRow,
                  player === playerNickname && styles.yourRow,
                ]}
              >
                <View style={styles.positionContainer}>
                  <Text style={styles.position}>
                    {index === 0 ? '🏆' : `${index + 1}º`}
                  </Text>
                </View>
                
                <View style={styles.playerInfo}>
                  <Text style={[
                    styles.playerName,
                    player === playerNickname && styles.yourName,
                  ]}>
                    {player}
                    {player === playerNickname && ' (Você)'}
                  </Text>
                  <Text style={styles.cardName}>
                    {getCardName(result.cardId)}
                  </Text>
                </View>
                
                <View style={styles.valueContainer}>
                  <Text style={[
                    styles.resultValue,
                    index === 0 && styles.winnerValue,
                  ]}>
                    {formatAttributeValue(roundResult.selectedAttribute, result.value)}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>

          {/* Botões */}
          <View style={styles.buttonContainer}>
            {!isGameFinished && onNextRound && (
              <TouchableOpacity
                style={styles.nextButton}
                onPress={onNextRound}
              >
                <Text style={styles.nextButtonText}>Próxima Rodada</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={[
                styles.closeButton,
                isGameFinished && styles.closeButtonPrimary,
              ]}
              onPress={onClose}
            >
              <Text style={[
                styles.closeButtonText,
                isGameFinished && styles.closeButtonTextPrimary,
              ]}>
                {isGameFinished ? 'Finalizar' : 'Fechar'}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    maxHeight: '80%',
    width: '100%',
    maxWidth: 400,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  attributeSection: {
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  attributeLabel: {
    fontSize: 14,
    color: '#1976d2',
    marginBottom: 4,
  },
  attributeValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1976d2',
  },
  resultsContainer: {
    maxHeight: 300,
    marginBottom: 20,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  winnerRow: {
    backgroundColor: '#fff3e0',
    borderWidth: 2,
    borderColor: '#ff9800',
  },
  yourRow: {
    backgroundColor: '#e3f2fd',
  },
  positionContainer: {
    width: 40,
    alignItems: 'center',
  },
  position: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  playerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  playerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  yourName: {
    color: '#1976d2',
  },
  cardName: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  valueContainer: {
    alignItems: 'flex-end',
  },
  resultValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  winnerValue: {
    color: '#f57c00',
    fontSize: 18,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  nextButton: {
    flex: 1,
    backgroundColor: '#4caf50',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#666',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonPrimary: {
    backgroundColor: '#2196f3',
    borderColor: '#2196f3',
  },
  closeButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeButtonTextPrimary: {
    color: '#FFF',
  },
});

export default ResultadoModal;
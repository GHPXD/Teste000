// src/components/game/ResultadoModal.tsx

import React, { useEffect, useRef } from 'react';
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
  onNextRound: () => void;
  isGameFinished?: boolean;
  gameWinner?: string;
  isHost: boolean;
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
  isHost,
}) => {
  const scaleValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      scaleValue.setValue(0);
      Animated.spring(scaleValue, {
        toValue: 1,
        friction: 6,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, scaleValue]);

  if (!roundResult) return null;

  const getCardName = (cardId: string): string => {
    const card = allCards.find(c => c.id === cardId);
    return card?.name || 'Carta desconhecida';
  };

  const isLowerBetter = roundResult.selectedAttribute === 'Fundação';
  const sortedResults = Object.entries(roundResult.playerCards)
    .sort(([, a], [, b]) => isLowerBetter ? a.value - b.value : b.value - a.value);

  const isWinner = roundResult.winner === playerNickname;
  const winnerNickname = roundResult.winner;

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
          <View style={styles.header}>
            {isGameFinished ? (
              <>
                <Text style={styles.title}>🏆 FIM DE JOGO 🏆</Text>
                <Text style={styles.subtitle}>
                  O grande vencedor é {gameWinner}!
                  {gameWinner === playerNickname && ' Parabéns!'}
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.title}>
                  {isWinner ? '🎉 Você Venceu a Rodada! 🎉' : `😔 ${winnerNickname} Venceu a Rodada!`}
                </Text>
                <Text style={styles.subtitle}>
                  O atributo era "{roundResult.selectedAttribute}"
                </Text>
              </>
            )}
          </View>
          
          <ScrollView style={styles.resultsContainer}>
            {sortedResults.map(([player, result]: [string, { cardId: string; value: number }], index: number) => (
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

          <View style={styles.buttonContainer}>
            {isGameFinished ? (
              <TouchableOpacity
                style={[styles.actionButton, styles.finishButton]}
                onPress={onClose}
              >
                <Text style={styles.actionButtonText}>Voltar ao Lobby</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  isHost ? styles.nextButton : styles.disabledButton,
                ]}
                onPress={onNextRound}
                disabled={!isHost}
              >
                <Text style={styles.actionButtonText}>
                  {isHost ? 'Próxima Rodada' : 'Aguardando Host...'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 24,
    maxHeight: '85%',
    width: '100%',
    maxWidth: 450,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
  },
  resultsContainer: {
    maxHeight: 320,
    marginBottom: 20,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  winnerRow: {
    backgroundColor: '#fffbe6',
    borderColor: '#ffc107',
    borderWidth: 2,
  },
  yourRow: {
    backgroundColor: '#e3f2fd',
  },
  positionContainer: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center'
  },
  position: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  playerInfo: {
    flex: 1,
    marginLeft: 10,
  },
  playerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  yourName: {
    color: '#0d47a1',
  },
  cardName: {
    fontSize: 12,
    color: '#777',
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
    color: '#ff8f00',
    fontSize: 18,
  },
  buttonContainer: {
    marginTop: 10,
  },
  actionButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  nextButton: {
    backgroundColor: '#4caf50',
  },
  finishButton: {
    backgroundColor: '#2196f3',
  },
  disabledButton: {
    backgroundColor: '#bdbdbd',
  },
});

export default ResultadoModal;
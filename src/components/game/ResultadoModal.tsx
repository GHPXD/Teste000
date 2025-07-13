// src/components/game/ResultadoModal.tsx

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
  Easing,
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
  // CORREÇÃO: Sintaxe do useState e lazy initialization corrigida.
  const [cardAnimations] = useState(() => [...Array(5)].map(() => new Animated.Value(0)));
  const [animationStarted, setAnimationStarted] = useState(false);

  // Animação de entrada do modal
  useEffect(() => {
    if (visible) {
      setAnimationStarted(false);
      scaleValue.setValue(0);
      Animated.spring(scaleValue, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, scaleValue]);
  
  // Animação das cartas voando
  useEffect(() => {
    if (visible && roundResult && !isGameFinished && !animationStarted) {
      setAnimationStarted(true);
      // CORREÇÃO: Tipagem explícita para os parâmetros do map.
      const animations = cardAnimations.map((anim: Animated.Value, index: number) => {
        return Animated.timing(anim, {
          toValue: 1,
          duration: 300,
          delay: 1000 + index * 100, 
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        });
      });

      Animated.stagger(100, animations).start();
    }
  }, [visible, roundResult, isGameFinished, animationStarted, cardAnimations]);


  if (!roundResult) return null;

  const getCardName = (cardId: string): string => {
    const card = allCards.find(c => c.id === cardId);
    return card?.name || 'Carta desconhecida';
  };

  const sortedResults = Object.entries(roundResult.playerCards)
    .sort(([, a], [, b]) => b.value - a.value);

  const isWinner = roundResult.winner === playerNickname;
  const winnerNickname = roundResult.winner;

  // Estilos da animação das cartas
  const cardAnimatedStyles = cardAnimations.map((anim: Animated.Value) => ({
    transform: [
      {
        translateY: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -100],
        }),
      },
      {
        scale: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 0.5],
        }),
      },
    ],
    opacity: anim.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [1, 1, 0],
    }),
  }));

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
          {/* Animação das cartas sendo coletadas */}
          {!isGameFinished && (
             <View style={styles.cardAnimationContainer} pointerEvents="none">
               {/* CORREÇÃO: Tipagem explícita para os parâmetros do map. */}
               {cardAnimatedStyles.map((style: object, index: number) => (
                 <Animated.View key={index} style={[styles.animatedCard, style]} />
               ))}
             </View>
          )}

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
                  {isWinner ? '🎉 Você venceu a rodada!' : '😔 Você perdeu a rodada!'}
                </Text>
                <Text style={styles.subtitle}>
                  Vencedor da rodada: {winnerNickname}
                </Text>
              </>
            )}
          </View>

          <View style={styles.attributeSection}>
            <Text style={styles.attributeLabel}>Atributo comparado:</Text>
            <Text style={styles.attributeValue}>
              {roundResult.selectedAttribute}
            </Text>
          </View>

          <ScrollView style={styles.resultsContainer}>
            <Text style={styles.resultsTitle}>Resultados:</Text>
            {/* CORREÇÃO: Tipagem explícita para os parâmetros do map. */}
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
                style={styles.closeButtonPrimary}
                onPress={onClose}
              >
                <Text style={styles.closeButtonTextPrimary}>Finalizar Jogo</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[
                  styles.nextButton,
                  !isHost && styles.disabledButton,
                ]}
                onPress={onNextRound}
                disabled={!isHost}
              >
                <Text style={styles.nextButtonText}>
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
    justifyContent: 'center',
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
  disabledButton: {
    backgroundColor: '#A5A5A5',
  },
  closeButtonPrimary: {
    flex: 1,
    backgroundColor: '#2196f3',
    borderColor: '#2196f3',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonTextPrimary: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cardAnimationContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 100,
    height: 140,
    marginLeft: -50,
    marginTop: -70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  animatedCard: {
    position: 'absolute',
    width: 60,
    height: 90,
    backgroundColor: '#1a237e',
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFF',
  },
});

export default ResultadoModal;
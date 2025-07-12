import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  Animated,
  StyleSheet,
  Dimensions,
} from 'react-native';

interface SpinWheelProps {
  players: string[];
  selectedPlayer: string;
  isSpinning: boolean;
  onSpinComplete: () => void;
}

const { width } = Dimensions.get('window');
const WHEEL_SIZE = width * 0.6;

const SpinWheel: React.FC<SpinWheelProps> = ({
  players,
  selectedPlayer,
  isSpinning,
  onSpinComplete,
}) => {
  const spinValue = useRef(new Animated.Value(0)).current;
  const hasSpun = useRef(false);
  const hasCompleted = useRef(false);

  useEffect(() => {
    if (isSpinning && !hasSpun.current) {
      hasSpun.current = true;
      
      // ✅ CORRETO: Calcular rotação final e usar na animação
      const playerIndex = players.indexOf(selectedPlayer);
      const sectionAngle = 360 / players.length;
      const targetAngle = (playerIndex * sectionAngle) + (sectionAngle / 2);
      const finalRotation = 360 * 3 + targetAngle; // 3 voltas completas + posição final

      spinValue.setValue(0);
      
      Animated.timing(spinValue, {
        toValue: finalRotation, // ✅ Usar a variável calculada
        duration: 3000,
        useNativeDriver: true,
      }).start(() => {
        if (!hasCompleted.current) {
          hasCompleted.current = true;
          console.log('🎯 Roleta concluída, chamando onSpinComplete');
          setTimeout(() => {
            onSpinComplete();
          }, 1000); // Delay de 1 segundo para mostrar o resultado
        }
      });
    }
  }, [isSpinning, selectedPlayer, players, spinValue, onSpinComplete]);

  useEffect(() => {
    if (!isSpinning) {
      hasSpun.current = false;
      hasCompleted.current = false;
    }
  }, [isSpinning]);

  // ✅ CORRETO: Usar interpolação simples baseada no valor final
  const rotation = spinValue.interpolate({
    inputRange: [0, 360 * 3 + 360], // 0 até rotação máxima possível
    outputRange: ['0deg', `${360 * 3 + 360}deg`],
  });

  const getPlayerColor = (index: number): string => {
    const colors = ['#f44336', '#2196f3', '#4caf50', '#ff9800', '#9c27b0', '#00bcd4'];
    return colors[index % colors.length];
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎯 Sorteando primeiro jogador...</Text>
      
      <View style={styles.wheelContainer}>
        {/* Seta indicadora */}
        <View style={styles.arrow}>
          <Text style={styles.arrowText}>▼</Text>
        </View>

        {/* Roleta */}
        <Animated.View
          style={[
            styles.wheel,
            { transform: [{ rotate: rotation }] }
          ]}
        >
          {players.map((player, index) => {
            const sectionAngle = 360 / players.length;
            const sectionRotation = index * sectionAngle;
            
            return (
              <View
                key={player}
                style={[
                  styles.section,
                  {
                    backgroundColor: getPlayerColor(index),
                    transform: [{ rotate: `${sectionRotation}deg` }],
                  },
                ]}
              >
                <View style={styles.sectionContent}>
                  <Text style={styles.playerText}>{player}</Text>
                </View>
              </View>
            );
          })}
        </Animated.View>
      </View>

      <Text style={styles.instruction}>
        {isSpinning ? 'Girando...' : `Selecionado: ${selectedPlayer}`}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  wheelContainer: {
    position: 'relative',
    width: WHEEL_SIZE,
    height: WHEEL_SIZE,
    marginBottom: 20,
  },
  arrow: {
    position: 'absolute',
    top: -10,
    left: '50%',
    marginLeft: -10,
    zIndex: 10,
  },
  arrowText: {
    fontSize: 20,
    color: '#333',
  },
  wheel: {
    width: WHEEL_SIZE,
    height: WHEEL_SIZE,
    borderRadius: WHEEL_SIZE / 2,
    position: 'relative',
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  section: {
    position: 'absolute',
    width: '50%',
    height: '50%',
    top: '50%',
    left: '50%',
    transformOrigin: '0 0',
  },
  sectionContent: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    alignItems: 'center',
  },
  playerText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    transform: [{ rotate: '45deg' }],
  },
  instruction: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default SpinWheel;
// src/components/game/TurnTimer.tsx

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

interface TurnTimerProps {
  duration: number; // em segundos
  isPlaying: boolean;
  onTimeEnd: () => void;
  size?: number;
}

const TurnTimer: React.FC<TurnTimerProps> = ({ duration, isPlaying, onTimeEnd, size = 60 }) => {
  const [timeLeft, setTimeLeft] = useState(duration);
  const animatedProgress = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    
    if (isPlaying) {
      // Reseta o timer e a animação
      setTimeLeft(duration);
      animatedProgress.setValue(1);

      // Inicia a animação da barra de progresso
      Animated.timing(animatedProgress, {
        toValue: 0,
        duration: duration * 1000,
        useNativeDriver: false,
      }).start(({ finished }) => {
        // onTimeEnd será chamado pelo setInterval para garantir precisão
        if (finished) {
            // A animação terminou, mas o timer controla o fim
        }
      });

      // Inicia o contador de segundos
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            onTimeEnd();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

    } else {
      // CORREÇÃO: Usa o método correto para parar a animação
      animatedProgress.stopAnimation();
      animatedProgress.setValue(1);
    }

    return () => {
        if (interval) {
            clearInterval(interval);
        }
    };
  }, [isPlaying, duration, onTimeEnd, animatedProgress]);

  const widthInterpolation = animatedProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const colorInterpolation = animatedProgress.interpolate({
    inputRange: [0, 0.3, 0.7],
    outputRange: ['#d9534f', '#f0ad4e', '#5cb85c'], // Vermelho, Laranja, Verde
  });
  
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <View style={styles.backgroundBar} />
      <Animated.View 
        style={[
          styles.progressBar, 
          { 
            width: widthInterpolation,
            backgroundColor: colorInterpolation,
          }
        ]} 
      />
      <View style={styles.textContainer}>
        <Text style={styles.timerText}>{timeLeft}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundBar: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 50,
    backgroundColor: '#e9ecef',
    borderWidth: 5,
    borderColor: '#ced4da',
  },
  progressBar: {
    position: 'absolute',
    height: '100%',
    borderRadius: 50,
  },
  textContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#343a40',
  },
});

export default TurnTimer;
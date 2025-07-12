import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import { validateNickname, formatNickname } from '../utils/validation';
import { saveUserNickname, getUserNickname } from '../services/storageService';

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

interface Props {
  navigation: LoginScreenNavigationProp;
}

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const [nickname, setNickname] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingStorage, setIsCheckingStorage] = useState(true);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Verifica se já existe um nickname salvo ao carregar a tela
  useEffect(() => {
    checkExistingNickname();
  }, []);

  const checkExistingNickname = async () => {
    try {
      const savedNickname = await getUserNickname();
      if (savedNickname) {
        // Se já existe nickname, navega diretamente para seleção de baralho
        navigation.replace('DeckSelection');
        return;
      }
    } catch (error) {
      console.error('Erro ao verificar nickname existente:', error);
    } finally {
      setIsCheckingStorage(false);
    }
  };

  const handleNicknameChange = (text: string) => {
    setNickname(text);
    
    // Validação em tempo real
    if (text.length > 0) {
      const validation = validateNickname(text);
      setValidationError(validation.isValid ? null : validation.error || null);
    } else {
      setValidationError(null);
    }
  };

  const handleLogin = async () => {
    const validation = validateNickname(nickname);
    
    if (!validation.isValid) {
      setValidationError(validation.error || 'Nickname inválido');
      return;
    }

    setIsLoading(true);
    
    try {
      const formattedNickname = formatNickname(nickname);
      await saveUserNickname(formattedNickname);
      
      // Navega para a próxima tela
      navigation.replace('DeckSelection');
    } catch (error) {
      Alert.alert(
        'Erro',
        'Não foi possível salvar seu nickname. Tente novamente.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const isNicknameValid = validateNickname(nickname).isValid;

  // Tela de loading enquanto verifica storage
  if (isCheckingStorage) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>🎮 Trunfia</Text>
          <Text style={styles.subtitle}>
            Digite seu apelido para começar a jogar
          </Text>
        </View>

        {/* Input Section */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>Seu apelido:</Text>
          <TextInput
            style={[
              styles.input,
              validationError ? styles.inputError : 
              (nickname.length > 0 && isNicknameValid) ? styles.inputValid : null
            ]}
            value={nickname}
            onChangeText={handleNicknameChange}
            placeholder="Digite seu apelido"
            placeholderTextColor="#999"
            maxLength={15}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={handleLogin}
          />
          
          {/* Contador de caracteres */}
          <Text style={styles.characterCount}>
            {nickname.length}/15 caracteres
          </Text>
          
          {/* Mensagem de erro */}
          {validationError && (
            <Text style={styles.errorText}>{validationError}</Text>
          )}
        </View>

        {/* Button Section */}
        <TouchableOpacity
          style={[
            styles.button,
            isNicknameValid ? styles.buttonEnabled : styles.buttonDisabled
          ]}
          onPress={handleLogin}
          disabled={!isNicknameValid || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.buttonText}>Entrar</Text>
          )}
        </TouchableOpacity>

        {/* Dicas */}
        <View style={styles.hintsSection}>
          <Text style={styles.hintsTitle}>Dicas:</Text>
          <Text style={styles.hintText}>• Entre 3 e 15 caracteres</Text>
          <Text style={styles.hintText}>• Apenas letras, números e _</Text>
          <Text style={styles.hintText}>• Sem emojis ou espaços</Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  inputSection: {
    marginBottom: 32,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    height: 56,
    borderWidth: 2,
    borderColor: '#DDD',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#FFF',
    color: '#333',
  },
  inputValid: {
    borderColor: '#4CAF50',
  },
  inputError: {
    borderColor: '#F44336',
  },
  characterCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 4,
  },
  errorText: {
    fontSize: 14,
    color: '#F44336',
    marginTop: 8,
  },
  button: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  buttonEnabled: {
    backgroundColor: '#007AFF',
  },
  buttonDisabled: {
    backgroundColor: '#CCC',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
  },
  hintsSection: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  hintsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  hintText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
});

export default LoginScreen;
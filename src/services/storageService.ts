import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';

const STORAGE_KEYS = {
  USER_NICKNAME: '@trunfia_user_nickname',
  USER_DATA: '@trunfia_user_data',
} as const;

/**
 * Salva o nickname do usuário no AsyncStorage
 * @param nickname - Nickname a ser salvo
 */
export const saveUserNickname = async (nickname: string): Promise<void> => {
  try {
    const userData: User = {
      nickname,
      createdAt: new Date().toISOString(),
    };
    
    await AsyncStorage.setItem(STORAGE_KEYS.USER_NICKNAME, nickname);
    await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
  } catch (error) {
    console.error('Erro ao salvar nickname:', error);
    throw new Error('Não foi possível salvar o nickname');
  }
};

/**
 * Recupera o nickname salvo do AsyncStorage
 * @returns Promise com o nickname ou null se não existir
 */
export const getUserNickname = async (): Promise<string | null> => {
  try {
    const nickname = await AsyncStorage.getItem(STORAGE_KEYS.USER_NICKNAME);
    return nickname;
  } catch (error) {
    console.error('Erro ao recuperar nickname:', error);
    return null;
  }
};

/**
 * Recupera os dados completos do usuário
 * @returns Promise com os dados do usuário ou null
 */
export const getUserData = async (): Promise<User | null> => {
  try {
    const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Erro ao recuperar dados do usuário:', error);
    return null;
  }
};

/**
 * Remove todos os dados do usuário
 */
export const clearUserData = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.USER_NICKNAME,
      STORAGE_KEYS.USER_DATA,
    ]);
  } catch (error) {
    console.error('Erro ao limpar dados do usuário:', error);
  }
};
// src/services/storageService.ts

import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';

const STORAGE_KEYS = {
  USER_DATA: '@trunfia_user_data',
} as const;

/**
 * Salva os dados do usuário (nickname e avatar) no AsyncStorage
 * @param userData - Objeto User a ser salvo
 */
export const saveUserData = async (userData: User): Promise<void> => {
  try {
    const dataToSave = JSON.stringify(userData);
    await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, dataToSave);
  } catch (error) {
    console.error('Erro ao salvar dados do usuário:', error);
    throw new Error('Não foi possível salvar os dados do usuário');
  }
};

/**
 * Recupera os dados completos do usuário do AsyncStorage
 * @returns Promise com os dados do usuário ou null se não existir
 */
export const getUserData = async (): Promise<User | null> => {
  try {
    const userDataString = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
    return userDataString ? JSON.parse(userDataString) : null;
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
    await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);
  } catch (error) {
    console.error('Erro ao limpar dados do usuário:', error);
  }
};
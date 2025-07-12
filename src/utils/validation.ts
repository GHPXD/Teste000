import { ValidationResult } from '../types';

/**
 * Valida o nickname do usuário
 * @param nickname - String a ser validada
 * @returns ValidationResult com status e possível erro
 */
export const validateNickname = (nickname: string): ValidationResult => {
  // Remove espaços do início e fim
  const trimmedNickname = nickname.trim();
  
  // Verifica comprimento mínimo
  if (trimmedNickname.length < 3) {
    return {
      isValid: false,
      error: 'Nickname deve ter pelo menos 3 caracteres'
    };
  }
  
  // Verifica comprimento máximo
  if (trimmedNickname.length > 15) {
    return {
      isValid: false,
      error: 'Nickname deve ter no máximo 15 caracteres'
    };
  }
  
  // Verifica se contém apenas letras, números e underscores
  const validCharactersRegex = /^[a-zA-Z0-9_]+$/;
  if (!validCharactersRegex.test(trimmedNickname)) {
    return {
      isValid: false,
      error: 'Nickname deve conter apenas letras, números e _'
    };
  }
  
  // Verifica se não contém emojis
  const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u;
  if (emojiRegex.test(trimmedNickname)) {
    return {
      isValid: false,
      error: 'Nickname não pode conter emojis'
    };
  }
  
  return { isValid: true };
};

/**
 * Limpa e formata o nickname
 * @param nickname - String a ser formatada
 * @returns String formatada
 */
export const formatNickname = (nickname: string): string => {
  return nickname.trim().toLowerCase();
};
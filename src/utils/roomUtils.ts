import { Room } from '../types';

/**
 * Gera um código único para a sala
 * @returns Código de 6 caracteres
 */
export const generateRoomCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Valida formato do código da sala
 * @param code - Código a ser validado
 * @returns true se válido
 */
export const validateRoomCode = (code: string): boolean => {
  const codeRegex = /^[A-Z0-9]{6}$/;
  return codeRegex.test(code.toUpperCase());
};

/**
 * Formata código da sala (maiúsculo)
 * @param code - Código a ser formatado
 * @returns Código formatado
 */
export const formatRoomCode = (code: string): string => {
  return code.toUpperCase().replace(/[^A-Z0-9]/g, '');
};

/**
 * Verifica se o jogador é o host da sala
 * @param room - Sala atual
 * @param nickname - Nickname do jogador
 * @returns true se for host
 */
export const isPlayerHost = (room: Room, nickname: string): boolean => {
  return room.hostNickname === nickname;
};

/**
 * Conta jogadores na sala
 * @param room - Sala atual
 * @returns Número de jogadores
 */
export const getPlayerCount = (room: Room): number => {
  return Object.keys(room.players).length;
};
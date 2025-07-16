// src/services/firebaseService.ts

import { 
  ref, 
  push, 
  set, 
  get, 
  remove, 
  onValue, 
  off, 
  query, 
  orderByChild, 
  equalTo,
  update
} from 'firebase/database';
import { database } from '../config/firebase';
import { Room, Player, ChatMessage } from '../types';
import { generateRoomCode } from '../utils/roomUtils';

const ROOMS_PATH = 'rooms';
const CHAT_PATH = 'chat';

/**
 * Cria uma nova sala no Firebase
 */
export const createRoom = async (
  hostNickname: string,
  hostAvatar: string, // NOVO
  deckId: string,
  deckName: string,
  isPrivate: boolean = false
): Promise<Room> => {
  try {
    const roomCode = generateRoomCode();
    const roomRef = push(ref(database, ROOMS_PATH));
    const roomId = roomRef.key;
    
    if (!roomId) {
      throw new Error('Erro ao gerar ID da sala');
    }

    const hostPlayer: Player = {
      nickname: hostNickname,
      avatar: hostAvatar, // NOVO
      isHost: true,
      joinedAt: new Date().toISOString(),
      isReady: true,
      status: 'active',
    };

    const newRoom: Room = {
      id: roomId,
      code: roomCode,
      hostNickname,
      deckId,
      deckName,
      players: {
        [hostNickname]: hostPlayer,
      },
      status: 'waiting',
      isPrivate,
      maxPlayers: 4,
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
    };

    await set(roomRef, newRoom);
    return newRoom;
  } catch (error) {
    console.error('Erro ao criar sala:', error);
    throw new Error('Não foi possível criar a sala');
  }
};

/**
 * Entra em uma sala existente
 */
export const joinRoom = async (
  roomCode: string,
  playerNickname: string,
  playerAvatar: string // NOVO
): Promise<Room> => {
  try {
    const roomsRef = ref(database, ROOMS_PATH);
    const roomsQuery = query(roomsRef, orderByChild('code'), equalTo(roomCode.toUpperCase()));
    const snapshot = await get(roomsQuery);

    if (!snapshot.exists()) {
      throw new Error('Sala não encontrada');
    }

    const rooms = snapshot.val();
    const roomId = Object.keys(rooms)[0];
    const room: Room = rooms[roomId];

    if (room.status !== 'waiting') {
      throw new Error('Esta sala já iniciou o jogo');
    }

    if (Object.keys(room.players).length >= room.maxPlayers) {
      throw new Error('Sala lotada');
    }

    if (room.players[playerNickname]) {
      throw new Error('Já existe um jogador com este nickname na sala');
    }

    const newPlayer: Player = {
      nickname: playerNickname,
      avatar: playerAvatar, // NOVO
      isHost: false,
      joinedAt: new Date().toISOString(),
      isReady: false,
      status: 'active',
    };

    const updates = {
      [`${ROOMS_PATH}/${roomId}/players/${playerNickname}`]: newPlayer,
      [`${ROOMS_PATH}/${roomId}/lastActivity`]: new Date().toISOString(),
    };

    await update(ref(database), updates);

    const updatedRoom = { ...room, players: { ...room.players, [playerNickname]: newPlayer } };
    return updatedRoom;
  } catch (error) {
    console.error('Erro ao entrar na sala:', error);
    throw error;
  }
};

/**
 * Lista salas públicas por baralho
 */
export const listRoomsByDeck = async (deckId: string): Promise<Room[]> => {
  try {
    const roomsRef = ref(database, ROOMS_PATH);
    const roomsQuery = query(roomsRef, orderByChild('deckId'), equalTo(deckId));
    const snapshot = await get(roomsQuery);

    if (!snapshot.exists()) {
      return [];
    }

    const rooms = snapshot.val();
    
    const publicRooms = Object.values(rooms as { [key: string]: Room })
      .filter(room => !room.isPrivate && room.status === 'waiting')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return publicRooms;
  } catch (error) {
    console.error('Erro ao listar salas:', error);
    return [];
  }
};

/**
 * Sai da sala atual
 */
export const leaveRoom = async (roomId: string, playerNickname: string): Promise<void> => {
  try {
    const roomRef = ref(database, `${ROOMS_PATH}/${roomId}`);
    const snapshot = await get(roomRef);
    
    if (!snapshot.exists()) {
      return;
    }

    const room: Room = snapshot.val();

    await remove(ref(database, `${ROOMS_PATH}/${roomId}/players/${playerNickname}`));

    const remainingPlayers = Object.keys(room.players).filter(p => p !== playerNickname);

    if (remainingPlayers.length === 0) {
      await remove(roomRef);
      return;
    }

    if (room.hostNickname === playerNickname) {
      const newHostNickname = remainingPlayers[0];
      const updates = {
        [`${ROOMS_PATH}/${roomId}/hostNickname`]: newHostNickname,
        [`${ROOMS_PATH}/${roomId}/players/${newHostNickname}/isHost`]: true,
        [`${ROOMS_PATH}/${roomId}/lastActivity`]: new Date().toISOString(),
      };
      await update(ref(database), updates);
    }
  } catch (error) {
    console.error('Erro ao sair da sala:', error);
  }
};

/**
 * Escuta mudanças em uma sala específica
 */
export const listenToRoom = (
  roomId: string,
  callback: (room: Room | null) => void
): (() => void) => {
  const roomRef = ref(database, `${ROOMS_PATH}/${roomId}`);
  
  const unsubscribe = onValue(roomRef, (snapshot) => {
    const room = snapshot.exists() ? snapshot.val() : null;
    callback(room);
  });

  return () => off(roomRef, 'value', unsubscribe);
};

/**
 * Envia mensagem no chat da sala
 */
export const sendChatMessage = async (
  roomId: string,
  nickname: string,
  message: string
): Promise<void> => {
  try {
    const chatRef = ref(database, `${CHAT_PATH}/${roomId}`);
    const newMessageRef = push(chatRef);
    
    const chatMessage: ChatMessage = {
      id: newMessageRef.key || '',
      nickname,
      message: message.trim(),
      timestamp: new Date().toISOString(),
    };

    await set(newMessageRef, chatMessage);
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
  }
};

/**
 * Escuta mensagens do chat
 */
export const listenToChatMessages = (
  roomId: string,
  callback: (messages: ChatMessage[]) => void
): (() => void) => {
  const chatRef = ref(database, `${CHAT_PATH}/${roomId}`);
  const chatQuery = query(chatRef, orderByChild('timestamp'));
  
  const unsubscribe = onValue(chatQuery, (snapshot) => {
    if (snapshot.exists()) {
      const messages = snapshot.val();
      const messageList = Object.values(messages as { [key: string]: ChatMessage })
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      callback(messageList);
    } else {
      callback([]);
    }
  });

  return () => off(chatRef, 'value', unsubscribe);
};
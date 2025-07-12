import { useMemo } from 'react';
import { useGame } from '../contexts/GameContext';
import { Player } from '../types';

export const useRoomData = () => {
  const { state } = useGame();

  const roomData = useMemo(() => {
    const currentRoom = state.currentRoom;
    
    if (!currentRoom) {
      return {
        isInRoom: false,
        players: [],
        playerCount: 0,
        maxPlayers: 4,
        roomCode: '',
        deckName: '',
        hostNickname: '',
      };
    }

    const players = currentRoom.players || {};
    const playersArray = Object.values(players) as Player[];
    
    return {
      isInRoom: true,
      players: playersArray,
      playerCount: playersArray.length,
      maxPlayers: currentRoom.maxPlayers || 4,
      roomCode: currentRoom.code || '',
      deckName: currentRoom.deckName || '',
      hostNickname: currentRoom.hostNickname || '',
      roomId: currentRoom.id || '',
    };
  }, [state.currentRoom]);

  return roomData;
};
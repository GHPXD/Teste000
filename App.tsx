import React from 'react';
import { StatusBar } from 'react-native';
import { GameProvider } from './src/contexts/GameContext';
import AppNavigator from './src/navigation/AppNavigator';

const App: React.FC = () => {
  return (
    <GameProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5F5" />
      <AppNavigator />
    </GameProvider>
  );
};

export default App;
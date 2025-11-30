/**
 * NVIDIA Cert Quiz - React Native App Entry Point
 */
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import Navigation from './src/navigation';
import { useQuizStore } from './src/stores/quizStore';

export default function App() {
  const { isDarkMode } = useQuizStore();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      <Navigation />
    </GestureHandlerRootView>
  );
}

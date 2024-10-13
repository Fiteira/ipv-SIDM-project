import React from 'react';
import { NavigationContainer } from '@react-navigation/native';  // Importando o container de navegação
import TabNavigator from './tabs/tabNavigator';  // Importando o TabNavigator

export default function App() {
  return (
    <NavigationContainer independent={true}>
      {/* O TabNavigator é exibido como navegação principal */}
      <TabNavigator />
    </NavigationContainer>
  );
}
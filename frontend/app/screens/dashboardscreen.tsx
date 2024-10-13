//dashboard screen com componentes de exemplo
import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';

export default function DashboardScreen() {
  return (
    <View style={styles.container}>
      <Text>Dashboard Screen</Text>
      <Button title='Ver perfil'></Button>
      <Button title='Notificações'></Button>
      <Button title='Configurações'></Button>
      <Button title='Sair'></Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
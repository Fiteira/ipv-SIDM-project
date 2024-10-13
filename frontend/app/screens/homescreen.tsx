import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function HomeScreen() {
  //pagina de inicio
  return (
    <View style={styles.container}>
      <Text>Home Screen</Text>
      <Text>Carregue em qualquer opção em baixo!</Text>
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
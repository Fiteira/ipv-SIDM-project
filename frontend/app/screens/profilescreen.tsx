import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import api from '../../config/api';

export default function ProfileScreen() {
  // Definindo o estado do perfil com useState
  const [perfil, setPerfil] = useState<any>({});

  const procurarPerfilAPI = () => {
    // Função para procurar perfil na API
    api.get('/users/1')
      .then((response) => {
        console.log(response.data);
        setPerfil(response.data.data); // Usando setPerfil para atualizar o estado
      })
      .catch((error) => {
        console.log(error);
      });
  };

  return (
    <View style={styles.container}>
      <Text>Profile Screen</Text>
      <Button title='Ver perfil' onPress={procurarPerfilAPI} />

      {/* Verificando se o perfil existe e renderizando os dados */}
      {perfil && perfil.name && (
        <>
          <Text>Perfil:</Text>
          <Text>{perfil.name}</Text>
          <Text>{perfil.userNumber}</Text>
        </>
      )}
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

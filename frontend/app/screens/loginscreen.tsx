import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet } from 'react-native';
import api from '@/config/api';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Para armazenar o token

export default function LoginScreen({ navigation, setIsAuthenticated }: any) {
  const [userNumber, setUserNumber] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      const response = await api.post('/auth/login', {
        userNumber,
        password,
      });

      if (response.data.success) {
        // Armazena o token no armazenamento seguro
        await AsyncStorage.setItem('token', response.data.token);

        Alert.alert('Sucesso', 'Login realizado com sucesso!');
        setIsAuthenticated(true);
        navigation.navigate('Home');
      } else {
        Alert.alert('Erro', 'Número de usuário ou senha incorretos');
      }
    } catch (error) {
      console.error('Erro na autenticação:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao tentar fazer login.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login Page</Text>
      <TextInput
        style={styles.input}
        placeholder="Número de Utilizador"
        keyboardType="numeric"
        value={userNumber}
        onChangeText={setUserNumber}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <Button title="Entrar" onPress={handleLogin} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  title: {
    fontSize: 24,
    marginBottom: 24,
  },
  input: {
    width: '100%',
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 8,
    marginBottom: 16,
  },
});
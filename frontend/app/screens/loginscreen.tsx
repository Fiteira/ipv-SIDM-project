import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet } from 'react-native';
import Constants from 'expo-constants'; // Importe o Constants
import AsyncStorage from '@react-native-async-storage/async-storage'; // Para armazenar o token
import api from '@/config/api';
import * as Notifications from 'expo-notifications'; // Importe o expo-notifications
import { Axios, AxiosError } from 'axios';

export default function LoginScreen({ navigation, setIsAuthenticated, deviceToken }: any) {
  const [userNumber, setUserNumber] = useState('');
  const [password, setPassword] = useState('');

  async function handleLogin() {
    try {/*
      // Obtém o token do dispositivo
      const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId ?? process.env.EXPO_PUBLIC_PROJECT_ID;
      if (!projectId) {
        return;
      }
  
      const token = await Notifications.getExpoPushTokenAsync({ projectId });
      setExpoPushToken(token.data); // Armazena o token correto
      console.log("Token criado")*/
      const response = await api.post('/auth/login', {
        userNumber,
        password,
        deviceToken: deviceToken, // Envia o token do dispositivo no corpo da requisição
      });
      
      if (response.data && response.data.success) {
        // Armazena o token e user no armazenamento seguro
        await AsyncStorage.setItem('token', response.data.token);
        await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
        setIsAuthenticated(true);
        navigation.navigate('Homepage');
      } else {
        Alert.alert('Error', 'User number or password is incorrect.');
      }
    } catch (error: AxiosError | any) {
      Alert.alert('Error', error.response?.data?.message || "There was an error trying to login.");
      console.log(error)
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

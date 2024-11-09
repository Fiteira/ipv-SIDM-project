import React, { useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, TextInput, Button, Alert, StyleSheet } from 'react-native';
import Constants from 'expo-constants'; // Importe o Constants
import AsyncStorage from '@react-native-async-storage/async-storage'; // Para armazenar o token
import api from '@/config/api';
import * as Notifications from 'expo-notifications'; // Importe o expo-notifications
import { Axios, AxiosError } from 'axios';

export default function LoginScreen({ navigation, setIsAuthenticated, deviceToken }: any) {
  const [userNumber, setUserNumber] = useState('');
  const [password, setPassword] = useState('');

  useFocusEffect(
    React.useCallback(() => {
      Notifications.getPermissionsAsync().then((status) => {
        if (status.status !== 'granted') {
          Notifications.requestPermissionsAsync();
        }
      });
      async function autoLogIn() {
        const token = await AsyncStorage.getItem('token');
        if (token) {
          try {
            const response = await api.get('/auth/checktoken');
            if (response.data && response.data.success) {
              setIsAuthenticated(true);
              navigation.navigate('Homepage');
            } else {
              await AsyncStorage.removeItem('token');
              await AsyncStorage.removeItem('user');
              setIsAuthenticated(false);
            }
          } catch (error: AxiosError | any) {
            console.log(error);
          }
        }
      }
      autoLogIn();
    }, [])
  );

  async function handleLogin() {
    try {
      const response = await api.post('/auth/login', {
        userNumber,
        password,
        deviceToken: deviceToken,
      });
      
      if (response.data && response.data.success) {
        // Armazena o token e user no armazenamento seguro
        await AsyncStorage.setItem('token', response.data.token);
        await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
        await AsyncStorage.setItem('factoryId', response.data.user.factoryId? response.data.user.factoryId.toString() : '');
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
        placeholder="User Number"
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
      <Button title="Confirm" onPress={handleLogin} />
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

import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '@/config/api';
import * as Notifications from 'expo-notifications';
import { AxiosError } from 'axios';
import { useContext } from 'react';
import { AuthContext } from '../AuthContext';

export default function LoginScreen({ navigation, setIsAuthenticated, deviceToken }: any) {
  const [userNumber, setUserNumber] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const { setUserRole } = useContext(AuthContext);

  useEffect(() => {
    const checkTokenAndAutoLogin = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (token) {
          const expoToken = (await Notifications.getExpoPushTokenAsync()).data;
          const response = await api.get('/auth/checktoken', {
            headers: { deviceToken: expoToken },
          });
          
          if (response.data && response.data.success) {
            const userRole = response.data.message.role;
            console.log("User: ", response.data.message);
            await AsyncStorage.setItem('user', JSON.stringify(response.data.message));
            await AsyncStorage.setItem('userRole', userRole);
            await AsyncStorage.setItem('userNumber', response.data.message.userNumber.toString());
            await AsyncStorage.setItem(
              'factoryId',
              response.data.message.factoryId ? response.data.message.factoryId.toString() : ''
            );
            setUserRole(userRole);
            setIsAuthenticated(true);
            if (userRole === 'adminSystem') {
              navigation.navigate('Homepage');
            } else {
              navigation.navigate('FactoryDetail', { factoryId: response.data.message.factoryId.toString()
               })
            } 
            return;
          }
        }
        // Se o token estiver ausente ou inválido
        setIsAuthenticated(false);
      } catch (error) {
        console.log("Erro ao verificar o token:", error);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    // Adiciona um timeout para definir `loading` como `false` caso o AsyncStorage falhe
    const timeoutId = setTimeout(() => setLoading(false), 5000);

    checkTokenAndAutoLogin();

    return () => clearTimeout(timeoutId);
  }, []);

  async function handleLogin() {
    try {
      const response = await api.post('/auth/login', {
        userNumber,
        password,
        deviceToken,
      });

      if (response.data && response.data.success) {
        console.log(response.data);
        await AsyncStorage.setItem('token', response.data.token);
        await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
        await AsyncStorage.setItem('userRole', response.data.user.role);
        await AsyncStorage.setItem(
          'factoryId',
          response.data.user.factoryId ? response.data.user.factoryId.toString() : ''
        );
        setUserRole(response.data.user.role);
        setIsAuthenticated(true);
        if (response.data.user.role === 'adminSystem') {
          navigation.navigate('Homepage');
          console.log('adminSystem')
        } else {
          console.log('factory')
          navigation.navigate('FactoryDetail', { factoryId: response.data.user.factoryId.toString() })
        } 

      } else {
        Alert.alert('Error', 'User number or password is incorrect.');
      }
    } catch (error: AxiosError | any) {
      Alert.alert('Error', error.response?.data?.message || "There was an error trying to login.");
      console.log(error);
    }
  }
/*
  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }*/

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

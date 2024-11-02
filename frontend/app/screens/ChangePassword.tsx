import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet } from 'react-native';
import api from '@/config/api'; // A mesma configuração de API que você está usando
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ChangePasswordScreen({ navigation }: any) {
  const [userNumber, setUserNumber] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      Alert.alert('Erro', 'A nova senha e a confirmação não coincidem.');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Erro', 'Usuário não autenticado.');
        return;
      }

      const response = await api.post(
        '/auth/change-password',
        { userNumber, oldPassword, newPassword },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        Alert.alert('Sucesso', 'Senha alterada com sucesso!');
        navigation.goBack(); // Retorna para a tela anterior após o sucesso
      } else {
        Alert.alert('Erro', response.data.message || 'Erro ao alterar a senha.');
      }
    } catch (error) {
      console.error("Erro ao alterar senha:", error);
      Alert.alert('Erro', 'Ocorreu um erro ao tentar alterar a senha.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Alterar Senha</Text>
      <TextInput
        style={styles.input}
        placeholder="Número de Utilizador"
        keyboardType="numeric"
        value={userNumber}
        onChangeText={setUserNumber}
      />
      <TextInput
        style={styles.input}
        placeholder="Senha Atual"
        secureTextEntry
        value={oldPassword}
        onChangeText={setOldPassword}
      />
      <TextInput
        style={styles.input}
        placeholder="Nova Senha"
        secureTextEntry
        value={newPassword}
        onChangeText={setNewPassword}
      />
      <TextInput
        style={styles.input}
        placeholder="Confirmar Nova Senha"
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />
      <Button title="Alterar Senha" onPress={handleChangePassword} />
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

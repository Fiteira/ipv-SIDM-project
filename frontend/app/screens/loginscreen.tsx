
// Em ./screens/loginscreen.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet } from 'react-native';

export default function LoginScreen({ navigation }: any) {
  const [userNumber, setUserNumber] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    // Aqui você pode adicionar a lógica para autenticação,
    // como chamar uma API com os dados de `userNumber` e `password`.
    // Exemplo de validação simples:
    if (userNumber === '123' && password === 'senha') {
      // Se a autenticação for bem-sucedida, navegue para a tela principal
      Alert.alert('Sucesso', 'Login realizado com sucesso!');
      // Aqui poderia mudar o estado global `isAuthenticated` para `true`
      navigation.replace('Main'); // Redireciona para o DrawerNavigator
    } else {
      Alert.alert('Erro', 'Número de usuário ou senha incorretos');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login Page</Text>
      <TextInput
        style={styles.input}
        placeholder="Número de Usuário"
        keyboardType="numeric"
        value={userNumber}
        onChangeText={setUserNumber}
      />
      <TextInput
        style={styles.input}
        placeholder="Senha"
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
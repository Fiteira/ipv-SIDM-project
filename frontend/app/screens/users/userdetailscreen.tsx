import React, { useEffect, useState } from 'react';
import { View, Text, Alert, StyleSheet } from 'react-native';
import { Box, Spinner, Button, VStack } from 'native-base';
import { RouteProp, useRoute } from '@react-navigation/native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import api from '../../../config/api';

type RootStackParamList = {
  UserDetail: { userId: string };
};

type UserDetailRouteProp = RouteProp<RootStackParamList, 'UserDetail'>;

interface User {
    userId: string;
    userNumber: string;
    name: string;
    role: string;
}

export default function UserDetailScreen() {
  const route = useRoute<UserDetailRouteProp>();
  const { userId } = route.params;
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  useEffect(() => {
    api.get(`/users/${userId}`)
      .then((response) => {
        setUser(response.data.data);
      })
      .catch((error) => {
        console.error('Erro ao carregar os detalhes do user:', error);
        Alert.alert('Erro', 'Não foi possível carregar os detalhes do user.');
      })
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) {
    return <Spinner color="blue.500" />;
  }

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>User não encontrado.</Text>
      </View>
    );
  }

  return (
    <Box style={styles.container}>
      <Text style={styles.title}>{user.name}</Text>
      <Text style={styles.role}>Number: {user.userNumber}</Text>
      <Text style={styles.role}>Role: {user.role}</Text>
      <VStack space={4} marginTop={6}>
        <Button colorScheme="darkBlue">
            Reset Password
        </Button>
      </VStack>
    </Box>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  role: {
    fontSize: 16,
    color: 'gray',
  },
});
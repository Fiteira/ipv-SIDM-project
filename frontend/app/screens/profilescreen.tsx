// ProfileScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeBaseProvider, VStack, HStack, Avatar, Text, Box, Spinner, Button } from 'native-base';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { db, getUserByNumber, insertUsers } from '@/config/sqlite';
import api from '@/config/api';
import avatarImage from '@/assets/avatar.png';

type RootStackParamList = {
  ProfileEdit: undefined;
};

export default function ProfileScreen() {
  const [perfil, setPerfil] = useState<{ name: string; userNumber: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  useEffect(() => {
    const loadProfile = async () => {
      try {
        // Tentar carregar do banco de dados local
        const userNumber = await AsyncStorage.getItem('userNumber');
        if (userNumber) {
          const localUser = await getUserByNumber(parseInt(userNumber));
          if (localUser) {
            setPerfil(localUser);
            setLoading(false);
            return;
          }
        }

        const user = await AsyncStorage.getItem('user');
        if (user) {
          const parsedUser = JSON.parse(user);
          setPerfil(parsedUser);
          setLoading(false);
          return;
        }

        const response = await api.get('/user/' + userNumber);
        const apiUser = response.data;
        setPerfil(apiUser);

        // Atualizar o banco de dados local e o AsyncStorage com os dados da API
        await insertUsers([apiUser]);
        await AsyncStorage.setItem('user', JSON.stringify(apiUser));
        await AsyncStorage.setItem('userNumber', apiUser.userNumber.toString());
      } catch (error) {
        console.error('Failed to load user profile:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleEditProfile = () => {
    navigation.navigate('ProfileEdit');
  };

  if (loading) {
    return <Spinner color="blue.500" />;
  }

  return (
    <NativeBaseProvider>
      <Box style={styles.container}>
        <VStack space={4} alignItems="center">
          <Avatar size="2xl" source={avatarImage} />

          {perfil ? (
            <VStack space={2} alignItems="left" bg="light.50" p={4} borderRadius="lg" shadow={2} width="80%">
              <HStack space={2} alignItems="left">
                <Text fontSize="md" fontWeight="semibold" color="coolGray.800">
                  Name:
                </Text>
                <Text fontSize="md" color="coolGray.600">
                  {perfil.name}
                </Text>
              </HStack>
              <HStack space={2} alignItems="left">
                <Text fontSize="md" fontWeight="semibold" color="coolGray.800">
                  Number:
                </Text>
                <Text fontSize="md" color="coolGray.600">
                  {perfil.userNumber}
                </Text>
              </HStack>
              <HStack space={2} alignItems="left">
                <Text fontSize="md" fontWeight="semibold" color="coolGray.800">
                  Role:
                </Text>
                <Text fontSize="md" color="coolGray.600">
                  {perfil.role}
                </Text>
              </HStack>
              <Button mt={4} colorScheme="darkBlue" alignSelf="center" onPress={handleEditProfile}>
                Edit Profile
              </Button>
            </VStack>
          ) : (
            <Text fontSize="md" color="coolGray.500" textAlign="center">
              Profile not found
            </Text>
          )}
        </VStack>
      </Box>
    </NativeBaseProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    padding: 16,
  },
});
import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeBaseProvider, VStack, HStack, Avatar, Text, Box, Spinner, Button  } from 'native-base';
import avatarImage from '@/assets/avatar.png';

export default function ProfileScreen() {
  const [perfil, setPerfil] = useState<{ name: string; userNumber: string; role: string } | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const user = await AsyncStorage.getItem('user');
        if (user) {
          const parsedUser = JSON.parse(user);
          setPerfil(parsedUser);
        }
      } catch (error) {
        console.error("Failed to load user profile:", error);
      }
    };

    loadProfile();
  }, []);

  const handleEditProfile = () => {
    // Lógica para abrir uma tela de edição ou habilitar a edição dos campos
    console.log("Edit Profile button clicked");
  };

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
                Editar Perfil
              </Button>
            </VStack>
          ) : (
            <Spinner size="lg" color="primary.500" />
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

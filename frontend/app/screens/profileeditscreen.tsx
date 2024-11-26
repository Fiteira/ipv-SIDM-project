// ProfileEditScreen.tsx
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet } from 'react-native';
import { Box, VStack, Button, Input, Text, Spinner } from 'native-base';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import api from '../../config/api'

type RootStackParamList = {
  ProfileEdit: undefined;
  Profile: undefined;
};

export default function ProfileEditScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const [name, setName] = useState('');
  const [userNumber, setUserNumber] = useState('');
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const user = await AsyncStorage.getItem('user');
        if (user) {
          const parsedUser = JSON.parse(user);
          setName(parsedUser.name);
          setUserNumber(parsedUser.userNumber);
          setRole(parsedUser.role);
        } else {
            //pedir o user à api

        }
      } catch (error) {
        console.error('Failed to load user profile:', error);
        Alert.alert('Error', 'Failed to load user profile.');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Name is required.');
      return;
    }

    try {
      setLoading(true);
      const updatedUser = { name, userNumber, role }
      await api.put('/users/' + userNumber.toString(), updatedUser);
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      Alert.alert('Success', 'Profile updated successfully.');
      navigation.goBack()
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Spinner color="blue.500" />;
  }

  return (
    <Box style={styles.container}>
      <VStack space={4}>
        <Text fontSize="md" bold>Name</Text>
        <Input
          value={name}
          onChangeText={setName}
          placeholder="Enter your name"
        />
        <Text fontSize="md" bold>User Number</Text>
        <Input
          value={userNumber}
          isReadOnly
          placeholder="User number"
        />
        <Text fontSize="md" bold>Role</Text>
        <Input
          value={role}
          isReadOnly
          placeholder="Role"
        />
        <Button colorScheme="blue" onPress={handleSave}>
          Save Changes
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
});
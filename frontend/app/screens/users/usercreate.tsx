import React, { useState } from 'react';
import { Select } from 'native-base';
import { View, StyleSheet, Alert } from 'react-native';
import { Box, Button, FormControl, Input, Text } from 'native-base';
import api from '../../../config/api';
import { MaterialIcons } from '@expo/vector-icons';
import { RouteProp, useRoute, useNavigation, NavigationProp } from '@react-navigation/native';

type RootStackParamList = {
  UserList: { factoryId: string };
  UserCreate: { factoryId: string };
};

type UserCreateRouteProp = RouteProp<RootStackParamList, 'UserCreate'>;

export default function UserCreateScreen() {
  const route = useRoute<UserCreateRouteProp>();
  const { factoryId } = route.params;
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(false);
  const roleOptions = ['Admin', 'User'];
  if (role === 'adminSystem') {
    roleOptions.push('System Admin');
  }

  const handleCreateUser = async () => {
    if (!name || !role) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    
    setLoading(true);
    try {
      await api.post('/users', {
        name,
        role,
        factoryId, // `factoryId` is directly sent from the route params
      });
      Alert.alert('Success', 'User created successfully');
      navigation.navigate('UserList', { factoryId }); // Força o `fetch` ao voltar para a lista
    } catch (error) {
      console.error('Error creating user:', error);
      Alert.alert('Error', 'Failed to create user. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Box padding={4} borderRadius="md" bg="light.50">
        <FormControl isRequired>
          <FormControl.Label>Name</FormControl.Label>
          <Input 
            value={name}
            onChangeText={setName}
            placeholder="Enter user name"
          />
        </FormControl>

        <FormControl isRequired marginTop={4}>
          <FormControl.Label>Role</FormControl.Label>
          <Select
            selectedValue={role}
            onValueChange={setRole}
            placeholder="Select user role"
          >
            {roleOptions.map((option) => (
              <Select.Item key={option} label={option} value={option} />
            ))}
          </Select>
        </FormControl>
        
        <Button
          onPress={handleCreateUser}
          colorScheme="blue"
          marginTop={4}
          isLoading={loading}
          leftIcon={<MaterialIcons name="add" color="white" />}
        >
          Create User
        </Button>
      </Box>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
});
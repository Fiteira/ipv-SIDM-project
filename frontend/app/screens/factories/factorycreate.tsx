import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Box, Button, FormControl, Input, Text } from 'native-base';
import { MaterialIcons } from '@expo/vector-icons';
import api from '../../../config/api';

export default function FactoryCreateScreen({ navigation }: { navigation: any }) {
  const [factoryName, setFactoryName] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateFactory = async () => {
    if (!factoryName || !location) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/factories', {
        factoryName,
        location,
      });
      if (response.data.success) {
        Alert.alert('Success', 'Factory created successfully');
        navigation.navigate('Main', { created: true }); // Navegação para o HomeScreen com o parâmetro `created: true`
      }
    } catch (error) {
      console.error('Error creating factory:', error);
      Alert.alert('Error', 'Failed to create factory. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Box padding={4} borderRadius="md" bg="light.50">
        <FormControl isRequired>
          <FormControl.Label>Factory Name</FormControl.Label>
          <Input 
            value={factoryName}
            onChangeText={setFactoryName}
            placeholder="Enter factory name"
          />
        </FormControl>
        
        <FormControl isRequired marginTop={4}>
          <FormControl.Label>Location</FormControl.Label>
          <Input 
            value={location}
            onChangeText={setLocation}
            placeholder="Enter factory location"
          />
        </FormControl>
        
        <Button
          onPress={handleCreateFactory}
          colorScheme="blue"
          marginTop={4}
          isLoading={loading}
          leftIcon={<MaterialIcons name="add" color="white" />}
        >
          Create Factory
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

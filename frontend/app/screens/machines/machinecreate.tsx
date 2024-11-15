import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Box, Button, FormControl, Input, Text } from 'native-base';
import api from '../../../config/api';
import { RouteProp, useRoute, useNavigation, NavigationProp } from '@react-navigation/native';

type RootStackParamList = {
    MachineList: { factoryId: string };
    MachineCreate: { factoryId: string };
};

type MachineCreateRouteProp = RouteProp<RootStackParamList, 'MachineCreate'>;

export default function MachineCreateScreen() {
  const route = useRoute<MachineCreateRouteProp>();
  const { factoryId } = route.params;
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const [machineName, setMachineName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateMachine = async () => {
    if (!machineName) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    
    setLoading(true);
    try {
      await api.post('/machines', {
        machineName,
        factoryId,
      });
      Alert.alert('Success', 'Machine  created successfully');
      navigation.navigate('MachineList', { factoryId }); // Força o `fetch` ao voltar para a lista
    } catch (error) {
      console.error('Error creating Machine:', error);
      Alert.alert('Error', 'Failed to create machine. Please try again later.');
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
            value={machineName}
            onChangeText={setMachineName}
            placeholder="Enter machine name"
          />
        </FormControl>
        
        <Button
          onPress={handleCreateMachine}
          colorScheme="blue"
          marginTop={4}
          isLoading={loading}
        >
          Create Machine
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
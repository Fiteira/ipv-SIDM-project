import React, { useState, useEffect } from 'react';
import { Alert, StyleSheet } from 'react-native';
import { Box, VStack, Button, Input, Text, Spinner } from 'native-base';
import { RouteProp, useRoute, useNavigation, NavigationProp } from '@react-navigation/native';
import api from '../../../config/api';
import { getMachineById, insertMachines } from '@/config/sqlite';
import { compareJSON } from '@/config/utils';

type RootStackParamList = {
  MachineEdit: { machineId: string };
};

type MachineEditRouteProp = RouteProp<RootStackParamList, 'MachineEdit'>;

export default function MachineEditScreen() {
  const route = useRoute<MachineEditRouteProp>();
  const { machineId } = route.params;
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const [machineName, setMachineName] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchMachineDetails = async () => {
    try {
      setLoading(true);

      // Fetch local machine details
      const localMachine = await getMachineById(machineId);

      if (localMachine) {
        setMachineName(localMachine.machineName); // Atualiza estado com dados locais
      } else {
        console.warn('No local machine data found.');
      }

      // Fetch machine details from API
      const response = await api.get(`/machines/${machineId}`);
      const serverMachine = response.data.data;

      // Normalize data for comparison
      const normalizeMachine = (machine: any) => ({
        machineId: machine.machineId,
        machineName: machine.machineName.trim(),
        state: machine.state.trim(),
        factoryId: machine.factoryId,
      });

      const normalizedLocalMachine = localMachine ? normalizeMachine(localMachine) : null;
      const normalizedServerMachine = normalizeMachine(serverMachine);

      // Compare local and server data
      if (!normalizedLocalMachine || !compareJSON(normalizedLocalMachine, normalizedServerMachine)) {
        console.log('Machine data has changed. Updating state and local storage.');

        // Update local storage
        await insertMachines([serverMachine]);

        // Update state with server data
        setMachineName(normalizedServerMachine.machineName);
      } else {
        console.log('Machine data is up-to-date. No update needed.');
      }
    } catch (error) {
      console.error('Error fetching machine details:', error);
      Alert.alert('Error', 'Failed to load machine details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMachineDetails();
  }, [machineId]);

  const handleSave = async () => {
    if (!machineName.trim()) {
      Alert.alert('Validation Error', 'Machine name is required.');
      return;
    }

    try {
      setLoading(true);
      await api.put(`/machines/${machineId}`, { machineName });
      Alert.alert('Success', 'Machine details updated successfully.');
      navigation.goBack();
    } catch (error) {
      console.error('Error updating machine:', error);
      Alert.alert('Error', 'Failed to update machine.');
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
        <Text fontSize="md" bold>Machine Name</Text>
        <Input
          value={machineName}
          onChangeText={setMachineName}
          placeholder="Enter machine name"
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

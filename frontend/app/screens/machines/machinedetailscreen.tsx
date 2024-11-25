import React, { useEffect, useState } from 'react';
import { View, Text, Alert, StyleSheet, TextInput } from 'react-native';
import { Box, Spinner, Button, VStack, Icon, HStack, Modal } from 'native-base';
import { MaterialIcons } from '@expo/vector-icons';
import { RouteProp, useRoute } from '@react-navigation/native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import api from '../../../config/api';
import { isNetworkAvailable } from '../../../config/netinfo';
import { getMachineById, insertMachines } from '../../../config/sqlite'; // SQLite functions
import { useContext } from 'react';
import { AuthContext } from '../../AuthContext';

type RootStackParamList = {
  MachineDetail: { machineId: string };
  SensorList: { machineId: string };
  MaintenanceList: { machineId: string };
  MachineList: { factoryId: string };
  MachineEdit: { machineId: string };
};

type MachineDetailRouteProp = RouteProp<RootStackParamList, 'MachineDetail'>;

interface Machine {
  machineId: number;
  machineName: string;
  state: string;
  factoryId: number;
  updatedAt: string; // For synchronization
}

export default function MachineDetailScreen() {
  const route = useRoute<MachineDetailRouteProp>();
  const { machineId } = route.params;
  const [machine, setMachine] = useState<Machine | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmDeleteModalVisible, setConfirmDeleteModalVisible] = useState(false);
  const [inputMachineName, setInputMachineName] = useState('');
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { userRole } = useContext(AuthContext);

  const fetchMachineDetails = async () => {
    try {
      setLoading(true);

      // Step 1: Load machine details from SQLite
      const localMachine = await getMachineById(machineId);
      if (localMachine) {
        setMachine(localMachine);
      }

      // Step 2: Check network availability
      const isConnected = await isNetworkAvailable();
      if (!isConnected) {
        console.warn('Offline mode: Using cached data.');
        return; // Skip server fetch if offline
      }

      // Step 3: Fetch machine details from server
      const response = await api.get(`/machines/${machineId}`);
      const serverMachine: Machine = response.data.data;

      // Step 4: Update SQLite if necessary
      if (
        !localMachine ||
        new Date(serverMachine.updatedAt) > new Date(localMachine.updatedAt)
      ) {
        await insertMachines([serverMachine]);
        console.log('Machine details synchronized with local database.');
      }

      // Step 5: Update state with server data
      setMachine(serverMachine);
    } catch (error) {
      console.error('Error fetching machine details:', error);
      Alert.alert('Error', 'Failed to load machine details. Check your connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMachineDetails();
  }, [machineId]);

  const handleDelete = async () => {
    if (inputMachineName === machine?.machineName) {
      setConfirmDeleteModalVisible(false);
      try {
        await api.delete(`/machines/${machineId}`);
        Alert.alert('Success', 'Machine deleted successfully');
        navigation.goBack();
      } catch (error) {
        console.error('Error deleting machine:', error);
        Alert.alert('Error', 'Failed to delete machine. Please try again later.');
      }
    } else {
      setErrorModalVisible(true);
    }
  };

  if (loading) {
    return <Spinner color="blue.500" />;
  }

  if (!machine) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Machine not found.</Text>
      </View>
    );
  }

  return (
    <Box style={styles.container}>
      <Text style={styles.title}>{machine.machineName}</Text>
      <Text style={styles.state}>State: {machine.state}</Text>
      <HStack space={3} justifyContent="center" marginTop={4}>
      {(userRole === 'admin' || userRole === 'adminSystem') && (
        <>
          <Button
            colorScheme="yellow"
            onPress={() => navigation.navigate('MachineEdit', { machineId })}
            leftIcon={<Icon as={MaterialIcons} name="edit" size="sm" color="white" />}
          >
            Edit
          </Button>
          <Button
            colorScheme="red"
            onPress={() => setShowDeleteModal(true)}
            leftIcon={<Icon as={MaterialIcons} name="delete" size="sm" color="white" />}
          >
            Delete
          </Button>
        </>
        )}
        <Button
          colorScheme="blue"
          onPress={() => navigation.navigate('SensorList', { machineId })}
          leftIcon={<Icon as={MaterialIcons} name="sensors" size="sm" color="white" />}
        >
          Sensors
        </Button>
        <Button
          colorScheme="green"
          onPress={() => navigation.navigate('MaintenanceList', { machineId })}
          leftIcon={<Icon as={MaterialIcons} name="build" size="sm" color="white" />}
        >
          Maintenance
        </Button>
      </HStack>

      {/* Modal de confirmação de exclusão */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
        <Modal.Content>
          <Modal.Header>Confirm Deletion</Modal.Header>
          <Modal.Body>
            You are about to delete the machine "{machine.machineName}". Do you want to continue?
          </Modal.Body>
          <Modal.Footer>
            <Button.Group space={2}>
              <Button variant="unstyled" onPress={() => setShowDeleteModal(false)}>
                Cancel
              </Button>
              <Button colorScheme="red" onPress={() => { setShowDeleteModal(false); setConfirmDeleteModalVisible(true); }}>
                Yes
              </Button>
            </Button.Group>
          </Modal.Footer>
        </Modal.Content>
      </Modal>

      {/* Modal de confirmação final com nome da máquina */}
      <Modal isOpen={confirmDeleteModalVisible} onClose={() => setConfirmDeleteModalVisible(false)}>
        <Modal.Content>
          <Modal.Header>Confirm Deletion</Modal.Header>
          <Modal.Body>
            To confirm deletion, type the machine name:
          </Modal.Body>
          <TextInput
            style={styles.input}
            placeholder="Enter machine name"
            value={inputMachineName}
            onChangeText={setInputMachineName}
          />
          <Modal.Footer>
            <Button.Group space={2}>
              <Button colorScheme="red" onPress={handleDelete}>
                Confirm Delete
              </Button>
              <Button onPress={() => setConfirmDeleteModalVisible(false)} colorScheme="coolGray">
                Cancel
              </Button>
            </Button.Group>
          </Modal.Footer>
        </Modal.Content>
      </Modal>

      {/* Modal de erro para nome incorreto */}
      <Modal isOpen={errorModalVisible} onClose={() => setErrorModalVisible(false)}>
        <Modal.Content>
          <Modal.Body>
            The machine name is incorrect. Please try again.
          </Modal.Body>
          <Modal.Footer>
            <Button colorScheme="coolGray" onPress={() => setErrorModalVisible(false)}>
              Close
            </Button>
          </Modal.Footer>
        </Modal.Content>
      </Modal>
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
  state: {
    fontSize: 16,
    color: 'gray',
  },
  iconButton: {
    width: 120,
    height: 120,
    backgroundColor: '#0077e6',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: 'gray',
    width: '100%',
    padding: 10,
    marginVertical: 10,
    borderRadius: 5,
    fontSize: 16,
  },
});
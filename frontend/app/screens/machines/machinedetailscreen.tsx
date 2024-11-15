import React, { useEffect, useState } from 'react';
import { View, Text, Alert, StyleSheet, TextInput } from 'react-native';
import { Box, Spinner, Button, VStack, Icon, HStack, Modal } from 'native-base';
import { MaterialIcons } from '@expo/vector-icons';
import { RouteProp, useRoute } from '@react-navigation/native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import api from '../../../config/api';

type RootStackParamList = {
  MachineDetail: { machineId: string };
  SensorList: { machineId: string };
  MaintenanceList: { machineId: string };
  MachineList: { factoryId: string };
};

type MachineDetailRouteProp = RouteProp<RootStackParamList, 'MachineDetail'>;

interface Machine {
  machineId: string;
  machineName: string;
  state: string;
  // Inclua outras propriedades relevantes
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

  useEffect(() => {
    api.get(`/machines/${machineId}`)
      .then((response) => {
        setMachine(response.data.data);
      })
      .catch((error) => {
        console.error('Error loading machine details:', error);
        Alert.alert('Error', 'Unable to load machine details.');
      })
      .finally(() => setLoading(false));
  }, [machineId]);

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

  return (
    <Box style={styles.container}>
      <Text style={styles.title}>{machine.machineName}</Text>
      <Text style={styles.state}>State: {machine.state}</Text>
      <VStack space={4} marginTop={6}>
      <HStack space={6} justifyContent="center">
          <Button
            style={styles.iconButton}
            onPress={() => navigation.navigate('SensorList', { machineId })}
          >
            <Icon as={MaterialIcons} name="sensors" size="6xl" color="white" />
          </Button>
          <Button
            style={styles.iconButton}
            onPress={() => navigation.navigate('MaintenanceList', { machineId })}
          >
            <Icon as={MaterialIcons} name="build" size="6xl" color="white" />
          </Button>
          <Button colorScheme="red" onPress={() => setShowDeleteModal(true)}>
          Delete Machine
        </Button>
        </HStack>
      </VStack>

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
    backgroundColor: '#0077e6', // Dark blue color
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
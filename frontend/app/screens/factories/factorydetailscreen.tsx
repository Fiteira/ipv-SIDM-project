import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, Modal, TextInput, Alert } from 'react-native';
import { Box, Spinner, Button, VStack, HStack, Icon } from 'native-base';
import { MaterialIcons } from '@expo/vector-icons';
import { RouteProp, useRoute, useNavigation, NavigationProp } from '@react-navigation/native';
import { getFactoryById, insertFactories } from '../../../config/sqlite';
import { useContext } from 'react';
import { AuthContext } from '../../AuthContext';


import api from '../../../config/api';

type RootStackParamList = {
  FactoryDetail: { factoryId: string };
  FactoryEdit: { factoryId: string };
  FactoryDashboard: { factoryId: string };
  MachineList: { factoryId: string };
  UserList: { factoryId: string };
  AlertList: { factoryId: string };
};

type FactoryDetailRouteProp = RouteProp<RootStackParamList, 'FactoryDetail'>;

interface Factory {
  factoryId: number;
  factoryName: string;
  location: string;
  updatedAt: string;
}

export default function FactoryDetailScreen() {
  const route = useRoute<FactoryDetailRouteProp>();
  const { factoryId } = route.params;
  const [factory, setFactory] = useState<Factory | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [inputFactoryName, setInputFactoryName] = useState('');
  const { userRole } = useContext(AuthContext);

  const fetchFactoryDetails = async () => {
    try {
      setLoading(true);

      // Step 1: Load data from SQLite
      const localFactory = await getFactoryById(factoryId);
      if (localFactory) {
        setFactory(localFactory);
        setLoading(false);
      } else {
        console.warn('Factory not found in local database.');
      }

      // Step 2: Fetch data from the server if online
      try {
        const response = await api.get(`/factories/${factoryId}`);
        const serverFactory: Factory = response.data.data;

        // Step 3: Update local database if necessary
        if (
          !localFactory ||
          new Date(serverFactory.updatedAt) > new Date(localFactory.updatedAt)
        ) {
          await insertFactories([serverFactory]);
          console.log('Factory details updated in the local database.');
        }

        // Step 4: Update state with server data
        setFactory(serverFactory);
      } catch (networkError) {
        console.warn('Unable to fetch data from server. Using local data if available.');
      }
    } catch (error) {
      console.error('Error fetching factory details:', error);
      Alert.alert('Error', 'Failed to load factory details. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (inputFactoryName === factory?.factoryName) {
      setConfirmModalVisible(false);
      try {
        await api.delete(`/factories/${factoryId}`);
        alert('Factory deleted successfully');
        navigation.goBack();
      } catch (error) {
        console.error('Error deleting factory:', error);
        alert('Failed to delete factory. Please try again later.');
      }
    } else {
      setErrorModalVisible(true); // Exibe o modal de erro se o nome estiver incorreto
    }
  };

  useEffect(() => {
    fetchFactoryDetails();
  }, [factoryId]);

  if (loading) {
    return <Spinner color="blue.500" />;
  }

  if (!factory) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Factory not found.</Text>
      </View>
    );
  }

  return (
    <Box style={styles.container}>
      <Text style={styles.title}>{factory.factoryName}</Text>
      <Text style={styles.location}>Location: {factory.location}</Text>

      <VStack space={4} marginTop={6}>
      <HStack space={6} justifyContent="center">
          <Button
            style={styles.iconButton}
            onPress={() => navigation.navigate('FactoryDashboard', { factoryId })}
          >
            <Icon as={MaterialIcons} name="dashboard" size="6xl" color="white" />
          </Button>
          <Button
            style={styles.iconButton}
            onPress={() => navigation.navigate('MachineList', { factoryId })}
          >
            <Icon as={MaterialIcons} name="precision-manufacturing" size="6xl" color="white" />
          </Button>
        </HStack>

        <HStack space={6} justifyContent="center">
        {(userRole === 'admin' || userRole === 'adminSystem') && (
          <Button
            style={styles.iconButton}
            onPress={() => navigation.navigate('UserList', { factoryId })}
          >
            <Icon as={MaterialIcons} name="group" size="6xl" color="white" />
          </Button>
        )}
          <Button
            style={styles.iconButton}
            onPress={() => navigation.navigate('AlertList', { factoryId })}
          >
            <Icon as={MaterialIcons} name="notifications" size="6xl" color="white" />
          </Button>
        </HStack>

        {/* Botões de Editar e Deletar */}
        <HStack space={3} justifyContent="center" marginTop={4}>
          <Button 
            colorScheme="yellow"
            onPress={() => navigation.navigate('FactoryEdit', { factoryId })}
            leftIcon={<Icon as={MaterialIcons} name="edit" size="sm" color="white" />}
          >
            Edit
          </Button>
          <Button 
            colorScheme="red"
            onPress={() => setModalVisible(true)}
            leftIcon={<Icon as={MaterialIcons} name="delete" size="sm" color="white" />}
          >
            Delete
          </Button>
        </HStack>
      </VStack>

      {/* Primeiro Modal para confirmação inicial de exclusão */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalText}>You are about to delete factory "{factory.factoryName}".</Text>
            <Text style={styles.modalText}>Do you want to continue?</Text>
            <HStack space={3} justifyContent="center" marginTop={4}>
              <Button colorScheme="red" onPress={() => { setModalVisible(false); setConfirmModalVisible(true); }}>
                Yes
              </Button>
              <Button onPress={() => setModalVisible(false)} colorScheme="coolGray">
                No
              </Button>
            </HStack>
          </View>
        </View>
      </Modal>

      {/* Segundo Modal para confirmação final com nome */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={confirmModalVisible}
        onRequestClose={() => setConfirmModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalText}>To confirm deletion, type the factory name:</Text>
            <Text style={styles.modalText}>{factory.factoryName}</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter factory name"
              value={inputFactoryName}
              onChangeText={setInputFactoryName}
            />
            <HStack space={3} justifyContent="center" marginTop={4}>
              <Button colorScheme="red" onPress={handleDelete}>
                Confirm Delete
              </Button>
              <Button onPress={() => setConfirmModalVisible(false)} colorScheme="coolGray">
                Cancel
              </Button>
            </HStack>
          </View>
        </View>
      </Modal>

      {/* Modal de Erro para nome incorreto */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={errorModalVisible}
        onRequestClose={() => setErrorModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalText}>The factory name is incorrect. Please try again.</Text>
            <Button colorScheme="coolGray" onPress={() => setErrorModalVisible(false)} marginTop={4}>
              Close
            </Button>
          </View>
        </View>
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
  location: {
    fontSize: 16,
    color: 'gray',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  modalText: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: 'gray',
    width: '100%',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
    fontSize: 16,
  },
  iconButton: {
    width: 120,
    height: 120,
    backgroundColor: '#0077e6', // Dark blue color
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 15,
  },
});
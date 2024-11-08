import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, Modal, TouchableOpacity } from 'react-native';
import { Box, Spinner, Button, VStack, HStack, Icon } from 'native-base';
import { MaterialIcons } from '@expo/vector-icons';
import { RouteProp, useRoute, useNavigation, NavigationProp } from '@react-navigation/native';

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
  factoryName: string;
  location: string;
}

export default function FactoryDetailScreen() {
  const route = useRoute<FactoryDetailRouteProp>();
  const { factoryId } = route.params;
  const [factory, setFactory] = useState<Factory | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const fetchFactoryDetails = async () => {
    try {
      const response = await api.get(`/factories/${factoryId}`);
      setFactory(response.data.data);
    } catch (error) {
      console.error('Error loading factory details:', error);
      alert('Unable to load factory details.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setModalVisible(false);
    try {
      await api.delete(`/factories/${factoryId}`);
      alert('Factory deleted successfully');
      navigation.goBack();
    } catch (error) {
      console.error('Error deleting factory:', error);
      alert('Failed to delete factory. Please try again later.');
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
        <Button 
          colorScheme="darkBlue"
          onPress={() => navigation.navigate('FactoryDashboard', { factoryId })}
        >
          Dashboard
        </Button>
        <Button
          colorScheme="darkBlue"
          onPress={() => navigation.navigate('MachineList', { factoryId })}
        >
          Machines
        </Button>
        <Button 
          colorScheme="darkBlue"
          onPress={() => navigation.navigate('UserList', { factoryId })}
        >
          Users
        </Button>
        <Button 
          colorScheme="darkBlue"
          onPress={() => navigation.navigate('AlertList', { factoryId })}
        >
          Alerts
        </Button>

        {/* Botões de Editar e Deletar */}
        <HStack space={3} justifyContent="center" marginTop={4}>
          <Button 
            colorScheme="yellow"
            onPress={() => navigation.navigate('FactoryEdit', { factoryId })} // Navegação para tela de edição
            leftIcon={<Icon as={MaterialIcons} name="edit" size="sm" color="white" />}
          >
            Edit
          </Button>
          <Button 
            colorScheme="red"
            onPress={() => setModalVisible(true)} // Exibe o modal de confirmação
            leftIcon={<Icon as={MaterialIcons} name="delete" size="sm" color="white" />}
          >
            Delete
          </Button>
        </HStack>
      </VStack>

      {/* Modal para confirmação de exclusão */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalText}>Are you sure you want to delete this factory?</Text>
            <HStack space={3} justifyContent="center" marginTop={4}>
              <Button colorScheme="red" onPress={handleDelete}>
                Confirm Delete
              </Button>
              <Button onPress={() => setModalVisible(false)} colorScheme="coolGray">
                Cancel
              </Button>
            </HStack>
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
});

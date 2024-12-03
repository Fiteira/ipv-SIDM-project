import React, { useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, Alert, StyleSheet, TextInput } from 'react-native';
import { Box, Spinner, Button, VStack, Modal, HStack, Icon } from 'native-base';
import { RouteProp, useRoute } from '@react-navigation/native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { getUserByNumber, insertUsers } from '../../../config/sqlite'; // SQLite functions
import api from '../../../config/api';
import { compareJSON } from '@/config/utils';
import { MaterialIcons } from '@expo/vector-icons';

type RootStackParamList = {
  UserDetail: { userNumber: number };
  UserEdit: { userNumber: number };
  UserList: { factoryId: string };
};

type UserDetailRouteProp = RouteProp<RootStackParamList, 'UserDetail'>;

interface User {
  userId: number;
  userNumber: number;
  name: string;
  role: string;
  updatedAt: string; // Para controle de sincronização
  factoryId: number | null;
}

export default function UserDetailScreen() {
  const route = useRoute<UserDetailRouteProp>();
  const { userNumber } = route.params;
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmDeleteModalVisible, setConfirmDeleteModalVisible] = useState(false);
  const [inputUserName, setInputUserName] = useState('');
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  // Função para buscar os dados do usuário
  const fetchUserDetails = async () => {
    try {
        setLoading(true);

        // Passo 1: Carregar dados do armazenamento local
        const localUser = await getUserByNumber(userNumber);
        if (localUser) {
            console.log('Local user found:', localUser);
            setUser(localUser); // Define imediatamente os dados locais no estado
        } else {
            console.warn('User not found in local database.');
        }

        // Passo 2: Buscar dados do servidor
        const response = await api.get(`/users/${userNumber}`);
        const serverUser: User = response.data.data;

        // Passo 3: Sincronizar dados do servidor com o armazenamento local, se necessário
        if (!localUser || !compareJSON(localUser, serverUser)) {
            await insertUsers([serverUser]); // Atualizar ou inserir no armazenamento local
            console.log('User data synced successfully.');
        } else {
            console.log('No update needed for user data.');
        }

        // Passo 4: Atualizar o estado com os dados mais recentes
        setUser(serverUser);
    } catch (error) {
        console.error('Error fetching user details:', error);
    } finally {
        setLoading(false); // Garantir que o carregamento é parado
    }
};


  useFocusEffect(
    React.useCallback(() => {
      fetchUserDetails();
    }, [userNumber])
  );

  const handleDelete = async () => {
    if (inputUserName === user?.name) {
      setConfirmDeleteModalVisible(false);
      try {
        await api.delete(`/users/${user?.userNumber}`);
        Alert.alert('Success', 'User deleted successfully');
        navigation.goBack();
      } catch (error) {
        console.error('Error deleting user:', error);
        Alert.alert('Error', 'Failed to delete user. Please try again later.');
      }
    } else {
      setErrorModalVisible(true);
    }
  };

  const handleResetPassword = async () => {
    if (!user) return;

    try {
      const response = await api.patch('/auth/resetpassword', { userNumber: user.userNumber });
      if (response.data.success) {
        Alert.alert('Success', 'Password has been reset');
      } else {
        Alert.alert('Error', response.data.message || 'Unable to reset password.');
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      Alert.alert('Error', 'Unable to reset password.');
    } finally {
      setShowResetModal(false);
    }
  };

  if (loading) {
    return <Spinner color="blue.500" />;
  }

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>User not found.</Text>
      </View>
    );
  }

  return (
    <Box style={styles.container}>
      <Text style={styles.title}>{user.name}</Text>
      <Text style={styles.role}>Number: {user.userNumber}</Text>
      <Text style={styles.role}>Role: {user.role}</Text>
      <VStack space={4} marginTop={6}>
        <Button colorScheme="darkBlue" onPress={() => setShowResetModal(true)}>
          Reset Password
        </Button>
        <HStack space={3} justifyContent="center" marginTop={4}>
          <Button
            colorScheme="yellow"
            leftIcon={<Icon as={MaterialIcons} name="edit" size="sm" color="white" />}
            onPress={() => navigation.navigate('UserEdit', { userNumber })}
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
        </HStack>
      </VStack>

      <Modal isOpen={showResetModal} onClose={() => setShowResetModal(false)}>
        <Modal.Content>
          <Modal.Header>Confirm Reset</Modal.Header>
          <Modal.Body>
            Are you sure you want to reset the password?
          </Modal.Body>
          <Modal.Footer>
            <Button.Group space={2}>
              <Button variant="unstyled" onPress={() => setShowResetModal(false)}>
                Cancel
              </Button>
              <Button colorScheme="red" onPress={handleResetPassword}>
                Confirm
              </Button>
            </Button.Group>
          </Modal.Footer>
        </Modal.Content>
      </Modal>

      {/* Modal para confirmação de exclusão de usuário */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
        <Modal.Content>
          <Modal.Header>Confirm Deletion</Modal.Header>
          <Modal.Body>
            You are about to delete the user "{user.name}". Do you want to continue?
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

      {/* Modal para confirmação final com nome do usuário */}
      <Modal isOpen={confirmDeleteModalVisible} onClose={() => setConfirmDeleteModalVisible(false)}>
        <Modal.Content>
          <Modal.Header>Confirm Deletion</Modal.Header>
          <Modal.Body>
            To confirm deletion, type the user name:
          </Modal.Body>
          <TextInput
            style={styles.input}
            placeholder="Enter user name"
            value={inputUserName}
            onChangeText={setInputUserName}
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
            The user name is incorrect. Please try again.
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
  role: {
    fontSize: 16,
    color: 'gray',
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

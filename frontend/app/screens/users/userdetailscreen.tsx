import React, { useEffect, useState } from 'react';
import { View, Text, Alert, StyleSheet, TextInput } from 'react-native';
import { Box, Spinner, Button, VStack, Modal, HStack, Icon } from 'native-base';
import { RouteProp, useRoute } from '@react-navigation/native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import api from '../../../config/api';
import { MaterialIcons } from '@expo/vector-icons';

type RootStackParamList = {
  UserDetail: { userNumber: string };
  UserList: { factoryId: string };
};

type UserDetailRouteProp = RouteProp<RootStackParamList, 'UserDetail'>;

interface User {
  userId: string;
  userNumber: string;
  name: string;
  role: string;
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

  useEffect(() => {
    api.get(`/users/${userNumber}`)
      .then((response) => {
        setUser(response.data.data);
      })
      .catch((error) => {
        console.error('Error loading user details:', error);
        Alert.alert('Error', 'Unable to load user details.');
      })
      .finally(() => setLoading(false));
  }, [userNumber]);

  const handleDelete = async () => {
    if (inputUserName === user?.name) {
      setConfirmDeleteModalVisible(false);
      try {
        await api.delete(`/users/${user.userId}`);
        Alert.alert('Success', 'User deleted successfully');
        navigation.goBack(); // Navega para UserList para atualizar a lista
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
      const response = await api.post('/auth/resetpassword', { userNumber: user.userNumber });
      if (response.data.success) {
        Alert.alert('Success', 'Password has been reset');
      } else {
        Alert.alert('Error', response.data.message || 'Unable to reset password.');
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      Alert.alert('Error', 'Unable to reset password.');
    } finally {
      setShowResetModal(false); // Fecha o modal após a operação
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

      {/* Modal de confirmação de reset de senha */}
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

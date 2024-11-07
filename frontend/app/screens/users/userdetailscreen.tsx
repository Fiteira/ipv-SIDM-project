import React, { useEffect, useState } from 'react';
import { View, Text, Alert, StyleSheet } from 'react-native';
import { Box, Spinner, Button, VStack, Modal } from 'native-base';
import { RouteProp, useRoute } from '@react-navigation/native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import api from '../../../config/api';

type RootStackParamList = {
  UserDetail: { userId: string };
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
  const { userId } = route.params;
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false); // Controle do modal
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  useEffect(() => {
    api.get(`/users/${userId}`)
      .then((response) => {
        setUser(response.data.data);
      })
      .catch((error) => {
        console.error('Error loading user details:', error);
        Alert.alert('Error', 'Unable to load user details.');
      })
      .finally(() => setLoading(false));
  }, [userId]);

  const handleResetPassword = async () => {
    if (!user) return;
 
    try {
      // Faz a chamada para resetar a senha com userNumber
      const response = await api.post('/auth/resetpassword', { userNumber: user.userNumber });
      if (response.data.success) {
        Alert.alert('Sucess', 'Password has been reset');
      } else {
        Alert.alert('Error', response.data.message || 'Unable to reset password.');
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      Alert.alert('Error', 'Unable to reset password.');
    } finally {
      setShowModal(false); // Fecha o modal após a operação
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
        <Button colorScheme="darkBlue" onPress={() => setShowModal(true)}>
            Reset Password
        </Button>
      </VStack>

      {/* Modal de confirmação */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
        <Modal.Content>
          <Modal.Header>Confirm Reset</Modal.Header>
          <Modal.Body>
            Are you sure you want to reset the password?
          </Modal.Body>
          <Modal.Footer>
            <Button.Group space={2}>
              <Button variant="unstyled" onPress={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button colorScheme="red" onPress={handleResetPassword}>
                Confirm
              </Button>
            </Button.Group>
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
});
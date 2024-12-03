// ProfileEditScreen.tsx
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet } from 'react-native';
import { Box, VStack, Button, Input, Text, Spinner } from 'native-base';
import { MaterialIcons } from '@expo/vector-icons';
import { Modal } from 'native-base';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import api from '../../../config/api'
import { get } from 'react-native/Libraries/TurboModule/TurboModuleRegistry';
import { getUserByNumber, insertUsers } from '@/config/sqlite';

type RootStackParamList = {
  ProfileEdit: undefined;
  Profile: undefined;
};

export default function UserEditScreen({ route }: { route: any }) {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const [name, setName] = useState('');
  const [userNumber, setUserNumber] = useState('');
  const [role, setRole] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      const userNumber = route.params.userNumber;
        try {
            const user = await getUserByNumber(userNumber);
            setName(user.name);
            setUserNumber(user.userNumber);
            setRole(user.role);

            const response = await api.get('/users/' + userNumber);
            const apiUser = response.data.data;
            setName(apiUser.name);
            setUserNumber(apiUser.userNumber);
            setRole(apiUser.role);
            // Comparar, se for diferente, atualizar
            if (user.name !== apiUser.name || user.role !== apiUser.role) {
                console.log('User data is different from API. Updating local data...');
                await insertUsers([apiUser]);
            }

        } catch (error) {
            console.error('Failed to load user profile:', error);
            Alert.alert('Error', 'Failed to load user profile.');
        } finally {
            setLoading(false);
        }
    };

    loadProfile();
  }, []);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Name is required.');
      return;
    }

    try {
      setLoading(true);
      const updatedUser = { name: name }
      const response = await api.put('/users/' + userNumber.toString(), updatedUser);
      console.log(response.data)
      Alert.alert('Success', 'Profile updated successfully.');
      navigation.goBack()
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };
  const openPassModal = () => {
    setPassword('');
    setConfirmPassword('');
    setModalVisible(modalVisible => !modalVisible);
  }

  const handleChangePass = async () => {
    if (!password.trim() || !confirmPassword.trim()) {
      Alert.alert('Validation Error', 'Password and confirm password are required.');
      return;
    } else if (password !== confirmPassword) {
      Alert.alert('Validation Error', 'Passwords do not match.');
      return;
    }
    const response = await api.patch('/auth/changepassword/' + userNumber.toString(), { password })
    if (response.data.success) {
      Alert.alert('Success', 'Password updated successfully.');
    } else {
      Alert.alert('Error', 'Failed to update password.');
    }
    setPassword('');
    setConfirmPassword('');
    setModalVisible(false);
  }

  if (loading) {
    return <Spinner color="blue.500" />;
  }

  return (
    <Box style={styles.container}>
      <VStack space={4}>
        <Text fontSize="md" bold>Name</Text>
        <Input
          value={name}
          onChangeText={setName}
          placeholder="Enter your name"
        />
        <Text fontSize="md" bold>User Number</Text>
        <Input
          value={userNumber}
          isReadOnly
          placeholder="User number"
        />
        <Text fontSize="md" bold>Role</Text>
        <Input
          value={role}
          isReadOnly
          placeholder="Role"
        />
        <Button colorScheme="blue" onPress={handleSave} leftIcon={<MaterialIcons name="add" color="white"></MaterialIcons>}>
          Save Changes
        </Button>
      </VStack>
      <Modal isOpen={modalVisible} onClose={() => setModalVisible(false)}>
        <Modal.Content maxWidth="400px">
          <Modal.Header>Change Password</Modal.Header>
          <Modal.Body>
            <Input placeholder="New Password" type="password" marginTop="2" value={password} onChangeText={setPassword}/>
            <Input placeholder="Confirm New Password" type="password" marginTop="2" value={confirmPassword} onChangeText={setConfirmPassword}/>
          </Modal.Body>
          <Modal.Footer>
            <Button.Group space={2}>
              <Button colorScheme="red" leftIcon={<MaterialIcons name="cancel" color="white"/>} onPress={openPassModal}>Cancel</Button>
              <Button colorScheme="blue" onPress={handleChangePass} leftIcon={<MaterialIcons name='save' color="white"/>}>Save</Button>
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
});
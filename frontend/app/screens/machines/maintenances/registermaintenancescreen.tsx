import React, { useState, useEffect  } from 'react';
import { View, Alert, StyleSheet } from 'react-native';
import { Box, Button, VStack, Input, TextArea, Spinner, Text } from 'native-base';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../../../config/api';

type RootStackParamList = {
  RegisterMaintenance: { alertId: string; machineId: string };
};

type RegisterMaintenanceRouteProp = RouteProp<RootStackParamList, 'RegisterMaintenance'>;

export default function RegisterMaintenanceScreen() {
  const route = useRoute<RegisterMaintenanceRouteProp>();
  const { alertId, machineId } = route.params;
  const navigation = useNavigation();
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);

  useEffect(() => {
    const loadUserId = async () => {
      const user = await AsyncStorage.getItem('user');
      if (user) {
        const parsedUser = JSON.parse(user);
        setUserId(parsedUser.userId);
      }
    };
    loadUserId();
  }, []);

  const handleSaveMaintenance = async () => {
    if (!description.trim()) {
        Alert.alert('Validation Error', 'Description is required');
        return;
    }

    if (!userId) {
        Alert.alert('Error', 'Unable to determine user ID.');
        return;
    }

    try {
      setLoading(true);

      // 1. Cria a manutenção
      await api.post('/maintenances', {
        machineId,
        alertId,
        maintenanceDate: new Date().toISOString(),
        description,
        performedBy: userId,
      });

      // 2. Atualiza o estado do alerta para "solved"
      await api.patch(`/alerts/state/${alertId}`, { state: 'solved' });

      Alert.alert('Success', 'Maintenance registered successfully');
      navigation.goBack();
    } catch (error) {
      console.error('Error saving maintenance:', error);
      Alert.alert('Error', 'Unable to save maintenance');
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
        <Text fontSize="md">Machine ID: {machineId}</Text>
        <Text fontSize="md">Alert ID: {alertId}</Text>
        <Text fontSize="md">User ID: {userId}</Text>

        <TextArea
          value={description}
          onChangeText={(text) => setDescription(text)}
          placeholder="Enter maintenance description"
          autoCompleteType="off"
          numberOfLines={4}
          style={styles.textArea}
        />

        <Button colorScheme="darkBlue" onPress={handleSaveMaintenance}>
          Save Maintenance
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
  textArea: {
    borderColor: '#ddd',
    borderWidth: 1,
    padding: 10,
    borderRadius: 5,
    fontSize: 16,
    minHeight: 100,
  },
});

import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet } from 'react-native';
import { Box, VStack, Button, Input, Text, Spinner } from 'native-base';
import { RouteProp, useRoute, useNavigation, NavigationProp } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import api from '../../../../config/api';
import { getSensorById, insertSensors } from '@/config/sqlite';
import { compareJSON } from '@/config/utils';

type RootStackParamList = {
  SensorEdit: { sensorId: string };
};

type SensorEditRouteProp = RouteProp<RootStackParamList, 'SensorEdit'>;

export default function SensorEditScreen() {
  const route = useRoute<SensorEditRouteProp>();
  const { sensorId } = route.params;
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const [sensorName, setSensorName] = useState('');
  const [sensorType, setSensorType] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchSensorDetails = async () => {
    try {
      setLoading(true);
  
      // Fetch local sensor data
      console.log('Fetching local sensor data...');
      const localSensorData = await getSensorById(sensorId);
  
      if (localSensorData) {
        console.log('Local sensor data found:', localSensorData);
        setSensorName(localSensorData.name);
        setSensorType(localSensorData.sensorType);
      } else {
        console.warn('No local sensor data found.');
      }
  
      // Fetch sensor data from API
      console.log('Fetching sensor data from API...');
      const response = await api.get(`/sensors/${sensorId}`);
      const fetchedSensor = response.data.data;
  
      console.log('Fetched sensor from API:', fetchedSensor);
  
      // Normalize data for comparison
      const normalizeSensor = (sensor: any) => ({
        sensorId: Number(sensor.sensorId),
        name: sensor.name.trim(),
        sensorType: sensor.sensorType.trim(),
        machineId: Number(sensor.machineId),
        apiKey: sensor.apiKey.trim(),
      });
  
      const normalizedLocalSensor = localSensorData ? normalizeSensor(localSensorData) : null;
      const normalizedFetchedSensor = normalizeSensor(fetchedSensor);
  
      // Compare local data with API data
      if (!normalizedLocalSensor || !compareJSON(normalizedLocalSensor, normalizedFetchedSensor)) {
        console.log('Sensor data has changed. Updating local storage and state.');
  
        // Update local storage
        await insertSensors([normalizedFetchedSensor]);
  
        // Update state with new data
        setSensorName(normalizedFetchedSensor.name);
        setSensorType(normalizedFetchedSensor.sensorType);
      } else {
        console.log('Sensor data is the same. No update needed.');
      }
    } catch (error) {
      console.error('Error fetching sensor details:', error);
      Alert.alert('Error', 'Failed to load sensor details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSensorDetails();
  }, [sensorId]);

  const handleSave = async () => {
    if (!sensorName.trim() || !sensorType.trim()) {
      Alert.alert('Validation Error', 'Sensor name and type are required.');
      return;
    }

    try {
      setLoading(true);
      await api.put(`/sensors/${sensorId}`, { name: sensorName, sensorType });
      Alert.alert('Success', 'Sensor details updated successfully.');
      navigation.goBack();
    } catch (error) {
      console.error('Error updating sensor:', error);
      Alert.alert('Error', 'Failed to update sensor.');
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
        <Text fontSize="md" bold>Sensor Name</Text>
        <Input
          value={sensorName}
          onChangeText={setSensorName}
          placeholder="Enter sensor name"
        />
        <Text fontSize="md" bold>Sensor Type</Text>
        <Input
          value={sensorType}
          onChangeText={setSensorType}
          placeholder="Enter sensor type"
        />
        <Button colorScheme="blue" onPress={handleSave} width="30%" alignSelf="center" leftIcon={<MaterialIcons name="save" color="white"/>}>
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

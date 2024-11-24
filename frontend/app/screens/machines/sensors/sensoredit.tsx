import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet } from 'react-native';
import { Box, VStack, Button, Input, Text, Spinner } from 'native-base';
import { RouteProp, useRoute, useNavigation, NavigationProp } from '@react-navigation/native';
import api from '../../../../config/api';

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

  useEffect(() => {
    const fetchSensorDetails = async () => {
      try {
        const response = await api.get(`/sensors/${sensorId}`);
        const sensor = response.data.data;
        setSensorName(sensor.name);
        setSensorType(sensor.sensorType);
      } catch (error) {
        console.error('Error fetching sensor details:', error);
        Alert.alert('Error', 'Failed to load sensor details.');
      } finally {
        setLoading(false);
      }
    };

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
        <Button colorScheme="blue" onPress={handleSave}>
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

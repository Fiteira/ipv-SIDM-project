import React, { useEffect, useState } from 'react';
import { View, Alert, StyleSheet } from 'react-native';
import { Box, Spinner, Button, VStack, HStack, Icon, Text } from 'native-base';
import { MaterialIcons } from '@expo/vector-icons';
import { RouteProp, useRoute } from '@react-navigation/native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import api from '../../../config/api';

type RootStackParamList = {
  AlertDetail: { alertId: string };
  SensorDetail: { sensorId: string };
};

type AlertDetailRouteProp = RouteProp<RootStackParamList, 'AlertDetail'>;

interface Alerta {
    alertId: string;
    alertDate: string;
    severity: string;
    message: string;
    state: string;
    machineId: string;
    sensorId: string;
    machine: {
      machineId: string;
      machineName: string;
      factoryId: string;
      state: string;
    };
    sensor: {
      sensorId: string;
      name: string;
      sensorType: string;
    };
}

export default function AlertDetailScreen() {
  const route = useRoute<AlertDetailRouteProp>();
  const { alertId } = route.params;
  const [alerta, setAlertas] = useState<Alerta | null>(null);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  useEffect(() => {
    api.get(`/alerts/${alertId}`)
      .then((response) => {
        setAlertas(response.data.data);
      })
      .catch((error) => {
        console.error('Error loading alert details:', error);
        Alert.alert('Error', 'Unable to load alert details.');
      })
      .finally(() => setLoading(false));
  }, [alertId]);

  if (loading) {
    return <Spinner color="blue.500" />;
  }

  if (!alerta) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Alert not found.</Text>
      </View>
    );
  }

  return (
    <Box style={styles.container}>
      <VStack space={4}>
        <HStack justifyContent="space-between" alignItems="center">
            <Text style={styles.title}>{alerta.machine.machineName} ({alerta.sensor.name})</Text>
            <Text style={styles.date}>{new Date(alerta.alertDate).toLocaleDateString()}</Text>
        </HStack>

        <HStack justifyContent="space-between" alignItems="center">
          <Text 
            style={[
                styles.value,
                { color: 
                    alerta.severity === 'critical'
                    ? '#8B0000' // red dark
                    : alerta.severity === 'high'
                    ? '#FF4500' // orange red
                    : alerta.severity === 'medium'
                    ? '#FFA500' // yellow
                    : '#32CD32' // lime green
                }
            ]}
          >
            {alerta.severity}
          </Text>
          <Text style={styles.state}>{alerta.state}</Text>
        </HStack>

        <HStack alignItems="center" space={2}>
            <Icon as={MaterialIcons} name="message" size="sm"/>
            <Text style={styles.label}>Message:</Text>
        </HStack>
        <Text style={styles.value}>{alerta.message}</Text>

        {alerta.state === 'awaiting analysis' && (
          <VStack space={4} marginTop={6}>
            <Button colorScheme="darkBlue" onPress={() => navigation.navigate('SensorDetail', { sensorId: alerta.sensor.sensorId })}>Check Sensor Readings</Button>
            <Button colorScheme="darkBlue">Start Maintenance Process</Button>
            <Button colorScheme="darkBlue">Ignore Alert</Button>
          </VStack>
        )}

        {alerta.state === 'in progress' && (
          <VStack space={4} marginTop={6}>
            <Button colorScheme="darkBlue" onPress={() => navigation.navigate('SensorDetail', { sensorId: alerta.sensor.sensorId })}>Check Sensor Readings</Button>
            <Button colorScheme="darkBlue">Finish Maintenance Process</Button>
          </VStack>
        )}

        {alerta.state === 'solved' && (
          <VStack space={4} marginTop={6}>
            <Button colorScheme="darkBlue">Check Associated Maintenance</Button>
          </VStack>
        )}
      </VStack>
    </Box>
  );
}

const styles = StyleSheet.create({
    container: {
    flex: 1,
    padding: 16,
    },
    title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
    },
    date: {
    fontSize: 16,
    color: 'gray',
    },
    label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    },
    value: {
    fontSize: 16,
    color: '#444',
    marginBottom: 10,
    },
    state: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    },
});
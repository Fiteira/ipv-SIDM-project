import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Alert, StyleSheet } from 'react-native';
import { Box, Spinner, Button, VStack, HStack, Icon, Text } from 'native-base';
import { MaterialIcons } from '@expo/vector-icons';
import { RouteProp, useRoute, NavigationProp, useNavigation, useFocusEffect } from '@react-navigation/native';
import { isNetworkAvailable } from '../../../config/netinfo';
import { getAlertById, insertAlerts } from '../../../config/sqlite'; // SQLite functions
import api from '../../../config/api';

type RootStackParamList = {
  AlertDetail: { alertId: number };
  SensorDetail: { sensorId: number };
  RegisterMaintenance: { alertId: number; machineId: number };
};

type AlertDetailRouteProp = RouteProp<RootStackParamList, 'AlertDetail'>;

interface Alerta {
  alertId: number;
  alertDate: string;
  severity: string;
  message: string;
  state: string;
  machineId: number;
  sensorId: number;
  machine: {
    machineId: number;
    machineName: string;
    factoryId: number;
    state: string;
  } | null;
  sensor: {
    sensorId: number;
    name: string;
    sensorType: string;
  } | null;
}

export default function AlertDetailScreen() {
  const route = useRoute<AlertDetailRouteProp>();
  const { alertId } = route.params;
  const [alerta, setAlerta] = useState<Alerta | null>(null);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const fetchLocalAlert = useCallback(async () => {
    try {
      console.log('Fetching local alert...');
      const localAlert = await getAlertById(alertId.toString()); // Busca alerta no SQLite
      if (localAlert) {
        setAlerta(localAlert);
      } else {
        console.warn('No local alert found.');
      }
    } catch (error) {
      console.error('Error fetching local alert:', error);
    }
  }, [alertId]);

  const fetchRemoteAlert = useCallback(async () => {
    try {
      console.log('Fetching remote alert...');
      const response = await api.get(`/alerts/${alertId}`);
      const serverAlert: Alerta = response.data.data;


      // Verifica se os dados do servidor são diferentes dos locais
      const localAlert = await getAlertById(alertId.toString());
      const isDifferent =
        !localAlert ||
        new Date(localAlert.alertDate).toISOString() !==
          new Date(serverAlert.alertDate).toISOString() ||
        localAlert.state !== serverAlert.state;

      if (isDifferent) {
        console.log('Server alert is different, updating local database...');
        await insertAlerts([serverAlert]); // Atualiza o SQLite com os dados do servidor
        setAlerta(serverAlert); // Atualiza o estado com os dados mais recentes
      } else {
        console.log('No changes detected, keeping local alert.');
      }
    } catch (error) {
      console.error('Error fetching remote alert:', error);
    }
  }, [alertId]);

  const fetchAlertDetails = useCallback(async () => {
    setLoading(true);
    await fetchLocalAlert(); // Mostra os dados locais imediatamente
    const isConnected = await isNetworkAvailable();
    if (isConnected) {
      await fetchRemoteAlert(); // Busca dados do servidor e atualiza se necessário
    } else {
      console.warn('No network connection, displaying local data.');
    }
    setLoading(false);
  }, [fetchLocalAlert, fetchRemoteAlert]);

  useFocusEffect(
    useCallback(() => {
      fetchAlertDetails();
    }, [fetchAlertDetails])
  );

  const fetchMachinesAndSensors = async (factoryId: number) => {
    try {
      const response = await api.get(`/factories/${factoryId}/machines-sensors`);
      console.log('Machines and Sensors fetched:', response.data);

      // Atualizar lógica de sincronização para salvar localmente, se necessário
      Alert.alert('Success', 'Machines and sensors have been updated.');
    } catch (error) {
      console.error('Error fetching machines and sensors:', error);
      Alert.alert('Error', 'Unable to fetch machines and sensors.');
    }
  };

  const handleCheckSensorReadings = () => {
    if (!alerta?.machine || !alerta?.sensor) {
      if (alerta?.machine?.factoryId) {
        fetchMachinesAndSensors(alerta.machine.factoryId);
      } else {
        Alert.alert(
          'Missing Data',
          'Machine or sensor data is missing, and no factory ID is available to fetch the data.'
        );
      }
    } else {
      navigation.navigate('SensorDetail', { sensorId: alerta.sensor.sensorId });
    }
  };

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
          <Text style={styles.title}>
            {alerta.machine?.machineName || 'Unknown Machine'} (
            {alerta.sensor?.name || 'Unknown Sensor'})
          </Text>
          <Text style={styles.date}>{new Date(alerta.alertDate).toLocaleDateString()}</Text>
        </HStack>

        <HStack justifyContent="space-between" alignItems="center">
          <Text
            style={[
              styles.value,
              {
                color:
                  alerta.severity === 'critical'
                    ? '#8B0000'
                    : alerta.severity === 'high'
                    ? '#FF4500'
                    : alerta.severity === 'medium'
                    ? '#FFA500'
                    : '#32CD32',
              },
            ]}
          >
            {alerta.severity}
          </Text>
          <Text style={styles.state}>{alerta.state}</Text>
        </HStack>

        <HStack alignItems="center" space={2}>
          <Icon as={MaterialIcons} name="message" size="sm" />
          <Text style={styles.label}>Message:</Text>
        </HStack>
        <Text style={styles.value}>{alerta.message}</Text>

        {/* Botões dinâmicos com base no estado do alerta */}
        {alerta.state === 'awaiting analysis' && (
          <VStack space={4} marginTop={6}>
            <Button colorScheme="darkBlue" onPress={handleCheckSensorReadings}>
              Check Sensor Readings
            </Button>
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

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Alert, StyleSheet } from 'react-native';
import { Box, Spinner, Button, VStack, HStack, Icon, Text, AlertDialog } from 'native-base';
import { MaterialIcons } from '@expo/vector-icons';
import { RouteProp, useRoute, NavigationProp, useNavigation, useFocusEffect } from '@react-navigation/native';
import { isNetworkAvailable } from '../../../config/netinfo';
import { getAlertById, insertAlerts } from '../../../config/sqlite'; // SQLite functions
import { compareJSON } from '@/config/utils';
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
  const [showIgnoreDialog, setShowIgnoreDialog] = useState(false);
  const [showStartMaintenanceDialog, setShowStartMaintenanceDialog] = useState(false);
  const [showFinishMaintenanceDialog, setShowFinishMaintenanceDialog] = useState(false);
  const cancelRef = useRef(null);
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
      console.log("Alerta local: ", localAlert);
      console.log("Alerta server: ", serverAlert);
  
      const isDifferent = !localAlert || !compareJSON(localAlert, serverAlert);
  
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
  }, [alertId])

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

  const handleIgnoreAlert = async () => {
    try {
      await api.patch(`/alerts/state/${alertId}`, { state: 'ignored' });
      setAlerta((prev) => prev ? { ...prev, state: 'ignored' } : null);
      setShowIgnoreDialog(false);
      Alert.alert('Sucess', 'Alert has been ignored.');
    } catch (error) {
      console.error('Error updating alert state:', error);
      Alert.alert('Error', 'Unable to ignore alert.');
    }
  };

  const handleStartMaintenance = async () => {
    try {
      await api.patch(`/alerts/state/${alertId}`, { state: 'in progress' });
      setAlerta((prev) => prev ? { ...prev, state: 'in progress' } : null);
      setShowStartMaintenanceDialog(false);
      Alert.alert('Success', 'Maintenance process started.');
    } catch (error) {
      console.error('Error starting maintenance process:', error);
      Alert.alert('Error', 'Unable to start maintenance process.');
    }
  };

  const handleFinishMaintenance = () => {
    setShowFinishMaintenanceDialog(false);
    if (alerta?.alertId && alerta?.machine?.machineId) {
      navigation.navigate('RegisterMaintenance', {
        alertId: alerta.alertId,
        machineId: alerta.machine.machineId,
      });
    } else {
      Alert.alert(
        'Error',
        'Required data is missing. Please ensure the alert and machine information are available.'
      );
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
            <Button colorScheme="darkBlue" onPress={() => setShowStartMaintenanceDialog(true)}>Start Maintenance Process</Button>
            <Button colorScheme="darkBlue" onPress={() => setShowIgnoreDialog(true)}>Ignore Alert</Button>
          </VStack>
        )}

          <AlertDialog
          leastDestructiveRef={cancelRef}
          isOpen={showIgnoreDialog}
          onClose={() => setShowIgnoreDialog(false)}
          >
          <AlertDialog.Content>
            <AlertDialog.Header>Ignore Alert</AlertDialog.Header>
            <AlertDialog.Body>
              Are you sure you want to ignore this alert?
            </AlertDialog.Body>
            <AlertDialog.Footer>
              <Button.Group space={2}>
                <Button variant="unstyled" onPress={() => setShowIgnoreDialog(false)} ref={cancelRef}>
                  Cancel
                </Button>
                <Button colorScheme="red" onPress={handleIgnoreAlert}>
                  Confirm
                </Button>
              </Button.Group>
            </AlertDialog.Footer>
          </AlertDialog.Content>
        </AlertDialog>

        <AlertDialog
          leastDestructiveRef={cancelRef}
          isOpen={showStartMaintenanceDialog}
          onClose={() => setShowStartMaintenanceDialog(false)}
        >
          <AlertDialog.Content>
            <AlertDialog.Header>Start Maintenance</AlertDialog.Header>
            <AlertDialog.Body>
              Are you sure you want to start the maintenance process?
            </AlertDialog.Body>
            <AlertDialog.Footer>
              <Button.Group space={2}>
                <Button variant="unstyled" onPress={() => setShowStartMaintenanceDialog(false)} ref={cancelRef}>
                  Cancel
                </Button>
                <Button colorScheme="darkBlue" onPress={handleStartMaintenance}>
                  Confirm
                </Button>
              </Button.Group>
            </AlertDialog.Footer>
          </AlertDialog.Content>
        </AlertDialog>

        {alerta.state === 'in progress' && (
          <VStack space={4} marginTop={6}>
            <Button colorScheme="darkBlue" onPress={() => setShowFinishMaintenanceDialog(true)}>Finish Maintenance Process</Button>
          </VStack>
        )}

        <AlertDialog
          leastDestructiveRef={cancelRef}
          isOpen={showFinishMaintenanceDialog}
          onClose={() => setShowFinishMaintenanceDialog(false)}
        >
          <AlertDialog.Content>
            <AlertDialog.Header>Finish Maintenance Process</AlertDialog.Header>
            <AlertDialog.Body>
              Are you sure you want to finish the maintenance process? Maintenance registration is required.
            </AlertDialog.Body>
            <AlertDialog.Footer>
              <Button.Group space={2}>
                <Button variant="unstyled" onPress={() => setShowFinishMaintenanceDialog(false)} ref={cancelRef}>
                  Cancel
                </Button>
                <Button colorScheme="darkBlue" onPress={handleFinishMaintenance}>
                  Confirm
                </Button>
              </Button.Group>
            </AlertDialog.Footer>
          </AlertDialog.Content>
        </AlertDialog>

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

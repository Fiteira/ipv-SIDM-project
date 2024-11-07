import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Alert, StyleSheet } from 'react-native';
import { Box, Spinner, Button, VStack, HStack, Icon, Text, AlertDialog } from 'native-base';
import { MaterialIcons } from '@expo/vector-icons';
import { RouteProp, useRoute, useNavigation, NavigationProp, useFocusEffect } from '@react-navigation/native';
import api from '../../../config/api';

type RootStackParamList = {
  AlertDetail: { alertId: string };
  SensorDetail: { sensorId: string };
  RegisterMaintenance: { alertId: string,  machineId: string};
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
  const [showIgnoreDialog, setShowIgnoreDialog] = useState(false);
  const [showStartMaintenanceDialog, setShowStartMaintenanceDialog] = useState(false);
  const [showFinishMaintenanceDialog, setShowFinishMaintenanceDialog] = useState(false);
  const cancelRef = useRef(null);
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const fetchAlertDetails = useCallback(() => {
    setLoading(true);
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

  useFocusEffect(
    useCallback(() => {
      fetchAlertDetails(); // Atualiza os dados sempre que a tela é focada
    }, [fetchAlertDetails])
  );

  const handleIgnoreAlert = async () => {
    try {
      await api.patch(`/alerts/state/${alertId}`, { state: 'ignored' });
      setAlertas((prev) => prev ? { ...prev, state: 'ignored' } : null);
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
      setAlertas((prev) => prev ? { ...prev, state: 'in progress' } : null);
      setShowStartMaintenanceDialog(false);
      Alert.alert('Success', 'Maintenance process started.');
    } catch (error) {
      console.error('Error starting maintenance process:', error);
      Alert.alert('Error', 'Unable to start maintenance process.');
    }
  };

  const handleFinishMaintenance = () => {
    setShowFinishMaintenanceDialog(false);
    navigation.navigate('RegisterMaintenance', { alertId: alerta!.alertId, machineId: alerta!.machine.machineId });
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
            <Button colorScheme="darkBlue" onPress={() => navigation.navigate('SensorDetail', { sensorId: alerta.sensor.sensorId })}>Check Sensor Readings</Button>
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
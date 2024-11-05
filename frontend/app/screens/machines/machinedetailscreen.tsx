import React, { useEffect, useState } from 'react';
import { View, Text, Alert, StyleSheet } from 'react-native';
import { Box, Spinner, Button, VStack } from 'native-base';
import { RouteProp, useRoute } from '@react-navigation/native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import api from '../../../config/api';

type RootStackParamList = {
  MachineDetail: { machineId: string };
  SensorList: { machineId: string };
  MaintenanceList: { machineId: string };
};

type MachineDetailRouteProp = RouteProp<RootStackParamList, 'MachineDetail'>;

interface Machine {
  machineId: string;
  machineName: string;
  state: string;
  // Inclua outras propriedades relevantes
}

export default function MachineDetailScreen() {
  const route = useRoute<MachineDetailRouteProp>();
  const { machineId } = route.params;
  const [machine, setMachine] = useState<Machine | null>(null);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  useEffect(() => {
    api.get(`/machines/${machineId}`)
      .then((response) => {
        setMachine(response.data.data);
      })
      .catch((error) => {
        console.error('Error loading machine details:', error);
        Alert.alert('Error', 'Unable to load machine details.');
      })
      .finally(() => setLoading(false));
  }, [machineId]);

  if (loading) {
    return <Spinner color="blue.500" />;
  }

  if (!machine) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Machine not found.</Text>
      </View>
    );
  }

  return (
    <Box style={styles.container}>
      <Text style={styles.title}>{machine.machineName}</Text>
      <Text style={styles.state}>State: {machine.state}</Text>
      <VStack space={4} marginTop={6}>
        <Button 
            colorScheme="darkBlue"
            onPress={() => navigation.navigate('SensorList', { machineId })}
        >
            Sensors
        </Button>
        <Button
            colorScheme="darkBlue"
            onPress={() => navigation.navigate('MaintenanceList', { machineId })}
        >
            Maintenances
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
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  state: {
    fontSize: 16,
    color: 'gray',
  },
});
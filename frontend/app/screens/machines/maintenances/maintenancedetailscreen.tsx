import React, { useEffect, useState } from 'react';
import { View, Alert, StyleSheet } from 'react-native';
import { Box, Spinner, Button, VStack, HStack, Icon, Text } from 'native-base';
import { MaterialIcons } from '@expo/vector-icons';
import { RouteProp, useRoute } from '@react-navigation/native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import api from '../../../../config/api';

type RootStackParamList = {
  MaintenanceDetail: { maintenanceId: string };
};

type MaintenanceDetailRouteProp = RouteProp<RootStackParamList, 'MaintenanceDetail'>;

interface Maintenance {
    maintenanceId: string;
    machineId: string;
    maintenanceDate: string;
    description: string;
    alertId: string;
    performedBy: string;
    machine: {
      machineId: string;
      machineName: string;
      factoryId: string;
      state: string;
    };
    performedUser: {
        userId: string;
        userNumber: string;
        name: string;
        role: string;
      };
  }

export default function MaintenanceDetailScreen() {
  const route = useRoute<MaintenanceDetailRouteProp>();
  const { maintenanceId } = route.params;
  const [maintenance, setMaintenance] = useState<Maintenance | null>(null);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  useEffect(() => {
    api.get(`/maintenances/${maintenanceId}`)
      .then((response) => {
        setMaintenance(response.data.data);
      })
      .catch((error) => {
        console.error('Error loading maintenance details:', error);
        Alert.alert('Error', 'Unable to load maintenance details.');
      })
      .finally(() => setLoading(false));
  }, [maintenanceId]);

  if (loading) {
    return <Spinner color="blue.500" />;
  }

  if (!maintenance) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Maintenance not found.</Text>
      </View>
    );
  }

  return (
    <Box style={styles.container}>
      <VStack space={4}>
        <HStack justifyContent="space-between" alignItems="center">
            <Text style={styles.title}>{maintenance.machine.machineName}</Text>
            <Text style={styles.date}>{new Date(maintenance.maintenanceDate).toLocaleDateString()}</Text>
        </HStack>

        <HStack alignItems="center" space={2}>
            <Icon as={MaterialIcons} name="person" size="sm"/>
            <Text style={styles.label}>{maintenance.performedUser.name} ({maintenance.performedUser.role})</Text>
        </HStack>
      
        <HStack alignItems="center" space={2}>
            <Icon as={MaterialIcons} name="message" size="sm"/>
            <Text style={styles.label}>Description:</Text>
        </HStack>
        <Text style={styles.value}>{maintenance.description}</Text>

        <Button 
            colorScheme="darkBlue"
        >
            Associated Alert
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
});
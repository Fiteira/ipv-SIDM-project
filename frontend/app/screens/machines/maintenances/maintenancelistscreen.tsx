import React, { useEffect, useState } from 'react';
import { View, Alert, StyleSheet, TouchableOpacity } from 'react-native';
import { Box, FlatList, Icon, HStack, VStack, Spinner, Text } from 'native-base';
import { MaterialIcons } from '@expo/vector-icons';
import { RouteProp, useRoute, useNavigation, NavigationProp } from '@react-navigation/native';
import api from '../../../../config/api';
import { isNetworkAvailable } from '../../../../config/netinfo'; // Função para verificar conexão
import { getMaintenancesByMachineId, insertMaintenances } from '../../../../config/sqlite'; // Funções SQLite

type RootStackParamList = {
  MaintenanceList: { machineId: number };
  MaintenanceDetail: { maintenanceId: number };
};

type MaintenanceListRouteProp = RouteProp<RootStackParamList, 'MaintenanceList'>;

interface Maintenance {
  maintenanceId: number;
  machineId: number;
  maintenanceDate: string;
  description: string;
  alertId: number;
  performedBy: string;
  machine: {
    machineId: number;
    machineName: string;
    factoryId: number;
    state: string;
  } | null;
  performedUser: {
    userId: number;
    userNumber: number;
    name: string;
    role: string;
  } | null;
}

// Função para comparar arrays de objetos
const areMaintenancesEqual = (localData: Maintenance[], remoteData: Maintenance[]): boolean => {
  const sortFunction = (a: Maintenance, b: Maintenance) => a.maintenanceId - b.maintenanceId;
  const sortedLocalData = localData.slice().sort(sortFunction);
  const sortedRemoteData = remoteData.slice().sort(sortFunction);
  return JSON.stringify(sortedLocalData) === JSON.stringify(sortedRemoteData);
};

export default function MaintenanceListScreen() {
  const route = useRoute<MaintenanceListRouteProp>();
  const { machineId } = route.params;
  const [maintenances, setMaintenances] = useState<Maintenance[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  // Função para buscar manutenções do SQLite
  const fetchLocalMaintenances = async (): Promise<Maintenance[]> => {
    try {
      const localMaintenances = await getMaintenancesByMachineId(Number(machineId));
      setMaintenances(localMaintenances);
      return localMaintenances;
    } catch (error) {
      console.error('Error fetching local maintenances:', error);
      return [];
    }
  };

  // Função para buscar manutenções da API e sincronizar localmente
  const fetchRemoteMaintenances = async () => {
    try {
      console.log('Fetching remote maintenances...');
      const response = await api.get(`/maintenances/machine/${machineId}`);
      const serverMaintenances: Maintenance[] = response.data.data;

      console.log('Remote maintenances fetched:', serverMaintenances);

      // Obter dados locais atuais
      const localMaintenances = await getMaintenancesByMachineId(Number(machineId));

      // Verificar se os dados são diferentes antes de atualizar
      if (!areMaintenancesEqual(localMaintenances, serverMaintenances)) {
        console.log('Data changed, updating local database and state.');
        
        // Atualizar banco de dados local
        const formattedMaintenances = serverMaintenances.map((maintenance) => ({
          maintenanceId: maintenance.maintenanceId,
          machineId: maintenance.machineId,
          maintenanceDate: maintenance.maintenanceDate,
          description: maintenance.description,
          alertId: maintenance.alertId,
          performedBy: maintenance.performedBy ? parseInt(maintenance.performedBy) : null,
        }));
        await insertMaintenances(formattedMaintenances);

        // Atualizar estado
        setMaintenances(serverMaintenances);
      } else {
        console.log('Data is the same, no update needed.');
      }
    } catch (error) {
      console.error('Error fetching remote maintenances:', error);
      Alert.alert('Error', 'Unable to load maintenances from server.');
    }
  };

  // Função principal para buscar dados (Offline First)
  const fetchMaintenances = async () => {
    setRefreshing(true);

    try {
      const localData = await fetchLocalMaintenances(); // Prioriza dados locais

      const isConnected = await isNetworkAvailable();
      if (isConnected) {
        await fetchRemoteMaintenances(); // Busca dados do servidor se houver conexão
      } else if (localData.length === 0) {
        Alert.alert('No Data', 'No local data available and no network connection.');
      } else {
        console.warn('No network connection. Showing local data.');
      }
    } catch (error) {
      console.error('Error fetching maintenances:', error);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaintenances();
  }, [machineId]);

  const renderMaintenanceCard = ({ item }: { item: Maintenance }) => (
    <TouchableOpacity onPress={() => navigation.navigate('MaintenanceDetail', { maintenanceId: item.maintenanceId })}>
      <Box shadow={2} borderRadius="md" padding="4" marginBottom="4" bg="light.50">
        <HStack space={3} alignItems="center">
          <Icon as={MaterialIcons} name="build" size="lg" color="darkBlue.500" />
          <VStack flex={1}>
            <HStack justifyContent="space-between" alignItems="center">
              <Text bold fontSize="lg">{item.machine?.machineName || 'Unknown Machine'}</Text>
              <Text fontSize="xs" color="coolGray.500">
                {new Date(item.maintenanceDate).toLocaleDateString()}
              </Text>
            </HStack>
            <Text fontSize="xs" color="coolGray.500">{item.performedUser?.name || 'Unknown User'}</Text>
            <Text fontSize="md" color="coolGray.700" mt={1} numberOfLines={2}>{item.description}</Text>
          </VStack>
        </HStack>
      </Box>
    </TouchableOpacity>
  );

  if (loading) {
    return <Spinner color="blue.500" />;
  }

  if (maintenances.length === 0) {
    return (
      <View style={styles.container}>
        <Text fontSize="lg" color="coolGray.500" textAlign="center" mt={4}>
          No maintenances found.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={maintenances}
        renderItem={renderMaintenanceCard}
        keyExtractor={(item) => item.maintenanceId.toString()}
        contentContainerStyle={styles.listContainer}
        refreshing={refreshing}
        onRefresh={fetchMaintenances}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  listContainer: {
    paddingBottom: 16,
  },
});

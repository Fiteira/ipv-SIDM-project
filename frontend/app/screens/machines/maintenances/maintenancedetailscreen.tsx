import React, { useEffect, useState, useCallback } from 'react';
import { View, Alert, StyleSheet } from 'react-native';
import { Box, Spinner, Button, VStack, HStack, Icon, Text } from 'native-base';
import { MaterialIcons } from '@expo/vector-icons';
import { RouteProp, useRoute } from '@react-navigation/native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import api from '../../../../config/api';
import { isNetworkAvailable } from '../../../../config/netinfo'; // Verificar conexão
import { getMaintenanceById, insertMaintenances } from '../../../../config/sqlite'; // Funções SQLite
import { compareJSON } from '@/config/utils';

type RootStackParamList = {
  MaintenanceDetail: { maintenanceId: string };
  AlertDetail: { alertId: string };
};

type MaintenanceDetailRouteProp = RouteProp<RootStackParamList, 'MaintenanceDetail'>;

interface Maintenance {
  maintenanceId: number;
  machineId: number;
  maintenanceDate: string;
  description: string;
  alertId: number;
  performedBy: number | null;
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

// Tipo para representar os dados retornados pela API
interface MaintenanceAPI {
  maintenanceId: number;
  machineId: number;
  maintenanceDate: string;
  description: string;
  alertId: number;
  performedBy: string | null; // API retorna performedBy como string
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

// Função de comparação profunda
function deepEqual(a: any, b: any): boolean {
  if (a === b) {
    return true;
  }

  if (a == null || typeof a != 'object' || b == null || typeof b != 'object') {
    return false;
  }

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  // Verifica se ambos os objetos têm o mesmo número de propriedades
  if (keysA.length !== keysB.length) {
    return false;
  }

  // Verifica cada propriedade
  for (let key of keysA) {
    // Se a propriedade também existe em b
    if (!keysB.includes(key)) {
      return false;
    }

    // Chamada recursiva
    if (!deepEqual(a[key], b[key])) {
      return false;
    }
  }

  return true;
}

export default function MaintenanceDetailScreen() {
  const route = useRoute<MaintenanceDetailRouteProp>();
  const { maintenanceId } = route.params;
  const [maintenance, setMaintenance] = useState<Maintenance | null>(null);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  // Função para converter os dados da API para o tipo Maintenance
  const transformMaintenance = (data: MaintenanceAPI): Maintenance => ({
    ...data,
    performedBy: data.performedBy ? parseInt(data.performedBy, 10) : null, // Converte string para número
  });

  // Função principal para carregar os detalhes da manutenção (Offline First)
  const fetchMaintenanceDetails = useCallback(async () => {
    try {
      setLoading(true);
  
      // Obtém os dados locais
      console.log('Fetching local maintenance details...');
      const localMaintenanceData = await getMaintenanceById(parseInt(maintenanceId));
  
      let localMaintenance: Maintenance | null = null;
  
      if (localMaintenanceData) {
        localMaintenance = transformMaintenance(localMaintenanceData);
        setMaintenance(localMaintenance); // Atualiza o estado com os dados locais
      } else {
        console.warn('No local maintenance found.');
      }
  
      // Verifica conexão de rede
      const isConnected = await isNetworkAvailable();
      if (!isConnected) {
        console.warn('No network connection. Using local data.');
        setLoading(false);
        return;
      }
  
      // Busca os dados do servidor
      console.log('Fetching remote maintenance details...');
      const response = await api.get(`/maintenances/${maintenanceId}`);
      const serverMaintenance: MaintenanceAPI = response.data.data;
      const transformedServerMaintenance = transformMaintenance(serverMaintenance);
  
      // Compara os dados locais e remotos usando compareJSON
      if (
        !localMaintenance || // Se não há dados locais
        !compareJSON(localMaintenance, transformedServerMaintenance)
      ) {
        console.log('Maintenance data is different. Updating local database...');
        await insertMaintenances([transformedServerMaintenance]); // Atualiza o banco local
        setMaintenance(transformedServerMaintenance); // Atualiza o estado com os dados do servidor
      } else {
        console.log('Local and remote maintenance data are identical. No update required.');
        // Os dados locais já estão atualizados, não é necessário alterar o estado
      }
    } catch (error) {
      console.error('Error fetching maintenance details:', error);
      Alert.alert('Error', 'Unable to load maintenance details.');
    } finally {
      setLoading(false);
    }
  }, [maintenanceId]);

  // Chama a função de busca quando o componente é montado ou o maintenanceId muda
  useEffect(() => {
    fetchMaintenanceDetails();
  }, [fetchMaintenanceDetails]);

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
          <Text style={styles.title}>{maintenance.machine?.machineName || 'Unknown Machine'}</Text>
          <Text style={styles.date}>{new Date(maintenance.maintenanceDate).toLocaleDateString()}</Text>
        </HStack>

        <HStack alignItems="center" space={2}>
          <Icon as={MaterialIcons} name="person" size="sm" />
          <Text style={styles.label}>
            {maintenance.performedUser?.name || 'Unknown User'} ({maintenance.performedUser?.role || 'Unknown Role'})
          </Text>
        </HStack>

        <HStack alignItems="center" space={2}>
          <Icon as={MaterialIcons} name="message" size="sm" />
          <Text style={styles.label}>Description:</Text>
        </HStack>
        <Text style={styles.value}>{maintenance.description}</Text>

        <Button colorScheme="darkBlue" onPress={() => navigation.navigate('AlertDetail', { alertId: maintenance.alertId.toString() })}>
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

import React, { useEffect, useState } from 'react';
import { View, Alert, StyleSheet, TouchableOpacity } from 'react-native';
import { Box, FlatList, Icon, HStack, VStack, Spinner, Text } from 'native-base';
import { MaterialIcons } from '@expo/vector-icons';
import { RouteProp, useRoute, NavigationProp, useNavigation } from '@react-navigation/native';
import { isNetworkAvailable } from '../../../config/netinfo';
import { getAlertsByFactory, insertAlerts } from '../../../config/sqlite'; // SQLite functions
import api from '../../../config/api';
import { compareJSON } from '@/config/utils';

type RootStackParamList = {
  AlertList: { factoryId: string };
  AlertDetail: { alertId: string };
};

type AlertListRouteProp = RouteProp<RootStackParamList, 'AlertList'>;

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

export default function AlertListScreen() {
  const route = useRoute<AlertListRouteProp>();
  const { factoryId } = route.params;
  const [alerts, setAlerts] = useState<Alerta[]>([]);
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [isFetching, setIsFetching] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const limit = 10;

  // Função para remover duplicatas
  const removeDuplicates = (array: Alerta[]): Alerta[] => {
    const uniqueIds = new Set();
    return array.filter(alert => {
      if (uniqueIds.has(alert.alertId)) {
        return false;
      } else {
        uniqueIds.add(alert.alertId);
        return true;
      }
    });
  };

  function normalizeAlerts(alerts: Alerta[]): Alerta[] {
    return alerts
      .map(alert => ({
        ...alert,
        alertDate: new Date(alert.alertDate).toISOString(), // Garantir formato consistente para datas
        state: alert.state.trim().toLowerCase(), // Normalizar estado
        message: alert.message.trim(), // Remover espaços desnecessários em mensagens
        machine: alert.machine
          ? {
              machineId: alert.machine.machineId,
              machineName: alert.machine.machineName,
              state: alert.machine.state.trim().toLowerCase(),
              factoryId: alert.machine.factoryId,
            }
          : null,
        sensor: alert.sensor
          ? {
              sensorId: alert.sensor.sensorId,
              name: alert.sensor.name.trim(),
              sensorType: alert.sensor.sensorType.trim(),
            }
          : null,
      }))
      .sort((a, b) => a.alertId - b.alertId); // Ordenar por `alertId` para consistência
  }

  const fetchAlerts = async (isRefreshing = false) => {
    try {
      const isConnected = await isNetworkAvailable();
  
      if (isRefreshing) {
        setPage(1);
        setHasMore(true);
        setIsFetching(true);
      } else {
        setIsLoadingMore(true);
      }
  
      const currentPage = isRefreshing ? 1 : page;
      const localAlerts: Alerta[] = await getAlertsByFactory(factoryId, currentPage, limit);
  
      const normalizedLocalAlerts = normalizeAlerts(localAlerts);
  
      if (isRefreshing) {
        setAlerts(normalizedLocalAlerts);
      } else {
        setAlerts(prev => removeDuplicates([...prev, ...normalizedLocalAlerts]));
      }
      setHasMore(localAlerts.length === limit);
  
      if (!isConnected) {
        console.warn('Offline mode: Using local data.');
        return;
      }
  
      const response = await api.get(`/alerts/factory/${factoryId}`, {
        params: { page: currentPage, limit },
      });
  
      const serverAlerts: Alerta[] = response.data.data;
      const normalizedServerAlerts = normalizeAlerts(serverAlerts);
  
      // Comparar alertas normalizados
      const alertsToInsertOrUpdate = normalizedServerAlerts.filter(serverAlert => {
        const localAlert = normalizedLocalAlerts.find(alert => alert.alertId === serverAlert.alertId);
        return !localAlert || !compareJSON(localAlert, serverAlert);
      });
  
      if (alertsToInsertOrUpdate.length > 0) {
        await insertAlerts(alertsToInsertOrUpdate);
        console.log(`${alertsToInsertOrUpdate.length} alerts updated locally.`);
      }
  
      if (isRefreshing) {
        setAlerts(normalizedServerAlerts);
        setPage(2);
      } else {
        setAlerts(prev => removeDuplicates([...prev, ...normalizedServerAlerts]));
        setPage(prevPage => prevPage + 1);
      }
      setHasMore(serverAlerts.length === limit);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      if (alerts.length === 0) Alert.alert('Error', 'Unable to load alerts.');
    } finally {
      setIsFetching(false);
      setIsLoadingMore(false);
    }
  };
  

  useEffect(() => {
    fetchAlerts(true); // Load alerts on initial render
  }, [factoryId]);

  const renderAlertCard = ({ item }: { item: Alerta }) => {
    if (!item.machine) {
      console.warn(`Alerta com ID ${item.alertId} não possui máquina associada.`);
      return null;
    }

    return (
      <TouchableOpacity onPress={() => navigation.navigate('AlertDetail', { alertId: item.alertId.toString() })}>
        <Box shadow={2} borderRadius="md" padding="4" marginBottom="4" bg="light.50">
          <HStack space={3} alignItems="center">
            <Icon as={MaterialIcons} name="warning" size="2xl" color="red.600" />
            <VStack flex={1}>
              <HStack justifyContent="space-between" alignItems="center">
                <Text bold fontSize="lg">
                  {item.machine.machineName} ({item.sensor ? item.sensor.name : 'Unknown Sensor'})
                </Text>
                <Text fontSize="xs" color="coolGray.500">
                  {new Date(item.alertDate).toLocaleDateString()}
                </Text>
              </HStack>

              <HStack justifyContent="space-between" alignItems="center">
                <Text
                  fontSize="sm"
                  color={
                    item.severity === 'critical'
                      ? 'red.800'
                      : item.severity === 'high'
                      ? 'red.600'
                      : item.severity === 'medium'
                      ? 'yellow.600'
                      : 'green.600'
                  }
                  bold
                >
                  {item.severity.charAt(0).toUpperCase() + item.severity.slice(1)}
                </Text>
                <Text fontSize="xs" color="coolGray.500" italic mt={1}>
                  {item.state}
                </Text>
              </HStack>
              <Text fontSize="md" color="coolGray.700" mt={1} numberOfLines={2}>
                {item.message}
              </Text>
            </VStack>
          </HStack>
        </Box>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {isFetching && page === 1 ? (
        <Spinner color="blue.500" />
      ) : alerts.length === 0 ? (
        <Text fontSize="lg" color="coolGray.500" textAlign="center" mt={4}>
          No alerts found
        </Text>
      ) : (
        <FlatList
          data={alerts}
          renderItem={renderAlertCard}
          keyExtractor={(item, index) => `${item.alertId || index}`} // Use índice como fallback
          contentContainerStyle={styles.listContainer}
          refreshing={isFetching}
          onRefresh={() => fetchAlerts(true)}
          onEndReached={() => {
            if (hasMore && !isLoadingMore) fetchAlerts();
          }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={isLoadingMore && hasMore ? <Spinner color="blue.500" /> : null}
        />
      )}
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

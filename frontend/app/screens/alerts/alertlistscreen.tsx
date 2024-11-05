import React, { useEffect, useState } from 'react';
import { View, Alert, StyleSheet } from 'react-native';
import { Box, FlatList, Icon, HStack, VStack, Spinner, Text } from 'native-base';
import { MaterialIcons } from '@expo/vector-icons';
import { RouteProp, useRoute, NavigationProp, useNavigation } from '@react-navigation/native';
import api from '../../../config/api';

type RootStackParamList = {
  AlertList: { factoryId: string };
  AlertDetail: { alertId: string };
};

type AlertListRouteProp = RouteProp<RootStackParamList, 'AlertList'>;

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
  

export default function AlertListScreen() {
  const route = useRoute<AlertListRouteProp>();
  const { factoryId } = route.params;
  const [alerts, setAlerts] = useState<Alerta[]>([]);
  const [isFetching, setIsFetching] = useState(true); // Estado para carregamento inicial
  const [isLoadingMore, setIsLoadingMore] = useState(false); // Estado para carregamento adicional
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const limit = 10;

  const fetchAlerts = async (isRefreshing = false) => {
    if ((isFetching || isLoadingMore) && !isRefreshing) return; // Evita carregamento duplicado

    if (isRefreshing) {
      setPage(1);
      setHasMore(true);
    }

    const currentPage = isRefreshing ? 1 : page;

    try {
      if (isRefreshing) setIsFetching(true);
      else setIsLoadingMore(true);

      const response = await api.get(`/alerts/factory/${factoryId}`, {
        params: { page: currentPage, limit },
      });

      const newAlerts = response.data.data;
      setHasMore(newAlerts.length === limit); // Se menos de 'limit', não há mais dados

      if (isRefreshing) {
        setAlerts(newAlerts); // Sobrescreve se é uma atualização
      } else {
        setAlerts((prevAlerts) => [...prevAlerts, ...newAlerts]);
      }

      setPage((prevPage) => prevPage + 1); // Atualiza para próxima página
    } catch (error) {
      console.error('Error fetching alerts:', error);
      Alert.alert('Error', 'Unable to load alerts.');
    } finally {
      setIsFetching(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchAlerts(true); // Carregamento inicial
  }, [factoryId]);

  const renderAlertCard = ({ item }: { item: Alerta }) => (
    <TouchableOpacity onPress={() => navigation.navigate('AlertDetail', { alertId: item.alertId })}>
        <Box
        shadow={2}
        borderRadius="md"
        padding="4"
        marginBottom="4"
        bg="light.50"
        >
        <HStack space={3} alignItems="center">
            <Icon as={MaterialIcons} name="warning" size="2xl" color="darkBlue.500" />
            <VStack flex={1}>
                <HStack justifyContent="space-between" alignItems="center">
                    <Text bold fontSize="lg">
                    {item.machine.machineName} ({item.sensor.name})
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
                      {item.severity.charAt(0) + item.severity.slice(1)}
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

  return (
    <View style={styles.container}>
      {isFetching && page === 1 ? (
      <Spinner color="blue.500" />
      ) : alerts.length === 0 ? (
      <Text fontSize="lg" color="coolGray.500" textAlign="center" mt={4}>
        Do not exist alerts
      </Text>
      ) : (
      <FlatList
        data={alerts}
        renderItem={renderAlertCard}
        keyExtractor={(item) => item.alertId}
        contentContainerStyle={styles.listContainer}
        refreshing={isFetching}
        onRefresh={() => fetchAlerts(true)}
        onEndReached={() => {
        if (hasMore && !isLoadingMore) fetchAlerts();
        }}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
        isLoadingMore && hasMore ? <Spinner color="blue.500" /> : null
        }
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

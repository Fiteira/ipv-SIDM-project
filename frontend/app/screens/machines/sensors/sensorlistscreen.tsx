import React, { useEffect, useState, useCallback } from 'react';
import { View, Alert, StyleSheet, TouchableOpacity } from 'react-native';
import { Box, FlatList, Icon, HStack, VStack, Spinner, Text, Button } from 'native-base';
import { MaterialIcons } from '@expo/vector-icons';
import { RouteProp, useRoute, useFocusEffect, useNavigation, NavigationProp } from '@react-navigation/native';
import api from '../../../../config/api';
import { useContext } from 'react';
import { AuthContext } from '../../../AuthContext';
import { compareJSON } from '@/config/utils';
import { insertSensors, deleteSensorsById, getSensorsByMachineId } from '@/config/sqlite';

type RootStackParamList = {  
  SensorList: { machineId: string };
  SensorDetail: { sensorId: string };
  SensorCreate: { machineId: string };
};

type SensorListRouteProp = RouteProp<RootStackParamList, 'SensorList'>;

interface Sensor {
  sensorId: number;
  name: string;
  sensorType: string;
}

export default function SensorListScreen() {
  const route = useRoute<SensorListRouteProp>();
  const { machineId } = route.params;
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { userRole } = useContext(AuthContext);

  const fetchSensors = useCallback(async () => {
    try {
      setRefreshing(true);
  
      // Obter sensores locais do banco de dados
      const localSensors = await getSensorsByMachineId(Number(machineId));
      console.log('Local sensors:', localSensors);
  
      // Buscar sensores do servidor
      const response = await api.get(`/sensors/machine/${machineId}`);
      const serverSensors: Sensor[] = response.data.data;
  
      // Normalizar dados para comparação
      const normalizeSensor = (sensor: Sensor) => ({
        sensorId: sensor.sensorId,
        name: sensor.name.trim(),
        sensorType: sensor.sensorType.trim(),
      });
  
      const normalizedLocalSensors = localSensors.map(normalizeSensor);
      const normalizedServerSensors = serverSensors.map(normalizeSensor);
  
      // Identificar sensores para inserir ou atualizar
      const sensorsToInsertOrUpdate = serverSensors.filter(serverSensor => {
        const localSensor = normalizedLocalSensors.find(
          sensor => sensor.sensorId === serverSensor.sensorId
        );
        return !localSensor || !compareJSON(localSensor, normalizeSensor(serverSensor));
      });
  
      if (sensorsToInsertOrUpdate.length > 0) {
        await insertSensors(sensorsToInsertOrUpdate.map(sensor => ({
          ...sensor,
          machineId: Number(machineId),
          apiKey: '' // Replace with the actual API key
        })));
        console.log(`${sensorsToInsertOrUpdate.length} sensors synchronized.`);
      }
  
      // Identificar sensores para remover
      const serverSensorIds = new Set(serverSensors.map(sensor => sensor.sensorId));
      const sensorsToDelete = localSensors.filter(
        localSensor => !serverSensorIds.has(localSensor.sensorId)
      );
  
      if (sensorsToDelete.length > 0) {
        const sensorIdsToDelete = sensorsToDelete.map(sensor => sensor.sensorId);
        await deleteSensorsById(sensorIdsToDelete);
        console.log(`${sensorsToDelete.length} sensors deleted locally.`);
      }
  
      // Atualizar estado com os dados mais recentes
      setSensors(serverSensors);
    } catch (error) {
      console.error('Error fetching sensors:', error);
      Alert.alert('Error', 'Unable to load sensors.');
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, [machineId]);

  useFocusEffect(
    useCallback(() => {
      fetchSensors();
    }, [fetchSensors])
  );

  const renderSensorCard = ({ item }: { item: Sensor }) => (
    <TouchableOpacity onPress={() => navigation.navigate('SensorDetail', { sensorId: String(item.sensorId) })}>
      <Box
        shadow={2}
        borderRadius="md"
        padding="4"
        marginBottom="4"
        bg="light.50"
      >
        <HStack space={3} alignItems="center">
          <Icon as={MaterialIcons} name="sensors" size="lg" color="darkBlue.500" />
          <VStack>
            <Text bold fontSize="md">
              {item.name}
            </Text>
            <Text fontSize="sm" color="coolGray.600">
              {item.sensorType}
            </Text>
          </VStack>
        </HStack>
      </Box>
    </TouchableOpacity>
  );

  if (loading) {
    return <Spinner color="blue.500" />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={sensors}
        renderItem={renderSensorCard}
        keyExtractor={(item) => String(item.sensorId)}
        contentContainerStyle={styles.listContainer}
        refreshing={refreshing}
        onRefresh={fetchSensors}
        ListFooterComponent={
          <>
            {(userRole === 'admin' || userRole === 'adminSystem') && (
              <Button
                onPress={() => navigation.navigate('SensorCreate', { machineId })}
                size="sm"
                width="full"
                alignSelf="center"
                leftIcon={<Icon as={MaterialIcons} name="add" size="sm" color="white" />}
                colorScheme="blue"
              >
                Create Sensor
              </Button>
            )}
          </>
        }
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

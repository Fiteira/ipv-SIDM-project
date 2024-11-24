import React, { useEffect, useState, useCallback } from 'react';
import { View, Alert, StyleSheet, TouchableOpacity } from 'react-native';
import { Box, FlatList, Icon, HStack, VStack, Spinner, Text, Button } from 'native-base';
import { MaterialIcons } from '@expo/vector-icons';
import { RouteProp, useRoute, useFocusEffect, useNavigation, NavigationProp } from '@react-navigation/native';
import api from '../../../../config/api';

type RootStackParamList = {  
  SensorList: { machineId: string };
  SensorDetail: { sensorId: string };
  SensorCreate: { machineId: string };
};

type SensorListRouteProp = RouteProp<RootStackParamList, 'SensorList'>;

interface Sensor {
  sensorId: string;
  name: string;
  sensorType: string;
}

// Deep equality function
function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;

  if (typeof a !== 'object' || a === null || typeof b !== 'object' || b === null) return false;

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) return false;

  for (let key of keysA) {
    if (!keysB.includes(key) || !deepEqual(a[key], b[key])) return false;
  }

  return true;
}

export default function SensorListScreen() {
  const route = useRoute<SensorListRouteProp>();
  const { machineId } = route.params;
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const fetchSensors = useCallback(() => {
    setRefreshing(true);
    api.get(`/sensors/machine/${machineId}`)
      .then((response) => {
        const fetchedSensors: Sensor[] = response.data.data;

        // Compare the new data with the current state
        if (!deepEqual(sensors, fetchedSensors)) {
          console.log('Sensors data has changed. Updating state.');
          setSensors(fetchedSensors);
        } else {
          console.log('Sensors data is the same. No state update needed.');
        }
      })
      .catch((error) => {
        console.error('Error fetching sensors:', error);
        Alert.alert('Error', 'Unable to load sensors.');
      })
      .finally(() => {
        setRefreshing(false);
        setLoading(false);
      });
  }, [machineId, sensors]);

  useFocusEffect(
    useCallback(() => {
      fetchSensors();
    }, [fetchSensors])
  );

  const renderSensorCard = ({ item }: { item: Sensor }) => (
    <TouchableOpacity onPress={() => navigation.navigate('SensorDetail', { sensorId: item.sensorId })}>
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
        keyExtractor={(item) => item.sensorId}
        contentContainerStyle={styles.listContainer}
        refreshing={refreshing}
        onRefresh={fetchSensors}
        ListFooterComponent={
          <Button
            onPress={() => navigation.navigate('SensorCreate', { machineId })}
            leftIcon={<Icon as={MaterialIcons} name="add" size="sm" color="white" />}
            colorScheme="blue"
            marginTop="4"
            borderRadius="md"
          >
            Create Sensor
          </Button>
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

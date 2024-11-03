import React, { useEffect, useState } from 'react';
import { View, Alert, StyleSheet, TouchableOpacity } from 'react-native';
import { Box, FlatList, Icon, HStack, VStack, Spinner, Text } from 'native-base';
import { MaterialIcons } from '@expo/vector-icons';
import { RouteProp, useRoute, useNavigation, NavigationProp } from '@react-navigation/native';
import api from '../../../../config/api';

type RootStackParamList = {
  SensorList: { machineId: string };
  SensorDetail: { sensorId: string };
};

type SensorListRouteProp = RouteProp<RootStackParamList, 'SensorList'>;

interface Sensor {
  sensorId: string;
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

  const fetchSensors = () => {
    setRefreshing(true);
    api.get(`/sensors/machine/${machineId}`)
      .then((response) => {
        setSensors(response.data.data);
      })
      .catch((error) => {
        console.error('Erro ao carregar os sensores:', error);
        Alert.alert('Erro', 'Não foi possível carregar os sensores.');
      })
      .finally(() => {
        setRefreshing(false);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchSensors();
  }, [machineId]);

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
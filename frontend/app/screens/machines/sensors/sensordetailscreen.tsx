import React, { useEffect, useState } from 'react';
import { View, Text, Alert, StyleSheet, Dimensions } from 'react-native';
import { Box, Spinner, Button, VStack } from 'native-base';
import { RouteProp, useRoute } from '@react-navigation/native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { LineChart } from 'react-native-chart-kit';
import api from '../../../../config/api';

type RootStackParamList = {
  SensorDetail: { sensorId: string };
};

type SensorDetailRouteProp = RouteProp<RootStackParamList, 'SensorDetail'>;

interface Sensor {
  sensorId: string;
  name: string;
  sensorType: string;
}

export default function SensorDetailScreen() {
  const route = useRoute<SensorDetailRouteProp>();
  const { sensorId } = route.params;
  const [sensor, setSensor] = useState<Sensor | null>(null);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  useEffect(() => {
    api.get(`/sensors/${sensorId}`)
      .then((response) => {
        setSensor(response.data.data);
      })
      .catch((error) => {
        console.error('Erro ao carregar os detalhes do sensor:', error);
        Alert.alert('Erro', 'Não foi possível carregar os detalhes do sensor.');
      })
      .finally(() => setLoading(false));
  }, [sensorId]);

  if (loading) {
    return <Spinner color="blue.500" />;
  }

  if (!sensor) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Sensor não encontrado.</Text>
      </View>
    );
  }

  return (
    <Box style={styles.container}>
      <Text style={styles.title}>{sensor.name}</Text>
      <Text style={styles.state}>Type: {sensor.sensorType}</Text>

      {/* Gráfico de Linhas Exemplo */}
      <LineChart
        data={{
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          datasets: [
            {
              data: [50, 10, 40, 95, 85, 55],
            },
          ],
        }}
        width={Dimensions.get('window').width - 32} // largura do gráfico
        height={220}
        yAxisLabel=""
        yAxisSuffix="°C"
        chartConfig={{
          backgroundColor: '#1E2923',
          backgroundGradientFrom: '#08130D',
          backgroundGradientTo: '#1F8A70',
          decimalPlaces: 1,
          color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
          style: {
            borderRadius: 16,
          },
        }}
        style={{
          marginVertical: 8,
          borderRadius: 16,
        }}
      />
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
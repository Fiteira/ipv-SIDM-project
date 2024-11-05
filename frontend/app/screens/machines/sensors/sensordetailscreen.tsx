import React, { useEffect, useState } from 'react';
import { View, Text, Alert, StyleSheet, Dimensions, FlatList } from 'react-native';
import { Box, Spinner } from 'native-base';
import { RouteProp, useRoute } from '@react-navigation/native';
import { LineChart } from 'react-native-chart-kit';
import api from '../../../../config/api';
import io from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

type RootStackParamList = {
  SensorDetail: { sensorId: string };
};

type SensorDetailRouteProp = RouteProp<RootStackParamList, 'SensorDetail'>;

interface Sensor {
  sensorId: string;
  name: string;
  sensorType: string;
}

interface SensorData {
  timestamp: string;
  columns: string[];
  values: number[];
}

export default function SensorDetailScreen() {
  const route = useRoute<SensorDetailRouteProp>();
  const { sensorId } = route.params;
  const [sensor, setSensor] = useState<Sensor | null>(null);
  const [loading, setLoading] = useState(true);
  const [dataPoints, setDataPoints] = useState<SensorData[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserRole = async () => {
      const userString = await AsyncStorage.getItem('user');
      if (userString) {
        const user = JSON.parse(userString);
        setUserRole(user.role);
      }
    };

    fetchUserRole();

    const fetchSensorData = async () => {
      try {
        const response = await api.get(`/sensors/${sensorId}`);
        setSensor(response.data.data);
      } catch (error) {
        Alert.alert('Error', 'Failed to get sensor details.');
      } finally {
        setLoading(false);
      }
    };

    fetchSensorData();

    const connectSocket = async () => {
      try {
        const apiUrl = process.env.EXPO_PUBLIC_API_URL ? process.env.EXPO_PUBLIC_API_URL.replace(/\/api$/, '') : '';
        const token = await AsyncStorage.getItem('token');

        if (!token) {
          console.error("Token not found in AsyncStorage.");
          return;
        }

        const socket = io(apiUrl, { auth: { token }, transports: ["websocket"] });

        socket.on("connect", () => {
          if (userRole === 'adminSystem') {
            Alert.alert("ALERT", 'System admin connected, no sensor data will be received.');
          }
          socket.emit("join_sensor", sensorId);
        });

        socket.on("sensor_data", (data) => {
          const { timestamp, value } = data;
          const { columns, values } = value;
        
          setDataPoints((prevData) => {
            // Verifica se o novo ponto de dados é idêntico ao último ponto armazenado
            const isDuplicate = prevData.length > 0 && 
                                prevData[prevData.length - 1].timestamp === timestamp && 
                                JSON.stringify(prevData[prevData.length - 1].values) === JSON.stringify(values);
        
            if (isDuplicate) {
              return prevData; // Retorna o estado anterior sem adicionar o ponto duplicado
            }
        
            const newDataPoints = [...prevData.slice(-4), { timestamp, columns, values }];
            return newDataPoints;
          });
        });

        socket.on("connect_error", () => {
          Alert.alert('Error', 'Failed getting real-time data from the sensor.');
          console.error("Socket connection error.");
        });

        return () => {
          socket.disconnect();
          console.log("Socket disconnected.");
        };
      } catch (error) {
        Alert.alert('Error', 'Failed connecting to the real-time data server.');
        
      }
    };

    connectSocket();
  }, [sensorId, userRole]);

  if (loading) {
    return <Spinner color="blue.500" />;
  }

  if (!sensor) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Sensor not found</Text>
      </View>
    );
  }

  const chartConfigs = [
    { label: 'Air Temperature', unit: 'K', index: 0 },
    { label: 'Process Temperature', unit: 'K', index: 1 },
    { label: 'Rotational Speed', unit: 'rpm', index: 2 },
    { label: 'Torque', unit: 'Nm', index: 3 },
    { label: 'Tool Wear', unit: 'min', index: 4 },
  ];

  return (
    <FlatList
      style={styles.scrollContainer}
      data={dataPoints}
      keyExtractor={(item, index) => index.toString()}
      ListHeaderComponent={() => (
        <Box style={styles.container}>
          <Text style={styles.title}>{sensor.name}</Text>
          <Text style={styles.state}>Type: {sensor.sensorType}</Text>

          {dataPoints.length > 0 ? (
            chartConfigs.map((config, configIndex) => (
              <View key={configIndex} style={styles.chartContainer}>
                <Text style={styles.chartTitle}>{config.label} ({config.unit})</Text>
                <LineChart
                  data={{
                    labels: dataPoints.map((point) => new Date(point.timestamp).toLocaleTimeString()),
                    datasets: [
                      {
                        data: dataPoints.map(point => point.values[config.index]),
                      },
                    ],
                  }}
                  width={Dimensions.get('window').width - 32}
                  height={220}
                  yAxisSuffix={` ${config.unit}`}
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
              </View>
            ))
          ) : (
            <Text style={styles.noDataText}>Waiting for real-time sensor data to display charts.</Text>
          )}
        </Box>
      )}
      renderItem={({ item }) => (
        <View style={styles.listItem}>
          <Text style={styles.listItemText}>Timestamp: {new Date(item.timestamp).toLocaleTimeString()}</Text>
          {item.columns.map((column, index) => (
            <Text key={index} style={styles.listItemText}>
              {column}: {item.values[index]}
            </Text>
          ))}
        </View>
      )}
      ListEmptyComponent={<Text style={styles.placeholderText}>No data available</Text>}
    />
  );
}

const styles = StyleSheet.create({
  scrollContainer: { flex: 1 },
  container: { flex: 1, padding: 16 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  state: { fontSize: 16, color: 'gray' },
  listTitle: { fontSize: 18, fontWeight: 'bold', marginVertical: 10 },
  listItem: { padding: 10, borderBottomWidth: 1, borderBottomColor: '#ddd' },
  listItemText: { fontSize: 16 },
  placeholderText: { fontSize: 16, color: 'gray', textAlign: 'center', marginTop: 10 },
  chartContainer: { marginBottom: 20 },
  chartTitle: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 5 },
  noDataText: { fontSize: 16, color: 'gray', textAlign: 'center', marginTop: 10 },
});

import React, { useEffect, useState } from 'react';
import { View, Text, Alert, StyleSheet, Dimensions, FlatList } from 'react-native';
import { Box, Spinner } from 'native-base';
import { RouteProp, useRoute } from '@react-navigation/native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
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
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

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
        console.log('Fetching sensor details...');
        const response = await api.get(`/sensors/${sensorId}`);
        setSensor(response.data.data);
        console.log('Sensor details loaded:', response.data.data);
      } catch (error) {
        console.error('Error getting sensor details:', error);
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

        console.log("Connecting to WebSocket server...");
        const socket = io(apiUrl, { auth: { token }, transports: ["websocket"] });

        socket.on("connect", () => {
          console.log("Connected to WebSocket server.");
          // If the user is an admin, show an alert
          if (userRole === 'adminSystem') {
            Alert.alert("ALERT", 'The system administrator is connected to the websocket, but has no factories associated, so it will not receive sensor data.');
          }
        });

        socket.on("sensor_data", (data) => {
          const { columns, values } = data.value;
          const newData = { timestamp: new Date().toLocaleTimeString(), columns, values };
          setDataPoints((prevData) => [...prevData.slice(-5), newData]);
        });

        socket.on("connect_error", (error) => {
          console.error("Error connecting with the websocket:", error);
          Alert.alert('Error', 'Failed getting real-time data from the sensor.');
        });

        return () => {
          console.log("Disconnecting from WebSocket server...");
          socket.disconnect();
        };
      } catch (error) {
        console.error("Error connecting to WebSocket server", error);
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

  return (
    <Box style={styles.container}>
      <Text style={styles.title}>{sensor.name}</Text>
      <Text style={styles.state}>Type: {sensor.sensorType}</Text>

      {/* Gráfico de Linhas */}
      {sensor ? (
        <LineChart
          data={{
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [
              {
                data: [50, 10, 40, 95, 85, 55],
              },
            ],
          }}
          width={Dimensions.get('window').width - 32}
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
      ) : (
        <Text style={styles.placeholderText}>Waiting for sensor's real-time data</Text>
      )}

      {/* Lista de Dados do Sensor em Tempo Real */}
      <Text style={styles.listTitle}>Real-time data</Text>
      <FlatList
        data={dataPoints}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <View style={styles.listItem}>
            <Text style={styles.listItemText}>Timestamp: {item.timestamp}</Text>
            {item.columns.map((column, index) => (
              <Text key={index} style={styles.listItemText}>
                {column}: {item.values[index]}
              </Text>
            ))}
          </View>
        )}
        ListEmptyComponent={<Text style={styles.placeholderText}>No data available</Text>}
      />
    </Box>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  state: { fontSize: 16, color: 'gray' },
  listTitle: { fontSize: 18, fontWeight: 'bold', marginVertical: 10 },
  listItem: { padding: 10, borderBottomWidth: 1, borderBottomColor: '#ddd' },
  listItemText: { fontSize: 16 },
  placeholderText: { fontSize: 16, color: 'gray', textAlign: 'center', marginTop: 10 },
});

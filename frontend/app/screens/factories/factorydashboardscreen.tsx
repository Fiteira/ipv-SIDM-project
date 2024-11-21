import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Box, Spinner } from 'native-base';
import { LineChart } from 'react-native-chart-kit';
import io, { Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import api from '../../../config/api';
import { isNetworkAvailable } from '@/config/netinfo';

interface SensorData {
  machineId: string;
  timestamp: string;
  columns: string[];
  values: number[];
}

interface SensorDataset {
  [sensorId: string]: SensorData[];
}

interface MachineData {
  machineId: string;
  machineName: string;
  state: string;
  alerts: number;
}

export default function SensorDashboardScreen() {
  const [sensorData, setSensorData] = useState<SensorDataset>({});
  const [machines, setMachines] = useState<MachineData[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSensors, setExpandedSensors] = useState<{ [sensorId: string]: boolean }>({});
  const socketRef = useRef<Socket | null>(null);
  const navigation = useNavigation();

  const toggleSensorExpansion = (sensorId: string) => {
    setExpandedSensors((prev) => ({ ...prev, [sensorId]: !prev[sensorId] }));
  };

  useEffect(() => {
    const fetchMachineData = async () => {
      try {
        const factoryId = await AsyncStorage.getItem("factoryId");
        if (!factoryId) {
          Alert.alert('Error', 'Factory ID not found in storage.');
          return;
        }

        const response = await api.get(`/machines/factory/${factoryId}`);
        const machineData = await Promise.all(
          response.data.data.map(async (machine: any) => {
            const alertResponse = await api.get(`/alerts/machine/${machine.machineId}`);
            const newAlerts = alertResponse.data.data.filter((alert: any) => alert.state === 'awaiting analysis').length;
            return {
              machineId: machine.machineId,
              machineName: machine.machineName,
              state: machine.state,
              alerts: newAlerts,
            };
          })
        );
        setMachines(machineData);
      } catch (error) {
        Alert.alert('Error', 'Failed to fetch machine data.');
      }
    };

    fetchMachineData();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      const connectSocket = async () => {
        const isConnected = await isNetworkAvailable();

        if (!isConnected) {
          Alert.alert('No Internet Connection', 'Internet connection is mandatory for accessing the dashboard! Check your connection and try again.', [
            { text: 'OK', onPress: () => navigation.goBack() },
          ]);
          return;
        }

        const apiUrl = process.env.EXPO_PUBLIC_API_URL ? process.env.EXPO_PUBLIC_API_URL.replace(/\/api$/, '') : '';
        const token = await AsyncStorage.getItem('token');

        if (!token) {
          console.error("Token not found in AsyncStorage.");
          return;
        }

        const socket = io(apiUrl, { auth: { token }, transports: ["websocket"] });
        socketRef.current = socket;

        socket.on("connect", () => {
          console.log("Socket connected.");
          setLoading(false);
        });

        socket.on("sensor_data", (data) => {
          const { machineId, sensorId, timestamp, value } = data;
          const { columns, values } = value;

          setSensorData((prevData) => {
            const sensorDataForId = prevData[sensorId] || [];
            const isDuplicate = sensorDataForId.length > 0 &&
                                sensorDataForId[sensorDataForId.length - 1].timestamp === timestamp &&
                                JSON.stringify(sensorDataForId[sensorDataForId.length - 1].values) === JSON.stringify(values);

            if (isDuplicate) {
              return prevData;
            }

            const newDataForSensor = [...sensorDataForId.slice(-4), { machineId, timestamp, columns, values }];
            return { ...prevData, [sensorId]: newDataForSensor };
          });
        });

        socket.on("connect_error", (message) => {
          Alert.alert('Error', message.toString() || 'Failed connecting to the real-time data server.');
          console.error("Socket connection error.");
        });
      };

      connectSocket();

      return () => {
        if (socketRef.current) {
          socketRef.current.disconnect();
          console.log("Socket disconnected.");
          socketRef.current = null;
        }
      };
    }, [])
  );

  if (loading) {
    return <Spinner color="blue.500" />;
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Real-Time Machine Dashboard</Text>
      {machines.map((machine) => (
        <Box key={machine.machineId} style={styles.machineContainer}>
          <Text style={styles.machineTitle}>{machine.machineName}</Text>
          <Text style={styles.machineInfo}>State: {machine.state}</Text>
          <Text style={styles.machineInfo}>New Alerts: {machine.alerts}</Text>

          {Object.keys(sensorData).filter(sensorId => sensorData[sensorId][0]?.machineId === machine.machineId).map((sensorId) => (
            <Box key={sensorId} style={styles.sensorContainer}>
              <TouchableOpacity onPress={() => toggleSensorExpansion(sensorId)}>
                <Text style={styles.sensorTitle}>Sensor ID: {sensorId} {expandedSensors[sensorId] ? '▲' : '▼'}</Text>
              </TouchableOpacity>

              {expandedSensors[sensorId] && sensorData[sensorId][0]?.columns.map((column, columnIndex) => (
                <View key={columnIndex} style={styles.chartContainer}>
                  <Text style={styles.chartTitle}>{column}</Text>
                  {sensorData[sensorId].length > 0 ? (
                    <LineChart
                      data={{
                        labels: sensorData[sensorId].map((point) => new Date(point.timestamp).toLocaleTimeString()),
                        datasets: [
                          {
                            data: sensorData[sensorId].map((point) => point.values[columnIndex]),
                          },
                        ],
                      }}
                      width={Dimensions.get('window').width - 32}
                      height={220}
                      yAxisSuffix=""
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
                    <Text style={styles.noDataText}>Sem dados</Text>
                  )}
                </View>
              ))}
            </Box>
          ))}
        </Box>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  machineContainer: { marginBottom: 20, padding: 10, backgroundColor: '#f0f0f0', borderRadius: 8 },
  machineTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
  machineInfo: { fontSize: 14, color: 'gray', marginBottom: 3 },
  sensorContainer: { marginTop: 10, padding: 8, backgroundColor: '#f5f5f5', borderRadius: 8 },
  sensorTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 5 },
  chartContainer: { marginBottom: 20 },
  chartTitle: { fontSize: 14, fontWeight: 'bold', textAlign: 'center', marginBottom: 5 },
  noDataText: { textAlign: 'center', color: 'gray', fontSize: 16, marginTop: 20 },
});

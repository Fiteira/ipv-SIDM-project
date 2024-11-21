import React, { useEffect, useState, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { View, Text, Alert, StyleSheet, TextInput, Dimensions } from 'react-native';
import { Box, Spinner, Button, VStack, Modal, Icon } from 'native-base';
import { MaterialIcons } from '@expo/vector-icons';
import { RouteProp, useRoute } from '@react-navigation/native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { LineChart } from 'react-native-chart-kit';
import api from '../../../../config/api';
import { isNetworkAvailable } from '../../../../config/netinfo';
import io, { Socket } from 'socket.io-client';
import { DefaultEventsMap } from '@socket.io/component-emitter';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSensorById, insertSensors } from '../../../../config/sqlite'


type RootStackParamList = {
  SensorDetail: { sensorId: string };
  SensorList: { machineId: string };
};

type SensorDetailRouteProp = RouteProp<RootStackParamList, 'SensorDetail'>;

interface Sensor {
  sensorId: string;
  name: string;
  sensorType: string;
  machineId: number,
  apiKey: string
}

interface SensorData {
  timestamp: string;
  columns: string[];
  values: number[];
}

// Deep comparison function
function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;

  if (typeof a !== 'object' || a === null || typeof b !== 'object' || b === null) return false;

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  // If the number of properties is different, the objects are not equal
  if (keysA.length !== keysB.length) return false;

  for (let key of keysA) {
    // If the value of the same key is not equal, the objects are not equal
    if (!keysB.includes(key) || !deepEqual(a[key], b[key])) return false;
  }

  return true;
}

export default function SensorDetailScreen() {
  const route = useRoute<SensorDetailRouteProp>();
  const { sensorId } = route.params;
  const [sensor, setSensor] = useState<Sensor | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmDeleteModalVisible, setConfirmDeleteModalVisible] = useState(false);
  const [inputSensorName, setInputSensorName] = useState('');
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [dataPoints, setDataPoints] = useState<SensorData[]>([]);
  const socketRef = useRef<Socket<DefaultEventsMap, DefaultEventsMap> | null>(null);


  
  useFocusEffect(
    useCallback(() => {

      // Função para conectar o socket
      const connectSocket = async () => {
        const isConnected = await isNetworkAvailable();
        if (!isConnected) {
          console.warn('Offline mode: Unable to connect to real-time data server.');
          Alert.alert('Error', 'No internet connection available. Some features may not work.');
          return;
        }
        const apiUrl = process.env.EXPO_PUBLIC_API_URL ? process.env.EXPO_PUBLIC_API_URL.replace(/\/api$/, '') : '';
        const token = await AsyncStorage.getItem('token');

        if (!token) {
          console.error("Token not found in AsyncStorage.");
          Alert.alert('Error', 'Failed to connect to the real-time data server.');
          return;
        }

        // Evitar múltiplas conexões
        if (socketRef.current) {
          console.log("Socket already connected.");
          return;
        }

        // Inicializa a conexão do socket
        const socket = io(apiUrl, { auth: { token }, transports: ["websocket"] });
        socketRef.current = socket;

        socket.on("connect", () => {
          console.log("Socket connected.");
          socket.emit("join_sensor", sensorId);
        });

        socket.on("sensor_data", (data) => {
          const { timestamp, value } = data;
          const { columns, values } = value;

          setDataPoints((prevData) => {
            const isDuplicate = prevData.length > 0 &&
                                prevData[prevData.length - 1].timestamp === timestamp &&
                                JSON.stringify(prevData[prevData.length - 1].values) === JSON.stringify(values);

            if (isDuplicate) {
              return prevData;
            }

            const newDataPoints = [...prevData.slice(-4), { timestamp, columns, values }];
            return newDataPoints;
          });
        });

        socket.on("connect_error", (message) => {
          Alert.alert('Error', message.toString() || 'Failed connecting to the real-time data server.');
          console.error("Socket connection error.");
        });

        socket.on("unauthorized", (message) => {
          Alert.alert('Error', message);
          console.error("Socket unauthorized.");
        });
      };

      connectSocket();

      // Função de limpeza para desconectar o socket ao sair da tela
      return () => {
        if (socketRef.current) {
          socketRef.current.disconnect();
          console.log("Socket disconnected.");
          socketRef.current = null; // Reseta o ref após desconectar
        }
      };
    }, [sensorId])
  );

  // Function to fetch sensor data from the API
  const fetchSensorData = async () => {
    try {
      setLoading(true);

      // Fetch local sensor data
      console.log('Fetching local sensor data...');
      const localSensorData = await getSensorById(sensorId);

      if (localSensorData) {
        console.log('Local sensor data found:', localSensorData);
        setSensor(localSensorData); // Update state with local data
      } else {
        console.warn('No local sensor data found.');
      }

      // Fetch sensor data from API
      console.log('Fetching sensor data from API...');
      const response = await api.get(`/sensors/${sensorId}`);
      const fetchedSensor: Sensor = response.data.data;

      console.log('Fetched sensor from API:', fetchedSensor);

      // Compare local data with API data
      if (!localSensorData || !deepEqual(localSensorData, fetchedSensor)) {
        console.log('Sensor data has changed. Updating local storage and state.');

        // Update local storage
        await insertSensors([{ ...fetchedSensor, sensorId: Number(fetchedSensor.sensorId) }]);

        // Update state with new data
        setSensor(fetchedSensor);
      } else {
        console.log('Sensor data is the same. No update needed.');
      }
    } catch (error) {
      console.error('Error fetching sensor data:', error);
      Alert.alert('Error', 'Failed to fetch sensor details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSensorData();
  }, [sensorId]);

  const handleDelete = async () => {
    if (inputSensorName === sensor?.name) {
      setConfirmDeleteModalVisible(false);
      try {
        await api.delete(`/sensors/${sensorId}`);
        Alert.alert('Success', 'Sensor deleted successfully');
        navigation.goBack(); // Go back to the sensor list after deletion
      } catch (error) {
        console.error('Error deleting sensor:', error);
        Alert.alert('Error', 'Failed to delete sensor. Please try again later.');
      }
    } else {
      setErrorModalVisible(true);
    }
  };

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
    <Box style={styles.container}>
      {/* Header with Name, Type, and Delete Button */}
      <View style={styles.headerRow}>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{sensor.name}</Text>
          <Text style={styles.state}>Type: {sensor.sensorType}</Text>
        </View>
        <Button
          colorScheme="red"
          size="sm"
          leftIcon={<Icon as={MaterialIcons} name="delete" size="sm" />}
          onPress={() => setShowDeleteModal(true)}
          style={styles.deleteButton}
        >
          Delete
        </Button>
      </View>

      {/* Sensor Charts and Data */}
      {dataPoints.length > 0 ? (
        chartConfigs.map((config, configIndex) => (
          <View key={configIndex} style={styles.chartContainer}>
            <Text style={styles.chartTitle}>
              {config.label} ({config.unit})
            </Text>
            <LineChart
              data={{
                labels: dataPoints.map((point) => new Date(point.timestamp).toLocaleTimeString()),
                datasets: [
                  {
                    data: dataPoints.map((point) => point.values[config.index]),
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

      {/* Delete Confirmation Modal */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
        <Modal.Content>
          <Modal.Header>Confirm Deletion</Modal.Header>
          <Modal.Body>
            You are about to delete the sensor "{sensor.name}". Do you want to continue?
          </Modal.Body>
          <Modal.Footer>
            <Button.Group space={2}>
              <Button variant="unstyled" onPress={() => setShowDeleteModal(false)}>
                Cancel
              </Button>
              <Button
                colorScheme="red"
                onPress={() => {
                  setShowDeleteModal(false);
                  setConfirmDeleteModalVisible(true);
                }}
              >
                Yes
              </Button>
            </Button.Group>
          </Modal.Footer>
        </Modal.Content>
      </Modal>

      {/* Final Confirmation Modal with Name */}
      <Modal isOpen={confirmDeleteModalVisible} onClose={() => setConfirmDeleteModalVisible(false)}>
        <Modal.Content>
          <Modal.Header>Confirm Deletion</Modal.Header>
          <Modal.Body>To confirm deletion, type the sensor name:</Modal.Body>
          <TextInput
            style={styles.input}
            placeholder="Type the sensor name"
            value={inputSensorName}
            onChangeText={setInputSensorName}
          />
          <Modal.Footer>
            <Button.Group space={2}>
              <Button colorScheme="red" onPress={handleDelete}>
                Confirm Deletion
              </Button>
              <Button onPress={() => setConfirmDeleteModalVisible(false)} colorScheme="coolGray">
                Cancel
              </Button>
            </Button.Group>
          </Modal.Footer>
        </Modal.Content>
      </Modal>

      {/* Error Modal for Incorrect Name */}
      <Modal isOpen={errorModalVisible} onClose={() => setErrorModalVisible(false)}>
        <Modal.Content>
          <Modal.Body>The sensor name is incorrect. Please try again.</Modal.Body>
          <Modal.Footer>
            <Button colorScheme="coolGray" onPress={() => setErrorModalVisible(false)}>
              Close
            </Button>
          </Modal.Footer>
        </Modal.Content>
      </Modal>
    </Box>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  state: {
    fontSize: 16,
    color: 'gray',
  },
  deleteButton: {
    marginLeft: 8,
  },
  chartContainer: {
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
  },
  noDataText: {
    fontSize: 16,
    color: 'gray',
    textAlign: 'center',
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: 'gray',
    width: '100%',
    padding: 10,
    marginVertical: 10,
    borderRadius: 5,
    fontSize: 16,
  },
});

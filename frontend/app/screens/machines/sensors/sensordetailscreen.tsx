import React, { useEffect, useState } from 'react';
import { View, Text, Alert, StyleSheet, TextInput, Dimensions } from 'react-native';
import { Box, Spinner, Button, VStack, Modal, Icon } from 'native-base';
import { MaterialIcons } from '@expo/vector-icons';
import { RouteProp, useRoute } from '@react-navigation/native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { LineChart } from 'react-native-chart-kit';
import api from '../../../../config/api';

type RootStackParamList = {
  SensorDetail: { sensorId: string };
  SensorList: { machineId: string };
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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmDeleteModalVisible, setConfirmDeleteModalVisible] = useState(false);
  const [inputSensorName, setInputSensorName] = useState('');
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [dataPoints, setDataPoints] = useState<SensorData[]>([]);

  useEffect(() => {
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
  }, [sensorId]);

  const handleDelete = async () => {
    if (inputSensorName === sensor?.name) {
      setConfirmDeleteModalVisible(false);
      try {
        await api.delete(`/sensors/${sensorId}`);
        Alert.alert('Success', 'Sensor deleted successfully');
        navigation.goBack(); // Retorna para a lista de sensores após exclusão
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
      {/* Header com Nome, Tipo e Botão de Exclusão */}
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

      {/* Gráficos e Dados do Sensor */}
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

      {/* Modal de Confirmação de Exclusão */}
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
              <Button colorScheme="red" onPress={() => { setShowDeleteModal(false); setConfirmDeleteModalVisible(true); }}>
                Yes
              </Button>
            </Button.Group>
          </Modal.Footer>
        </Modal.Content>
      </Modal>

      {/* Modal de Confirmação Final com Nome */}
      <Modal isOpen={confirmDeleteModalVisible} onClose={() => setConfirmDeleteModalVisible(false)}>
        <Modal.Content>
          <Modal.Header>Confirm Deletion</Modal.Header>
          <Modal.Body>
            To confirm deletion, type the sensor name:
          </Modal.Body>
          <TextInput
            style={styles.input}
            placeholder="Enter sensor name"
            value={inputSensorName}
            onChangeText={setInputSensorName}
          />
          <Modal.Footer>
            <Button.Group space={2}>
              <Button colorScheme="red" onPress={handleDelete}>
                Confirm Delete
              </Button>
              <Button onPress={() => setConfirmDeleteModalVisible(false)} colorScheme="coolGray">
                Cancel
              </Button>
            </Button.Group>
          </Modal.Footer>
        </Modal.Content>
      </Modal>

      {/* Modal de Erro para Nome Incorreto */}
      <Modal isOpen={errorModalVisible} onClose={() => setErrorModalVisible(false)}>
        <Modal.Content>
          <Modal.Body>
            The sensor name is incorrect. Please try again.
          </Modal.Body>
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

import React, { useEffect, useState } from 'react';
import { View, Alert, StyleSheet, TouchableOpacity } from 'react-native';
import { Box, FlatList, Icon, HStack, VStack, Spinner, Text } from 'native-base';
import { MaterialIcons } from '@expo/vector-icons';
import { RouteProp, useRoute, useNavigation, NavigationProp } from '@react-navigation/native';
import api from '../../../config/api';

type RootStackParamList = {
  AlertList: { factoryId: string };
  //MachineDetail: { machineId: string };
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
  }
  

export default function AlertListScreen() {
  const route = useRoute<AlertListRouteProp>();
  const { factoryId } = route.params;
  const [alerts, setAlerts] = useState<Alerta[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const fetchAlerts = () => {
    setRefreshing(true);
    api.get(`/alerts/factory/${factoryId}`)
      .then((response) => {
        setAlerts(response.data.data);
      })
      .catch((error) => {
        console.error('Error fetching alerts:', error);
        Alert.alert('Error', 'Unable to load alerts.');
      })
      .finally(() => {
        setRefreshing(false);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchAlerts();
  }, [factoryId]);

  const renderAlertCard = ({ item }: { item: Alerta }) => (
    // <TouchableOpacity onPress={() => navigation.navigate('AlertDetail', { alertId: item.alertId })}>
        <Box
        shadow={2}
        borderRadius="md"
        padding="4"
        marginBottom="4"
        bg="light.50"
        >
        <HStack space={3} alignItems="center">
            <Icon as={MaterialIcons} name="warning" size="2xl" color="red.500" />
            <VStack flex={1}>
                <HStack justifyContent="space-between" alignItems="center">
                    <Text bold fontSize="lg">
                    {item.machine.machineName}
                    </Text>
                    <Text fontSize="xs" color="coolGray.500">
                    {new Date(item.alertDate).toLocaleDateString()}
                    </Text>
                </HStack>
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
                    {item.severity.charAt(0).toUpperCase() + item.severity.slice(1)}
                </Text>
                <Text fontSize="md" color="coolGray.700" mt={1} numberOfLines={2}>
                    {item.message}
                </Text>
                <Text fontSize="xs" color="coolGray.500" italic mt={1}>
                    State: {item.state}
                </Text>
            </VStack>
        </HStack>
        </Box>
    // </TouchableOpacity>
  );

  if (loading) {
    return <Spinner color="blue.500" />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={alerts}
        renderItem={renderAlertCard}
        keyExtractor={(item) => item.alertId}
        contentContainerStyle={styles.listContainer}
        refreshing={refreshing}
        onRefresh={fetchAlerts}
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
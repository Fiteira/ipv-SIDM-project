import React, { useEffect, useState } from 'react';
import { View, Alert, StyleSheet, TouchableOpacity } from 'react-native';
import { Box, FlatList, Icon, HStack, VStack, Spinner, Text } from 'native-base';
import { MaterialIcons } from '@expo/vector-icons';
import { RouteProp, useRoute, useNavigation, NavigationProp } from '@react-navigation/native';
import api from '../../../../config/api';

type RootStackParamList = {
  MaintenanceList: { machineId: string };
  MaintenanceDetail: { maintenanceId: string };
};

type MaintenanceListRouteProp = RouteProp<RootStackParamList, 'MaintenanceList'>;

interface Maintenance {
    maintenanceId: string;
    machineId: string;
    maintenanceDate: string;
    description: string;
    alertId: string;
    performedBy: string;
    machine: {
      machineId: string;
      machineName: string;
      factoryId: string;
      state: string;
    };
    performedUser: {
        userId: string;
        userNumber: string;
        name: string;
        role: string;
      };
  }
  

export default function MaintenanceListScreen() {
  const route = useRoute<MaintenanceListRouteProp>();
  const { machineId } = route.params;
  const [maintenances, setMaintenances] = useState<Maintenance[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const fetchMaintenances = () => {
    setRefreshing(true);
    api.get(`/maintenances/machine/${machineId}`)
      .then((response) => {
        setMaintenances(response.data.data);
      })
      .catch((error) => {
        console.error('Error fetching maintenances:', error);
        Alert.alert('Error', 'Unable to load maintenances.');
      })
      .finally(() => {
        setRefreshing(false);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchMaintenances();
  }, [machineId]);

  const renderMaintenanceCard = ({ item }: { item: Maintenance }) => (
    <TouchableOpacity onPress={() => navigation.navigate('MaintenanceDetail', {  maintenanceId: item. maintenanceId })}>
        <Box
        shadow={2}
        borderRadius="md"
        padding="4"
        marginBottom="4"
        bg="light.50"
        >
        <HStack space={3} alignItems="center">
          <Icon as={MaterialIcons} name="build" size="lg" color="darkBlue.700" />
          <VStack flex={1}>
            <HStack justifyContent="space-between" alignItems="center">
                <Text bold fontSize="lg">
                {item.machine.machineName}
                </Text>
                <Text fontSize="xs" color="coolGray.500">
                {new Date(item.maintenanceDate).toLocaleDateString()}
                </Text>
            </HStack>
            <Text fontSize="xs" color="coolGray.600">
                Performed by: {item.performedUser.name}
            </Text>
            <Text fontSize="md" color="coolGray.700" mt={1} numberOfLines={2}>
                {item.description}
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
        data={maintenances}
        renderItem={renderMaintenanceCard}
        keyExtractor={(item) => item.maintenanceId}
        contentContainerStyle={styles.listContainer}
        refreshing={refreshing}
        onRefresh={fetchMaintenances}
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
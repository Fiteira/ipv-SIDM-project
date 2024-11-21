import React, { useCallback, useState } from 'react';
import { View, Alert, StyleSheet, TouchableOpacity } from 'react-native';
import { Box, FlatList, Icon, HStack, VStack, Spinner, Text, Button } from 'native-base';
import { MaterialIcons } from '@expo/vector-icons';
import { RouteProp, useRoute, useNavigation, NavigationProp, useFocusEffect } from '@react-navigation/native';
import api from '../../../config/api';
import { getMachinesByFactory, insertMachines } from '../../../config/sqlite'; // SQLite functions
import { isNetworkAvailable } from '../../../config/netinfo'; // Utility to check network status

type RootStackParamList = {
  MachineList: { factoryId: string };
  MachineDetail: { machineId: string };
  MachineCreate: { factoryId: string };
};

type MachineListRouteProp = RouteProp<RootStackParamList, 'MachineList'>;

interface Machine {
  machineId: number;
  machineName: string;
  state: string;
  updatedAt: string; // For sync comparison
  factoryId: number; // Associated factory
}

export default function MachineListScreen() {
  const route = useRoute<MachineListRouteProp>();
  const { factoryId } = route.params;
  const [machines, setMachines] = useState<Machine[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const fetchMachines = useCallback(async () => {
    try {
      setLoading(true);

      // Step 1: Fetch local machines
      const localMachines = await getMachinesByFactory(factoryId);
      if (localMachines.length > 0) {
        console.log('Local machines:', localMachines);
        setMachines(localMachines);
      }

      // Step 2: Check network status
      const isConnected = await isNetworkAvailable();
      if (!isConnected) {
        console.warn('Offline mode: Displaying cached data.');
        return; // Stop here if offline
      }

      // Step 3: Fetch server machines if online
      const response = await api.get(`/machines/factory/${factoryId}`);
      const serverMachines: Machine[] = response.data.data;

      // Step 4: Sync server data with local database
      const machinesToSync = serverMachines.filter(serverMachine => {
        const localMachine = localMachines.find(m => m.machineId === serverMachine.machineId);
        return (
          !localMachine ||
          new Date(serverMachine.updatedAt) > new Date(localMachine.updatedAt)
        );
      });

      if (machinesToSync.length > 0) {
        await insertMachines(machinesToSync);
        console.log(`${machinesToSync.length} machines synchronized.`);
      }

      // Step 5: Update state with the most recent data
      setMachines(serverMachines);
    } catch (error) {
      console.error('Error fetching machines:', error);
      if (machines.length === 0) {
        Alert.alert('Error', 'Unable to load machines. Check your connection.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [factoryId]);

  // Fetch machines when screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchMachines();
    }, [fetchMachines])
  );

  const renderMachineCard = ({ item }: { item: Machine }) => (
    <TouchableOpacity onPress={() => navigation.navigate('MachineDetail', { machineId: item.machineId.toString() })}>
      <Box shadow={2} borderRadius="md" padding="4" marginBottom="4" bg="light.50">
        <HStack space={3} alignItems="center">
          <Icon as={MaterialIcons} name="precision-manufacturing" size="lg" color="darkBlue.500" />
          <VStack>
            <Text bold fontSize="md">{item.machineName}</Text>
            <Text fontSize="sm" color="coolGray.600">{item.state}</Text>
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
        data={machines}
        renderItem={renderMachineCard}
        keyExtractor={(item) => item.machineId.toString()}
        contentContainerStyle={styles.listContainer}
        refreshing={refreshing}
        onRefresh={fetchMachines}
        ListFooterComponent={
          <Button
            onPress={() => navigation.navigate('MachineCreate', { factoryId })}
            leftIcon={<Icon as={MaterialIcons} name="add" size="sm" color="white" />}
            colorScheme="blue"
            marginTop="4"
            borderRadius="md"
          >
            Create Machine
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

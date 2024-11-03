import React, { useEffect, useState } from 'react';
import { View, Alert, StyleSheet } from 'react-native';
import { Box, FlatList, Icon, HStack, VStack, Spinner, Text } from 'native-base';
import { MaterialIcons } from '@expo/vector-icons';
import { RouteProp, useRoute } from '@react-navigation/native';
import api from '../../../config/api';

type RootStackParamList = {
  MachineList: { factoryId: string };
};

type MachineListRouteProp = RouteProp<RootStackParamList, 'MachineList'>;

interface Machine {
  machineId: string;
  machineName: string;
  state: string;
}

export default function MachineListScreen() {
  const route = useRoute<MachineListRouteProp>();
  const { factoryId } = route.params;
  const [machines, setMachines] = useState<Machine[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchMachines = () => {
    setRefreshing(true);
    api.get(`/machines/factory/${factoryId}`)
      .then((response) => {
        setMachines(response.data.data);
      })
      .catch((error) => {
        console.error('Erro ao carregar as máquinas:', error);
        Alert.alert('Erro', 'Não foi possível carregar as máquinas.');
      })
      .finally(() => {
        setRefreshing(false);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchMachines();
  }, [factoryId]);

  const renderMachineCard = ({ item }: { item: Machine }) => (
    <Box
      shadow={2}
      borderRadius="md"
      padding="4"
      marginBottom="4"
      bg="light.50"
    >
      <HStack space={3} alignItems="center">
        <Icon as={MaterialIcons} name="precision-manufacturing" size="lg" color="darkBlue.500" />
        <VStack>
          <Text bold fontSize="md">
            {item.machineName}
          </Text>
          <Text fontSize="sm" color="coolGray.600">
            {item.state}
          </Text>
        </VStack>
      </HStack>
    </Box>
  );

  if (loading) {
    return <Spinner color="blue.500" />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={machines}
        renderItem={renderMachineCard}
        keyExtractor={(item) => item.machineId}
        contentContainerStyle={styles.listContainer}
        refreshing={refreshing}
        onRefresh={fetchMachines}
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
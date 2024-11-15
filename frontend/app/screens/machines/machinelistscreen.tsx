import React, { useCallback, useState } from 'react';
import { View, Alert, StyleSheet, TouchableOpacity } from 'react-native';
import { Box, FlatList, Icon, HStack, VStack, Spinner, Text, Button } from 'native-base';
import { MaterialIcons } from '@expo/vector-icons';
import { RouteProp, useRoute, useNavigation, NavigationProp, useFocusEffect } from '@react-navigation/native';
import api from '../../../config/api';

type RootStackParamList = {
  MachineList: { factoryId: string };
  MachineDetail: { machineId: string };
  MachineCreate: { factoryId: string }; 
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
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const fetchMachines = useCallback(() => {
    setLoading(true);
    api.get(`/machines/factory/${factoryId}`)
      .then((response) => {
        setMachines(response.data.data);
      })
      .catch((error) => {
        console.error('Error fetching machines:', error);
        Alert.alert('Error', 'Unable to load machines.');
      })
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  }, [factoryId]);

  // Atualiza a lista ao focar na tela
  useFocusEffect(
    useCallback(() => {
      fetchMachines();
    }, [fetchMachines])
  );

  const renderMachineCard = ({ item }: { item: Machine }) => (
    <TouchableOpacity onPress={() => navigation.navigate('MachineDetail', { machineId: item.machineId })}>
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
        keyExtractor={(item) => item.machineId}
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
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { Box, FlatList, Text, Icon, VStack, HStack, Spinner, Button } from 'native-base';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, NavigationProp, useFocusEffect } from '@react-navigation/native';
import { db, insertFactories, getFactories } from '@/config/sqlite'; // SQLite functions
import api from '../../config/api';
import { isNetworkAvailable } from '../../config/netinfo'; // Utility to check network status
import { useContext } from 'react';
import { AuthContext } from '../AuthContext';

type RootStackParamList = {
  FactoryDetail: { factoryId: string };
  FactoryCreate: undefined;
};

interface Factory {
  factoryId: number;
  factoryName: string;
  location: string;
  updatedAt: string; // For synchronization comparison
}

export default function HomeScreen() {
  const [factories, setFactories] = useState<Factory[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const { userRole } = useContext(AuthContext);
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  // Function to load and synchronize data
  const syncFactories = async () => {
    try {
      setRefreshing(true);

      // Load local data first
      const localFactories = await getFactories();
      console.log('Local factories:', localFactories);
      setFactories(localFactories);
      if (localFactories.length === 0) {
        setRefreshing(false);
      }
      // Check network availability
      const isConnected = await isNetworkAvailable();

      if (!isConnected) {
        console.warn('No internet connection. Displaying offline data.');
        return; // Exit early if offline
      }

      // Fetch data from the server
      const response = await api.get('/factories');
      const serverFactories: Factory[] = response.data.data;

      // Find and update or insert data locally
      const factoriesToInsertOrUpdate = serverFactories.filter(serverFactory => {
        const localFactory = localFactories.find(
          local => local.factoryId === serverFactory.factoryId
        );
        return (
          !localFactory || new Date(serverFactory.updatedAt) > new Date(localFactory.updatedAt)
        );
      });

      if (factoriesToInsertOrUpdate.length > 0) {
        await insertFactories(factoriesToInsertOrUpdate);
        console.log(`${factoriesToInsertOrUpdate.length} factories synchronized.`);
      } else {
        console.log('No updates needed.');
      }

      // Update UI with server data
      setFactories(serverFactories);
    } catch (error) {
      console.error('Error synchronizing factories:', error);
      Alert.alert('Error', 'Failed to synchronize data. Please try again later.');
    } finally {
      setRefreshing(false); // Ensure refreshing is stopped
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      syncFactories();
    }, [])
  );

  const renderFactoryCard = ({ item }: { item: Factory }) => (
    <TouchableOpacity onPress={() => navigation.navigate('FactoryDetail', { factoryId: item.factoryId.toString() })}>
      <Box shadow={2} borderRadius="md" padding="4" marginBottom="4" bg="light.50">
        <HStack space={3} alignItems="center">
          <Icon as={MaterialIcons} name="factory" size="lg" color="darkBlue.500" />
          <VStack>
            <Text bold fontSize="md">
              {item.factoryName}
            </Text>
            <Text fontSize="sm" color="coolGray.600">
              {item.location}
            </Text>
          </VStack>
        </HStack>
      </Box>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {refreshing && !factories.length ? <Spinner color="blue.500" /> : null}
      <FlatList
        data={factories}
        renderItem={renderFactoryCard}
        keyExtractor={(item) => item.factoryId.toString()}
        contentContainerStyle={styles.listContainer}
        refreshing={refreshing}
        onRefresh={syncFactories}
        ListFooterComponent={
          <Button
            onPress={() => navigation.navigate('FactoryCreate')}
            leftIcon={<Icon as={MaterialIcons} name="add" size="sm" color="white" />}
            colorScheme="blue"
            marginTop="4"
            borderRadius="md"
            padding="4"
          >
            Create New Factory
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

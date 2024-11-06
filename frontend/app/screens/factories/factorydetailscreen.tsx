import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, Alert } from 'react-native';
import { Box, Spinner, Button, VStack } from 'native-base';
import { RouteProp, useRoute } from '@react-navigation/native';
import { useNavigation, NavigationProp } from '@react-navigation/native';

import api from '../../../config/api';

type RootStackParamList = {
  FactoryDetail: { factoryId: string };
  FactoryDashboard: { factoryId: string };
  MachineList: { factoryId: string };
  UserList: { factoryId: string };
  AlertList: { factoryId: string };
};

type FactoryDetailRouteProp = RouteProp<RootStackParamList, 'FactoryDetail'>;

interface Factory {
  factoryName: string;
  location: string;
}

export default function FactoryDetailScreen() {
  const route = useRoute<FactoryDetailRouteProp>();
  const { factoryId } = route.params;
  const [factory, setFactory] = useState<Factory | null>(null);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  useEffect(() => {
    api.get(`/factories/${factoryId}`)
      .then((response) => {
        setFactory(response.data.data);
      })
      .catch((error) => {
        console.error('Error loading factory details:', error);
        Alert.alert('Erro', 'Unable to load factory details.');
      })
      .finally(() => setLoading(false));
  }, [factoryId]);

  if (loading) {
    return <Spinner color="blue.500" />;
  }

  if (!factory) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Factory not found.</Text>
      </View>
    );
  }

  return (
    <Box style={styles.container}>
      <Text style={styles.title}>{factory.factoryName}</Text>
      <Text style={styles.location}>Location: {factory.location}</Text>

      <VStack space={4} marginTop={6}>
        <Button
          colorScheme="darkBlue"
          onPress={() => navigation.navigate('MachineList', { factoryId })}
        >
          Machines
        </Button>
        <Button 
          colorScheme="darkBlue"
          onPress={() => navigation.navigate('UserList', { factoryId })}
        >
          Users
        </Button>
        <Button 
          colorScheme="darkBlue"
          onPress={() => navigation.navigate('AlertList', { factoryId })}
          >
          Alerts
        </Button>
      </VStack>
    </Box>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  location: {
    fontSize: 16,
    color: 'gray',
  },
});
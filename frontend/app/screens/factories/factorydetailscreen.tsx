import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, Alert } from 'react-native';
import { Box, Spinner, Button, VStack } from 'native-base';
import { RouteProp, useRoute } from '@react-navigation/native';

import api from '../../../config/api';

type RootStackParamList = {
  FactoryDetail: { factoryId: string };
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

  useEffect(() => {
    api.get(`/factories/${factoryId}`)
      .then((response) => {
        setFactory(response.data.data);
      })
      .catch((error) => {
        console.error('Erro ao carregar os detalhes da fábrica:', error);
        Alert.alert('Erro', 'Não foi possível carregar os detalhes da fábrica.');
      })
      .finally(() => setLoading(false));
  }, [factoryId]);

  if (loading) {
    return <Spinner color="blue.500" />;
  }

  if (!factory) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Fábrica não encontrada.</Text>
      </View>
    );
  }

  return (
    <Box style={styles.container}>
      <Text style={styles.title}>{factory.factoryName}</Text>
      <Text style={styles.location}>Location: {factory.location}</Text>

      <VStack space={4} marginTop={6}>
        <Button colorScheme="darkBlue">
          Machines
        </Button>
        <Button colorScheme="darkBlue">
          Users
        </Button>
        <Button colorScheme="darkBlue">
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
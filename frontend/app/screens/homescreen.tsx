import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Box, FlatList, Text, Icon, VStack, HStack } from 'native-base';
import { MaterialIcons } from '@expo/vector-icons';
import api from '../../config/api';

interface Factory {
    factoryId: string;
    factoryName: string;
    location: string;
}

export default function HomeScreen() {
  const [factories, setFactories] = useState<Factory[]>([]);
  const [refreshing, setRefreshing] = useState(false);

    // Função para buscar as fábricas da API
    const fetchFactories = () => {
        setRefreshing(true);
        api.get('/factories')
        .then((response) => {
            console.log(response.data);
            setFactories(response.data.data); // Atualiza o estado com os dados recebidos
        })
        .catch((error) => {
            console.log('Erro ao buscar as fábricas:', error);
        })
        .finally(() => setRefreshing(false));
    };

    // Chamada da função ao montar o componente
    useEffect(() => {
        fetchFactories();
    }, []);

  // Renderizar cada card de fábrica
  const renderFactoryCard = ({ item }: { item: Factory }) => (
    <Box
      borderWidth="1"
      borderColor="coolGray.300"
      borderRadius="md"
      padding="4"
      marginBottom="4"
      bg="light.50"
    >
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
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={factories}
        renderItem={renderFactoryCard}
        keyExtractor={(item) => item.factoryId}
        contentContainerStyle={styles.listContainer}

        // Configurações para "Pull-to-Refresh"
        refreshing={refreshing}
        onRefresh={fetchFactories}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  listContainer: {
    paddingBottom: 16,
  },
});

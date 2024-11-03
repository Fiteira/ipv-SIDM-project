import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Box, FlatList, Text, Icon, VStack, HStack, Spinner } from 'native-base';
import { MaterialIcons } from '@expo/vector-icons';
import api from '../../config/api';

interface Factory {
    factoryId: string;
    factoryName: string;
    location: string;
}
//Teste
export default function HomeScreen() {
  const [factories, setFactories] = useState<Factory[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFactories = () => {
    setRefreshing(true);
    api.get('/factories')
      .then((response) => {
        console.log(response.data);
        setFactories(response.data.data);
      })
      .catch((error) => {
        console.log('Erro ao buscar as fábricas:', error);
        Alert.alert('Erro', 'Não foi possível carregar as fábricas. Tente novamente mais tarde.');
      })
      .finally(() => setRefreshing(false));
  };

  useEffect(() => {
    fetchFactories();
  }, []);

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
      {refreshing && <Spinner color="blue.500" />}
      <FlatList
        data={factories}
        renderItem={renderFactoryCard}
        keyExtractor={(item) => item.factoryId}
        contentContainerStyle={styles.listContainer}
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
  listContainer: {
    paddingBottom: 16,
  },
});

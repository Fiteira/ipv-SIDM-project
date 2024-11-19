import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { Box, FlatList, Text, Icon, VStack, HStack, Spinner, Button } from 'native-base';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, NavigationProp, useFocusEffect } from '@react-navigation/native';
import { db, insertFactories, getFactories } from '@/config/sqlite'; // Importa as funções SQLite para manipular a tabela
import api from '../../config/api';

type RootStackParamList = {
  FactoryDetail: { factoryId: string };
  FactoryCreate: undefined;
};

interface Factory {
  factoryId: string;
  factoryName: string;
  location: string;
  updatedAt: string; // Para comparação de sincronização
}

export default function HomeScreen() {
  const [factories, setFactories] = useState<Factory[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  // Função para sincronizar dados locais com os do servidor
  const syncFactories = async () => {
    try {
      // Obtém os dados locais
      const localFactories = await getFactories();
  
      // Obtém os dados do servidor
      const response = await api.get('/factories');
      const serverFactories: Factory[] = response.data.data;
  
      // Identifica novos dados para atualizar/inserir localmente
      const factoriesToInsertOrUpdate = serverFactories.filter(serverFactory => {
        const localFactory = localFactories.find(
          local => local.factoryId === serverFactory.factoryId
        );
        // Verifica se é novo ou está desatualizado
        return (
          !localFactory ||
          new Date(serverFactory.updatedAt) > new Date(localFactory.updatedAt)
        );
      });
  
      // Atualiza ou insere no banco local
      if (factoriesToInsertOrUpdate.length > 0) {
        await insertFactories(factoriesToInsertOrUpdate);
        console.log(`${factoriesToInsertOrUpdate.length} fábricas sincronizadas.`);
      } else {
        console.log('Nenhuma atualização necessária.');
      }
  
      // Atualiza o estado
      setFactories(serverFactories);
    } catch (error) {
      console.error('Erro ao sincronizar fábricas:', error);
      Alert.alert('Erro', 'Não foi possível sincronizar os dados. Tente novamente mais tarde.');
    } finally {
      setRefreshing(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      setRefreshing(true);
      syncFactories();
    }, [])
  );

  const renderFactoryCard = ({ item }: { item: Factory }) => (
    <TouchableOpacity onPress={() => navigation.navigate('FactoryDetail', { factoryId: item.factoryId })}>
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
      {refreshing && <Spinner color="blue.500" />}
      <FlatList
        data={factories}
        renderItem={renderFactoryCard}
        keyExtractor={(item) => item.factoryId}
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

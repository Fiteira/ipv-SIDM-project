import React, { useState } from 'react';
import { View, Alert, StyleSheet, TouchableOpacity } from 'react-native';
import { Box, FlatList, Icon, HStack, VStack, Spinner, Text, Button } from 'native-base';
import { MaterialIcons } from '@expo/vector-icons';
import { RouteProp, useRoute, useNavigation, NavigationProp, useFocusEffect } from '@react-navigation/native';
import { getUsersByFactory, insertUsers } from '../../../config/sqlite'; // SQLite functions
import api from '../../../config/api';

type RootStackParamList = {
  UserList: { factoryId: string };
  UserDetail: { userNumber: number };
  UserCreate: { factoryId: string };
};

type UserListRouteProp = RouteProp<RootStackParamList, 'UserList'>;

interface User {
  userId: number;
  userNumber: number;
  name: string;
  role: string;
  updatedAt: string;
  factoryId: number | null;
}

export default function UserListScreen() {
  const route = useRoute<UserListRouteProp>();
  const { factoryId } = route.params;
  const [users, setUsers] = useState<User[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false); // Inicializa com false
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  // Sincroniza dados locais e remotos
  const syncUsers = async () => {
    try {
      setLoading(true);
  
      // Obtém os dados locais
      const localUsers = await getUsersByFactory(factoryId);
  
      // Atualiza a lista com os dados locais
      setUsers(localUsers);
      // Busca os dados do servidor
      const response = await api.get(`/users/factory/${factoryId}`);
      const serverUsers: User[] = response.data.data;
  
      // Filtra os usuários a serem inseridos ou atualizados
      const usersToInsertOrUpdate = serverUsers.filter(serverUser => {
        const localUser = localUsers.find(local => local.userNumber === serverUser.userNumber); // Comparando por userNumber
        return (
          !localUser || // Novo usuário
          new Date(serverUser.updatedAt) > new Date(localUser.updatedAt) // Usuário atualizado
        );
      });
  
  
      // Atualiza ou insere os dados no SQLite
      if (usersToInsertOrUpdate.length > 0) {
        await insertUsers(usersToInsertOrUpdate);
        console.log(`${usersToInsertOrUpdate.length} usuários sincronizados.`);
      } else {
        console.log('Nenhuma atualização necessária.');
      }
  
      // Atualiza o estado com os dados mais recentes
      setUsers(serverUsers);
    } catch (error) {
      console.error('Erro ao sincronizar usuários:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  

  // Sincroniza ao entrar na tela
  useFocusEffect(
    React.useCallback(() => {
      syncUsers();
    }, [factoryId]) // Só reexecuta se o factoryId mudar
  );

  // Renderiza o cartão de usuário
  const renderUserCard = ({ item }: { item: User }) => (
    <TouchableOpacity onPress={() => navigation.navigate('UserDetail', { userNumber: item.userNumber })}>
      <Box shadow={2} borderRadius="md" padding="4" marginBottom="4" bg="light.50">
        <HStack space={3} alignItems="center">
          <Icon as={MaterialIcons} name="person" size="lg" color="darkBlue.500" />
          <VStack>
            <Text bold fontSize="md">{item.name}</Text>
            <Text fontSize="sm" color="coolGray.600">{item.role}</Text>
          </VStack>
        </HStack>
      </Box>
    </TouchableOpacity>
  );

  // Mostra o spinner enquanto carrega
  if (loading) {
    return <Spinner color="blue.500" />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={users}
        renderItem={renderUserCard}
        keyExtractor={(item) => item.userId.toString()}
        contentContainerStyle={styles.listContainer}
        refreshing={refreshing}
        onRefresh={() => {
          setRefreshing(true);
          syncUsers();
        }}
        ListFooterComponent={
          <Button
            onPress={() => navigation.navigate('UserCreate', { factoryId })}
            leftIcon={<Icon as={MaterialIcons} name="add" size="sm" color="white" />}
            colorScheme="blue"
            marginTop="4"
            borderRadius="md"
          >
            Create User
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

import React, { useEffect, useState } from 'react';
import { View, Alert, StyleSheet, TouchableOpacity } from 'react-native';
import { Box, FlatList, Icon, HStack, VStack, Spinner, Text } from 'native-base';
import { MaterialIcons } from '@expo/vector-icons';
import { RouteProp, useRoute, useNavigation, NavigationProp } from '@react-navigation/native';
import api from '../../../config/api';

type RootStackParamList = {
  UserList: { factoryId: string };
  UserDetail: { userId: string };
};

type UserListRouteProp = RouteProp<RootStackParamList, 'UserList'>;

interface User {
    userId: string;
    userNumber: string;
    name: string;
    role: string;
}

export default function UserListScreen() {
  const route = useRoute<UserListRouteProp>();
  const { factoryId } = route.params;
  const [users, setUsers] = useState<User[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const fetchUsers = () => {
    setRefreshing(true);
    api.get(`/users/factory/${factoryId}`)
      .then((response) => {
        setUsers(response.data.data);
      })
      .catch((error) => {
        console.error('Erro ao carregar os users:', error);
        Alert.alert('Erro', 'Não foi possível carregar os users.');
      })
      .finally(() => {
        setRefreshing(false);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchUsers();
  }, [factoryId]);

  const renderUserCard = ({ item }: { item: User }) => (
    <TouchableOpacity onPress={() => navigation.navigate('UserDetail', { userId: item.userId })}>
        <Box
        shadow={2}
        borderRadius="md"
        padding="4"
        marginBottom="4"
        bg="light.50"
        >
        <HStack space={3} alignItems="center">
            <Icon as={MaterialIcons} name="person" size="lg" color="darkBlue.500" />
            <VStack>
            <Text bold fontSize="md">
                {item.name}
            </Text>
            <Text fontSize="sm" color="coolGray.600">
                {item.role}
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
        data={users}
        renderItem={renderUserCard}
        keyExtractor={(item) => item.userId}
        contentContainerStyle={styles.listContainer}
        refreshing={refreshing}
        onRefresh={fetchUsers}
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
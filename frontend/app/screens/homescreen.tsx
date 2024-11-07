import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Alert, TouchableOpacity  } from 'react-native';
import { Box, FlatList, Text, Icon, VStack, HStack, Spinner, Button } from 'native-base';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, NavigationProp, useFocusEffect, RouteProp } from '@react-navigation/native';
import api from '../../config/api';

type RootStackParamList = {
  FactoryDetail: { factoryId: string };
  FactoryCreate: undefined;
};

interface Factory {
    factoryId: string;
    factoryName: string;
    location: string;
}
//Teste
export default function HomeScreen() {
  const [factories, setFactories] = useState<Factory[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const fetchFactories = () => {
    setRefreshing(true);
    api.get('/factories')
      .then((response) => {
        setFactories(response.data.data);
      })
      .catch((error) => {
        console.log('Error fetching factories:', error);
        Alert.alert('Error', 'Unable to load factories. Try again later.');
      })
      .finally(() => setRefreshing(false));
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchFactories();
    }, [])
  );

  const deleteFactory = (factoryId: string) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this factory?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/factories/${factoryId}`);
              Alert.alert('Deleted', 'Factory deleted successfully');
              fetchFactories(); // Refresh list after deletion
            } catch (error) {
              console.error('Error deleting factory:', error);
              Alert.alert('Error', 'Failed to delete factory. Please try again later.');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const renderFactoryCard = ({ item }: { item: Factory }) => (
    <TouchableOpacity onPress={() => navigation.navigate('FactoryDetail', { factoryId: item.factoryId })}>
      <Box
        shadow={2}
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
        onRefresh={fetchFactories}
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

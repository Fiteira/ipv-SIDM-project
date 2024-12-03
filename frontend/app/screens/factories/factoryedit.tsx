import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Box, Button, Input, VStack, Spinner, Text } from 'native-base';
import { RouteProp, useRoute, useNavigation, NavigationProp } from '@react-navigation/native';
import api from '../../../config/api';

type RootStackParamList = {
  FactoryEdit: { factoryId: string };
};

type FactoryEditRouteProp = RouteProp<RootStackParamList, 'FactoryEdit'>;

export default function FactoryEditScreen() {
  const route = useRoute<FactoryEditRouteProp>();
  const { factoryId } = route.params;
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const [factoryName, setFactoryName] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchFactoryDetails = async () => {
    try {
      const response = await api.get(`/factories/${factoryId}`);
      const factory = response.data.data;
      setFactoryName(factory.factoryName);
      setLocation(factory.location);
    } catch (error) {
      console.error('Error fetching factory details:', error);
      Alert.alert('Error', 'Failed to load factory details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFactoryDetails();
  }, [factoryId]);

  const handleSave = async () => {
    if (!factoryName.trim() || !location.trim()) {
      Alert.alert('Validation Error', 'Factory name and location are required.');
      return;
    }

    try {
      setLoading(true);
      await api.put(`/factories/${factoryId}`, { factoryName, location });
      Alert.alert('Success', 'Factory details updated successfully.');
      navigation.goBack();
    } catch (error) {
      console.error('Error updating factory:', error);
      Alert.alert('Error', 'Failed to update factory.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Spinner color="blue.500" />;
  }

  return (
    <Box style={styles.container}>
      <VStack space={4}>
        <Text fontSize="md" bold>Factory Name</Text>
        <Input
          value={factoryName}
          onChangeText={setFactoryName}
          placeholder="Enter factory name"
        />
        <Text fontSize="md" bold>Location</Text>
        <Input
          value={location}
          onChangeText={setLocation}
          placeholder="Enter factory location"
        />
        <Button colorScheme="blue" onPress={handleSave}>
          Save Changes
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
});

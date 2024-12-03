import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Box, Button, FormControl, Input, Text } from 'native-base';
import api from '../../../../config/api';
import { MaterialIcons } from '@expo/vector-icons';
import { RouteProp, useRoute, useNavigation, NavigationProp } from '@react-navigation/native';

type RootStackParamList = {
    SensorList: { machineId: string };
    SensorCreate: { machineId: string }; 
};

type SensorCreateRouteProp = RouteProp<RootStackParamList, 'SensorCreate'>;

export default function SensorCreateScreen() {
    const route = useRoute<SensorCreateRouteProp>();
    const { machineId } = route.params;
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  
    const [sensorName, setSensorName] = useState('');
    const [sensorType, setSensorType] = useState('');
    const [loading, setLoading] = useState(false);
  
    const handleCreateSensor = async () => {
        if (!sensorName || !sensorType) {
          Alert.alert('Error', 'Please fill in all fields');
          return;
        }
        
        setLoading(true);
        try {
          console.log('Creating sensor with data:', {
            name: sensorName,
            sensorType,
            machineId,
          });
      
          await api.post('/sensors', {
            name: sensorName,
            sensorType,
            machineId,
          });
          Alert.alert('Success', 'Sensor created successfully');
          navigation.navigate('SensorList', { machineId });
        } catch (error) {
          console.error('Error creating sensor:', error);
          Alert.alert('Error', 'Failed to create sensor. Please try again later.');
        } finally {
          setLoading(false);
        }
    };
      
  
    return (
      <View style={styles.container}>
        <Box padding={4} borderRadius="md" bg="light.50">
          <FormControl isRequired>
            <FormControl.Label>Sensor Name</FormControl.Label>
            <Input 
              value={sensorName}
              onChangeText={setSensorName}
              placeholder="Enter sensor name"
            />
          </FormControl>
          <FormControl isRequired>
            <FormControl.Label>Sensor Type</FormControl.Label>
            <Input 
              value={sensorType}
              onChangeText={setSensorType}
              placeholder="Enter sensor type"
            />
          </FormControl>
          <Button
            onPress={handleCreateSensor}
            leftIcon={<MaterialIcons name="add" color="white" />}
            colorScheme="blue"
            marginTop={4}
            isLoading={loading}
          >
            Create Sensor
          </Button>
        </Box>
      </View>
    );
}
  

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
});
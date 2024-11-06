import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, Alert } from 'react-native';
import { Box, Spinner, Button, VStack } from 'native-base';
import { RouteProp, useRoute } from '@react-navigation/native';
import { useNavigation, NavigationProp } from '@react-navigation/native';

import api from '../../../config/api';

type RootStackParamList = {
  FactoryDashboard: { factoryId: string };
};

type FactoryDashboardRouteProp = RouteProp<RootStackParamList, 'FactoryDashboard'>;

interface Factory {
  factoryName: string;
  location: string;
}

export default function FactoryDashboardScreen() {
  const route = useRoute<FactoryDashboardRouteProp>();
  const { factoryId } = route.params;
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  return (
    <Box style={styles.container}>
      <Text style={styles.title}>Dashboard 🗿🤫🧏‍♂️</Text>
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
});
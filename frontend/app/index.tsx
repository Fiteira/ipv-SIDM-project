import React, { useState, useEffect } from 'react';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList, DrawerItem, DrawerContentComponentProps } from '@react-navigation/drawer';
import { createStackNavigator, StackScreenProps  } from '@react-navigation/stack';
import { NativeBaseProvider, Avatar, HStack, VStack, Text } from 'native-base';
import { TouchableOpacity, ActivityIndicator, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import AdminAppHomeScreen from './screens/homescreen'; // Importando a HomeScreen
import ProfileScreen from './screens/profilescreen'; // Importando a HomeScreen
import LoginScreen from './screens/loginscreen'; // Importando o LoginScreen

import avatar from '../assets/avatar.png';

const Drawer = createDrawerNavigator();
const Stack = createStackNavigator();

function CustomDrawerContent(props: DrawerContentComponentProps) {
  return (
    <DrawerContentScrollView {...props}>
     {/* Avatar e Nome do User na parte superior */}
     <TouchableOpacity onPress={() => props.navigation.navigate('Profile Screen')}>
        <HStack alignItems="center" space={3} padding={4}>
          <Avatar size="md" source={avatar} />
          <VStack>
            <Text fontSize="md" bold>Nome do User</Text>
          </VStack>
        </HStack>
      </TouchableOpacity>
      <DrawerItemList {...props} />
      <DrawerItem
        label="Logout"
        icon={() => <MaterialIcons name="logout" size={22} color="red" />}
        labelStyle={{ color: 'red' }}
        onPress={() => {}}
      />
    </DrawerContentScrollView>
  );
}

function DrawerNavigator() {
  return (
    <Drawer.Navigator
      initialRouteName="Homepage"
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={({ navigation }) => ({
        headerTitle: () => (
          <TouchableOpacity onPress={() => navigation.navigate('Homepage')}>
            <Text style={{ fontSize: 18 }}>Home</Text>
          </TouchableOpacity>
        ),
      })}
    >
      <Drawer.Screen name="Homepage" component={AdminAppHomeScreen} options={{ drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="Profile Screen" component={ProfileScreen} options={{ drawerItemStyle: { display: 'none' } }} />
    </Drawer.Navigator>
  );
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  // Verifica a existência do token no AsyncStorage ao inicializar o app
  useEffect(() => {
    const checkToken = async () => {
      const token = await AsyncStorage.getItem('token');
      setIsAuthenticated(!!token);
    };

    checkToken();
  }, []);

  // Para mostrar spinner
  if (isAuthenticated === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <NativeBaseProvider>
      <Stack.Navigator>
        {!isAuthenticated ? (
          <Stack.Screen
            name="Login" 
            component={(props: StackScreenProps<any>) => ( // Define o tipo de props
              <LoginScreen {...props} setIsAuthenticated={setIsAuthenticated} />
            )} 
            options={{ headerShown: false }} 
          />
        ) : (
          <Stack.Screen 
            name="Main" 
            component={DrawerNavigator} 
            options={{ headerShown: false }} 
          />
        )}
      </Stack.Navigator>
    </NativeBaseProvider>
  );
}
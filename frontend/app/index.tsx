import React, { useEffect, useState, useRef } from 'react';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList, DrawerItem, DrawerContentComponentProps } from '@react-navigation/drawer';
import { createStackNavigator } from '@react-navigation/stack';
import { NativeBaseProvider, Avatar, HStack, VStack, Text, extendTheme } from 'native-base';
import { TouchableOpacity, Alert, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

import AdminAppHomeScreen from './screens/homescreen';
import ProfileScreen from './screens/profilescreen';
import LoginScreen from './screens/loginscreen';
import FactoryDetailScreen from './screens/factories/factorydetailscreen';
import MachineListScreen from './screens/machines/machinelistscreen';
import MachineDetailScreen from './screens/machines/machinedetailscreen';
import SensorListScreen from './screens/machines/sensors/sensorlistscreen';
import SensorDetailScreen from './screens/machines/sensors/sensordetailscreen';
import UserListScreen from './screens/users/userlistscreen';
import UserDetailScreen from './screens/users/userdetailscreen';
import AlertListScreen from './screens/alerts/alertlistscreen';
import MaintenanceListScreen from './screens/machines/maintenances/maintenancelistscreen';

import avatar from '../assets/avatar.png';

const theme = extendTheme({
  config: {
    initialColorMode: 'light',
    useSystemColorMode: false,
  },
});

const Drawer = createDrawerNavigator();
const Stack = createStackNavigator();



interface CustomDrawerContentProps extends DrawerContentComponentProps {
  setIsAuthenticated: (isAuthenticated: boolean) => void;
}

function CustomDrawerContent({ setIsAuthenticated, ...props }: CustomDrawerContentProps) {
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    const loadUserName = async () => {
      const user = await AsyncStorage.getItem('user');
      if (user) setUserName(JSON.parse(user).name);
    };
    loadUserName();
  }, []);

  return (
    <DrawerContentScrollView {...props}>
      <TouchableOpacity onPress={() => props.navigation.navigate('Profile Screen')}>
        <HStack alignItems="center" space={3} padding={4}>
          <Avatar size="md" source={avatar} />
          <VStack>
            <Text fontSize="md" bold>{userName || 'Nome do User'}</Text>
          </VStack>
        </HStack>
      </TouchableOpacity>
      <DrawerItemList {...props} />
      <DrawerItem
        label="Logout"
        icon={() => <MaterialIcons name="logout" size={22} color="red" />}
        labelStyle={{ color: 'red' }}
        onPress={() => setIsAuthenticated(false)}
      />
    </DrawerContentScrollView>
  );
}

function DrawerNavigator({ setIsAuthenticated }: { setIsAuthenticated: (isAuthenticated: boolean) => void }) {
  return (
    <Drawer.Navigator
      initialRouteName="Homepage"
      drawerContent={(props) => <CustomDrawerContent {...props} setIsAuthenticated={setIsAuthenticated} />}
    >
      <Drawer.Screen name="Homepage" component={AdminAppHomeScreen} />
      <Drawer.Screen name="Profile Screen" component={ProfileScreen} options={{ drawerItemStyle: { display: 'none' } }} />
    </Drawer.Navigator>
  );
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });

    registerForPushNotificationsAsync().then(token => setExpoPushToken(token));

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notificação Recebida:', notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Resposta à Notificação:', response);
    });

    return () => {
      if (notificationListener.current) Notifications.removeNotificationSubscription(notificationListener.current);
      if (responseListener.current) Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  const registerForPushNotificationsAsync = async () => {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      Alert.alert('Falha ao obter permissões para notificações!');
      return null;
    }
    const token = (await Notifications.getExpoPushTokenAsync()).data;
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }
    return token;
  };

  async function sendLocalNotification(title: string, body: string) {
    await Notifications.scheduleNotificationAsync({
      content: { title, body, sound: true },
      trigger: null,
    });
  }

  return (
    <NativeBaseProvider theme={theme}>
      <Stack.Navigator screenOptions={{ headerBackTitle: '' }}>
        {!isAuthenticated ? (
          <Stack.Screen
            name="Login"
            options={{ headerShown: false }}
          >
            {(props) => <LoginScreen {...props} setIsAuthenticated={setIsAuthenticated} deviceToken={expoPushToken} />}
          </Stack.Screen>
        ) : (
          <>
            <Stack.Screen
              name="Main"
              options={{ headerShown: false }}
            >
              {(props) => <DrawerNavigator {...props} setIsAuthenticated={setIsAuthenticated} />}
            </Stack.Screen>
            <Stack.Screen name="FactoryDetail" component={FactoryDetailScreen} options={{ title: 'Factory Details' }} />
            <Stack.Screen name="MachineList" component={MachineListScreen} options={{ title: 'Machines List' }} />
            <Stack.Screen name="MachineDetail" component={MachineDetailScreen} options={{ title: 'Machine Details' }} />
            <Stack.Screen name="SensorList" component={SensorListScreen} options={{ title: 'Sensors List' }} />
            <Stack.Screen name="SensorDetail" component={SensorDetailScreen} options={{ title: 'Sensor Details' }} />
            <Stack.Screen name="UserList" component={UserListScreen} options={{ title: 'Users List' }} />
            <Stack.Screen name="UserDetail" component={UserDetailScreen} options={{ title: 'User Details' }} />
            <Stack.Screen name="AlertList" component={AlertListScreen} options={{ title: 'Alerts List' }} />
            <Stack.Screen name="MaintenanceList" component={MaintenanceListScreen} options={{ title: 'Maintenances List' }} />
          </>
        )}
      </Stack.Navigator>
    </NativeBaseProvider>
  );
}

import React, { useEffect, useState, useRef } from 'react';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList, DrawerItem } from '@react-navigation/drawer';
import { createStackNavigator } from '@react-navigation/stack';
import { NativeBaseProvider, Avatar, HStack, VStack, Text } from 'native-base';
import { TouchableOpacity, Alert, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import AdminAppHomeScreen from './screens/homescreen';
import ProfileScreen from './screens/profilescreen';
import LoginScreen from './screens/loginscreen';
import avatar from '../assets/avatar.png';

const Drawer = createDrawerNavigator();
const Stack = createStackNavigator();

import { DrawerContentComponentProps } from '@react-navigation/drawer';

interface CustomDrawerContentProps extends DrawerContentComponentProps {
  setIsAuthenticated: (isAuthenticated: boolean) => void;
}

function CustomDrawerContent(props: CustomDrawerContentProps) {
  return (
    <DrawerContentScrollView {...props}>
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
        onPress={() => props.setIsAuthenticated(false)}
      />
    </DrawerContentScrollView>
  );
}

function DrawerNavigator({ setIsAuthenticated }: { setIsAuthenticated: (isAuthenticated: boolean) => void }) {
  return (
    <Drawer.Navigator
      initialRouteName="Homepage"
      drawerContent={(props) => <CustomDrawerContent {...props} setIsAuthenticated={setIsAuthenticated} />}
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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    // Configura o handler de notificações
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });

    // Registra o dispositivo para notificações push
    registerForPushNotificationsAsync().then(token => {
      if (token) {
        setExpoPushToken(token);
        // Envia uma notificação de teste após obter o token
        sendTestNotification(token);
      }
    });

    // Listener para notificações recebidas enquanto o app está em primeiro plano
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
      handleNotification(notification);
    });

    // Listener para resposta a notificações (quando o usuário interage com a notificação)
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log(response);
      handleNotificationResponse(response);
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  const registerForPushNotificationsAsync = async () => {
    let token;
   // if (Constants.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        Alert.alert('Falha ao obter permissões para notificações!');
        return;
      }
      token = (await Notifications.getExpoPushTokenAsync({ projectId: process.env.EXPO_PUBLIC_PROJECT_ID})).data;
      console.log('Token de Notificação:', token);
    //} else {
    //  Alert.alert('Deve usar um dispositivo físico para notificações push.');
   // }

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

  const sendTestNotification = async (token: string) => {
    if (!token) return;

    const message = {
      to: token,
      sound: 'default',
      title: 'Notificação de Teste',
      body: 'Esta é uma notificação de teste enviada do aplicativo!',
      data: { someData: 'goes here' },
    };

    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });
  };

  const handleNotification = (notification: Notifications.Notification) => {
    console.log('Notificação Recebida:', notification);

    // Aqui pode atualizar o estado da aplicação ou navegar para um ecrã específico
  };
  
  const handleNotificationResponse = (response: Notifications.NotificationResponse) => {
    console.log('Resposta à Notificação:', response);
    // Aqui pode processar a resposta à notificação, como navegar para um ecrã específico
  };

  return (
    <NativeBaseProvider>
      <Stack.Navigator>
        {!isAuthenticated ? (
          <Stack.Screen
            name="Login"
            component={(props: any) => (
              <LoginScreen {...props} setIsAuthenticated={setIsAuthenticated} deviceToken={expoPushToken} />
            )}
            options={{ headerShown: false }}
          />
        ) : (
          <Stack.Screen
            name="Main"
            options={{ headerShown: false }}
          >
            {(props) => <DrawerNavigator {...props} setIsAuthenticated={setIsAuthenticated} />}
          </Stack.Screen>
        )}
      </Stack.Navigator>
    </NativeBaseProvider>
  );
}

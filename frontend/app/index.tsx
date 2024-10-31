import React from 'react';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList, DrawerItem, DrawerContentComponentProps } from '@react-navigation/drawer';
import { NativeBaseProvider, Avatar, HStack, VStack, Text } from 'native-base';
import { TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AdminAppHomeScreen from './screens/homescreen'; // Importando a HomeScreen
import ProfileScreen from './screens/profilescreen'; // Importando a HomeScreen

import avatar from '../assets/avatar.png';

const Drawer = createDrawerNavigator();

function CustomDrawerContent(props: DrawerContentComponentProps) {
  return (
    <DrawerContentScrollView {...props}>
     {/* Avatar e Nome do Usuário na parte superior */}
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

export default function App() {
  return (
    <NativeBaseProvider>
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
    </NativeBaseProvider>
  );
}
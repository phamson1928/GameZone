import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuthStore } from '../store/useAuthStore';
import { theme } from '../theme';
import {
  Home,
  Compass,
  Users,
  User,
  Plus,
} from 'lucide-react-native';

import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { DiscoverScreen } from '../screens/DiscoverScreen';
import { GroupsScreen } from '../screens/GroupsScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { ZoneDetailsScreen } from '../screens/ZoneDetailsScreen';
import { CreateZoneScreen } from '../screens/CreateZoneScreen';
import { EditProfileScreen } from '../screens/EditProfileScreen';
import { AddGameProfileScreen } from '../screens/AddGameProfileScreen';
import { GameZonesScreen } from '../screens/GameZonesScreen';
import { MyZonesScreen } from '../screens/MyZonesScreen';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  MainTabs: undefined;
  ZoneDetails: { zoneId: string };
  CreateZone: { gameId?: string } | undefined;
  EditProfile: undefined;
  AddGameProfile: undefined;
  GameZones: { gameId: string; gameName: string };
  MyZones: undefined;
  Notifications: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

const AuthNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
  </Stack.Navigator>
);

// Placeholder component for the center tab (does nothing, we handle navigation via custom button)
const DummyScreen = () => null;

// Custom center button component
const AddZoneButton = ({ onPress }: { onPress: () => void }) => (
  <View style={styles.addButtonContainer}>
    <TouchableOpacity style={styles.addButton} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.addButtonInner}>
        <Plus color="#FFFFFF" size={28} strokeWidth={2.5} />
      </View>
    </TouchableOpacity>
    <Text style={styles.addButtonLabel}>Tạo mới</Text>
  </View>
);

const TabNavigator = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarStyle: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderTopWidth: 0,
        height: 80,
        paddingBottom: 20,
        paddingTop: 10,
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: -4,
        },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 0,
      },
      tabBarActiveTintColor: theme.colors.primary,
      tabBarInactiveTintColor: '#94a3b8',
      tabBarLabelStyle: {
        fontSize: 10,
        fontWeight: '600',
        marginTop: 4,
      },
    }}
  >
    <Tab.Screen
      name="Lobby"
      component={HomeScreen}
      options={{
        tabBarIcon: ({ color, size, focused }) => (
          <Home color={color} size={size} fill={focused ? color : 'transparent'} />
        ),
        tabBarLabel: 'Sảnh',
      }}
    />
    <Tab.Screen
      name="Discover"
      component={DiscoverScreen}
      options={{
        tabBarIcon: ({ color, size, focused }) => (
          <Compass color={color} size={size} fill={focused ? color : 'transparent'} />
        ),
        tabBarLabel: 'Khám phá',
      }}
    />
    <Tab.Screen
      name="AddZone"
      component={DummyScreen}
      listeners={({ navigation }) => ({
        tabPress: (e) => {
          e.preventDefault();
          navigation.getParent()?.navigate('CreateZone', {});
        },
      })}
      options={({ navigation }) => ({
        tabBarLabel: () => null, // Hide default label as we render it in custom button
        tabBarIcon: () => null,
        tabBarButton: () => (
          <AddZoneButton onPress={() => {
            navigation.getParent()?.navigate('CreateZone', {});
          }} />
        ),
      })}
    />
    <Tab.Screen
      name="Groups"
      component={GroupsScreen}
      options={{
        tabBarIcon: ({ color, size, focused }) => (
          <Users color={color} size={size} fill={focused ? color : 'transparent'} />
        ),
        tabBarLabel: 'Đội',
      }}
    />
    <Tab.Screen
      name="Profile"
      component={ProfileScreen}
      options={{
        tabBarIcon: ({ color, size, focused }) => (
          <User color={color} size={size} fill={focused ? color : 'transparent'} />
        ),
        tabBarLabel: 'Hồ sơ',
      }}
    />
  </Tab.Navigator>
);

const MainNavigator = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      contentStyle: { backgroundColor: theme.colors.background },
    }}
  >
    <Stack.Screen name="MainTabs" component={TabNavigator} />
    <Stack.Screen name="ZoneDetails" component={ZoneDetailsScreen} />
    <Stack.Screen name="CreateZone" component={CreateZoneScreen} />
    <Stack.Screen name="EditProfile" component={EditProfileScreen} />
    <Stack.Screen name="AddGameProfile" component={AddGameProfileScreen} />
    <Stack.Screen name="GameZones" component={GameZonesScreen} />
    <Stack.Screen name="MyZones" component={MyZonesScreen} />
    <Stack.Screen name="Notifications" component={NotificationsScreen} />
  </Stack.Navigator>
);

export const AppNavigator = () => {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  return (
    <NavigationContainer>
      {isAuthenticated ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  addButtonContainer: {
    position: 'absolute',
    top: -30,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  addButtonInner: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonLabel: {
    marginTop: 4,
    fontSize: 10,
    fontWeight: '600',
    color: '#94a3b8',
  },
});

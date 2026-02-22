import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuthStore } from '../store/useAuthStore';
import { theme } from '../theme';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Home,
  Compass,
  Users,
  User,
  Plus,
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { DiscoverScreen } from '../screens/DiscoverScreen';
import { GroupsScreen } from '../screens/GroupsScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { ZoneDetailsScreen } from '../screens/ZoneDetailsScreen';
import { CreateZoneScreen } from '../screens/CreateZoneScreen';
import { EditProfileScreen } from '../screens/EditProfileScreen';
import { AddGameProfileScreen } from '../screens/AddGameProfileScreen';
import { TeamZoneVNsScreen } from '../screens/TeamZoneVNsScreen';
import { MyZonesScreen } from '../screens/MyZonesScreen';

export type RootStackParamList = {
  Onboarding: undefined;
  App: undefined;
  Login: undefined;
  Register: undefined;
  MainTabs: undefined;
  ZoneDetails: { zoneId: string };
  CreateZone: { gameId?: string } | undefined;
  EditProfile: undefined;
  AddGameProfile: undefined;
  TeamZoneVNs: { gameId: string; gameName: string };
  MyZones: undefined;
  Notifications: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

// Placeholder component for the center tab (does nothing, we handle navigation via custom button)
const DummyScreen = () => null;

// Custom center FAB (Create Zone)
const AddZoneButton = ({ onPress }: { onPress: () => void }) => (
  <View style={styles.fabContainer}>
    <TouchableOpacity
      style={styles.fabWrapper}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <LinearGradient
        colors={['#2563FF', '#7C3AED']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.fabGradient}
      >
        <Plus color="#FFFFFF" size={26} strokeWidth={2.5} />
      </LinearGradient>
    </TouchableOpacity>
    <Text style={styles.fabLabel}>Tạo mới</Text>
  </View>
);

const TabNavigator = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarStyle: {
        backgroundColor: '#111827',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.06)',
        height: 80,
        paddingBottom: 20,
        paddingTop: 10,
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 12,
      },
      tabBarActiveTintColor: theme.colors.primary,
      tabBarInactiveTintColor: '#475569',
      tabBarLabelStyle: {
        fontSize: 10,
        fontWeight: '700',
        marginTop: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
      },
      tabBarHideOnKeyboard: true,
    }}
  >
    <Tab.Screen
      name="Lobby"
      component={HomeScreen}
      options={{
        tabBarIcon: ({ color, size, focused }) => (
          <Home
            color={color}
            size={size}
            fill={focused ? color : 'transparent'}
            strokeWidth={focused ? 2.5 : 2}
          />
        ),
        tabBarLabel: 'Sảnh',
      }}
    />
    <Tab.Screen
      name="Discover"
      component={DiscoverScreen}
      options={{
        tabBarIcon: ({ color, size, focused }) => (
          <Compass
            color={color}
            size={size}
            fill={focused ? color : 'transparent'}
            strokeWidth={focused ? 2.5 : 2}
          />
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
        tabBarLabel: () => null,
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
          <Users
            color={color}
            size={size}
            fill={focused ? color : 'transparent'}
            strokeWidth={focused ? 2.5 : 2}
          />
        ),
        tabBarLabel: 'Đội',
      }}
    />
    <Tab.Screen
      name="Profile"
      component={ProfileScreen}
      options={{
        tabBarIcon: ({ color, size, focused }) => (
          <User
            color={color}
            size={size}
            fill={focused ? color : 'transparent'}
            strokeWidth={focused ? 2.5 : 2}
          />
        ),
        tabBarLabel: 'Hồ sơ',
      }}
    />
  </Tab.Navigator>
);

const AuthNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
  </Stack.Navigator>
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
    <Stack.Screen name="TeamZoneVNs" component={TeamZoneVNsScreen} />
    <Stack.Screen name="MyZones" component={MyZonesScreen} />
    <Stack.Screen name="Notifications" component={NotificationsScreen} />
  </Stack.Navigator>
);

export const AppNavigator = () => {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const [showOnboarding, setShowOnboarding] = React.useState<boolean>(false);
  const [isReady, setIsReady] = React.useState(true); // Force ready to true immediately

  React.useEffect(() => {
    const checkOnboarding = async () => {
      console.log('AppNavigator: Starting onboarding check...');
      try {
        const value = await AsyncStorage.getItem('@onboarding_completed');
        console.log('AppNavigator: Onboarding value is:', value);
        if (value === null) {
          setShowOnboarding(true);
        }
      } catch (err) {
        console.error('AppNavigator: Onboarding check error:', err);
      }
    };
    checkOnboarding();
  }, []);




  if (!isReady) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0F172A', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#FFFFFF' }}>Loading...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {showOnboarding ? (
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        ) : null}
        <Stack.Screen name="App" component={isAuthenticated ? MainNavigator : AuthNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};


const styles = StyleSheet.create({
  fabContainer: {
    position: 'absolute',
    top: -28,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    width: 64,
  },
  fabWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: '#2563FF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 10,
    borderWidth: 3,
    borderColor: '#111827',
  },
  fabGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabLabel: {
    marginTop: 6,
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

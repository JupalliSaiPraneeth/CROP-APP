import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

// Screens
import { HomeScreen } from '../screens/HomeScreen';
import { DiseaseDetectionScreen } from '../screens/DiseaseDetectionScreen';
import { PestDetectionScreen } from '../screens/PestDetectionScreen';
import { NutrientScreen } from '../screens/NutrientScreen';
import { YieldPredictionScreen } from '../screens/YieldPredictionScreen';
import { MarketPriceScreen } from '../screens/MarketPriceScreen';
import { SettingsScreen } from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSubtle,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 62,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'leaf';

          if (route.name === 'HomeTab') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'DiseaseTab') {
            iconName = focused ? 'leaf' : 'leaf-outline';
          } else if (route.name === 'PestTab') {
            iconName = focused ? 'bug' : 'bug-outline';
          } else if (route.name === 'NutrientTab') {
            iconName = focused ? 'flask' : 'flask-outline';
          } else if (route.name === 'YieldTab') {
            iconName = focused ? 'analytics' : 'analytics-outline';
          }

          return <Ionicons name={iconName} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="DiseaseTab" component={DiseaseDetectionScreen} options={{ tabBarLabel: 'Disease' }} />
      <Tab.Screen name="PestTab" component={PestDetectionScreen} options={{ tabBarLabel: 'Pests' }} />
      <Tab.Screen name="NutrientTab" component={NutrientScreen} options={{ tabBarLabel: 'Nutrients' }} />
      <Tab.Screen name="YieldTab" component={YieldPredictionScreen} options={{ tabBarLabel: 'Yield' }} />
    </Tab.Navigator>
  );
};

export const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen name="Disease" component={DiseaseDetectionScreen} />
        <Stack.Screen name="Pest" component={PestDetectionScreen} />
        <Stack.Screen name="Nutrient" component={NutrientScreen} />
        <Stack.Screen name="Yield" component={YieldPredictionScreen} />
        <Stack.Screen name="Market" component={MarketPriceScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

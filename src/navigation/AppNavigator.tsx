import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import { View, TouchableOpacity, StyleSheet, Text, Image, Platform } from 'react-native';
import { Home, ShoppingBag, ShoppingCart, User, Search, Bell, Leaf } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';

import SplashScreen from '../screens/SplashScreen';
import HomeScreen from '../screens/HomeScreen';
import ShopScreen from '../screens/ShopScreen';
import CartScreen from '../screens/CartScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ProductDetailsScreen from '../screens/ProductDetailsScreen';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import OtpVerificationScreen from '../screens/OtpVerificationScreen';
import AdminPortalScreen from '../screens/AdminPortalScreen';
import AdminAddProductScreen from '../screens/AdminAddProductScreen';
import AdminEditProductScreen from '../screens/AdminEditProductScreen';
import AdminAddCategoryScreen from '../screens/AdminAddCategoryScreen';
import AdminAddSliderScreen from '../screens/AdminAddSliderScreen';
import AdminReportsScreen from '../screens/AdminReportsScreen';
import AdminOrdersListScreen from '../screens/AdminOrdersListScreen';
import OrderTrackingScreen from '../screens/OrderTrackingScreen';
import MyAddressesScreen from '../screens/MyAddressesScreen';
import LocationTestScreen from '../screens/LocationTestScreen';
import { useAuthStore } from '../store/useAuthStore';


const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function BottomTabs() {
  const insets = useSafeAreaInsets();
  
  return (
    <Tab.Navigator
      screenOptions={{
        sceneStyle: { backgroundColor: '#FAFCFC' },
        headerShown: true,
        headerStyle: {
          backgroundColor: '#FAFCFC',
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 0,
        },
        headerTitleStyle: {
          fontWeight: '900',
          color: colors.text,
          fontSize: 22,
          letterSpacing: -0.5,
        },
        headerTitleAlign: 'left',
        headerLeft: () => (
          <View style={styles.headerLeftIcon}>
            <Image 
              source={require('../assets/images/header_logo_brand.png')} 
              style={{ width: 170, height: 42 }} 
              resizeMode="contain" 
              fadeDuration={0}
            />
          </View>
        ),
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: '#94A3B8', // subtle slate for inactive
        tabBarStyle: {
          backgroundColor: '#FFFFFF', // White bottom bar
          borderTopWidth: 1,
          borderColor: '#E2E8F0',
          height: 60 + Math.max(insets.bottom, 10),
          paddingBottom: Math.max(insets.bottom, 10),
          paddingTop: 10,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: '', // Remove title since logo is in the headerLeft
          tabBarIcon: ({ color }) => <Home color={color} size={24} />,
        }}
      />
      <Tab.Screen
        name="Shop"
        component={ShopScreen}
        options={{
          title: '',
          tabBarIcon: ({ color }) => <ShoppingBag color={color} size={24} />,
        }}
      />
      <Tab.Screen
        name="Cart"
        component={CartScreen}
        options={{
          title: '',
          tabBarIcon: ({ color }) => <ShoppingCart color={color} size={24} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: '',
          tabBarIcon: ({ color }) => <User color={color} size={24} />,
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'admin';

  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="MainTabs"
        screenOptions={{ 
          headerShown: false,
          animation: 'fade_from_bottom',
        }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="MainTabs" component={BottomTabs} />
        <Stack.Screen name="AdminPortal" component={AdminPortalScreen} />
        <Stack.Screen name="AdminAddProduct" component={AdminAddProductScreen} />
        <Stack.Screen name="AdminEditProduct" component={AdminEditProductScreen} />
        <Stack.Screen name="AdminAddCategory" component={AdminAddCategoryScreen} />
        <Stack.Screen name="AdminAddSlider" component={AdminAddSliderScreen} />
        <Stack.Screen name="AdminReports" component={AdminReportsScreen} />
        <Stack.Screen name="AdminOrdersList" component={AdminOrdersListScreen} />
        <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} />
        <Stack.Screen name="OrderTracking" component={OrderTrackingScreen} />
        <Stack.Screen name="MyAddresses" component={MyAddressesScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Signup" component={SignupScreen} />
        <Stack.Screen name="OtpVerification" component={OtpVerificationScreen} />
        <Stack.Screen name="LocationTest" component={LocationTestScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  headerLeftIcon: {
    marginLeft: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitleText: {
    marginLeft: 10,
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  headerIcons: {
    flexDirection: 'row',
    marginRight: 20,
  },
  iconButton: {
    marginLeft: 15,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
});

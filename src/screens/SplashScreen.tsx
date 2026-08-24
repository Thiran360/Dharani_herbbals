import React, { useEffect } from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../store/useAuthStore';

export default function SplashScreen() {
  const navigation = useNavigation<any>();

  useEffect(() => {
    const currentUser = useAuthStore.getState().user;
    if (currentUser?.role === 'admin') {
      navigation.replace('AdminPortal');
    } else {
      navigation.replace('MainTabs');
    }
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
});





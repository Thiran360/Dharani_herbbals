import React, { useEffect, useRef } from 'react';
import { View, Text, Image, StyleSheet, Animated, Dimensions, Easing } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../theme/colors';
import Svg, { Path } from 'react-native-svg';
import { useAuthStore } from '../store/useAuthStore';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
  const navigation = useNavigation<any>();
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'admin';
  
  // Animation values
  const logoScale = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;

  // Background blobs animation
  const blob1TranslateY = useRef(new Animated.Value(0)).current;
  const blob2TranslateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1. Logo springs in
    Animated.sequence([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 10,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();

    // 3. Loading text pulses continuously
    setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(textOpacity, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(textOpacity, {
            toValue: 0.3,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }, 1200);

    // 4. Subtle background blob floating
    Animated.loop(
      Animated.sequence([
        Animated.timing(blob1TranslateY, {
          toValue: -30,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(blob1TranslateY, {
          toValue: 0,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(blob2TranslateY, {
          toValue: 40,
          duration: 3500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(blob2TranslateY, {
          toValue: 0,
          duration: 3500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Navigate to respective screen quickly
    const timer = setTimeout(() => {
      Animated.timing(logoOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true
      }).start(() => {
        const currentUser = useAuthStore.getState().user;
        if (currentUser?.role === 'admin') {
          navigation.replace('AdminPortal');
        } else {
          navigation.replace('MainTabs');
        }
      });
    }, 1200);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      
      {/* Background Decorative SVGs */}
      <Animated.View style={[styles.blobContainer, { top: -100, right: -100, transform: [{ translateY: blob1TranslateY }] }]}>
        <Svg height="300" width="300" viewBox="0 0 200 200">
          <Path
            fill={colors.primary + '15'}
            d="M44.7,-76.4C58.9,-69.2,71.8,-59.1,81.1,-46.2C90.4,-33.3,96,-16.6,95.5,-0.3C95,16,88.4,32,79.1,44.9C69.8,57.8,57.8,67.6,44.1,75.3C30.4,83,15.2,88.6,-0.6,89.6C-16.4,90.6,-32.8,87,-47.1,79.5C-61.4,72,-73.6,60.6,-81.9,47.1C-90.2,33.6,-94.6,16.8,-94.3,0.2C-94,-16.4,-89,-32.8,-80.4,-46.4C-71.8,-60,-59.6,-70.8,-45.8,-78.4C-32,-86,-16,-90.4,-0.1,-90.2C15.8,-90,30.5,-83.6,44.7,-76.4Z"
            transform="translate(100 100)"
          />
        </Svg>
      </Animated.View>
      
      <Animated.View style={[styles.blobContainer, { bottom: -100, left: -100, transform: [{ translateY: blob2TranslateY }] }]}>
        <Svg height="300" width="300" viewBox="0 0 200 200">
          <Path
            fill={colors.primary + '1A'}
            d="M39.9,-65.7C53.7,-59.2,68.4,-53.4,79,-41.8C89.6,-30.2,96.1,-15.1,95.4,-0.4C94.7,14.3,86.8,28.6,76,39.9C65.2,51.2,51.5,59.5,37.3,64.2C23.1,68.9,8.4,70,-6.3,71.3C-21,72.6,-35.7,74.1,-48.6,68.6C-61.5,63.1,-72.6,50.6,-80.7,36.2C-88.8,21.8,-93.9,5.5,-90.3,-8.9C-86.7,-23.3,-74.4,-35.8,-60.8,-43.8C-47.2,-51.8,-32.3,-55.3,-18.8,-62.4C-5.3,-69.5,6.8,-80.2,19.3,-79C31.8,-77.8,44.7,-64.7,39.9,-65.7Z"
            transform="translate(100 100)"
          />
        </Svg>
      </Animated.View>

      <View style={styles.content}>
        {/* Animated Main Logo */}
        <Animated.Image 
          source={require('../assets/images/logo.png')} 
          style={[
            styles.logo,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }]
            }
          ]}
          resizeMode="contain"
        />
        {/* Loading Text */}
        <Animated.View style={[styles.textContainer, { opacity: textOpacity }]}>
          <Text style={styles.loadingText}>Curating your herbal experience</Text>
          <View style={styles.dotContainer}>
            <Text style={styles.loadingDot}>.</Text>
            <Text style={styles.loadingDot}>.</Text>
            <Text style={styles.loadingDot}>.</Text>
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  blobContainer: {
    position: 'absolute',
    zIndex: 0,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  logo: {
    width: 280,
    height: 120,
    marginBottom: 50,
  },
  textContainer: {
    flexDirection: 'row',
    marginTop: 40,
    alignItems: 'baseline',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  dotContainer: {
    flexDirection: 'row',
    marginLeft: 2,
  },
  loadingDot: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.primary,
    lineHeight: 18,
    marginLeft: 2,
  },
});

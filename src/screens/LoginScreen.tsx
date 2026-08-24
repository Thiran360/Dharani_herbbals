import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  KeyboardAvoidingView, Platform, ActivityIndicator, 
  Dimensions, Alert 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Phone, Leaf, ArrowLeft } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { useAuthStore } from '../store/useAuthStore';

const { width } = Dimensions.get('window');

export default function LoginScreen() {
  const navigation = useNavigation<any>();
  const requestLoginOtp = useAuthStore((state) => state.requestLoginOtp);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  
  const [mobile, setMobile] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSendOtp = async () => {
    if (!mobile || mobile.length < 10) {
      Alert.alert('Invalid Mobile Number', 'Please enter a valid 10-digit mobile number.');
      return;
    }
    setIsLoading(true);
    try {
      const res = await requestLoginOtp(mobile);
      if (res?.success !== false) {
        const userId = res?.user_id || res?.data?.user_id || res?.id;
        const serverOtp = res?.otp || res?.data?.otp || res?.code;
        navigation.navigate('OtpVerification', { mobile, userId, serverOtp });
      } else {
        Alert.alert('Error', res?.message || 'Failed to send OTP. Please try again.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Automatically navigate back when authentication becomes true
  useEffect(() => {
    if (isAuthenticated) {
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.reset({
          index: 0,
          routes: [{ name: 'MainTabs' }],
        });
      }
    }
  }, [isAuthenticated, navigation]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        {/* Top-Left Back Button */}
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.navigate('MainTabs');
            }
          }}
          activeOpacity={0.7}
        >
          <ArrowLeft color={colors.text} size={22} />
        </TouchableOpacity>

        {/* Abstract Background Shapes */}
        <View style={styles.circleTopRight} />
        <View style={styles.circleBottomLeft} />

        <View style={styles.content}>
          <View style={styles.headerContainer}>
            <View style={styles.logoContainer}>
              <Leaf color={colors.white} size={32} />
            </View>
            <Text style={styles.title}>Welcome</Text>
            <Text style={styles.subtitle}>Enter your mobile number to get started</Text>
          </View>

          <View style={styles.cardContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mobile Number</Text>
              <View style={styles.inputContainer}>
                <Phone color={colors.textSecondary} size={20} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your mobile number"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="phone-pad"
                  autoCapitalize="none"
                  autoComplete="tel"
                  textContentType="telephoneNumber"
                  value={mobile}
                  onChangeText={setMobile}
                />
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.sendOtpButton, (!mobile || mobile.length < 10) && styles.sendOtpButtonDisabled]}
              onPress={handleSendOtp}
              disabled={!mobile || mobile.length < 10 || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.sendOtpButtonText}>Send OTP</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    flex: 1,
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 16 : 8,
    left: 20,
    zIndex: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  circleTopRight: {
    position: 'absolute',
    top: -width * 0.4,
    right: -width * 0.2,
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    backgroundColor: colors.primary,
    opacity: 0.1,
  },
  circleBottomLeft: {
    position: 'absolute',
    bottom: -width * 0.3,
    left: -width * 0.3,
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: width * 0.35,
    backgroundColor: colors.secondary,
    opacity: 0.05,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  headerContainer: {
    marginBottom: 40,
    alignItems: 'center',
  },
  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    transform: [{ rotate: '10deg' }],
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  cardContainer: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 5,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 60,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: '100%',
    color: colors.text,
    fontSize: 16,
    fontWeight: '500',
  },
  sendOtpButton: {
    backgroundColor: colors.primary,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 8,
    marginTop: 10,
  },
  sendOtpButtonDisabled: {
    backgroundColor: colors.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  sendOtpButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});

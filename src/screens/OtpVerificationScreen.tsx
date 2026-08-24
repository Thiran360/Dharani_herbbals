import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  KeyboardAvoidingView, Platform, ActivityIndicator, 
  Dimensions, Alert, Keyboard 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ArrowLeft, ShieldCheck, RefreshCw, Smartphone } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { useAuthStore } from '../store/useAuthStore';

const { width } = Dimensions.get('window');
const OTP_LENGTH = 6;

export default function OtpVerificationScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { mobile, name, email, userId, serverOtp, otp: paramOtp } = route.params || {};

  const verifyOtp = useAuthStore((state) => state.verifyOtp);
  const resendOtp = useAuthStore((state) => state.resendOtp);

  const initialOtp = serverOtp || paramOtp;

  const [otpString, setOtpString] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);

  const mainInputRef = useRef<TextInput>(null);

  // Automatically autofill OTP string on mount if available
  useEffect(() => {
    if (initialOtp && String(initialOtp).length >= 4) {
      const clean = String(initialOtp).replace(/[^0-9]/g, '').slice(0, OTP_LENGTH);
      setOtpString(clean);
    }
  }, [initialOtp]);

  useEffect(() => {
    let interval: any;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  useEffect(() => {
    const timer = setTimeout(() => {
      mainInputRef.current?.focus();
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  const handleOtpStringChange = (text: string) => {
    const clean = text.replace(/[^0-9]/g, '').slice(0, OTP_LENGTH);
    setOtpString(clean);
    if (clean.length === OTP_LENGTH) {
      Keyboard.dismiss();
    }
  };

  const isAutoSubmitted = useRef(false);

  const handleVerify = async (codeToVerify?: string | any) => {
    const fullOtp = (typeof codeToVerify === 'string' && codeToVerify.length >= 4) ? codeToVerify : otpString;
    if (fullOtp.length < OTP_LENGTH) {
      Alert.alert('Incomplete OTP', `Please enter the complete ${OTP_LENGTH}-digit OTP sent to your phone.`);
      return;
    }

    setIsLoading(true);
    try {
      const response = await verifyOtp(mobile, fullOtp, { name, email, userId, serverOtp: initialOtp });
      if (response?.success !== false) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'MainTabs' }],
        });
      } else {
        isAutoSubmitted.current = false;
        Alert.alert('Verification Failed', response?.message || 'Invalid OTP. Please try again.');
      }
    } catch (error: any) {
      isAutoSubmitted.current = false;
      Alert.alert('Verification Failed', error.message || 'Invalid OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fast auto-submit / auto-login as soon as OTP is completely autofilled or entered
  useEffect(() => {
    if (otpString.length === OTP_LENGTH && !isLoading && !isAutoSubmitted.current) {
      isAutoSubmitted.current = true;
      const timer = setTimeout(() => {
        handleVerify(otpString);
      }, 100);
      return () => clearTimeout(timer);
    } else if (otpString.length < OTP_LENGTH) {
      isAutoSubmitted.current = false;
    }
  }, [otpString, isLoading]);

  const handleResend = async () => {
    if (resendTimer > 0 || isResending) return;
    setIsResending(true);
    try {
      const res = await resendOtp(mobile);
      const newOtpStr = res?.otp || res?.data?.otp || res?.code;
      if (newOtpStr && String(newOtpStr).length >= 4) {
        const clean = String(newOtpStr).replace(/[^0-9]/g, '').slice(0, OTP_LENGTH);
        setOtpString(clean);
      } else {
        setOtpString('');
      }
      Alert.alert('OTP Resent', res?.message || 'A new verification code has been sent to your mobile number.');
      setResendTimer(30);
      mainInputRef.current?.focus();
    } catch (error: any) {
      Alert.alert('Resend Failed', error.message || 'Could not resend OTP. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const isOtpComplete = otpString.length === OTP_LENGTH;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        {/* Background Accent Shapes */}
        <View style={styles.circleTopRight} />
        <View style={styles.circleBottomLeft} />

        {/* Top Navigation */}
        <View style={styles.navHeader}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeft color={colors.text} size={24} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.headerContainer}>
            <View style={styles.iconBadge}>
              <ShieldCheck color={colors.white} size={36} />
            </View>
            <Text style={styles.title}>OTP Verification</Text>
            <Text style={styles.subtitle}>
              We have sent a verification code to
            </Text>
            <View style={styles.mobileBadge}>
              <Smartphone color={colors.primary} size={16} style={{ marginRight: 6 }} />
              <Text style={styles.mobileText}>{mobile || 'Your Mobile Number'}</Text>
            </View>
          </View>

          <View style={styles.cardContainer}>
            <Text style={styles.otpLabel}>Enter 6-Digit Code</Text>
            
            {/* Single Hidden Input + 6 Visual Boxes */}
            <TouchableOpacity 
              activeOpacity={1} 
              onPress={() => mainInputRef.current?.focus()}
              style={styles.otpInputContainer}
            >
              <TextInput
                ref={mainInputRef}
                style={styles.hiddenTextInput}
                value={otpString}
                onChangeText={handleOtpStringChange}
                keyboardType="number-pad"
                maxLength={6}
                autoComplete="one-time-code"
                textContentType="oneTimeCode"
                selectionColor="transparent"
                cursorColor="transparent"
                caretHidden={true}
                autoFocus
              />

              <View style={styles.otpInputRow} pointerEvents="none">
                {Array(OTP_LENGTH).fill('').map((_, idx) => {
                  const digit = otpString[idx] || '';
                  const isFocused = (otpString.length === idx) || (idx === 5 && otpString.length === 6);
                  return (
                    <View
                      key={idx}
                      style={[
                        styles.otpBox,
                        digit ? styles.otpBoxActive : null,
                        isFocused ? styles.otpBoxFocused : null,
                      ]}
                    >
                      <Text style={styles.otpDigitText}>{digit}</Text>
                    </View>
                  );
                })}
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.verifyButton, (!isOtpComplete || isLoading) && styles.verifyButtonDisabled]}
              onPress={() => handleVerify()}
              disabled={!isOtpComplete || isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.verifyButtonText}>Sign In</Text>
              )}
            </TouchableOpacity>

            <View style={styles.resendRow}>
              <Text style={styles.resendText}>Didn't receive the code? </Text>
              {resendTimer > 0 ? (
                <Text style={styles.timerText}>Resend in {resendTimer}s</Text>
              ) : (
                <TouchableOpacity onPress={handleResend} disabled={isResending} style={styles.resendBtn}>
                  {isResending ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <RefreshCw color={colors.primary} size={14} style={{ marginRight: 4 }} />
                      <Text style={styles.resendBtnText}>Resend OTP</Text>
                    </View>
                  )}
                </TouchableOpacity>
              )}
            </View>
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
  navHeader: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconBadge: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  mobileBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  mobileText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
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
  otpLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 16,
    textAlign: 'center',
  },
  otpInputContainer: {
    position: 'relative',
    width: '100%',
    marginBottom: 24,
  },
  hiddenTextInput: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    opacity: 0.01,
    zIndex: 10,
  },
  otpInputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  otpBox: {
    width: (width - 120) / 6,
    height: 54,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpBoxActive: {
    borderColor: colors.primary,
    backgroundColor: '#FFFFFF',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 2,
  },
  otpBoxFocused: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  otpDigitText: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  verifyButton: {
    backgroundColor: colors.primary,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 15,
    elevation: 8,
    marginBottom: 20,
  },
  verifyButtonDisabled: {
    backgroundColor: colors.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  verifyButtonText: {
    color: colors.white,
    fontSize: 17,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  resendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resendText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  timerText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  resendBtn: {
    padding: 4,
  },
  resendBtnText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
});

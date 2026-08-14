import React, { useEffect, useRef } from 'react';
import {
  Modal, View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions, Image
} from 'react-native';
import { ShoppingBag } from 'lucide-react-native';
import { colors } from '../theme/colors';

const { width } = Dimensions.get('window');

interface CartSuccessModalProps {
  visible: boolean;
  onClose: () => void;
  onViewCart?: () => void;
}

export default function CartSuccessModal({
  visible,
  onClose,
  onViewCart,
}: CartSuccessModalProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const bagAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.spring(bagAnim, {
          toValue: 1,
          friction: 4,
          tension: 50,
          delay: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.card,
            { opacity: opacityAnim, transform: [{ scale: scaleAnim }] },
          ]}
        >
          <View style={styles.iconRing}>
            <Animated.View
              style={[
                styles.iconInner,
                { transform: [{ scale: bagAnim }] },
              ]}
            >
              <ShoppingBag size={38} color={colors.primary} />
            </Animated.View>
          </View>

          <Text style={styles.title}>Added to Cart</Text>
          <Text style={styles.message}>
            This item has been successfully added to your shopping cart.
          </Text>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.continueBtn} onPress={onClose} activeOpacity={0.8}>
              <Text style={styles.continueBtnText}>Keep Shopping</Text>
            </TouchableOpacity>
            
            {onViewCart && (
              <TouchableOpacity style={styles.viewCartBtn} onPress={onViewCart} activeOpacity={0.8}>
                <Text style={styles.viewCartBtnText}>View Cart</Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  card: {
    width: width - 60,
    backgroundColor: colors.white,
    borderRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 30 },
    shadowOpacity: 0.15,
    shadowRadius: 40,
    elevation: 20,
  },
  iconRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 3,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  iconInner: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 8,
    overflow: 'hidden',
  },
  gifImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.5,
    marginBottom: 10,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '500',
    marginBottom: 32,
    paddingHorizontal: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  continueBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: 'center',
  },
  continueBtnText: {
    color: '#64748B',
    fontSize: 15,
    fontWeight: '800',
  },
  viewCartBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  viewCartBtnText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '800',
  },
});

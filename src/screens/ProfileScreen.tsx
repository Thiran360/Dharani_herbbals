import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, StatusBar, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  User, MapPin, Package, Heart, Calendar, LogOut, ChevronRight, 
  ArrowRight, Phone, Mail, HelpCircle, FileText, ShieldCheck, Truck, ShoppingBag, RotateCcw
} from 'lucide-react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { colors } from '../theme/colors';
import { useAuthStore } from '../store/useAuthStore';
import LogoutModal from '../components/LogoutModal';
import AddressModal from '../components/AddressModal';
import AccountDetailsModal from '../components/AccountDetailsModal';
import WishlistModal from '../components/WishlistModal';
import PolicyModal, { PolicyType } from '../components/PolicyModal';
import UsageCalendarModal from '../components/UsageCalendarModal';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const fetchCustomerProfile = useAuthStore((state) => state.fetchCustomerProfile);
  
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showWishlistModal, setShowWishlistModal] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [activePolicy, setActivePolicy] = useState<PolicyType>('privacy');

  const getValidProfileName = (userObj: any): string => {
    if (!userObj) return 'User';
    const rawName = (userObj.name || userObj.full_name || userObj.username || userObj.first_name || '').trim();
    if (!rawName) return 'User';
    const lower = rawName.toLowerCase();
    if (lower === 'guest' || lower === 'guest user' || lower === 'guest_email' || lower.includes('guest') || lower.includes('enter your') || lower.includes('enter name')) {
      return 'User';
    }
    return rawName;
  };

  const getValidProfileEmail = (userObj: any): string => {
    if (!userObj) return '';
    const rawEmail = (userObj.email || '').trim();
    if (!rawEmail) return '';
    const lower = rawEmail.toLowerCase();
    if (lower.includes('guest') || lower.includes('@user.com') || lower === 'user@DharaniHerbbals.com') {
      return '';
    }
    return rawEmail;
  };

  const profileName = getValidProfileName(user);
  const profileEmail = getValidProfileEmail(user);

  React.useEffect(() => {
    if (isFocused && isAuthenticated) {
      fetchCustomerProfile(user?.id);
    }
  }, [isFocused, isAuthenticated, user?.id]);

  const performLogout = async () => {
    setShowLogoutModal(false);
    await logout();
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" translucent={false} />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Profile</Text>
      </View>

      {!isAuthenticated ? (
        <View style={styles.guestContainer}>
          <View style={styles.guestIconCircle}>
            <User size={56} color={colors.primary} />
          </View>
          <Text style={styles.guestTitle}>Welcome to Dharani Herbbals</Text>
          <Text style={styles.guestSubtitle}>Sign in to view your verified profile, track orders, and manage shipping addresses.</Text>
          <TouchableOpacity 
            style={styles.loginBtn}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.loginBtnText}>Login / Sign Up</Text>
            <ArrowRight color={colors.white} size={20} style={{ marginLeft: 8 }} />
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
          {/* User Card */}
          <View style={styles.userCard}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>
                {profileName ? profileName.charAt(0).toUpperCase() : 'U'}
              </Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>
                {profileName || 'User'}
              </Text>
              
              {user?.phone ? (
                <View style={styles.contactRow}>
                  <Phone color={colors.textSecondary} size={14} />
                  <Text style={styles.userContact}>{user.phone}</Text>
                </View>
              ) : null}

              {profileEmail ? (
                <View style={styles.contactRow}>
                  <Mail color={colors.textSecondary} size={14} />
                  <Text style={styles.userContact}>{profileEmail}</Text>
                </View>
              ) : null}

              <View style={styles.badgePill}>
                <ShieldCheck color="#16A34A" size={14} />
                <Text style={styles.badgeText}>Verified Member</Text>
              </View>
            </View>
          </View>

          {/* Web-Style Account Action List (Exact Match with User Screenshot) */}
          <View style={styles.webMenuCard}>
            {/* 1. Account Details */}
            <TouchableOpacity 
              style={styles.webMenuRow} 
              activeOpacity={0.8}
              onPress={() => setShowAccountModal(true)}
            >
              <View style={styles.webMenuRowLeft}>
                <User color="#334155" size={20} strokeWidth={2.2} />
                <Text style={styles.webMenuTitle}>Account Details</Text>
              </View>
              <ChevronRight color="#94A3B8" size={18} strokeWidth={2} />
            </TouchableOpacity>

            {/* 2. My Orders */}
            <TouchableOpacity 
              style={styles.webMenuRow} 
              activeOpacity={0.8}
              onPress={() => navigation.navigate('OrderTracking')}
            >
              <View style={styles.webMenuRowLeft}>
                <Package color="#334155" size={20} strokeWidth={2.2} />
                <Text style={styles.webMenuTitle}>My Orders</Text>
              </View>
              <ChevronRight color="#94A3B8" size={18} strokeWidth={2} />
            </TouchableOpacity>

            {/* 3. My Addresses */}
            <TouchableOpacity 
              style={styles.webMenuRow} 
              activeOpacity={0.8}
              onPress={() => navigation.navigate('MyAddresses')}
            >
              <View style={styles.webMenuRowLeft}>
                <MapPin color="#334155" size={20} strokeWidth={2.2} />
                <Text style={styles.webMenuTitle}>My Addresses</Text>
              </View>
              <ChevronRight color="#94A3B8" size={18} strokeWidth={2} />
            </TouchableOpacity>


            {/* 4. Wishlist */}
            <TouchableOpacity 
              style={styles.webMenuRow} 
              activeOpacity={0.8}
              onPress={() => setShowWishlistModal(true)}
            >
              <View style={styles.webMenuRowLeft}>
                <Heart color="#334155" size={20} strokeWidth={2.2} />
                <Text style={styles.webMenuTitle}>Wishlist</Text>
              </View>
              <ChevronRight color="#94A3B8" size={18} strokeWidth={2} />
            </TouchableOpacity>

            {/* 5. Usage Calendar */}
            <TouchableOpacity 
              style={styles.webMenuRow} 
              activeOpacity={0.8}
              onPress={() => setShowCalendarModal(true)}
            >
              <View style={styles.webMenuRowLeft}>
                <Calendar color="#334155" size={20} strokeWidth={2.2} />
                <Text style={styles.webMenuTitle}>Usage Calendar</Text>
              </View>
              <ChevronRight color="#94A3B8" size={18} strokeWidth={2} />
            </TouchableOpacity>

            {/* 6. Logout */}
            <TouchableOpacity 
              style={styles.webMenuRowLogout} 
              activeOpacity={0.8}
              onPress={() => setShowLogoutModal(true)}
            >
              <View style={styles.webMenuRowLeft}>
                <LogOut color="#EF4444" size={20} strokeWidth={2.2} />
                <Text style={styles.webMenuTitleLogout}>Logout</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Support & Policies */}
          <Text style={styles.sectionTitle}>Support & Policies</Text>
          <View style={styles.actionsList}>
            <TouchableOpacity 
              style={styles.menuItem} 
              activeOpacity={0.7} 
              onPress={() => {
                setActivePolicy('faqs');
                setShowPolicyModal(true);
              }}
            >
              <View style={[styles.menuIconContainer, { backgroundColor: 'rgba(217, 119, 6, 0.1)' }]}>
                <HelpCircle color="#D97706" size={22} />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuTitle}>FAQs</Text>
              </View>
              <ChevronRight color="#CBD5E1" size={20} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuItem} 
              activeOpacity={0.7} 
              onPress={() => {
                setActivePolicy('privacy');
                setShowPolicyModal(true);
              }}
            >
              <View style={[styles.menuIconContainer, { backgroundColor: 'rgba(217, 119, 6, 0.1)' }]}>
                <ShieldCheck color="#D97706" size={22} />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuTitle}>Privacy Policy</Text>
              </View>
              <ChevronRight color="#CBD5E1" size={20} />
            </TouchableOpacity>
          </View>

          {/* Contact Us */}
          <Text style={styles.sectionTitle}>Contact Us</Text>
          <View style={styles.actionsList}>
            <TouchableOpacity 
              style={styles.menuItem}
              activeOpacity={0.7}
              onPress={() => Linking.openURL('tel:+919788122001')}
            >
              <View style={[styles.menuIconContainer, { backgroundColor: 'rgba(15, 23, 42, 0.1)' }]}>
                <Phone color="#0F172A" size={22} />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuTitle}>+91 97881 22001</Text>
                <Text style={styles.menuSubtitle}>Call for support</Text>
              </View>
              <ChevronRight color="#CBD5E1" size={20} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuItem}
              activeOpacity={0.7}
              onPress={() => Linking.openURL('mailto:info@DharaniHerbbals.in')}
            >
              <View style={[styles.menuIconContainer, { backgroundColor: 'rgba(15, 23, 42, 0.1)' }]}>
                <Mail color="#0F172A" size={22} />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuTitle}>info@DharaniHerbbals.in</Text>
                <Text style={styles.menuSubtitle}>Email us anytime</Text>
              </View>
              <ChevronRight color="#CBD5E1" size={20} />
            </TouchableOpacity>
          </View>

          {/* Footer info */}
          <View style={styles.footerInfo}>
            <Text style={styles.footerText}>© 2026 Dharani Herbbals. All rights reserved.</Text>
            <Text style={styles.footerText}>Managed by ARUMUGAM POONKODI</Text>
            <Text style={styles.footerText}>Developed by ThinkAside</Text>
          </View>
          
        </ScrollView>
      )}

      {/* Logout Modal */}
      <LogoutModal
        visible={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={performLogout}
      />

      {/* Address Modal */}
      <AddressModal
        visible={showAddressModal}
        onClose={() => setShowAddressModal(false)}
      />

      {/* Account Details Modal */}
      <AccountDetailsModal
        visible={showAccountModal}
        onClose={() => setShowAccountModal(false)}
      />

      {/* Wishlist Modal */}
      <WishlistModal
        visible={showWishlistModal}
        onClose={() => setShowWishlistModal(false)}
        onNavigateToShop={() => navigation.navigate('Shop')}
      />

      {/* Policy & Support Modal */}
      <PolicyModal
        visible={showPolicyModal}
        initialPolicy={activePolicy}
        onClose={() => setShowPolicyModal(false)}
      />

      {/* Usage Calendar Modal */}
      <UsageCalendarModal
        visible={showCalendarModal}
        onClose={() => setShowCalendarModal(false)}
        onNavigateToShop={() => navigation.navigate('Shop')}
      />

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    backgroundColor: '#F8FAFC',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: -0.5,
  },
  guestContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  guestIconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 5,
  },
  guestTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  guestSubtitle: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 35,
    lineHeight: 22,
  },
  loginBtn: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 35,
    borderRadius: 20,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  loginBtnText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '800',
  },
  scrollContent: {
    paddingTop: 10,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  userCard: {
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  avatarContainer: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 4,
    borderColor: '#F0FDF4',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarText: {
    fontSize: 34,
    fontWeight: '900',
    color: colors.white,
  },
  userInfo: {
    alignItems: 'center',
  },
  userName: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.text,
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  userContact: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 6,
    fontWeight: '600',
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 10,
  },
  badgeText: {
    color: '#16A34A',
    fontWeight: '800',
    fontSize: 12,
    marginLeft: 4,
  },

  /* Web Menu Card (Exact match with user screenshot) */
  webMenuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 12,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  webMenuRowHighlighted: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0FDF4', // Light mint green background matching screenshot
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  webMenuTitleHighlighted: {
    fontSize: 16,
    fontWeight: '800',
    color: '#15803D',
  },
  webMenuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  webMenuRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  webMenuTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
  },
  webMenuRowLogout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 16,
    marginTop: 4,
  },
  webMenuTitleLogout: {
    fontSize: 16,
    fontWeight: '800',
    color: '#EF4444',
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: '900',
    color: colors.text,
    marginBottom: 12,
    letterSpacing: -0.5,
    paddingHorizontal: 4,
  },
  actionsList: {
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  menuIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  footerInfo: {
    alignItems: 'center',
    padding: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 5,
    fontWeight: '600',
  },
});

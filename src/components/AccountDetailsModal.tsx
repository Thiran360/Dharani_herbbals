import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  TextInput, 
  ScrollView, 
  ActivityIndicator, 
  Alert 
} from 'react-native';
import { User, Mail, Phone, X, Check, Lock, Pencil } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { useAuthStore } from '../store/useAuthStore';
import { apiClient } from '../api/client';
import SuccessModal from './SuccessModal';

interface AccountDetailsModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function AccountDetailsModal({ visible, onClose }: AccountDetailsModalProps) {
  const user = useAuthStore((state) => state.user);
  const updateProfile = useAuthStore((state) => state.updateProfile);

  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const [resolvedPk, setResolvedPk] = useState<number>(8);

  const getValidPk = async () => {
    let currentId = user?.id;
    const numId = Number(currentId);

    // If ID is already a valid backend PK (e.g. 8, 14), use it
    if (!isNaN(numId) && numId > 0 && numId < 1000000) {
      return numId;
    }

    // Lookup customer by mobile phone from /customers/ list
    try {
      const res = await apiClient('/customers/');
      const list = res?.data || (Array.isArray(res) ? res : []);
      const userPhone = (user?.phone || user?.mobile || '').replace(/\D/g, '').slice(-10);

      const matched = list.find((c: any) => {
        const cPhone = (c.mobile || c.phone || '').replace(/\D/g, '').slice(-10);
        return cPhone && cPhone === userPhone;
      });

      if (matched && matched.id) {
        return Number(matched.id);
      }
    } catch (e) {
      console.warn("Error matching customer by phone:", e);
    }

    return 8; // Default fallback
  };

  const isRealEmail = (e: string) => Boolean(e && e.includes('@') && !e.includes('@user.com') && e !== 'user@DharaniHerbbals.com');

  const fetchCustomerDetails = async () => {
    setIsLoading(true);
    try {
      const validPk = await getValidPk();
      setResolvedPk(validPk);

      const uName = user?.name && user.name !== 'User' && user.name !== 'Guest User' ? user.name : '';
      const uEmail = user?.email && isRealEmail(user.email) ? user.email : '';
      const uPhone = user?.phone || user?.mobile || '';

      const response = await apiClient(`/customers/${validPk}/`);
      const cust = response?.data || response;
      if (cust) {
        const cName = cust.name && cust.name !== 'User' && cust.name !== 'Guest User' ? cust.name : '';
        const cEmail = cust.email && isRealEmail(cust.email) ? cust.email : '';

        setName(uName || cName || '');
        setEmail(uEmail || cEmail || '');
        setPhone(cust.phone || cust.mobile || uPhone);
      } else {
        setName(uName);
        setEmail(uEmail);
        setPhone(uPhone);
      }
    } catch (err: any) {
      console.warn("Could not fetch customer details from /customers/:", err);
      const uName = user?.name && user.name !== 'User' && user.name !== 'Guest User' ? user.name : '';
      const uEmail = user?.email && isRealEmail(user.email) ? user.email : '';
      setName(uName);
      setEmail(uEmail);
      setPhone(user?.phone || user?.mobile || '');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      setIsEditing(false);
      fetchCustomerDetails();
    }
  }, [visible, user?.id, user?.name, user?.email]);

  const handleSave = async () => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      Alert.alert('Required Field', 'Please enter your full name.');
      return;
    }

    setIsSaving(true);
    try {
      const validPk = resolvedPk || await getValidPk();

      // 1. Immediately update Zustand state & storage
      if (updateProfile) {
        await updateProfile({ id: validPk, name: trimmedName, email: trimmedEmail });
      }

      // 2. Sync to Backend
      try {
        await apiClient(`/customers/${validPk}/`, {
          method: 'PATCH',
          body: JSON.stringify({
            name: trimmedName,
            full_name: trimmedName,
            email: trimmedEmail,
          }),
        });
      } catch (patchErr) {
        try {
          await apiClient(`/customers/${validPk}/`, {
            method: 'PUT',
            body: JSON.stringify({
              name: trimmedName,
              full_name: trimmedName,
              email: trimmedEmail,
              phone: phone,
              mobile: phone,
            }),
          });
        } catch (_) {}
      }

      setIsEditing(false);
      setShowSuccessModal(true);
    } catch (err: any) {
      Alert.alert('Update Failed', err?.message || 'Could not update profile details.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={styles.title}>Account Details</Text>
              <Text style={styles.subtitle}>Manage your personal information and preferences.</Text>
            </View>
            <TouchableOpacity 
              onPress={onClose} 
              style={styles.closeBtn} 
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X color="#64748B" size={20} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color="#16A34A" size="large" />
              <Text style={styles.loadingText}>Fetching details...</Text>
            </View>
          ) : (
            <ScrollView 
              contentContainerStyle={styles.content}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Field 1: Full Name */}
              <View style={styles.card}>
                <View style={styles.iconCircle}>
                  <User size={20} color="#16A34A" strokeWidth={2.2} />
                </View>
                <View style={styles.cardContent}>
                  <Text style={styles.fieldLabel}>FULL NAME</Text>
                  {isEditing ? (
                    <TextInput
                      style={styles.textInput}
                      value={name}
                      onChangeText={setName}
                      placeholder="Enter full name"
                      placeholderTextColor="#94A3B8"
                    />
                  ) : (
                    <Text style={styles.fieldValue}>{name || 'Not Provided'}</Text>
                  )}
                </View>
              </View>

              {/* Field 2: Email Address */}
              <View style={styles.card}>
                <View style={styles.iconCircle}>
                  <Mail size={20} color="#16A34A" strokeWidth={2.2} />
                </View>
                <View style={styles.cardContent}>
                  <Text style={styles.fieldLabel}>EMAIL ADDRESS</Text>
                  {isEditing ? (
                    <TextInput
                      style={styles.textInput}
                      value={email}
                      onChangeText={setEmail}
                      placeholder="Enter email address"
                      placeholderTextColor="#94A3B8"
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  ) : (
                    <Text style={styles.fieldValue}>{email || 'Not Provided'}</Text>
                  )}
                </View>
              </View>

              {/* Field 3: Mobile Number (Non-Editable / Fixed) */}
              <View style={styles.card}>
                <View style={styles.iconCircle}>
                  <Phone size={20} color="#16A34A" strokeWidth={2.2} />
                </View>
                <View style={styles.cardContent}>
                  <Text style={styles.fieldLabel}>MOBILE NUMBER</Text>
                  <Text style={styles.fieldValue}>
                    {phone ? (phone.startsWith('+91') ? phone : `+91 ${phone}`) : 'Not Provided'}
                  </Text>
                </View>
              </View>

              {/* Action Buttons */}
              {!isEditing ? (
                <TouchableOpacity
                  style={styles.editBtn}
                  onPress={() => setIsEditing(true)}
                  activeOpacity={0.9}
                >
                  <Pencil size={17} color="#FFFFFF" strokeWidth={2.5} />
                  <Text style={styles.editBtnText}>Edit Profile</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.saveBtn]}
                    onPress={handleSave}
                    disabled={isSaving}
                    activeOpacity={0.9}
                  >
                    {isSaving ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <>
                        <Check size={18} color="#FFFFFF" strokeWidth={3} />
                        <Text style={styles.saveBtnText}>Save Changes</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, styles.cancelBtn]}
                    onPress={() => {
                      setIsEditing(false);
                      fetchCustomerDetails();
                    }}
                    disabled={isSaving}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </View>

      <SuccessModal
        visible={showSuccessModal}
        title="Profile Updated!"
        message="Your profile details have been saved successfully."
        buttonText="Continue"
        onClose={() => setShowSuccessModal(false)}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '85%',
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
    lineHeight: 18,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignSelf: 'flex-start',
  },
  loadingBox: {
    paddingVertical: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },
  content: {
    paddingBottom: 20,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  disabledCard: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
  },
  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#DCFCE7', // Mint green background matching screenshot
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  cardContent: {
    flex: 1,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
  },
  lockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  lockText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  fieldValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  textInput: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    padding: 0,
    borderBottomWidth: 1.5,
    borderBottomColor: colors.primary,
    paddingVertical: 2,
  },
  editBtn: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 15,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 14,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  editBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  actionBtn: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  saveBtn: {
    backgroundColor: colors.primary,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  cancelBtn: {
    backgroundColor: '#F1F5F9',
  },
  cancelBtnText: {
    color: '#64748B',
    fontSize: 15,
    fontWeight: '800',
  },
});

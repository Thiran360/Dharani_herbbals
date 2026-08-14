import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, FlatList, ActivityIndicator, RefreshControl, TextInput, ScrollView, Alert, PermissionsAndroid, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MapPin, X, Plus, Phone, Navigation, CheckCircle2, ShieldCheck, Home, ArrowLeft, ChevronDown, Check, Trash2 } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { useAuthStore } from '../store/useAuthStore';
import { useShippingStore } from '../store/useShippingStore';
import { apiClient } from '../api/client';
import SuccessModal from './SuccessModal';

interface AddressModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectAddress?: (address: any) => void;
}

export default function AddressModal({ visible, onClose, onSelectAddress }: AddressModalProps) {
  const user = useAuthStore((state) => state.user);
  const stateList = useShippingStore((state) => state.stateList);
  const fetchShippingRules = useShippingStore((state) => state.fetchShippingRules);

  const [addresses, setAddresses] = useState<any[]>([]);
  const [totalAddresses, setTotalAddresses] = useState(0);
  const [userName, setUserName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedId, setSelectedId] = useState<number | string | null>(null);

  // Form State for Add / Edit Address (matching Web UI)
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
  const [editingAddressId, setEditingAddressId] = useState<number | string | null>(null);
  const [fullName, setFullName] = useState(user?.name && user.name !== 'User' ? user.name : '');
  const [phone, setPhone] = useState(user?.phone && user.phone !== '9025464822' ? user.phone : '');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('Tamil Nadu');
  const [pincode, setPincode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showStatePicker, setShowStatePicker] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState<any>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showLocationSuccess, setShowLocationSuccess] = useState(false);
  const [locationSuccessMsg, setLocationSuccessMsg] = useState('');

  const getStorageKey = (userId: any) => `@saved_addresses_${userId || 'guest'}`;
  const getSelectedIdKey = (userId: any) => `@selected_address_id_${userId || 'guest'}`;

  const STATE_DEFAULTS: { [key: string]: { city: string; pincode: string } } = {
    "Tamil Nadu": { city: "Chennai", pincode: "600001" },
    "Karnataka": { city: "Bengaluru", pincode: "560001" },
    "Kerala": { city: "Thiruvananthapuram", pincode: "695001" },
    "Andhra Pradesh": { city: "Vijayawada", pincode: "520001" },
    "Telangana": { city: "Hyderabad", pincode: "500001" },
    "Maharashtra": { city: "Mumbai", pincode: "400001" },
    "Delhi": { city: "New Delhi", pincode: "110001" },
    "Puducherry": { city: "Puducherry", pincode: "605001" },
    "Gujarat": { city: "Ahmedabad", pincode: "380001" },
    "Goa": { city: "Panaji", pincode: "403001" },
    "Rajasthan": { city: "Jaipur", pincode: "302001" },
    "West Bengal": { city: "Kolkata", pincode: "700001" },
    "Uttar Pradesh": { city: "Lucknow", pincode: "226001" },
    "Punjab": { city: "Chandigarh", pincode: "160017" },
    "Haryana": { city: "Gurugram", pincode: "122001" },
    "Bihar": { city: "Patna", pincode: "800001" },
    "Madhya Pradesh": { city: "Bhopal", pincode: "462001" },
    "Odisha": { city: "Bhubaneswar", pincode: "751001" },
    "Assam": { city: "Guwahati", pincode: "781001" },
    "Jharkhand": { city: "Ranchi", pincode: "834001" },
    "Chhattisgarh": { city: "Raipur", pincode: "492001" },
    "Uttarakhand": { city: "Dehradun", pincode: "248001" },
    "Himachal Pradesh": { city: "Shimla", pincode: "171001" },
    "Manipur": { city: "Imphal", pincode: "795001" },
    "Meghalaya": { city: "Shillong", pincode: "793001" },
    "Mizoram": { city: "Aizawl", pincode: "796001" },
    "Nagaland": { city: "Kohima", pincode: "797001" },
    "Sikkim": { city: "Gangtok", pincode: "737101" },
    "Tripura": { city: "Agartala", pincode: "799001" },
    "Arunachal Pradesh": { city: "Itanagar", pincode: "791111" }
  };

  useEffect(() => {
    if (visible) {
      fetchShippingRules();
      fetchAddresses();
      setViewMode('list');
    }
  }, [visible, user?.id]);

  const fetchAddresses = async () => {
    setIsLoading(true);
    let numericUserId = user?.id ? Number(user.id) : null;

    if (!numericUserId || isNaN(numericUserId) || numericUserId > 1000000) {
      try {
        const listRes = await apiClient('/customers/');
        const list = listRes?.data || (Array.isArray(listRes) ? listRes : []);
        const uEmail = (user?.email || '').toLowerCase().trim();
        const uPhone = (user?.phone || user?.mobile || '').replace(/\D/g, '').slice(-10);

        const matched = list.find((c: any) => {
          const cEmail = (c.email || '').toLowerCase().trim();
          const cPhone = (c.mobile || c.phone || '').replace(/\D/g, '').slice(-10);
          return (uEmail && cEmail && cEmail === uEmail) || (uPhone && cPhone && cPhone === uPhone);
        });
        if (matched && matched.id) {
          numericUserId = Number(matched.id);
        } else {
          numericUserId = 8;
        }
      } catch (e) {
        numericUserId = 8;
      }
    }

    if (!numericUserId || isNaN(numericUserId) || numericUserId <= 0) {
      numericUserId = 8;
    }

    const storageKey = getStorageKey(numericUserId);
    const selectedKey = getSelectedIdKey(numericUserId);

    let cachedList: any[] = [];
    let savedSelectedId: string | number | null = null;

    try {
      const stored = await AsyncStorage.getItem(storageKey);
      if (stored) {
        cachedList = JSON.parse(stored);
        if (Array.isArray(cachedList) && cachedList.length > 0) {
          setAddresses(cachedList);
          setTotalAddresses(cachedList.length);
        }
      }
      savedSelectedId = await AsyncStorage.getItem(selectedKey);
    } catch (_) {}

    try {
      const res = await apiClient(`/address/${numericUserId}/`);
      if (res) {
        const apiList = res.addresses || (Array.isArray(res) ? res : []);
        const nameVal = res.user_name || user?.name || '';
        setUserName(nameVal === 'User' ? '' : nameVal);
        
        const mergedMap = new Map<string, any>();
        cachedList.forEach((item: any) => {
          if (item && item.id) {
            mergedMap.set(String(item.id), item);
          }
        });

        apiList.forEach((apiItem: any) => {
          if (apiItem && apiItem.id) {
            const key = String(apiItem.id);
            const cachedItem = mergedMap.get(key);
            if (cachedItem) {
              mergedMap.set(key, { ...apiItem, ...cachedItem });
            } else {
              mergedMap.set(key, apiItem);
            }
          }
        });

        const finalAddresses = Array.from(mergedMap.values());
        setAddresses(finalAddresses);
        setTotalAddresses(res.total_addresses !== undefined ? res.total_addresses : finalAddresses.length);
        await AsyncStorage.setItem(storageKey, JSON.stringify(finalAddresses));

        if (finalAddresses.length > 0) {
          const targetId = savedSelectedId || selectedId;
          const found = finalAddresses.find((a: any) => String(a.id) === String(targetId));
          const defaultItem = found || finalAddresses.find((a: any) => a.is_default) || finalAddresses[0];
          setSelectedId(defaultItem.id);
          populateForm(defaultItem);
        }
      }
    } catch (error) {
      console.warn('Error fetching addresses:', error);
      if (cachedList.length > 0) {
        const defaultItem = cachedList.find((a: any) => String(a.id) === String(savedSelectedId)) || cachedList.find((a: any) => a.is_default) || cachedList[0];
        setSelectedId(defaultItem.id);
        populateForm(defaultItem);
      }
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const populateForm = (addr: any) => {
    setEditingAddressId(addr.id || null);
    const nameVal = addr.full_name || addr.name || userName || user?.name || '';
    setFullName(nameVal === 'User' ? '' : nameVal);
    const phoneVal = addr.phone || addr.mobile || user?.phone || user?.mobile || '';
    setPhone(phoneVal);
    setDeliveryAddress(addr.address || '');
    setCity(addr.city || '');
    setStateName(addr.state || 'Tamil Nadu');
    setPincode(addr.pincode || '');
  };

  const resetFormForNew = () => {
    setEditingAddressId(null);
    setFullName(userName && userName !== 'User' ? userName : '');
    setPhone(user?.phone || user?.mobile || '');
    setDeliveryAddress('');
    setCity('');
    setStateName('Tamil Nadu');
    setPincode('');
    setViewMode('form');
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchAddresses();
  };

  const handleSelect = (item: any) => {
    setSelectedId(item.id);
    populateForm(item);
    if (onSelectAddress) {
      onSelectAddress(item);
      onClose();
    }
  };

  const handleDeleteAddress = (addr: any) => {
    setAddressToDelete(addr);
  };

  const confirmDeleteAddress = async (addr: any) => {
    const numericUserId = Number(user?.id);
    const addrId = addr.id;

    // Optimistically update address list
    setAddresses((prev) => prev.filter((a) => a.id !== addrId));
    setTotalAddresses((prev) => Math.max(0, prev - 1));

    try {
      if (!isNaN(numericUserId) && numericUserId > 0) {
        try {
          await apiClient(`/address/${numericUserId}/`, {
            method: 'DELETE',
            body: JSON.stringify({ address_id: addrId, id: addrId }),
          });
        } catch (e1) {
          try {
            await apiClient(`/address/${addrId}/`, { method: 'DELETE' });
          } catch (e2) {}
        }
      }
    } catch (err) {
      console.warn("Notice deleting address:", err);
    } finally {
      fetchAddresses();
    }
  };

  const [isLocating, setIsLocating] = useState(false);

  const fetchMobileLocation = async (): Promise<{ lat: string; lon: string } | null> => {
    if (Platform.OS === 'android') {
      try {
        await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Access Needed',
            message: 'Dharani Herbals needs location access to auto-detect your delivery address.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
      } catch (err) {
        console.warn('Location permission request notice:', err);
      }
    }

    const getNavLocation = (): Promise<{ lat: string; lon: string } | null> => {
      return new Promise((resolve) => {
        const geo = (globalThis as any)?.navigator?.geolocation;
        if (geo && typeof geo.getCurrentPosition === 'function') {
          geo.getCurrentPosition(
            (position: any) => {
              if (position?.coords?.latitude && position?.coords?.longitude) {
                resolve({
                  lat: String(position.coords.latitude),
                  lon: String(position.coords.longitude),
                });
              } else {
                resolve(null);
              }
            },
            () => resolve(null),
            { enableHighAccuracy: true, timeout: 8000, maximumAge: 10000 }
          );
        } else {
          resolve(null);
        }
      });
    };

    const navCoords = await getNavLocation();
    if (navCoords) return navCoords;

    try {
      const ipRes = await fetch('https://ipapi.co/json/', { headers: { 'Accept': 'application/json' } });
      if (ipRes.ok) {
        const ipData = await ipRes.json();
        if (ipData?.latitude && ipData?.longitude) {
          return { lat: String(ipData.latitude), lon: String(ipData.longitude) };
        }
      }
    } catch (e) {}

    try {
      const ipRes2 = await fetch('http://ip-api.com/json', { headers: { 'Accept': 'application/json' } });
      if (ipRes2.ok) {
        const ipData2 = await ipRes2.json();
        if (ipData2?.lat && ipData2?.lon) {
          return { lat: String(ipData2.lat), lon: String(ipData2.lon) };
        }
      }
    } catch (e) {}

    return null;
  };

  const handleAutoDetectLocation = async () => {
    setIsLocating(true);
    try {
      const coords = await fetchMobileLocation();
      const lat = coords?.lat || '11.35941';
      const lon = coords?.lon || '77.828346';

      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`, {
        headers: {
          'User-Agent': 'DharaniHerbalsApp/1.0',
          'Accept': 'application/json',
        }
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.address) {
          const addr = data.address;
          const detectedCity = addr.town || addr.city || addr.county || addr.village || addr.suburb || addr.state_district || '';
          const detectedState = addr.state || 'Tamil Nadu';
          const detectedPincode = addr.postcode || '';
          const road = addr.road || addr.suburb || addr.neighbourhood || '';
          const fullDisplay = [road, detectedCity, detectedState, detectedPincode].filter(Boolean).join(', ') || data.display_name || '';

          setDeliveryAddress(fullDisplay);
          setCity(detectedCity);
          setStateName(detectedState);
          setPincode(detectedPincode);
          setLocationSuccessMsg(`Detected: ${detectedCity}, ${detectedState}`);
          setShowLocationSuccess(true);
        }
      }
    } catch (err) {
      console.warn("Location reverse geocode error:", err);
      Alert.alert('Notice', 'Could not fetch reverse location.');
    } finally {
      setIsLocating(false);
    }
  };

  const handleSaveAddress = async () => {
    if (!fullName || !phone || !deliveryAddress || !pincode) {
      Alert.alert('Incomplete Form', 'Please fill in all address details.');
      return;
    }

    setIsSubmitting(true);
    let numericUserId = user?.id ? Number(user.id) : null;
    if (!numericUserId || isNaN(numericUserId) || numericUserId > 1000000) {
      try {
        const listRes = await apiClient('/customers/');
        const list = listRes?.data || (Array.isArray(listRes) ? listRes : []);
        const uEmail = (user?.email || '').toLowerCase().trim();
        const uPhone = (user?.phone || user?.mobile || '').replace(/\D/g, '').slice(-10);

        const matched = list.find((c: any) => {
          const cEmail = (c.email || '').toLowerCase().trim();
          const cPhone = (c.mobile || c.phone || '').replace(/\D/g, '').slice(-10);
          return (uEmail && cEmail && cEmail === uEmail) || (uPhone && cPhone && cPhone === uPhone);
        });
        if (matched && matched.id) {
          numericUserId = Number(matched.id);
        } else {
          numericUserId = 8;
        }
      } catch (e) {
        numericUserId = 8;
      }
    }
    if (!numericUserId) numericUserId = 8;

    const targetId = editingAddressId || `local_${Date.now()}`;
    const payload = {
      id: targetId,
      address_id: targetId,
      user_id: numericUserId,
      user: numericUserId,
      full_name: fullName.trim(),
      phone: phone.trim(),
      address: deliveryAddress.trim(),
      city: city.trim(),
      state: stateName.trim(),
      pincode: pincode.trim(),
      is_default: addresses.length === 0,
    };

    let updatedList: any[] = [];
    setAddresses(prev => {
      const exists = prev.some(a => String(a.id) === String(targetId));
      if (exists) {
        updatedList = prev.map(a => String(a.id) === String(targetId) ? { ...a, ...payload } : a);
      } else {
        updatedList = [payload, ...prev];
      }
      return updatedList;
    });

    const storageKey = getStorageKey(numericUserId);
    const selectedKey = getSelectedIdKey(numericUserId);
    try {
      await AsyncStorage.setItem(storageKey, JSON.stringify(updatedList));
      await AsyncStorage.setItem(selectedKey, String(targetId));
    } catch (_) {}

    setSelectedId(targetId);

    if (editingAddressId) {
      try {
        await apiClient(`/address/${editingAddressId}/`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } catch (e1) {
        try {
          await apiClient(`/address/${numericUserId}/`, {
            method: 'POST',
            body: JSON.stringify(payload),
          });
        } catch (e2) {
          try {
            await apiClient(`/address/${numericUserId}/`, {
              method: 'PUT',
              body: JSON.stringify(payload),
            });
          } catch (e3) {
            console.warn('API save address notice:', e3);
          }
        }
      }
    } else {
      try {
        await apiClient(`/address/${numericUserId}/`, {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      } catch (e1) {
        console.warn('API create address notice:', e1);
      }
    }

    setShowSuccessModal(true);
    setViewMode('list');
    setIsSubmitting(false);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.container, viewMode === 'form' && styles.formContainerBg]}>
          
          {/* VIEW MODE 1: LIST OF SAVED ADDRESSES */}
          {viewMode === 'list' && (
            <>
              {/* Header Bar */}
              <View style={styles.header}>
                <View style={styles.headerLeft}>
                  <View style={styles.headerIconCircle}>
                    <MapPin color={colors.primary} size={22} strokeWidth={2.5} />
                  </View>
                  <View>
                    <View style={styles.headerTitleRow}>
                      <Text style={styles.headerTitle}>Delivery Addresses</Text>
                      <View style={styles.countBadge}>
                        <Text style={styles.countBadgeText}>{totalAddresses} Saved</Text>
                      </View>
                    </View>
                    <Text style={styles.headerSubtitle}>Select or manage your shipping location</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
                  <X color="#64748B" size={20} strokeWidth={2.5} />
                </TouchableOpacity>
              </View>

              {/* Loading Indicator */}
              {isLoading && !refreshing ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator color={colors.primary} size="large" />
                  <Text style={styles.loadingText}>Fetching saved addresses...</Text>
                </View>
              ) : (
                <FlatList
                  data={addresses}
                  keyExtractor={(item, index) => item.id?.toString() || index.toString()}
                  contentContainerStyle={styles.listContent}
                  refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
                  ListEmptyComponent={() => (
                    <View style={styles.emptyContainer}>
                      <View style={styles.emptyIconCircle}>
                        <MapPin color="#94A3B8" size={44} strokeWidth={1.5} />
                      </View>
                      <Text style={styles.emptyTitle}>No Delivery Addresses</Text>
                      <Text style={styles.emptySubtitle}>You don't have any saved shipping addresses yet.</Text>
                    </View>
                  )}
                  renderItem={({ item }) => {
                    const name = item.full_name || item.name || userName || 'Customer';
                    const fullAddress = item.address || [item.address_line1, item.city, item.state, item.pincode].filter(Boolean).join(', ');
                    const itemPhone = item.phone;
                    const isSelected = selectedId === item.id;
                    const isDefault = Boolean(item.is_default);

                    return (
                      <TouchableOpacity
                        style={[styles.addressCard, isSelected && styles.addressCardSelected]}
                        onPress={() => handleSelect(item)}
                        activeOpacity={0.85}
                      >
                        {/* Card Top Row */}
                        <View style={styles.cardTopRow}>
                          <View style={styles.userSection}>
                            <View style={[styles.avatarCircle, isSelected && styles.avatarCircleSelected]}>
                              <Text style={[styles.avatarText, isSelected && styles.avatarTextSelected]}>
                                {name.charAt(0).toUpperCase()}
                              </Text>
                            </View>
                            <View style={styles.userInfoTextCol}>
                              <Text style={styles.addressName} numberOfLines={1}>{name}</Text>
                              {itemPhone && (
                                <View style={styles.phoneRow}>
                                  <Phone size={11} color="#64748B" />
                                  <Text style={styles.phoneText}>+91 {itemPhone}</Text>
                                </View>
                              )}
                            </View>
                          </View>

                          {/* Selection Radio / Badge */}
                          <View style={styles.badgeGroup}>
                            {isDefault && (
                              <View style={styles.defaultBadge}>
                                <ShieldCheck size={10} color="#059669" />
                                <Text style={styles.defaultBadgeText}>DEFAULT</Text>
                              </View>
                            )}
                            <TouchableOpacity 
                              style={styles.editCardBtn} 
                              onPress={() => {
                                populateForm(item);
                                setViewMode('form');
                              }}
                            >
                              <Text style={styles.editCardBtnText}>Edit</Text>
                            </TouchableOpacity>

                            <TouchableOpacity 
                              style={styles.deleteAddressCardBtn} 
                              onPress={() => handleDeleteAddress(item)}
                              activeOpacity={0.7}
                            >
                              <Trash2 size={14} color="#EF4444" />
                            </TouchableOpacity>

                            <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                              {isSelected && <CheckCircle2 size={20} color={colors.primary} strokeWidth={2.5} />}
                            </View>
                          </View>
                        </View>

                        {/* Address Body */}
                        <View style={styles.addressBody}>
                          <MapPin size={16} color={colors.primary} style={styles.pinIcon} />
                          <Text style={styles.addressText} numberOfLines={3}>{fullAddress}</Text>
                        </View>

                        {/* Meta Pill Badges */}
                        <View style={styles.metaRow}>
                          {item.city && (
                            <View style={styles.metaPill}>
                              <Home size={11} color="#475569" />
                              <Text style={styles.metaPillText}>{item.city}</Text>
                            </View>
                          )}
                          {item.state && (
                            <View style={styles.metaPill}>
                              <Text style={styles.metaPillText}>{item.state}</Text>
                            </View>
                          )}
                          {item.pincode && (
                            <View style={styles.metaPillPrimary}>
                              <Text style={styles.metaPillPrimaryText}>PIN {item.pincode}</Text>
                            </View>
                          )}
                          {item.latitude && item.longitude && (
                            <View style={styles.gpsPill}>
                              <Navigation size={10} color="#2563EB" />
                              <Text style={styles.gpsPillText}>GPS Verified</Text>
                            </View>
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  }}
                />
              )}

              {/* Footer Action Bar */}
              <View style={styles.footerBar}>
                <TouchableOpacity style={styles.addBtn} activeOpacity={0.9} onPress={resetFormForNew}>
                  <Plus size={18} color="#FFFFFF" strokeWidth={3} />
                  <Text style={styles.addBtnText}>Add New Shipping Address</Text>
                </TouchableOpacity>
              </View>
            </>
          )}


          {/* VIEW MODE 2: WEB-STYLE FORM UI (Mint Background, Rounded White Cards) */}
          {viewMode === 'form' && (
            <View style={styles.webFormWrapper}>
              {/* Form Top Header */}
              <View style={styles.webHeaderRow}>
                <Text style={styles.webHeaderTitle}>Shipping Address</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
                  <X color="#64748B" size={20} strokeWidth={2.5} />
                </TouchableOpacity>
              </View>

              {/* Back to Saved Addresses Link */}
              <TouchableOpacity 
                style={styles.backLinkRow} 
                onPress={() => setViewMode('list')}
                activeOpacity={0.7}
              >
                <ArrowLeft size={16} color="#64748B" strokeWidth={2.5} />
                <Text style={styles.backLinkText}>Back to saved addresses</Text>
              </TouchableOpacity>

              <ScrollView contentContainerStyle={styles.webFormContent} showsVerticalScrollIndicator={false}>
                {/* 1. Full Name */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Full Name</Text>
                  <View style={styles.webInputCard}>
                    <CheckCircle2 size={18} color="#16A34A" style={styles.inputIcon} />
                    <TextInput
                      style={styles.webTextInput}
                      value={fullName}
                      onChangeText={setFullName}
                      placeholder="Enter full name"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>
                </View>

                {/* 2. Phone Number */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Phone Number</Text>
                  <View style={styles.webInputCard}>
                    <Phone size={18} color="#64748B" style={styles.inputIcon} />
                    <TextInput
                      style={styles.webTextInput}
                      value={phone}
                      onChangeText={setPhone}
                      keyboardType="phone-pad"
                      placeholder="Enter phone number"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>
                </View>

                {/* 3. Delivery Address */}
                <View style={styles.inputGroup}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <Text style={styles.inputLabel}>Delivery Address</Text>
                    <TouchableOpacity
                      style={styles.gpsDetectBtn}
                      onPress={() => handleAutoDetectLocation()}
                      disabled={isLocating}
                      activeOpacity={0.7}
                    >
                      {isLocating ? (
                        <ActivityIndicator size="small" color="#1D4ED8" />
                      ) : (
                        <>
                          <Navigation size={13} color="#1D4ED8" strokeWidth={2.2} />
                          <Text style={styles.gpsDetectBtnText}>Use Current Location</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                  <View style={[styles.webInputCard, styles.webTextAreaCard]}>
                    <MapPin size={18} color="#64748B" style={[styles.inputIcon, { marginTop: 3 }]} />
                    <TextInput
                      style={[styles.webTextInput, styles.webTextAreaInput]}
                      value={deliveryAddress}
                      onChangeText={setDeliveryAddress}
                      multiline
                      numberOfLines={3}
                      placeholder="Enter house, street, locality"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>
                </View>

                {/* 4. City & State (2-Column Row) */}
                <View style={styles.twoColumnRow}>
                  {/* City */}
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>City</Text>
                    <View style={styles.webInputCard}>
                      <TextInput
                        style={styles.webTextInputNoIcon}
                        value={city}
                        onChangeText={setCity}
                        placeholder="Enter city"
                        placeholderTextColor="#94A3B8"
                      />
                    </View>
                  </View>

                  {/* State Dropdown */}
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>State</Text>
                    <TouchableOpacity 
                      style={styles.webDropdownCard} 
                      activeOpacity={0.8}
                      onPress={() => setShowStatePicker(true)}
                    >
                      <Text style={styles.webDropdownText} numberOfLines={1}>{stateName}</Text>
                      <ChevronDown size={18} color="#16A34A" strokeWidth={2.5} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* 5. PIN Code */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>PIN Code</Text>
                  <View style={styles.webInputCardPin}>
                    <TextInput
                      style={styles.webTextInputNoIcon}
                      value={pincode}
                      onChangeText={setPincode}
                      keyboardType="numeric"
                      maxLength={6}
                      placeholder="Enter 6-digit PIN"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>
                </View>

                {/* Save Address Button */}
                <TouchableOpacity 
                  style={styles.webSaveBtn} 
                  onPress={handleSaveAddress}
                  disabled={isSubmitting}
                  activeOpacity={0.9}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <Check size={18} color="#FFFFFF" strokeWidth={3} />
                      <Text style={styles.webSaveBtnText}>Save Address</Text>
                    </>
                  )}
                </TouchableOpacity>
              </ScrollView>
            </View>
          )}

          {/* State Picker Sub-Modal */}
          <Modal
            visible={showStatePicker}
            transparent
            animationType="slide"
            onRequestClose={() => setShowStatePicker(false)}
          >
            <TouchableOpacity 
              style={styles.pickerOverlay} 
              activeOpacity={1} 
              onPress={() => setShowStatePicker(false)}
            >
              <View style={styles.pickerModalContent}>
                <View style={styles.pickerHeader}>
                  <Text style={styles.pickerHeaderTitle}>Select State</Text>
                </View>
                <ScrollView style={{ maxHeight: 300 }}>
                  {stateList.map((st) => (
                    <TouchableOpacity
                      key={st}
                      style={styles.stateItem}
                      onPress={() => {
                        if (st !== stateName) {
                          setStateName(st);
                          setCity('');
                          setPincode('');
                          setDeliveryAddress('');
                        }
                        setShowStatePicker(false);
                      }}
                    >
                      <Text style={[styles.stateItemText, stateName === st && { color: colors.primary, fontWeight: '800' }]}>
                        {st}
                      </Text>
                      {stateName === st && <Check size={16} color={colors.primary} />}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </TouchableOpacity>
          </Modal>

        </View>
      </View>

      {/* Custom Delete Confirmation Popup Modal */}
      <Modal
        visible={Boolean(addressToDelete)}
        transparent
        animationType="fade"
        onRequestClose={() => setAddressToDelete(null)}
      >
        <TouchableOpacity 
          style={styles.confirmModalOverlay} 
          activeOpacity={1}
          onPress={() => setAddressToDelete(null)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.confirmModalCard}>
            <View style={styles.confirmIconCircle}>
              <Trash2 size={26} color="#EF4444" />
            </View>

            <Text style={styles.confirmTitle}>Delete Address</Text>
            <Text style={styles.confirmSubtitle}>
              Are you sure you want to remove this delivery address?
            </Text>

            <View style={styles.confirmBtnRow}>
              <TouchableOpacity 
                style={styles.cancelBtn}
                onPress={() => setAddressToDelete(null)}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelBtnText}>CANCEL</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.deleteConfirmBtn}
                onPress={async () => {
                  if (addressToDelete) {
                    await confirmDeleteAddress(addressToDelete);
                  }
                  setAddressToDelete(null);
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.deleteConfirmBtnText}>DELETE</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <SuccessModal
        visible={showSuccessModal}
        title="Address Saved!"
        message="Your shipping address details have been saved successfully."
        buttonText="Continue"
        onClose={() => setShowSuccessModal(false)}
      />

      <SuccessModal
        visible={showLocationSuccess}
        title="Location Detected"
        message={locationSuccessMsg}
        buttonText="OK"
        onClose={() => setShowLocationSuccess(false)}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#FAFCFC',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '88%',
    minHeight: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 20,
  },
  formContainerBg: {
    backgroundColor: '#EBF4ED', // Mint green background matching web UI image
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  countBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#047857',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 10,
    fontWeight: '500',
  },
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#334155',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 30,
  },
  addressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3,
  },
  addressCardSelected: {
    borderColor: colors.primary,
    backgroundColor: '#F0FDF4',
    shadowColor: colors.primary,
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginRight: 6,
  },
  userInfoTextCol: {
    flex: 1,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCircleSelected: {
    backgroundColor: colors.primary,
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#334155',
  },
  avatarTextSelected: {
    color: '#FFFFFF',
  },
  addressName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  phoneText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    lineHeight: 16,
    includeFontPadding: false,
  },
  badgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  defaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  defaultBadgeText: {
    color: '#047857',
    fontSize: 9,
    fontWeight: '800',
  },
  editCardBtn: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  editCardBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  deleteAddressCardBtn: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
  radioCircleSelected: {
    borderColor: colors.primary,
    borderWidth: 0,
  },
  addressBody: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(248, 250, 252, 0.8)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  pinIcon: {
    marginTop: 2,
  },
  addressText: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '600',
    color: '#334155',
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  metaPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  metaPillPrimary: {
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  metaPillPrimaryText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#3730A3',
  },
  gpsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  gpsPillText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  footerBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  addBtn: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },

  /* WEB FORM SPECIFIC STYLES (Matching Image) */
  webFormWrapper: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 20,
  },
  webHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  webHeaderTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1E293B',
    letterSpacing: -0.4,
  },
  backLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  backLinkText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#475569',
  },
  gpsDetectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  gpsDetectBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1D4ED8',
  },
  webFormContent: {
    paddingBottom: 30,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  webInputCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  webInputCardPin: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    maxWidth: '50%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  webTextAreaCard: {
    alignItems: 'flex-start',
    paddingVertical: 10,
  },
  inputIcon: {
    marginRight: 10,
  },
  webTextInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    padding: 0,
  },
  webTextInputNoIcon: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    padding: 0,
  },
  webTextAreaInput: {
    minHeight: 54,
    textAlignVertical: 'top',
  },
  twoColumnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  webDropdownCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderWidth: 1.5,
    borderColor: colors.primary, // Highlighted green border matching image!
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  webDropdownText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  webSaveBtn: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  webSaveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  pickerModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  pickerHeader: {
    marginBottom: 14,
  },
  pickerHeaderTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  stateItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  stateItemText: {
    fontSize: 15,
    color: '#334155',
    fontWeight: '600',
  },

  /* Custom Delete Confirmation Modal Styles */
  confirmModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  confirmModalCard: {
    width: '100%',
    maxWidth: 330,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  confirmIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  confirmTitle: {
    fontSize: 19,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 8,
    textAlign: 'center',
  },
  confirmSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  confirmBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: '100%',
    gap: 12,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  deleteConfirmBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#EF4444',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  deleteConfirmBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});

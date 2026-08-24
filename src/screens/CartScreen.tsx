import React, { useEffect, useState, useRef, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  ActivityIndicator, 
  Animated, 
  Alert, 
  RefreshControl, 
  TextInput, 
  ScrollView,
  Modal,
  Linking,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useIsFocused } from '@react-navigation/native';

let WebView: any = null;
try {
  WebView = require('react-native-webview').WebView;
} catch (e) {
  console.warn('react-native-webview not linked natively yet');
}
import { 
  Minus, 
  Plus, 
  Trash2, 
  ShoppingCart, 
  ArrowRight, 
  ShieldCheck, 
  MapPin, 
  Phone, 
  ChevronDown,
  Check,
  ArrowLeft,
  CreditCard,
  Wallet,
  Truck,
  Mail,
  Navigation,
  User,
  ShoppingBag,
  X
} from 'lucide-react-native';
import { colors } from '../theme/colors';
import { useCartStore } from '../store/useCartStore';
import { useLocation } from '../hooks/useLocation';

import { useAuthStore } from '../store/useAuthStore';
import { useShippingStore } from '../store/useShippingStore';
import SuccessModal from '../components/SuccessModal';
import AddressModal from '../components/AddressModal';
import { getImageUrl } from '../utils/imageUrl';
import { apiClient } from '../api/client';

const INDIAN_STATES = [
  'Tamil Nadu',
  'Kerala',
  'Karnataka',
  'Andhra Pradesh',
  'Telangana',
  'Maharashtra',
  'Puducherry',
  'Delhi',
  'Gujarat',
  'Rajasthan',
];

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
};

const AnimatedQtyBtn = ({ onPress, disabled, children, style }: any) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (disabled) return;
    Animated.spring(scaleAnim, { toValue: 0.85, useNativeDriver: true }).start();
  };

  const handlePressOut = () => {
    if (disabled) return;
    Animated.spring(scaleAnim, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={style}
        disabled={disabled}
        activeOpacity={0.9}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function CartScreen() {
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  const { isLocating: isLocatingCart, getLocationOnce, requestLocationPermission } = useLocation();

  const items = useCartStore((s) => s.items);
  const isLoading = useCartStore((s) => s.isLoading);
  const fetchCart = useCartStore((s) => s.fetchCart);
  const increaseQuantity = useCartStore((s) => s.increaseQuantity);
  const decreaseQuantity = useCartStore((s) => s.decreaseQuantity);
  const removeFromCart = useCartStore((s) => s.removeFromCart);
  const getTotalPrice = useCartStore((s) => s.getTotalPrice);
  const checkout = useCartStore((s) => s.checkout);
  const createPaytmOrder = useCartStore((s) => s.createPaytmOrder);
  const verifyPaytmCallback = useCartStore((s) => s.verifyPaytmCallback);
  const clearCart = useCartStore((s) => s.clearCart);
  const productTotal = useCartStore((s) => s.productTotal);
  const deliveryCharge = useCartStore((s) => s.deliveryCharge);
  const taxTotal = useCartStore((s) => s.taxTotal);
  const grandTotal = useCartStore((s) => s.grandTotal);
  const cgst = useCartStore((s) => s.cgst);
  const sgst = useCartStore((s) => s.sgst);
  const igst = useCartStore((s) => s.igst);
  const cartAddress = useCartStore((s) => s.cartAddress);

  const [refreshing, setRefreshing] = useState(false);
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [showCheckoutSuccess, setShowCheckoutSuccess] = useState(false);
  const [shippingAddress, setShippingAddress] = useState<any>(null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showStatePicker, setShowStatePicker] = useState(false);
  const [paytmWebViewUrl, setPaytmWebViewUrl] = useState<any>(null);
  const [paytmDirectUrl, setPaytmDirectUrl] = useState<string>('');
  const [showPaytmWebView, setShowPaytmWebView] = useState(false);

  // Screen mode: false = My Cart List, true = Checkout Stepper
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // Stepper state: 1 = Contact, 2 = Shipping, 3 = Payment
  const [currentStep, setCurrentStep] = useState<number>(1); // Default to Contact step

  // Helper to check if email is auto-generated dummy email
  const isRealUserEmail = (emailVal: string) => {
    if (!emailVal) return false;
    const lower = emailVal.toLowerCase().trim();
    return !lower.includes('@user.com') && lower !== 'user@vedanmart.com' && !lower.includes('guest');
  };

  const getValidProfileName = (userObj: any): string => {
    if (!userObj) return '';
    const rawName = (userObj.name || userObj.full_name || userObj.username || userObj.first_name || '').trim();
    if (!rawName) return '';
    const lower = rawName.toLowerCase();
    if (lower === 'user' || lower === 'guest' || lower === 'guest user' || lower === 'guest_email' || lower.includes('guest')) {
      return '';
    }
    return rawName;
  };

  const userPhone = user?.phone || user?.mobile || '';

  // Contact Form State
  const [contactEmail, setContactEmail] = useState(isRealUserEmail(user?.email) ? user.email : '');
  const [contactPhone, setContactPhone] = useState(userPhone);
  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');

  // Shipping Form State (Auto-filled with profile name if set, else blank placeholder)
  const initialName = getValidProfileName(user);
  const initialPhone = userPhone;

  const [formFullName, setFormFullName] = useState(initialName);
  const [formPhone, setFormPhone] = useState(initialPhone);
  const [formAddress, setFormAddress] = useState('');
  const [formCity, setFormCity] = useState('');
  const [formState, setFormState] = useState('');
  const [formPincode, setFormPincode] = useState('');
  const [isFormInitialized, setIsFormInitialized] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);

  // Shipping Form Error States
  const [shippingNameError, setShippingNameError] = useState('');
  const [shippingPhoneError, setShippingPhoneError] = useState('');
  const [shippingAddressError, setShippingAddressError] = useState('');
  const [shippingCityError, setShippingCityError] = useState('');
  const [shippingStateError, setShippingStateError] = useState('');
  const [shippingPincodeError, setShippingPincodeError] = useState('');

  // Location Success Modal State
  const [showLocationSuccess, setShowLocationSuccess] = useState(false);
  const [locationSuccessMsg, setLocationSuccessMsg] = useState('');

  // Payment Method State
  const [paymentMethod, setPaymentMethod] = useState<'paytm' | 'upi' | 'cod'>('paytm');

  const fetchShippingRules = useShippingStore((state) => state.fetchShippingRules);
  const calculateShipping = useShippingStore((state) => state.calculateShipping);
  const indianStates = useShippingStore((state) => state.stateList);

  const calcSubtotal = items.reduce((sum, item) => {
    const p = parseFloat(item.price || item.product?.price || 0);
    const qty = item.quantity || 1;
    return sum + (p * qty);
  }, 0);

  const subtotal = calcSubtotal > 0 ? calcSubtotal : (productTotal > 0 ? productTotal : getTotalPrice());
  const activeState = formState || shippingAddress?.state || '';
  const activeAddr = formAddress || shippingAddress?.address || '';
  const hasLocation = Boolean(activeState.trim() || activeAddr.trim());

  const shippingInfo = useMemo(() => {
    return calculateShipping(subtotal, activeState || activeAddr);
  }, [subtotal, activeState, activeAddr, calculateShipping]);

  const currentDeliveryCharge = shippingInfo.shippingFee;
  const finalTotal = subtotal + currentDeliveryCharge + taxTotal;

  useEffect(() => {
    fetchShippingRules();
  }, [fetchShippingRules]);

  useEffect(() => {
    if (user) {
      const uEmail = user.email || user.email_address || '';
      if (uEmail && isRealUserEmail(uEmail)) {
        if (!contactEmail || contactEmail !== uEmail) setContactEmail(uEmail);
      }
      const uPhone = user.phone || user.mobile || '';
      if (uPhone) {
        if (!contactPhone) setContactPhone(uPhone);
        if (!formPhone) setFormPhone(uPhone);
      }
      const uName = user.name || user.full_name || '';
      if (uName && uName !== 'User') {
        if (!formFullName || formFullName === 'User' || formFullName === '') {
          setFormFullName(uName);
        }
      }
    }
  }, [user?.email, user?.phone, user?.mobile, user?.name, isFocused, isCheckingOut]);

  useEffect(() => {
    if (isFocused) {
      fetchShippingRules();
      if (user?.id) {
        fetchCart(user.id, activeState);
        fetchShippingAddress();
        useAuthStore.getState().fetchCustomerProfile(user.id);
      }
    }
  }, [isFocused, user?.id]);

  const fetchShippingAddress = async () => {
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
          if (matched.email && isRealUserEmail(matched.email) && !contactEmail) {
            setContactEmail(matched.email);
            useAuthStore.getState().updateProfile({ email: matched.email });
          }
        } else {
          numericUserId = 8;
        }
      } catch (e) {
        numericUserId = 8;
      }
    }
    if (!numericUserId) numericUserId = 8;

    try {
      if (cartAddress) {
        setShippingAddress(cartAddress);
        if (cartAddress.email && isRealUserEmail(cartAddress.email) && !contactEmail) {
          setContactEmail(cartAddress.email);
          useAuthStore.getState().updateProfile({ email: cartAddress.email });
        }
        if (!isFormInitialized) {
          const profileName = getValidProfileName(user);
          const addrName = getValidProfileName({ name: cartAddress.full_name || cartAddress.name });
          setFormFullName(profileName || addrName || '');
          const phoneVal = cartAddress.phone || cartAddress.mobile || userPhone || initialPhone;
          setFormPhone(phoneVal);
          setFormAddress(cartAddress.address || '');
          setFormCity(cartAddress.city || '');
          setFormState(cartAddress.state || '');
          setFormPincode(cartAddress.pincode || '');
          setIsFormInitialized(true);
        }
        return;
      }
      
      if (!numericUserId || isNaN(numericUserId) || numericUserId <= 0) return;

      const res = await apiClient(`/address/${numericUserId}/`);
      if (res) {
        if (res.user_email && isRealUserEmail(res.user_email) && !contactEmail) {
          setContactEmail(res.user_email);
          useAuthStore.getState().updateProfile({ email: res.user_email });
        }
        if (res.user_name) {
          const validResName = getValidProfileName({ name: res.user_name });
          if (validResName && (!formFullName || formFullName.toLowerCase().includes('guest'))) {
            setFormFullName(validResName);
          }
        }
        const addressList = res.addresses || (Array.isArray(res) ? res : []);
        if (addressList.length > 0) {
          const defaultAddr = addressList.find((a: any) => a.is_default) || addressList[0];
          setShippingAddress(defaultAddr);
          if (defaultAddr.email && isRealUserEmail(defaultAddr.email) && !contactEmail) {
            setContactEmail(defaultAddr.email);
            useAuthStore.getState().updateProfile({ email: defaultAddr.email });
          }
          if (!isFormInitialized) {
            const nameVal = user?.name && user.name !== 'User' ? user.name : (defaultAddr.full_name || defaultAddr.name || initialName);
            setFormFullName(nameVal === 'User' ? '' : nameVal);
            const phoneVal = defaultAddr.phone || defaultAddr.mobile || userPhone || initialPhone;
            setFormPhone(phoneVal);
            setFormAddress(defaultAddr.address || '');
            setFormCity(defaultAddr.city || '');
            setFormState(defaultAddr.state || '');
            setFormPincode(defaultAddr.pincode || '');
            setIsFormInitialized(true);
          }
        }
      }
    } catch (err) {
      console.warn("Notice fetching address for cart:", err);
    }
  };

  const handleAutoDetectLocationCart = async () => {
    try {
      let coords = await getLocationOnce();
      if (!coords) {
        const granted = await requestLocationPermission();
        if (granted) {
          coords = await getLocationOnce();
        }
      }

      if (!coords) {
        Alert.alert('Location Access Needed', 'Please enable location permission to auto-detect your delivery address.');
        return;
      }

      const lat = String(coords.latitude);
      const lon = String(coords.longitude);

      // Primary Reverse Geocode GET Endpoint: Nominatim OpenStreetMap
      try {
        const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;
        const res1 = await fetch(url, {
          headers: {
            'User-Agent': 'VedanMartApp/1.0',
            'Accept': 'application/json',
          }
        });

        if (res1.ok) {
          const osmData = await res1.json();
          if (osmData && osmData.address) {
            const addr = osmData.address;
            const detectedCity = addr.city || addr.town || addr.county || addr.village || addr.suburb || addr.state_district || 'Chennai';
            const detectedState = addr.state || 'Tamil Nadu';
            const detectedPincode = addr.postcode || '';

            setFormAddress(detectedCity);
            setFormCity(detectedCity);
            if (detectedState) setFormState(detectedState);
            if (detectedPincode) setFormPincode(detectedPincode);
            setLocationSuccessMsg(`City Detected: ${detectedCity}`);
            setShowLocationSuccess(true);
            return;
          }
        }
      } catch (e1) {
        console.warn("Nominatim reverse geocode GET endpoint notice:", e1);
      }

      // Secondary Fallback Reverse Geocoder: BigDataCloud
      try {
        const res2 = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`);
        if (res2.ok) {
          const bdData = await res2.json();
          if (bdData) {
            const detectedCity = bdData.city || bdData.locality || bdData.principalSubdivision || '';
            const detectedState = bdData.principalSubdivision || 'Tamil Nadu';
            const detectedPincode = bdData.postcode || '';

            if (detectedCity) {
              setFormAddress(detectedCity);
              setFormCity(detectedCity);
              if (detectedState) setFormState(detectedState);
              if (detectedPincode) setFormPincode(detectedPincode);
              setLocationSuccessMsg(`City Detected: ${detectedCity}`);
              setShowLocationSuccess(true);
              return;
            }
          }
        }
      } catch (e2) {
        console.warn("BigDataCloud reverse geocode notice:", e2);
      }

      // Fallback: Display raw GPS coordinates if reverse geocoding network fails
      const coordStr = `GPS: ${lat.slice(0, 8)}, ${lon.slice(0, 8)}`;
      setFormAddress(coordStr);
      setLocationSuccessMsg(`Location fetched: ${lat.slice(0, 8)}, ${lon.slice(0, 8)}`);
      setShowLocationSuccess(true);
    } catch (err) {
      console.warn("Location reverse geocode error in cart:", err);
      Alert.alert('Location Notice', 'Could not detect exact location address automatically. Please enter your address details.');
    }
  };


  const validateContactFields = () => {
    let cleanPhone = (contactPhone || userPhone || '').replace(/\D/g, '');
    let trimmedEmail = (contactEmail || '').trim();

    // Auto-fill phone if missing or invalid
    if (!cleanPhone || cleanPhone.length < 10) {
      cleanPhone = userPhone ? userPhone.replace(/\D/g, '') : '9999999999';
      if (!cleanPhone || cleanPhone.length < 10) cleanPhone = '9999999999';
      setContactPhone(cleanPhone);
    }
    setPhoneError('');

    // Auto-fill fallback email if missing or invalid
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      trimmedEmail = `${cleanPhone}@vedanmart.com`;
      setContactEmail(trimmedEmail);
    }
    setEmailError('');

    return true;
  };

  const handleProceedToShipping = () => {
    validateContactFields();
    if (contactEmail && isRealUserEmail(contactEmail)) {
      const emailTrim = contactEmail.trim();
      useAuthStore.getState().updateProfile({ email: emailTrim });
    }
    setCurrentStep(2);
  };

  const validateShippingFields = () => {
    let hasError = false;

    if (!formFullName || !formFullName.trim()) {
      const nameFallback = (user?.name && user.name !== 'User') ? user.name : 'Customer';
      setFormFullName(nameFallback);
      setShippingNameError('');
    } else {
      setShippingNameError('');
    }

    const cleanPhone = (formPhone || contactPhone || userPhone || '').replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      setShippingPhoneError('Enter the mobile number');
      hasError = true;
    } else {
      if (!formPhone) setFormPhone(cleanPhone);
      setShippingPhoneError('');
    }

    if (!formAddress || !formAddress.trim()) {
      setShippingAddressError('Enter the shipping address');
      hasError = true;
    } else {
      setShippingAddressError('');
    }

    if (!formCity || !formCity.trim()) {
      setShippingCityError('Enter the city');
      hasError = true;
    } else {
      setShippingCityError('');
    }

    if (!formState || !formState.trim()) {
      setShippingStateError('Select the state');
      hasError = true;
    } else {
      setShippingStateError('');
    }

    if (!formPincode || !formPincode.trim() || formPincode.trim().length < 6) {
      setShippingPincodeError('Enter the pincode');
      hasError = true;
    } else {
      setShippingPincodeError('');
    }

    return !hasError;
  };

  const handleCheckout = async () => {
    if (currentStep === 1) {
      handleProceedToShipping();
      return;
    }

    const extractAddressObj = (res: any) => {
      if (!res) return null;
      if (res.address_id || res.id) return res;
      if (res.data && (res.data.id || res.data.address_id)) return res.data;
      if (res.address && (res.address.id || res.address.address_id)) return res.address;
      if (Array.isArray(res) && res.length > 0) return res[0];
      if (Array.isArray(res?.addresses) && res.addresses.length > 0) return res.addresses[0];
      return null;
    };

    const getAddrId = (obj: any) => {
      const idVal = obj?.address_id || obj?.id || obj?.pk;
      const num = Number(idVal);
      return (!isNaN(num) && num > 0) ? num : null;
    };

    if (currentStep === 2) {
      if (!validateShippingFields()) return;

      // Ensure address is saved/posted to backend to obtain a valid address_id if needed
      try {
        let numericUserId = Number(user?.id);
        if (isNaN(numericUserId) || numericUserId <= 0) numericUserId = 8;
        
        const addrPayload = {
          user_id: numericUserId,
          full_name: formFullName.trim(),
          phone: (contactPhone || formPhone).trim(),
          address: formAddress.trim(),
          city: formCity.trim(),
          state: formState.trim(),
          pincode: formPincode.trim(),
          is_default: true,
        };
        
        const savedRes = await apiClient(`/address/${numericUserId}/`, {
          method: 'POST',
          body: JSON.stringify(addrPayload),
        });

        const extracted = extractAddressObj(savedRes);
        if (extracted) {
          setShippingAddress(extracted);
        }
      } catch (err) {
        console.warn("Auto save address notice:", err);
      }

      setCurrentStep(3);
      return;
    }

    const targetUserId = user?.id || '';
    let numericUserId = Number(user?.id);
    if (isNaN(numericUserId) || numericUserId <= 0) numericUserId = 8;

    let activeAddressObj = extractAddressObj(shippingAddress) || extractAddressObj(cartAddress);
    let activeAddressId = getAddrId(activeAddressObj);

    // If no valid DB address ID yet, attempt to save or fetch real address ID from backend
    if (!activeAddressId) {
      try {
        const addrPayload = {
          user_id: numericUserId,
          full_name: formFullName.trim(),
          phone: (contactPhone || formPhone).trim(),
          address: formAddress.trim(),
          city: formCity.trim(),
          state: formState.trim(),
          pincode: formPincode.trim(),
          is_default: true,
        };
        const savedRes = await apiClient(`/address/${numericUserId}/`, {
          method: 'POST',
          body: JSON.stringify(addrPayload),
        });
        const extracted = extractAddressObj(savedRes);
        if (extracted) {
          setShippingAddress(extracted);
          activeAddressObj = extracted;
          activeAddressId = getAddrId(extracted);
        }
      } catch (e1) {
        console.warn("Attempt save address in step 3 notice:", e1);
      }

      if (!activeAddressId) {
        try {
          const fetchRes = await apiClient(`/address/${numericUserId}/`);
          const extracted = extractAddressObj(fetchRes);
          if (extracted) {
            setShippingAddress(extracted);
            activeAddressObj = extracted;
            activeAddressId = getAddrId(extracted);
          }
        } catch (e2) {
          console.warn("Attempt fetch address in step 3 notice:", e2);
        }
      }
    }

    const generatedOrderId = `DH_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    try {
      const checkoutPayload: any = {
        user_id: targetUserId || numericUserId,
        user: targetUserId || numericUserId,
        customer: targetUserId || numericUserId,
        order_id: generatedOrderId,
        ORDER_ID: generatedOrderId,
        email: contactEmail.trim(),
        phone: (contactPhone || formPhone).trim(),
        name: formFullName.trim(),
        full_name: formFullName.trim(),
        address: formAddress.trim(),
        city: formCity.trim(),
        state: formState.trim(),
        pincode: formPincode.trim(),
        amount: finalTotal,
        total_amount: finalTotal,
        items: items,
      };

      if (activeAddressId) {
        checkoutPayload.address_id = activeAddressId;
        checkoutPayload.id = activeAddressId;
        checkoutPayload.address_pk = activeAddressId;
      }

      // 1. Fetch /checkout/
      let checkoutRes = await checkout(checkoutPayload);
      if (!checkoutRes || checkoutRes.error || (!checkoutRes.id && !checkoutRes.order_id && !checkoutRes.pk && !checkoutRes.data)) {
        try {
          checkoutRes = await apiClient('/orders/', {
            method: 'POST',
            body: JSON.stringify({
              user: targetUserId || numericUserId,
              customer: targetUserId || numericUserId,
              user_id: targetUserId || numericUserId,
              order_id: generatedOrderId,
              total_amount: finalTotal,
              amount: finalTotal,
              items: items,
              name: formFullName.trim(),
              phone: (contactPhone || formPhone).trim(),
              address: formAddress.trim(),
              city: formCity.trim(),
              state: formState.trim(),
              pincode: formPincode.trim(),
              ...(activeAddressId ? { address_id: activeAddressId } : {}),
            }),
          });
        } catch (_) {}
      }

      const finalOrderId = checkoutRes?.order_id || checkoutRes?.id || checkoutRes?.data?.order_id || checkoutRes?.pk || generatedOrderId;
      const dbId = checkoutRes?.id || checkoutRes?.data?.id || checkoutRes?.pk || checkoutRes?.order_id || finalOrderId;

      const finalPayload = {
        ...checkoutPayload,
        order_id: finalOrderId,
        ORDER_ID: finalOrderId,
        id: dbId,
        order: dbId,
        pk: dbId,
        order_pk: dbId,
      };

      // 2. Fetch /create-paytm-order/
      let paytmResponse: any = null;
      try {
        paytmResponse = await createPaytmOrder(targetUserId, finalTotal, finalPayload);
      } catch (errPayload: any) {
        paytmResponse = errPayload;
      }

      const txnToken = paytmResponse?.txnToken || paytmResponse?.token || paytmResponse?.body?.txnToken || paytmResponse?.paytm_response?.body?.txnToken || '';
      const activePaytmOrderId = paytmResponse?.paytm_order_id || paytmResponse?.order_id || paytmResponse?.ORDER_ID || finalOrderId;
      const paytmAmount = paytmResponse?.amount ? String(paytmResponse.amount) : String(finalTotal);
      const mid = paytmResponse?.mid || 'YyffBp11837369316995';

      if (!txnToken || paytmResponse?.success === false) {
        const errorMsg = paytmResponse?.message || paytmResponse?.error || 'Unable to connect to Paytm server.';
        Alert.alert(
          'Paytm Server Connection Notice',
          `The server experienced a temporary network timeout connecting to Paytm.\n\nDetail: ${errorMsg}\n\nPlease tap Retry to try generating the Paytm token again.`,
          [
            { text: 'Retry', onPress: () => handleCheckout() },
            { text: 'Cancel', style: 'cancel' }
          ]
        );
        return;
      }

      const isStaging = paytmResponse?.environment === 'staging' || paytmResponse?.is_stage;
      const paytmHost = paytmResponse?.host || paytmResponse?.paytm_host || (isStaging ? 'securegw-stage.paytm.in' : 'secure.paytmpayments.com');

      if (paytmResponse?.html) {
        setPaytmWebViewUrl({ html: paytmResponse.html, baseUrl: `https://${paytmHost}` });
      } else if (paytmResponse?.redirect_url && !paytmResponse.redirect_url.includes('/showPaymentPage')) {
        setPaytmWebViewUrl({ uri: paytmResponse.redirect_url });
      } else {
        const paytmFormHtml = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
              <title>Paytm Payment Gateway</title>
              <style>
                body { font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #FAFCFC; color: #0F172A; text-align: center; padding: 20px; box-sizing: border-box; }
                .loader { width: 44px; height: 44px; border: 4px solid #E2E8F0; border-top: 4px solid #10B981; border-radius: 50%; animation: spin 0.8s linear infinite; margin-bottom: 20px; }
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                h3 { font-size: 18px; margin: 0 0 8px 0; font-weight: 800; }
                p { font-size: 13px; color: #64748B; margin: 0; }
              </style>
            </head>
            <body>
              <div class="loader"></div>
              <h3>Connecting to Paytm Gateway...</h3>
              <p>Please wait, redirecting securely to Paytm payment page.</p>
              
              <!-- Standard POST Form Redirect -->
              <form id="paytmAutoForm" method="post" action="https://${paytmHost}/theia/api/v1/showPaymentPage?mid=${encodeURIComponent(mid)}&orderId=${encodeURIComponent(activePaytmOrderId)}">
                <input type="hidden" name="mid" value="${mid}" />
                <input type="hidden" name="orderId" value="${activePaytmOrderId}" />
                <input type="hidden" name="txnToken" value="${txnToken}" />
              </form>
              
              <script type="text/javascript">
                // Instantly submit the form, forcing the WebView to navigate to the Paytm Checkout Page
                document.getElementById('paytmAutoForm').submit();
              </script>
            </body>
          </html>
        `;
        setPaytmWebViewUrl({ html: paytmFormHtml, baseUrl: 'https://api.codingboss.in' });
        const directPaymentUrl = `https://${paytmHost}/theia/api/v1/showPaymentPage?mid=${encodeURIComponent(mid)}&orderId=${encodeURIComponent(activePaytmOrderId)}&txnToken=${encodeURIComponent(txnToken)}`;
        const fallbackUrl = paytmResponse?.web_url || paytmResponse?.paytm_url || paytmResponse?.redirect_url || directPaymentUrl;
        setPaytmDirectUrl(fallbackUrl);
      }

      if (WebView) {
        setShowPaytmWebView(true);
      } else {
        const directPaymentUrl = `https://${paytmHost}/theia/api/v1/showPaymentPage?mid=${encodeURIComponent(mid)}&orderId=${encodeURIComponent(activePaytmOrderId)}&txnToken=${encodeURIComponent(txnToken)}`;
        const fallbackUrl = paytmResponse?.web_url || paytmResponse?.paytm_url || paytmResponse?.redirect_url || directPaymentUrl;
        try {
          await Linking.openURL(fallbackUrl);
        } catch (err) {
          console.warn('Could not launch external browser URL:', err);
        }
      }
    } catch (e: any) {
      Alert.alert('Checkout Failed', e?.message || 'Could not initialize payment. Please try again.');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchShippingRules();
    if (user?.id) {
      await fetchCart(user.id, activeState);
      await fetchShippingAddress();
    }
    setRefreshing(false);
  };



  // Top Stepper Navigation (Contact - Shipping - Payment)
  const renderStepper = () => (
    <View style={styles.stepperContainer}>
      {/* Step 1: Contact */}
      <TouchableOpacity 
        style={styles.stepTab} 
        onPress={() => setCurrentStep(1)}
        activeOpacity={0.8}
      >
        {currentStep > 1 ? (
          <View style={styles.completedBadge}>
            <Check size={12} color="#FFFFFF" strokeWidth={3} />
          </View>
        ) : (
          <View style={[styles.stepBadge, currentStep === 1 && styles.activeStepBadge]}>
            <Text style={[styles.stepBadgeText, currentStep === 1 && styles.activeStepBadgeText]}>1</Text>
          </View>
        )}
        <Text style={[styles.stepLabel, currentStep === 1 && styles.activeStepLabel, currentStep > 1 && styles.completedStepLabel]}>
          Contact
        </Text>
      </TouchableOpacity>

      <View style={[styles.stepLine, currentStep >= 2 && styles.activeStepLine]} />

      {/* Step 2: Shipping */}
      <TouchableOpacity 
        style={styles.stepTab} 
        onPress={() => {
          if (!validateContactFields()) {
            setCurrentStep(1);
            return;
          }
          setCurrentStep(2);
        }}
        activeOpacity={0.8}
      >
        {currentStep > 2 ? (
          <View style={styles.completedBadge}>
            <Check size={12} color="#FFFFFF" strokeWidth={3} />
          </View>
        ) : (
          <View style={[styles.stepBadge, currentStep === 2 && styles.activeStepBadge]}>
            <Text style={[styles.stepBadgeText, currentStep === 2 && styles.activeStepBadgeText]}>2</Text>
          </View>
        )}
        <Text style={[styles.stepLabel, currentStep === 2 && styles.activeStepLabel, currentStep > 2 && styles.completedStepLabel]}>
          Shipping
        </Text>
      </TouchableOpacity>

      <View style={[styles.stepLine, currentStep >= 3 && styles.activeStepLine]} />

      {/* Step 3: Payment */}
      <TouchableOpacity 
        style={styles.stepTab} 
        onPress={() => {
          if (!validateContactFields()) {
            setCurrentStep(1);
            return;
          }
          if (!validateShippingFields()) {
            setCurrentStep(2);
            return;
          }
          setCurrentStep(3);
        }}
        activeOpacity={0.8}
      >
        <View style={[styles.stepBadge, currentStep === 3 && styles.activeStepBadge]}>
          <Text style={[styles.stepBadgeText, currentStep === 3 && styles.activeStepBadgeText]}>3</Text>
        </View>
        <Text style={[styles.stepLabel, currentStep === 3 && styles.activeStepLabel]}>
          Payment
        </Text>
      </TouchableOpacity>
    </View>
  );

  // ─── Guest View: Login / Sign Up Prompt ──────────────────────────────────
  const renderGuestLoginPrompt = () => (
    <View style={styles.guestContainer}>
      <View style={styles.guestIconCircle}>
        <User size={56} color="#16A34A" />
      </View>
      <Text style={styles.guestTitle}>Welcome to Vedan Mart</Text>
      <Text style={styles.guestSubtitle}>
        Sign in to view your cart, track orders, and manage shipping addresses.
      </Text>
      <TouchableOpacity 
        style={styles.loginBtn}
        onPress={() => navigation.navigate('Login')}
        activeOpacity={0.9}
      >
        <Text style={styles.loginBtnText}>Login / Sign Up</Text>
        <ArrowRight color="#FFFFFF" size={20} style={{ marginLeft: 8 }} />
      </TouchableOpacity>
    </View>
  );

  // ─── Phase 1: My Cart Product List View ──────────────────────────────────
  const renderCartItemListView = () => (
    <View style={styles.cartListViewContainer}>
      <Text style={styles.cartListHeaderTitle}>Cart Products ({items.length})</Text>
      
      {items.map((item, idx) => {
        const name = item.product_name || item.product?.name || (item as any).name || 'Herbal Product';
        const image = item.product_image || item.product?.image || (item as any).image;
        const price = parseFloat(String(item.price || item.product?.price || 0));
        const itemTotal = price * item.quantity;

        return (
          <View key={item.id?.toString() || idx.toString()} style={styles.cartItemCard}>
            {/* Product Image */}
            <Image source={getImageUrl(image)} style={styles.cartItemImage} />

            {/* Product Info & Controls */}
            <View style={styles.cartItemDetails}>
              <View style={styles.cartItemHeaderRow}>
                <Text style={styles.cartItemTitle} numberOfLines={2}>{name}</Text>
                <TouchableOpacity 
                  onPress={() => removeFromCart(item.id)}
                  style={styles.deleteBtn}
                  activeOpacity={0.7}
                >
                  <Trash2 size={18} color="#EF4444" />
                </TouchableOpacity>
              </View>

              <Text style={styles.cartItemUnitPrice}>₹{price.toFixed(0)}</Text>

              {/* Quantity Controls & Subtotal Row */}
              <View style={styles.cartItemFooterRow}>
                <View style={styles.qtyControlBox}>
                  <AnimatedQtyBtn
                    onPress={() => decreaseQuantity(item)}
                    style={styles.qtyBtn}
                  >
                    <Minus size={14} color="#0F172A" strokeWidth={2.5} />
                  </AnimatedQtyBtn>

                  <Text style={styles.qtyText}>{item.quantity}</Text>

                  <AnimatedQtyBtn
                    onPress={() => increaseQuantity(item)}
                    style={styles.qtyBtn}
                  >
                    <Plus size={14} color="#0F172A" strokeWidth={2.5} />
                  </AnimatedQtyBtn>
                </View>

                <Text style={styles.cartItemTotalPrice}>₹{itemTotal.toFixed(0)}</Text>
              </View>
            </View>
          </View>
        );
      })}

      {/* Cart Summary Card before proceeding to checkout */}
      <View style={styles.cartFooterSummaryCard}>
        <View style={styles.cartFooterSummaryRow}>
          <Text style={styles.cartFooterLabel}>Subtotal ({items.length} items)</Text>
          <Text style={styles.cartFooterValue}>₹{subtotal.toFixed(0)}</Text>
        </View>

        <TouchableOpacity 
          style={styles.proceedCheckoutBtn}
          onPress={() => setIsCheckingOut(true)}
          activeOpacity={0.9}
        >
          <Text style={styles.proceedCheckoutBtnText}>Checkout</Text>
          <ArrowRight size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );

  // Order Summary Card (Matching Web UI)
  const renderOrderSummaryCard = () => (
    <View style={styles.summaryBox}>
      <Text style={styles.summaryBoxTitle}>Order Summary</Text>
      
      {/* Shortened Product List inside Summary */}
      {items.map((item, idx) => {
        const name = item.product_name || item.product?.name || (item as any).name || 'Herbal Product';
        const image = item.product_image || item.product?.image || (item as any).image || (item as any).product?.product_image || (item as any).product_image_url || (item as any).image_url || (item as any).thumbnail;
        const price = parseFloat(item.price || item.product?.price || 0);

        return (
          <View key={item.id?.toString() || idx.toString()} style={styles.summaryItemRow}>
            <View style={styles.summaryThumbWrapper}>
              <Image source={getImageUrl(image)} style={styles.summaryThumb} />
              <View style={styles.summaryThumbBadge}>
                <Text style={styles.summaryThumbBadgeText}>{item.quantity}</Text>
              </View>
            </View>
            <Text style={styles.summaryItemTitle} numberOfLines={1}>{name}</Text>
            <Text style={styles.summaryItemPrice}>₹{price.toFixed(0)}</Text>
          </View>
        );
      })}

      <View style={styles.summaryDivider} />

      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Subtotal</Text>
        <Text style={styles.summaryValue}>₹{Number(subtotal || 0).toFixed(0)}</Text>
      </View>

      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>
          Shipping Charge {hasLocation ? `(${shippingInfo?.matchedState || 'Select State'})` : ''}
        </Text>
        <Text style={[styles.summaryValue, currentDeliveryCharge === 0 && { color: '#16A34A', fontWeight: '700' }]}>
          {currentDeliveryCharge === 0 ? 'FREE' : `₹${currentDeliveryCharge}`}
        </Text>
      </View>

      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>CGST</Text>
        <Text style={styles.summaryValue}>₹{Number(cgst || 0).toFixed(2)}</Text>
      </View>

      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>SGST</Text>
        <Text style={styles.summaryValue}>₹{Number(sgst || 0).toFixed(2)}</Text>
      </View>

      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>IGST</Text>
        <Text style={styles.summaryValue}>₹{Number(igst || 0).toFixed(2)}</Text>
      </View>

      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Tax Total</Text>
        <Text style={styles.summaryValue}>₹{Number(taxTotal || 0).toFixed(2)}</Text>
      </View>

      <View style={styles.summaryDivider} />

      <View style={styles.summaryRow}>
        <Text style={styles.summaryTotalLabel}>Total</Text>
        <Text style={styles.summaryTotalValue}>
          ₹{Number(finalTotal || 0).toFixed(2)}
        </Text>
      </View>
    </View>
  );

  // STEP 1: Contact Information Form
  const renderContactStep = () => (
    <View style={styles.stepSectionCard}>
      <Text style={styles.stepSectionTitle}>Contact Information</Text>
      <Text style={styles.stepSectionSub}>We will send order tracking details to your contact info.</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.fieldLabel}>Email Address</Text>
        <View style={[styles.inputBox, Boolean(emailError) && styles.inputBoxError]}>
          <Mail size={18} color={emailError ? "#EF4444" : "#64748B"} style={styles.inputIcon} />
          <TextInput
            style={styles.textInput}
            value={contactEmail}
            onChangeText={(txt) => {
              setContactEmail(txt);
              if (emailError) setEmailError('');
            }}
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
        {Boolean(emailError) && (
          <Text style={styles.fieldErrorText}>{emailError}</Text>
        )}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.fieldLabel}>Phone Number</Text>
        <View style={[styles.inputBox, Boolean(phoneError) && styles.inputBoxError]}>
          <Phone size={18} color={phoneError ? "#EF4444" : "#64748B"} style={styles.inputIcon} />
          <TextInput
            style={styles.textInput}
            value={contactPhone}
            onChangeText={(txt) => {
              setContactPhone(txt);
              if (phoneError) setPhoneError('');
            }}
            placeholder="10-digit mobile number"
            keyboardType="phone-pad"
            maxLength={10}
          />
        </View>
        {Boolean(phoneError) && (
          <Text style={styles.fieldErrorText}>{phoneError}</Text>
        )}
      </View>

      <TouchableOpacity 
        style={styles.primaryActionButton} 
        onPress={handleProceedToShipping}
        activeOpacity={0.9}
      >
        <Text style={styles.primaryActionButtonText}>Proceed to Shipping</Text>
        <ArrowRight size={18} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );

  // STEP 2: Shipping Address Form (Exact match with user screenshot)
  const renderShippingStep = () => (
    <View style={styles.stepSectionCard}>
      <View style={styles.shippingHeaderRow}>
        <View style={styles.shippingTitleGroup}>
          <TouchableOpacity 
            style={styles.backStepBtn} 
            onPress={() => setCurrentStep(1)}
            activeOpacity={0.7}
          >
            <ArrowLeft size={16} color="#64748B" />
          </TouchableOpacity>
          <View style={styles.stepNumberCircle}>
            <Text style={styles.stepNumberCircleText}>2</Text>
          </View>
          <Text style={styles.stepSectionTitle}>Shipping Address</Text>
        </View>
      </View>

      {/* Saved Addresses Button Bar */}
      <View style={{ flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center', marginBottom: 14 }}>
        <TouchableOpacity 
          style={styles.selectSavedBtn} 
          onPress={() => setShowAddressModal(true)}
          activeOpacity={0.7}
        >
          <MapPin size={13} color="#15803D" strokeWidth={2.2} />
          <Text style={styles.selectSavedBtnText}>Saved Addresses</Text>
        </TouchableOpacity>
      </View>

      {/* Full Name */}
      <View style={styles.inputGroup}>
        <Text style={styles.fieldLabel}>Full Name</Text>
        <View style={[styles.inputBox, Boolean(shippingNameError) && styles.inputBoxError]}>
          <View style={styles.checkCircleSmall}>
            <Check size={11} color={shippingNameError ? "#EF4444" : "#16A34A"} strokeWidth={3} />
          </View>
          <TextInput
            style={styles.textInput}
            value={formFullName}
            onChangeText={(txt) => {
              setFormFullName(txt);
              if (shippingNameError) setShippingNameError('');
            }}
            placeholder="Enter your full name"
            placeholderTextColor="#94A3B8"
          />
        </View>
        {Boolean(shippingNameError) && (
          <Text style={styles.fieldErrorText}>{shippingNameError}</Text>
        )}
      </View>

      {/* Phone Number */}
      <View style={styles.inputGroup}>
        <Text style={styles.fieldLabel}>Phone Number</Text>
        <View style={[styles.inputBox, Boolean(shippingPhoneError) && styles.inputBoxError]}>
          <Phone size={18} color={shippingPhoneError ? "#EF4444" : "#64748B"} style={styles.inputIcon} />
          <TextInput
            style={styles.textInput}
            value={formPhone}
            onChangeText={(txt) => {
              setFormPhone(txt);
              if (shippingPhoneError) setShippingPhoneError('');
            }}
            placeholder="10-digit mobile number"
            placeholderTextColor="#94A3B8"
            keyboardType="phone-pad"
            maxLength={10}
          />
        </View>
        {Boolean(shippingPhoneError) && (
          <Text style={styles.fieldErrorText}>{shippingPhoneError}</Text>
        )}
      </View>

      {/* Delivery Address */}
      <View style={styles.inputGroup}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <Text style={styles.fieldLabel}>Delivery Address</Text>
          <TouchableOpacity
            style={styles.gpsDetectBtnSmall}
            onPress={() => handleAutoDetectLocationCart()}
            disabled={isLocatingCart}
            activeOpacity={0.7}
          >
            {isLocatingCart ? (
              <ActivityIndicator size="small" color="#1D4ED8" />
            ) : (
              <>
                <Navigation size={13} color="#1D4ED8" strokeWidth={2.2} />
                <Text style={styles.gpsDetectBtnTextSmall}>Use Current Location</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
        <View style={[styles.inputBox, styles.multilineInputBox, Boolean(shippingAddressError) && styles.inputBoxError]}>
          <MapPin size={18} color={shippingAddressError ? "#EF4444" : "#64748B"} style={[styles.inputIcon, { marginTop: 4 }]} />
          <TextInput
            style={[styles.textInput, styles.multilineTextInput]}
            value={formAddress}
            onChangeText={(txt) => {
              setFormAddress(txt);
              if (shippingAddressError) setShippingAddressError('');
            }}
            placeholder="House No, Building, Street Area"
            placeholderTextColor="#94A3B8"
            multiline
            numberOfLines={2}
          />
        </View>
        {Boolean(shippingAddressError) && (
          <Text style={styles.fieldErrorText}>{shippingAddressError}</Text>
        )}
      </View>

      {/* City & State 2 Column */}
      <View style={styles.twoColRow}>
        <View style={[styles.inputGroup, { flex: 1 }]}>
          <Text style={styles.fieldLabel}>City</Text>
          <View style={[styles.inputBox, Boolean(shippingCityError) && styles.inputBoxError]}>
            <TextInput
              style={styles.textInput}
              value={formCity}
              onChangeText={(txt) => {
                setFormCity(txt);
                if (shippingCityError) setShippingCityError('');
              }}
              placeholder="e.g. Chennai"
              placeholderTextColor="#94A3B8"
            />
          </View>
          {Boolean(shippingCityError) && (
            <Text style={styles.fieldErrorText}>{shippingCityError}</Text>
          )}
        </View>

        <View style={[styles.inputGroup, { flex: 1 }]}>
          <Text style={styles.fieldLabel}>State</Text>
          <TouchableOpacity 
            style={[styles.inputBox, styles.highlightedSelectBox, Boolean(shippingStateError) && styles.inputBoxError]} 
            onPress={() => {
              if (shippingStateError) setShippingStateError('');
              setShowStatePicker(true);
            }}
            activeOpacity={0.8}
          >
            <Text style={[styles.textInput, { color: formState ? '#0F172A' : '#94A3B8' }]}>
              {formState || 'Select State'}
            </Text>
            <ChevronDown size={18} color={shippingStateError ? "#EF4444" : "#64748B"} />
          </TouchableOpacity>
          {Boolean(shippingStateError) && (
            <Text style={styles.fieldErrorText}>{shippingStateError}</Text>
          )}
        </View>
      </View>

      {/* PIN Code */}
      <View style={styles.inputGroup}>
        <Text style={styles.fieldLabel}>PIN Code</Text>
        <View style={[
          styles.inputBox, 
          Boolean(shippingPincodeError) && styles.inputBoxError,
          formPincode.trim().length === 6 && !shippingPincodeError && styles.inputBoxSuccess
        ]}>
          <TextInput
            style={[styles.textInput, { letterSpacing: 1.5, fontWeight: '700' }]}
            value={formPincode}
            onChangeText={(txt) => {
              const cleaned = txt.replace(/\D/g, '').slice(0, 6);
              setFormPincode(cleaned);
              if (shippingPincodeError) setShippingPincodeError('');
            }}
            placeholder="6-digit PIN Code"
            placeholderTextColor="#94A3B8"
            keyboardType="numeric"
            maxLength={6}
          />
          {formPincode.trim().length === 6 && !shippingPincodeError && (
            <View style={styles.checkCircleSmall}>
              <Check size={11} color="#16A34A" strokeWidth={3} />
            </View>
          )}
        </View>
        {Boolean(shippingPincodeError) ? (
          <Text style={styles.fieldErrorText}>{shippingPincodeError}</Text>
        ) : (
          formPincode.trim().length === 6 && (
            <Text style={styles.fieldSuccessText}>✓ Valid 6-digit PIN Code</Text>
          )
        )}
      </View>

      {/* Continue to Payment Button */}
      <TouchableOpacity 
        style={styles.primaryActionButton} 
        onPress={() => {
          if (!validateShippingFields()) return;
          setCurrentStep(3);
        }}
        activeOpacity={0.9}
      >
        <Text style={styles.primaryActionButtonText}>Continue to Payment</Text>
        <ArrowRight size={18} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );

  // STEP 3: Payment Options
  const renderPaymentStep = () => (
    <View style={styles.stepSectionCard}>
      <View style={styles.shippingHeaderRow}>
        <View style={styles.shippingTitleGroup}>
          <TouchableOpacity 
            style={styles.backStepBtn} 
            onPress={() => setCurrentStep(2)}
            activeOpacity={0.7}
          >
            <ArrowLeft size={16} color="#64748B" />
          </TouchableOpacity>
          <View style={styles.stepNumberCircle}>
            <Text style={styles.stepNumberCircleText}>3</Text>
          </View>
          <Text style={styles.stepSectionTitle}>Payment Method</Text>
        </View>
      </View>
      <Text style={styles.stepSectionSub}>Pay securely via Paytm Payment Gateway.</Text>

      {/* Paytm Exclusive Option */}
      <TouchableOpacity 
        style={[styles.paymentMethodCard, styles.paymentMethodCardSelected]}
        onPress={() => setPaymentMethod('paytm')}
        activeOpacity={0.9}
      >
        <View style={styles.paymentRadio}>
          <View style={styles.paymentRadioInner} />
        </View>
        <CreditCard size={22} color={colors.primary} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.paymentMethodTitle}>Paytm (UPI, Cards, NetBanking, Wallet)</Text>
          <Text style={styles.paymentMethodSub}>100% Secure Instant Payment via Paytm</Text>
        </View>
      </TouchableOpacity>

      {/* Complete Payment Button */}
      <TouchableOpacity 
        style={[styles.primaryActionButton, { marginTop: 24 }]} 
        onPress={handleCheckout}
        disabled={isLoading}
        activeOpacity={0.9}
      >
        {isLoading ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <>
            <Text style={styles.primaryActionButtonText}>
              Pay ₹{(deliveryCharge === 0 && grandTotal === subtotal ? subtotal + 50 : finalTotal).toFixed(0)} & Place Order
            </Text>
            <ShieldCheck size={18} color="#FFFFFF" />
          </>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
      {/* Header with Title */}
      <View style={styles.header}>
        {!isAuthenticated ? (
          <Text style={styles.headerTitle}>My Profile</Text>
        ) : isCheckingOut ? (
          <TouchableOpacity 
            onPress={() => setIsCheckingOut(false)}
            style={styles.backCartBtn}
            activeOpacity={0.8}
          >
            <ArrowLeft size={20} color={colors.text} />
            <Text style={styles.headerTitle}>Checkout</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.headerTitle}>My Cart ({items.length})</Text>
        )}
      </View>

      {/* Top Stepper (Contact - Shipping - Payment, shown during checkout only) */}
      {isAuthenticated && isCheckingOut && renderStepper()}

      {/* Main Scroll Content */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        keyboardShouldPersistTaps="handled"
      >
        {!isAuthenticated ? (
          /* Guest View: Welcome to Vedan Mart / Login prompt */
          renderGuestLoginPrompt()
        ) : items.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <ShoppingBag size={52} color={colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>Your cart is empty</Text>
            <Text style={styles.emptySubtitle}>
              Looks like you haven't added anything to your cart yet. Explore our herbal products and start shopping!
            </Text>
            <TouchableOpacity 
              style={styles.startShoppingBtn}
              onPress={() => navigation.navigate('MainTabs', { screen: 'Shop' })}
              activeOpacity={0.85}
            >
              <Text style={styles.startShoppingBtnText}>Start Shopping</Text>
              <ArrowRight size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        ) : !isCheckingOut ? (
          /* Phase 1: View Cart Product List */
          renderCartItemListView()
        ) : (
          /* Phase 2: Checkout Stepper View */
          <View style={styles.checkoutBodyGrid}>
            {/* Order Summary Box */}
            {renderOrderSummaryCard()}

            {/* Step Form based on active step */}
            {currentStep === 1 && renderContactStep()}
            {currentStep === 2 && renderShippingStep()}
            {currentStep === 3 && renderPaymentStep()}
          </View>
        )}
      </ScrollView>

      {/* State Picker Modal */}
      <Modal
        visible={showStatePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowStatePicker(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowStatePicker(false)}
        >
          <View style={styles.pickerModalContent}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerHeaderTitle}>Select State</Text>
            </View>
            <ScrollView style={{ maxHeight: 300 }}>
              {indianStates.map((st) => (
                <TouchableOpacity
                  key={st}
                  style={styles.stateItem}
                  onPress={() => {
                    if (st !== formState) {
                      setFormState(st);
                      setFormCity('');
                      setFormPincode('');
                      setFormAddress('');
                    }
                    setShowStatePicker(false);
                  }}
                >
                  <Text style={[styles.stateItemText, formState === st && { color: colors.primary, fontWeight: '800' }]}>
                    {st}
                  </Text>
                  {formState === st && <Check size={16} color={colors.primary} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Address Selection Modal */}
      <AddressModal
        visible={showAddressModal}
        onClose={() => setShowAddressModal(false)}
        onSelectAddress={(addr) => {
          setShippingAddress(addr);
          const nameVal = addr.full_name || addr.name || addr.user_name || '';
          setFormFullName(nameVal === 'User' ? '' : nameVal);
          const phoneVal = addr.phone || addr.mobile || userPhone || '';
          setFormPhone(phoneVal);
          const addrText = addr.address || addr.delivery_address || addr.address_line1 || addr.street || '';
          setFormAddress(addrText);
          setFormCity(addr.city || '');
          setFormState(addr.state || 'Tamil Nadu');
          setFormPincode(addr.pincode || '');
        }}
      />

      {/* Success Modal */}
      <SuccessModal
        visible={showCheckoutSuccess}
        title="Payment Successful 🎉"
        message="Your order has been placed successfully! It will be shipped shortly."
        buttonText="Back to Home"
        onClose={() => {
          setShowCheckoutSuccess(false);
          navigation.navigate('Home');
        }}
      />

      {/* Location Detected Modal */}
      <SuccessModal
        visible={showLocationSuccess}
        title="Location Detected"
        message={locationSuccessMsg}
        buttonText="OK"
        onClose={() => setShowLocationSuccess(false)}
      />

      {/* Paytm Gateway WebView Modal */}
      <Modal
        visible={showPaytmWebView}
        animationType="slide"
        onRequestClose={() => setShowPaytmWebView(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', backgroundColor: '#F8FAFC' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <ShieldCheck size={20} color={colors.primary} />
              <Text style={{ fontSize: 16, fontWeight: '800', color: colors.text }}>Paytm Payment Gateway</Text>
            </View>
            <TouchableOpacity 
              onPress={() => setShowPaytmWebView(false)}
              style={{ padding: 4 }}
              activeOpacity={0.8}
            >
              <X size={24} color="#64748B" />
            </TouchableOpacity>
          </View>
          {showPaytmWebView && WebView && paytmWebViewUrl && (
            <WebView
              source={typeof paytmWebViewUrl === 'object' ? paytmWebViewUrl : { uri: paytmWebViewUrl }}
              style={{ flex: 1 }}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              startInLoadingState={true}
              thirdPartyCookiesEnabled={true}
              sharedCookiesEnabled={true}
              userAgent="Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36"
              originWhitelist={['*']}
              mixedContentMode="always"
              allowUniversalAccessFromFileURLs={true}
              renderLoading={() => (
                <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={{ marginTop: 12, fontSize: 14, color: '#64748B', fontWeight: '500' }}>Connecting to Paytm Gateway...</Text>
                </View>
              )}
              renderError={() => (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#FFFFFF' }}>
                  <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                    <X size={32} color="#EF4444" />
                  </View>
                  <Text style={{ fontSize: 18, fontWeight: '800', color: colors.text, marginBottom: 8, textAlign: 'center' }}>
                    Paytm Connection Error
                  </Text>
                  <Text style={{ fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: 24, maxWidth: 280 }}>
                    Unable to connect to the Paytm Gateway server. Please check network connection or retry generating the Paytm token.
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      if (paytmDirectUrl) {
                        Linking.openURL(paytmDirectUrl).catch(() => {});
                      }
                    }}
                    style={{ backgroundColor: '#10B981', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 16, width: '100%', alignItems: 'center', marginBottom: 12 }}
                    activeOpacity={0.8}
                  >
                    <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 15 }}>Open in Paytm App / Browser 🚀</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      setShowPaytmWebView(false);
                      handleCheckout();
                    }}
                    style={{ backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 16, width: '100%', alignItems: 'center' }}
                    activeOpacity={0.8}
                  >
                    <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 15 }}>Retry Paytm Checkout</Text>
                  </TouchableOpacity>
                </View>
              )}
              onShouldStartLoadWithRequest={(request: any) => {
                const url = request.url || '';
                if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('about:') && !url.startsWith('data:')) {
                  try {
                    Linking.openURL(url).catch(() => {});
                  } catch (_) {}
                  return false;
                }
                return true;
              }}
              onError={(syntheticEvent: any) => {
                const { nativeEvent } = syntheticEvent;
                console.warn('WebView error: ', nativeEvent);
              }}
              onHttpError={(syntheticEvent: any) => {
                const { nativeEvent } = syntheticEvent;
                console.warn('WebView HTTP error: ', nativeEvent);
              }}
              onNavigationStateChange={async (navState: any) => {
                const url = navState.url;
                if (url.includes('/paytm/callback') || url.includes('/callback') || url.includes('TXN_SUCCESS') || url.includes('success')) {
                  setShowPaytmWebView(false);
                  clearCart(user?.id);
                  setShowCheckoutSuccess(true);
                }
              }}
            />
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAFCFC', // Matches Home Screen background
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    backgroundColor: '#FAFCFC',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: -0.5,
  },

  /* Top Stepper Styles */
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    marginHorizontal: 16,
    marginVertical: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 24,
  },
  stepTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeStepBadge: {
    backgroundColor: '#0F172A',
  },
  completedBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  activeStepBadgeText: {
    color: '#FFFFFF',
  },
  stepLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  activeStepLabel: {
    fontWeight: '800',
    color: '#0F172A',
  },
  completedStepLabel: {
    fontWeight: '700',
    color: colors.primary,
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#CBD5E1',
    marginHorizontal: 8,
  },
  activeStepLine: {
    backgroundColor: colors.primary,
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  checkoutBodyGrid: {
    gap: 16,
  },

  /* Summary Box Styles */
  summaryBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryBoxTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 12,
  },
  summaryItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  summaryThumbWrapper: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    position: 'relative',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  summaryThumb: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
    overflow: 'hidden',
    resizeMode: 'cover',
  },
  summaryThumbBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#64748B',
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryThumbBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  summaryItemTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginRight: 8,
  },
  summaryItemPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 13,
    color: '#1E293B',
    fontWeight: '700',
  },
  summaryTotalLabel: {
    fontSize: 16,
    fontWeight: '900',
    color: '#1E293B',
  },
  summaryTotalValue: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.primary,
  },

  /* Step Section Card Styles */
  stepSectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  stepSectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
  },
  stepSectionSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 14,
  },

  shippingHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  shippingTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepNumberCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberCircleText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  gpsDetectBtnSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  gpsDetectBtnTextSmall: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1D4ED8',
  },
  backSavedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backSavedBtnText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  backStepBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    marginRight: 2,
  },
  selectSavedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  selectSavedBtnText: {
    fontSize: 11,
    color: '#15803D',
    fontWeight: '800',
  },

  /* Form Input Styles */
  inputGroup: {
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  inputBoxError: {
    borderColor: '#EF4444',
    borderWidth: 1.5,
    backgroundColor: '#FFFFFF',
  },
  inputBoxSuccess: {
    borderColor: '#16A34A',
    borderWidth: 1.5,
    backgroundColor: '#F0FDF4',
  },
  fieldErrorText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
    marginLeft: 2,
  },
  fieldSuccessText: {
    color: '#16A34A',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
    marginLeft: 2,
  },
  multilineInputBox: {
    height: 70,
    alignItems: 'flex-start',
    paddingTop: 8,
  },
  highlightedSelectBox: {
    borderColor: '#10B981',
    borderWidth: 1.5,
  },
  checkCircleSmall: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    padding: 0,
  },
  multilineTextInput: {
    textAlignVertical: 'top',
    borderColor: colors.primary,
  },
  twoColRow: {
    flexDirection: 'row',
    gap: 12,
  },

  /* Buttons */
  primaryActionButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryActionButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },

  /* Payment Method Cards */
  paymentMethodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  paymentMethodCardSelected: {
    backgroundColor: '#ECFDF5',
    borderColor: colors.primary,
    borderWidth: 1.5,
  },
  paymentRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  paymentRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  paymentMethodTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  paymentMethodSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },

  /* Cart Empty view */
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 70,
  },
  emptyIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
    maxWidth: 280,
  },
  startShoppingBtn: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 36,
    borderRadius: 24,
    gap: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  startShoppingBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },

  /* State Modal */
  modalOverlay: {
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

  /* Shipping Banner Styles */
  shippingBanner: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 8,
    marginBottom: 4,
  },
  shippingBannerSuccess: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  shippingBannerTextSuccess: {
    color: '#15803D',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  shippingBannerWarning: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  shippingBannerTextWarning: {
    color: '#B91C1C',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  shippingBannerInfo: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#93C5FD',
  },
  shippingBannerTextInfo: {
    color: '#1D4ED8',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },

  /* Header Back Cart Button */
  backCartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  /* Cart Product List View Styles */
  cartListViewContainer: {
    paddingBottom: 20,
  },
  cartListHeaderTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  cartItemCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    alignItems: 'center',
  },
  cartItemImage: {
    width: 80,
    height: 80,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cartItemDetails: {
    flex: 1,
    marginLeft: 14,
  },
  cartItemHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  cartItemTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    flex: 1,
    lineHeight: 20,
  },
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartItemUnitPrice: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
    marginBottom: 8,
  },
  cartItemFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  qtyControlBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 4,
    gap: 12,
  },
  qtyBtn: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  qtyText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0F172A',
  },
  cartItemTotalPrice: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.primary,
  },
  cartFooterSummaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },
  cartFooterSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  cartFooterLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#64748B',
  },
  cartFooterValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
  },
  proceedCheckoutBtn: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 18,
    gap: 10,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  proceedCheckoutBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },

  /* Guest View Styles */
  guestContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 70,
  },
  guestIconCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 15,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  guestTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 10,
    textAlign: 'center',
  },
  guestSubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
    maxWidth: 300,
  },
  loginBtn: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 36,
    borderRadius: 24,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  loginBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});

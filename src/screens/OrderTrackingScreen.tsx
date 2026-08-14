import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, ActivityIndicator, Image, RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Package, Truck, CheckCircle, MapPin, ShoppingBag, ChevronRight, Calendar, CreditCard, ShieldCheck } from 'lucide-react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { colors } from '../theme/colors';
import { useAuthStore } from '../store/useAuthStore';
import { apiClient } from '../api/client';
import { getImageUrl } from '../utils/imageUrl';

const STATUS_STEPS = [
  { key: 'order_placed', label: 'Order Placed',  desc: 'We have received your order', icon: Package },
  { key: 'shipped',      label: 'Shipped',        desc: 'Your order is on the way',   icon: Truck },
  { key: 'delivered',    label: 'Delivered',      desc: 'Package arrived safely',     icon: CheckCircle },
];

function getStepIndex(status: string) {
  const s = (status || '').toLowerCase();
  if (s === 'delivered') return 2;
  if (s === 'shipped') return 1;
  return 0; // pending / processing / confirmed / placed
}

function formatDate(dateStr: string) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  } catch (_) {
    return dateStr;
  }
}

function getStatusColor(status: string) {
  const s = (status || '').toLowerCase();
  if (s === 'delivered') return '#15803D';
  if (s === 'shipped') return '#2563EB';
  if (s === 'confirmed' || s === 'placed' || s === 'order placed') return '#166534';
  return '#475569';
}

function getStatusBg(status: string) {
  const s = (status || '').toLowerCase();
  if (s === 'delivered') return '#DCFCE7';
  if (s === 'shipped') return '#DBEAFE';
  if (s === 'confirmed' || s === 'placed' || s === 'order placed') return '#F0FDF4';
  return '#F1F5F9';
}

function renderShippingAddressDetails(selectedOrder: any, user: any) {
  if (!selectedOrder) {
    return <Text style={styles.shippingAddress}>Gobichettipalayam, Tamil Nadu, 638476</Text>;
  }

  let rawAddr = selectedOrder.shipping_address ?? selectedOrder.address ?? selectedOrder.delivery_address ?? selectedOrder.customer_address;

  if (typeof rawAddr === 'string' && (rawAddr.startsWith('{') || rawAddr.startsWith('['))) {
    try {
      rawAddr = JSON.parse(rawAddr);
    } catch (_) {}
  }

  let name = selectedOrder.name || selectedOrder.full_name || selectedOrder.customer_name || selectedOrder.customer || user?.name || '';
  let phone = selectedOrder.phone || selectedOrder.mobile || selectedOrder.contact_phone || user?.phone || user?.mobile || '';
  let addressText = '';

  if (typeof rawAddr === 'object' && rawAddr !== null && !Array.isArray(rawAddr)) {
    if (rawAddr.full_name || rawAddr.name) name = rawAddr.full_name || rawAddr.name;
    if (rawAddr.phone || rawAddr.mobile) phone = rawAddr.phone || rawAddr.mobile;

    if (typeof rawAddr.address === 'string' && rawAddr.address.trim()) {
      addressText = rawAddr.address.trim();
    } else {
      const parts = [
        rawAddr.street,
        rawAddr.address_line1,
        rawAddr.address_line2,
        rawAddr.area,
        rawAddr.city,
        rawAddr.state,
        rawAddr.pincode,
        rawAddr.country
      ].map((s: any) => (typeof s === 'string' ? s.trim() : (typeof s === 'number' ? String(s) : ''))).filter(Boolean);

      addressText = parts.join(', ');
    }
  } else if (typeof rawAddr === 'string' && rawAddr.trim()) {
    addressText = rawAddr.trim();
  }

  if (!addressText) {
    const directParts = [
      selectedOrder.address_text,
      selectedOrder.street,
      selectedOrder.area,
      selectedOrder.city,
      selectedOrder.state,
      selectedOrder.pincode
    ].map((s: any) => (typeof s === 'string' ? s.trim() : (typeof s === 'number' ? String(s) : ''))).filter(Boolean);

    addressText = directParts.join(', ');
  }

  return (
    <View style={{ flex: 1 }}>
      {Boolean(name || phone) && (
        <Text style={[styles.shippingAddress, { fontWeight: '800', color: colors.text, marginBottom: 3 }]}>
          {name}{phone ? ` (${phone})` : ''}
        </Text>
      )}
      <Text style={styles.shippingAddress}>
        {addressText || 'Gobichettipalayam, Tamil Nadu, 638476'}
      </Text>
    </View>
  );
}

export default function OrderTrackingScreen() {
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  const user = useAuthStore(s => s.user);

  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [resolvedCustomerId, setResolvedCustomerId] = useState<number | null>(null);

  const fetchOrders = async (silent = false) => {
    if (!silent && orders.length === 0) {
      setIsLoading(true);
    }
    setError('');

    let targetUserId = resolvedCustomerId || (user?.id ? Number(user.id) : null);

    // Dynamically resolve exact customer ID via mobile number if missing or timestamp (>1000000)
    if (!targetUserId || isNaN(targetUserId) || targetUserId > 1000000) {
      try {
        const custRes = await apiClient('/customers/');
        const custList = custRes?.data || (Array.isArray(custRes) ? custRes : []);
        const uPhone = (user?.phone || user?.mobile || '').replace(/\D/g, '').slice(-10);

        const matchedCust = custList.find((c: any) => {
          const cPhone = (c.mobile || c.phone || '').replace(/\D/g, '').slice(-10);
          return cPhone && cPhone === uPhone;
        });

        if (matchedCust && matchedCust.id) {
          targetUserId = Number(matchedCust.id);
          setResolvedCustomerId(targetUserId);
        }
      } catch (e) {
        console.warn("Could not resolve customer ID by mobile number:", e);
      }
    }

    if (!targetUserId || isNaN(targetUserId) || targetUserId <= 0) {
      setOrders([]);
      setSelectedOrder(null);
      setIsLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      // Endpoint: herbal/my-orders/<int:user_id>/
      const responseData = await apiClient(`/my-orders/${targetUserId}/`);
      let userOrders = Array.isArray(responseData?.orders) 
        ? responseData.orders 
        : (Array.isArray(responseData) ? responseData : []);

      // Filter out test orders, unpaid online attempts, and cancelled orders
      userOrders = userOrders.filter((ord: any) => {
        if (!ord) return false;
        const oId = Number(ord.order_id || ord.id);
        if (oId === 5 || oId === 6 || oId === 8) return false;

        const st = String(ord.status || '').toLowerCase().trim();
        const paySt = String(ord.payment_status || ord.paymentStatus || '').toLowerCase().trim();
        const payMethod = String(ord.payment_method || ord.paymentMethod || ord.method || '').toLowerCase().trim();
        const isPaid = ord.is_paid === true || ord.isPaid === true;
        const isCod = payMethod === 'cod' || paySt === 'cod' || ord.is_cod === true || ord.isCod === true;

        if (['cancelled', 'canceled', 'failed', 'rejected', 'abandoned'].includes(st)) return false;
        if (['failed', 'cancelled', 'canceled', 'txn_failure', 'rejected'].includes(paySt)) return false;

        if (isCod) return true;

        const isExplicitPaid = ['paid', 'success', 'completed', 'txn_success'].includes(paySt) || isPaid;
        return isExplicitPaid;
      });

      setOrders(userOrders);
      if (userOrders.length > 0) {
        setSelectedOrder((prev: any) => prev || userOrders[0]);
      } else {
        setSelectedOrder(null);
      }
    } catch (e: any) {
      if (e?.message && (e.message.includes('does not exist') || e.message.includes('404'))) {
        setOrders([]);
        setSelectedOrder(null);
      } else {
        setError(e.message || 'Could not load orders.');
      }
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isFocused) {
      fetchOrders(orders.length > 0);
    }
  }, [isFocused, user?.id]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const activeStep = selectedOrder ? getStepIndex(selectedOrder.status) : -1;

  // ─── Render Order Card in List View ──────────────────────────────────────────
  const renderOrderListItem = (item: any) => {
    const itemsList = item.items || [];
    const firstItem = itemsList.length > 0 ? itemsList[0] : null;
    const itemImage = firstItem?.product_image || firstItem?.image || firstItem?.product?.image;
    const itemTitle = firstItem?.product_name || firstItem?.product || firstItem?.name || 'Herbal Product';
    const extraCount = itemsList.length - 1;

    return (
      <TouchableOpacity
        key={String(item.order_id || item.id)}
        style={styles.orderCard}
        onPress={() => {
          setSelectedOrder(item);
          setViewMode('detail');
        }}
        activeOpacity={0.85}
      >
        {/* Top Header Row */}
        <View style={styles.orderCardHeader}>
          <View style={styles.orderIdGroup}>
            <Package size={16} color={colors.primary} />
            <Text style={styles.orderCardId}>Placed on {formatDate(item.placed_at || item.created_at)}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusBg(item.status) }]}>
            <Text style={[styles.statusBadgeText, { color: getStatusColor(item.status) }]}>
              {item.status ? (item.status.charAt(0).toUpperCase() + item.status.slice(1)) : 'Confirmed'}
            </Text>
          </View>
        </View>

        <View style={styles.cardDivider} />

        {/* Product Details Row */}
        <View style={styles.orderCardBody}>
          <View style={styles.productThumbBox}>
            {itemImage ? (
              <Image source={getImageUrl(itemImage)} style={styles.productThumb} resizeMode="cover" />
            ) : (
              <View style={styles.productThumbPlaceholder}>
                <ShoppingBag size={22} color={colors.primary} />
              </View>
            )}
          </View>

          <View style={styles.orderCardDetails}>
            <Text style={styles.productTitleText} numberOfLines={1}>
              {itemTitle}
            </Text>
            {extraCount > 0 && (
              <Text style={styles.extraItemsText}>+ {extraCount} more item{extraCount > 1 ? 's' : ''}</Text>
            )}
            <View style={styles.datePriceRow}>
              <Text style={styles.orderAmountText}>Total: ₹{item.total_amount || item.amount}</Text>
            </View>
          </View>

          <View style={styles.trackChevronBtn}>
            <Text style={styles.trackBtnText}>Track</Text>
            <ChevronRight size={16} color={colors.primary} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Header Bar */}
      <View style={styles.header}>
        {viewMode === 'detail' ? (
          <TouchableOpacity onPress={() => setViewMode('list')} style={styles.backBtn} activeOpacity={0.7}>
            <ArrowLeft size={20} color={colors.text} />
            <Text style={styles.backText}>My Orders</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
            <ArrowLeft size={20} color={colors.text} />
            <Text style={styles.backText}>My Profile</Text>
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Fetching your orders...</Text>
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => fetchOrders()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.centered}>
          <View style={styles.emptyIconCircle}>
            <ShoppingBag size={52} color={colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>No Orders Yet</Text>
          <Text style={styles.emptySubtitle}>You haven't placed any orders yet.</Text>
        </View>
      ) : viewMode === 'list' ? (
        /* ─── ORDERS LIST VIEW ─────────────────────────────────────────────── */
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <View style={styles.listHeaderRow}>
            <Text style={styles.pageTitle}>My Orders</Text>
            <Text style={styles.pageSubtitle}>{orders.length} confirmed order{orders.length > 1 ? 's' : ''}</Text>
          </View>

          {orders.map((item) => renderOrderListItem(item))}
        </ScrollView>
      ) : selectedOrder ? (
        /* ─── SINGLE ORDER TRACKING DETAIL VIEW ────────────────────────────── */
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {/* Order Header Summary Banner */}
          <View style={styles.detailBannerCard}>
            <View style={styles.detailBannerRow}>
              <View>
                <Text style={styles.detailOrderNo}>Order Details</Text>
                <Text style={styles.detailOrderDate}>Placed on {formatDate(selectedOrder.placed_at || selectedOrder.created_at)}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getStatusBg(selectedOrder.status) }]}>
                <Text style={[styles.statusBadgeText, { color: getStatusColor(selectedOrder.status) }]}>
                  {selectedOrder.status ? (selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)) : 'Confirmed'}
                </Text>
              </View>
            </View>
            <View style={styles.bannerDivider} />
            <View style={styles.detailBannerFooter}>
              <Text style={styles.bannerTotalLabel}>Total Amount Paid</Text>
              <Text style={styles.bannerTotalValue}>₹{selectedOrder.total_amount || selectedOrder.amount}</Text>
            </View>
          </View>

          {/* Delivery Step Tracker */}
          <Text style={styles.sectionTitle}>Order Status</Text>
          <View style={styles.card}>
            {STATUS_STEPS.map((step, index) => {
              const isActive = index <= activeStep;
              const Icon = step.icon;
              return (
                <View key={step.key} style={styles.stepRow}>
                  <View style={styles.stepLeft}>
                    <View style={[
                      styles.stepIconCircle,
                      isActive ? styles.stepIconActive : styles.stepIconInactive,
                    ]}>
                      <Icon size={20} color={isActive ? '#FFFFFF' : '#94A3B8'} />
                    </View>
                    {index < STATUS_STEPS.length - 1 && (
                      <View style={[styles.stepLine, index < activeStep && styles.stepLineActive]} />
                    )}
                  </View>
                  <View style={styles.stepRight}>
                    <Text style={[styles.stepLabel, !isActive && styles.stepLabelInactive]}>
                      {step.label}
                    </Text>
                    <Text style={[styles.stepDesc, !isActive && styles.stepDescInactive]}>
                      {step.desc}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Items in this order */}
          <Text style={styles.sectionTitle}>Items in this Order</Text>
          <View style={styles.card}>
            {(selectedOrder.items || []).map((item: any, i: number) => (
              <View key={i} style={[styles.itemRow, i < selectedOrder.items.length - 1 && styles.itemRowBorder]}>
                <View style={styles.itemImageBox}>
                  {item.product_image
                    ? <Image source={getImageUrl(item.product_image)} style={styles.itemImage} resizeMode="cover" />
                    : (
                      <View style={styles.itemImagePlaceholder}>
                        <Package size={22} color={colors.primary} />
                      </View>
                    )
                  }
                </View>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.product_name || item.product}</Text>
                  <Text style={styles.itemQty}>Qty: {item.quantity}</Text>
                </View>
                <Text style={styles.itemPrice}>₹{item.price}</Text>
              </View>
            ))}
          </View>

          {/* Shipping Info */}
          <Text style={styles.sectionTitle}>Shipping Address</Text>
          <View style={styles.card}>
            <View style={styles.shippingRow}>
              <View style={styles.shippingIcon}>
                <MapPin size={20} color={colors.primary} />
              </View>
              {renderShippingAddressDetails(selectedOrder, user)}
            </View>
          </View>

          {/* Payment & Price Summary */}
          <Text style={styles.sectionTitle}>Price Breakdown</Text>
          <View style={styles.card}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Product Amount</Text>
              <Text style={styles.priceValue}>₹{selectedOrder.subtotal || selectedOrder.product_amount || selectedOrder.total_amount}</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Shipping Fee</Text>
              <Text style={styles.priceValue}>₹{selectedOrder.shipping_charges || 0}</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>GST / Tax</Text>
              <Text style={styles.priceValue}>₹{selectedOrder.gst_amount || selectedOrder.tax_total || 0}</Text>
            </View>
            <View style={[styles.priceRow, styles.totalPriceRow]}>
              <Text style={styles.totalPriceLabel}>Total Amount Paid</Text>
              <Text style={styles.totalPriceValue}>₹{selectedOrder.total_amount || 0}</Text>
            </View>
          </View>

          {/* Tracking Number */}
          {!!selectedOrder.tracking_number && (
            <View style={styles.trackingNumberBox}>
              <Text style={styles.trackingNumberLabel}>Tracking Number</Text>
              <Text style={styles.trackingNumber}>{selectedOrder.tracking_number}</Text>
            </View>
          )}
        </ScrollView>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  backText: { fontSize: 16, fontWeight: '800', color: colors.text },
  scroll: { padding: 18, paddingBottom: 60 },

  listHeaderRow: { marginBottom: 16, marginTop: 4 },
  pageTitle: { fontSize: 22, fontWeight: '900', color: colors.text },
  pageSubtitle: { fontSize: 13, fontWeight: '600', color: '#64748B', marginTop: 2 },

  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  loadingText: { color: '#64748B', fontWeight: '600', fontSize: 15, marginTop: 12 },
  errorText: { color: '#EF4444', fontWeight: '600', fontSize: 15, textAlign: 'center' },
  retryBtn: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingHorizontal: 28,
    paddingVertical: 12,
    marginTop: 8,
  },
  retryText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },
  emptyIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: { fontSize: 20, fontWeight: '900', color: '#334155' },
  emptySubtitle: { fontSize: 14, color: '#94A3B8', fontWeight: '500', textAlign: 'center' },

  // Order Cards in List
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  orderCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderIdGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  orderCardId: { fontSize: 15, fontWeight: '800', color: colors.text },
  cardDivider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 12 },
  orderCardBody: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productThumbBox: {
    width: 64,
    height: 64,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    marginRight: 14,
  },
  productThumb: { width: '100%', height: '100%' },
  productThumbPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FDF4',
  },
  orderCardDetails: { flex: 1, justifyContent: 'center' },
  productTitleText: { fontSize: 15, fontWeight: '800', color: colors.text, marginBottom: 2 },
  extraItemsText: { fontSize: 12, fontWeight: '700', color: colors.primary, marginBottom: 4 },
  datePriceRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  orderCardDate: { fontSize: 12, fontWeight: '600', color: '#64748B' },
  dotSeparator: { fontSize: 12, color: '#CBD5E1', marginHorizontal: 2 },
  orderAmountText: { fontSize: 13, fontWeight: '800', color: colors.text },

  trackChevronBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  trackBtnText: { fontSize: 12, fontWeight: '800', color: colors.primary },

  statusBadge: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  statusBadgeText: { fontSize: 12, fontWeight: '800' },

  // Detail View Banner
  detailBannerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  detailBannerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  detailOrderNo: { fontSize: 20, fontWeight: '900', color: colors.text },
  detailOrderDate: { fontSize: 13, fontWeight: '500', color: '#64748B', marginTop: 3 },
  bannerDivider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 14 },
  detailBannerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bannerTotalLabel: { fontSize: 14, fontWeight: '700', color: '#64748B' },
  bannerTotalValue: { fontSize: 20, fontWeight: '900', color: colors.primary },

  // Detail Section Cards
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 10,
    marginTop: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  // Steps
  stepRow: { flexDirection: 'row', alignItems: 'flex-start' },
  stepLeft: { alignItems: 'center', marginRight: 14 },
  stepIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepIconActive: { backgroundColor: colors.primary },
  stepIconInactive: { backgroundColor: '#F1F5F9' },
  stepLine: { width: 2, height: 32, backgroundColor: '#E2E8F0', marginVertical: 2 },
  stepLineActive: { backgroundColor: colors.primary },
  stepRight: { flex: 1, paddingBottom: 20, paddingTop: 6 },
  stepLabel: { fontSize: 15, fontWeight: '800', color: colors.text },
  stepLabelInactive: { color: '#94A3B8' },
  stepDesc: { fontSize: 13, fontWeight: '500', color: '#64748B', marginTop: 2 },
  stepDescInactive: { color: '#CBD5E1' },

  // Items
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  itemRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  itemImageBox: {
    width: 56,
    height: 56,
    borderRadius: 14,
    marginRight: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  itemImage: { width: 56, height: 56 },
  itemImagePlaceholder: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FDF4',
  },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: '800', color: colors.text, marginBottom: 2 },
  itemQty: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  itemPrice: { fontSize: 15, fontWeight: '900', color: colors.text },

  // Shipping
  shippingRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  shippingIcon: {
    width: 38,
    height: 38,
    backgroundColor: '#F0FDF4',
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shippingAddress: { flex: 1, fontSize: 14, fontWeight: '600', color: '#334155', lineHeight: 22 },

  // Tracking Number
  trackingNumberBox: {
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#86EFAC',
    marginBottom: 20,
  },
  trackingNumberLabel: { fontSize: 12, fontWeight: '700', color: '#15803D', marginBottom: 4 },
  trackingNumber: { fontSize: 18, fontWeight: '900', color: '#166534' },

  // Price Details
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  priceLabel: { fontSize: 14, color: '#64748B', fontWeight: '600' },
  priceValue: { fontSize: 14, color: '#0F172A', fontWeight: '700' },
  totalPriceRow: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    marginTop: 6,
    paddingTop: 10,
  },
  totalPriceLabel: { fontSize: 15, color: '#0F172A', fontWeight: '800' },
  totalPriceValue: { fontSize: 18, color: colors.primary, fontWeight: '900' },
});

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  StatusBar, FlatList, Image, Alert, ActivityIndicator,
  NativeModules, Platform, Vibration
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  LogOut, Users, Package, ShoppingBag, TrendingUp,
  ChevronRight, PlusCircle, Trash2, RefreshCw, ImagePlus, Edit3,
  FileText, ClipboardList, MapPin
} from 'lucide-react-native';
import { colors } from '../theme/colors';
import { useAuthStore } from '../store/useAuthStore';
import { useProductStore } from '../store/useProductStore';
import { useSliderStore } from '../store/useSliderStore';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import LogoutModal from '../components/LogoutModal';
import { apiClient } from '../api/client';

const BASE_URL = 'https://api.codingboss.in/herbal';
const ORDER_POLL_INTERVAL_MS = 15000;
const { AdminNotificationSound } = NativeModules;

const getOrderId = (order: any) => String(order?.order_id || order?.id || '');

const getCustomerName = (order: any) => {
  if (typeof order?.customer === 'string') return order.customer;

  return (
    order?.customer_name ||
    order?.name ||
    order?.user_name ||
    order?.full_name ||
    order?.customer?.name ||
    order?.user?.name ||
    order?.shipping_name ||
    order?.billing_name ||
    'Customer'
  );
};

const getCustomerContact = (order: any) => {
  return order?.mobile || order?.phone || order?.phone_number || order?.customer?.mobile || '';
};

const getOrderItems = (order: any) => {
  const items =
    order?.items ||
    order?.order_items ||
    order?.products ||
    order?.cart_items ||
    order?.line_items ||
    [];

  return Array.isArray(items) ? items : [];
};

const getOrderItemName = (item: any) => {
  if (typeof item?.product === 'string') return item.product;
  return (
    item?.product_name ||
    item?.name ||
    item?.product?.name ||
    item?.product?.product_name ||
    item?.title ||
    'Product'
  );
};

const getOrderProductsText = (order: any) => {
  const items = getOrderItems(order);

  if (items.length === 0) {
    const singleProduct =
      order?.product_name ||
      (typeof order?.product === 'string' ? order.product : order?.product?.name) ||
      order?.product?.name ||
      order?.item_name;

    return typeof singleProduct === 'string' ? singleProduct : 'Products not available';
  }

  return items
    .slice(0, 3)
    .map((item: any) => {
      const quantity = item?.quantity || item?.qty;
      return `${getOrderItemName(item)}${quantity ? ` x ${quantity}` : ''}`;
    })
    .join(', ');
};

const formatOrderDate = (dateStr: string) => {
  if (!dateStr) return 'New order';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return 'New order';
  return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
};

const formatMoney = (value: number | string | undefined) => {
  const amount = Number(value || 0);
  return `Rs.${Number.isFinite(amount) ? amount.toLocaleString('en-IN') : '0'}`;
};

const playNewOrderSound = () => {
  if (Platform.OS === 'android' && AdminNotificationSound?.playNewOrderSound) {
    AdminNotificationSound.playNewOrderSound();
    return;
  }
  Vibration.vibrate([0, 700, 250, 700, 250, 700, 250, 700, 250, 700], false);
};

const getImageUrl = (url: string | null) => {
  if (!url) return null;
  if (url.startsWith('http')) return { uri: url };
  return { uri: `${BASE_URL}${url}` };
};

export default function AdminPortalScreen() {
  const logout = useAuthStore((state) => state.logout);
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  const { products, isLoading, fetchData, deleteProduct } = useProductStore();
  const { sliders, fetchSliders, deleteSlider } = useSliderStore();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingSliderId, setDeletingSliderId] = useState<string | null>(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const lastKnownOrderIdsRef = useRef<Set<string> | null>(null);
  const orderSnapshotRef = useRef('');
  const [newOrderCount, setNewOrderCount] = useState(0);

  const fetchOrders = useCallback(async (options: { silent?: boolean } = {}) => {
    if (!options.silent) setOrdersLoading(true);
    try {
      const response = await apiClient('/orders/');
      const nextOrders = Array.isArray(response)
        ? response
        : response?.orders || response?.data || [];
      const sortedOrders = [...nextOrders].sort((a: any, b: any) => {
        const aTime = new Date(a?.created_at || 0).getTime();
        const bTime = new Date(b?.created_at || 0).getTime();
        return bTime - aTime;
      });
      const nextIds = new Set(sortedOrders.map(getOrderId).filter(Boolean));
      const knownIds = lastKnownOrderIdsRef.current;
      const nextSnapshot = sortedOrders
        .map((order: any) => `${getOrderId(order)}:${order?.status || ''}:${order?.total_amount || ''}`)
        .join('|');

      if (knownIds) {
        const newIds = [...nextIds].filter((id) => !knownIds.has(id));
        if (newIds.length > 0) {
          setNewOrderCount((count) => count + newIds.length);
          playNewOrderSound();
        }
      }

      if (nextSnapshot !== orderSnapshotRef.current) {
        setOrders(sortedOrders);
        orderSnapshotRef.current = nextSnapshot;
      }
      lastKnownOrderIdsRef.current = nextIds;
    } catch (error) {
      console.error('Error fetching admin orders', error);
    } finally {
      if (!options.silent) setOrdersLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isFocused) {
      fetchData();
      fetchSliders();
      fetchOrders();
    }
  }, [fetchData, fetchOrders, fetchSliders, isFocused]);

  useEffect(() => {
    if (!isFocused) return;

    const intervalId = setInterval(() => {
      fetchOrders({ silent: true });
    }, ORDER_POLL_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [fetchOrders, isFocused]);

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const performLogout = async () => {
    setShowLogoutModal(false);
    await logout();
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert(
      'Delete Product',
      `Are you sure you want to delete "${name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeletingId(id);
            try {
              await deleteProduct(id);
            } catch {
              Alert.alert('Error', 'Failed to delete product. Please try again.');
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]
    );
  };

  const handleDeleteSlider = (id: string, text: string) => {
    Alert.alert(
      'Delete Slider',
      `Are you sure you want to delete the slider "${text}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeletingSliderId(id);
            try {
              await deleteSlider(id);
            } catch {
              Alert.alert('Error', 'Failed to delete slider. Please try again.');
            } finally {
              setDeletingSliderId(null);
            }
          },
        },
      ]
    );
  };

  const renderSlider = ({ item }: { item: any }) => {
    const imgSrc = getImageUrl(item.image);
    const isDeleting = deletingSliderId === String(item.id);
    return (
      <View style={styles.sliderCard}>
        {imgSrc ? (
          <Image source={imgSrc} style={styles.sliderImage} />
        ) : (
          <View style={styles.sliderImagePlaceholder} />
        )}
        <View style={styles.sliderOverlay}>
          <Text style={styles.sliderText} numberOfLines={1}>{item.overlay_text}</Text>
          <TouchableOpacity
            style={styles.sliderDeleteBtn}
            onPress={() => handleDeleteSlider(String(item.id), item.overlay_text)}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <ActivityIndicator size="small" color="#EF4444" />
            ) : (
              <Trash2 color="#EF4444" size={16} />
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderProduct = ({ item }: { item: any }) => {
    const imgSrc = getImageUrl(item.image);
    const isDeleting = deletingId === String(item.id);
    return (
      <View style={styles.productCard}>
        <View style={styles.productImageBox}>
          {imgSrc ? (
            <Image source={imgSrc} style={styles.productImage} />
          ) : (
            <Package color="#CBD5E1" size={28} />
          )}
        </View>
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.productCategory}>{item.category_name || 'Uncategorized'}</Text>
          <View style={styles.productMeta}>
            <Text style={styles.productPrice}>₹{item.price}</Text>
            <View style={styles.stockBadge}>
              <Text style={styles.stockText}>Stock: {item.stock}</Text>
            </View>
          </View>
        </View>
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => navigation.navigate('AdminEditProduct', { product: item })}
          >
            <Edit3 color="#3B82F6" size={20} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => handleDelete(String(item.id), item.name)}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <ActivityIndicator size="small" color="#EF4444" />
            ) : (
              <Trash2 color="#EF4444" size={20} />
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const totalSales = orders.reduce((sum, order) => sum + Number(order?.total_amount || 0), 0);
  const customerCount = new Set(
    orders
      .map((order) => getCustomerContact(order) || order?.user || order?.user_id || getCustomerName(order))
      .filter(Boolean)
  ).size;
  const inventoryCount = products.reduce((sum, product: any) => {
    return sum + Number(product?.stock || 0);
  }, 0);
  const latestOrders = orders.slice(0, 4);

  const renderHeader = () => (
    <View>
      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <View style={[styles.iconBg, { backgroundColor: 'rgba(16,185,129,0.1)' }]}>
            <Package color={colors.primary} size={20} />
          </View>
          <Text style={styles.statValue}>{products.length}</Text>
          <Text style={styles.statLabel}>Products</Text>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.iconBg, { backgroundColor: 'rgba(37,99,235,0.1)' }]}>
            <ShoppingBag color="#2563EB" size={20} />
          </View>
          <Text style={styles.statValue}>{orders.length}</Text>
          <Text style={styles.statLabel}>Orders</Text>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.iconBg, { backgroundColor: 'rgba(217,119,6,0.1)' }]}>
            <Users color="#D97706" size={20} />
          </View>
          <Text style={styles.statValue}>{customerCount}</Text>
          <Text style={styles.statLabel}>Customers</Text>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.iconBg, { backgroundColor: 'rgba(22,163,74,0.1)' }]}>
            <TrendingUp color="#16A34A" size={20} />
          </View>
          <Text style={styles.statValue}>{formatMoney(totalSales)}</Text>
          <Text style={styles.statLabel}>Sales</Text>
        </View>
      </View>

      {/* Orders */}
      <View style={styles.productListHeader}>
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>Orders</Text>
          {newOrderCount > 0 && (
            <View style={styles.newOrderBadge}>
              <Text style={styles.newOrderText}>{newOrderCount} new</Text>
            </View>
          )}
        </View>
        <TouchableOpacity onPress={() => fetchOrders()} style={styles.refreshBtn}>
          {ordersLoading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <RefreshCw color={colors.primary} size={18} />
          )}
        </TouchableOpacity>
      </View>
      <View style={styles.ordersPanel}>
        <View style={styles.orderSummaryRow}>
          <View>
            <Text style={styles.orderSummaryValue}>{orders.length}</Text>
            <Text style={styles.orderSummaryLabel}>Total Orders</Text>
          </View>
          <View>
            <Text style={styles.orderSummaryValue}>{formatMoney(totalSales)}</Text>
            <Text style={styles.orderSummaryLabel}>Total Sales</Text>
          </View>
          <View>
            <Text style={styles.orderSummaryValue}>{inventoryCount}</Text>
            <Text style={styles.orderSummaryLabel}>Stock</Text>
          </View>
        </View>

        {ordersLoading && orders.length === 0 ? (
          <ActivityIndicator color={colors.primary} style={{ marginVertical: 18 }} />
        ) : latestOrders.length === 0 ? (
          <View style={styles.emptyOrders}>
            <ShoppingBag color="#CBD5E1" size={30} />
            <Text style={styles.emptySubText}>No orders yet</Text>
          </View>
        ) : (
          latestOrders.map((order) => (
            <View key={getOrderId(order)} style={styles.orderRow}>
              <View style={styles.orderIconBox}>
                <ShoppingBag color="#2563EB" size={18} />
              </View>
              <View style={styles.orderInfo}>
                <Text style={styles.orderTitleText} numberOfLines={1}>
                  {getCustomerName(order)}
                </Text>
                <Text style={styles.orderSubtitle} numberOfLines={1}>
                  Order #{getOrderId(order)} - {getCustomerContact(order) || formatOrderDate(order?.created_at)}
                </Text>
                <Text style={styles.orderProductsText} numberOfLines={2}>
                  {getOrderProductsText(order)}
                </Text>
              </View>
              <View style={styles.orderAmountBox}>
                <Text style={styles.orderAmount}>{formatMoney(order?.total_amount)}</Text>
                <Text style={styles.orderStatus}>{order?.status || 'pending'}</Text>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionsList}>
        <TouchableOpacity
          style={styles.actionItem}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('AdminAddProduct')}
        >
          <View style={[styles.actionIcon, { backgroundColor: 'rgba(16,185,129,0.1)' }]}>
            <Package color={colors.primary} size={22} />
          </View>
          <View style={styles.actionTextContainer}>
            <Text style={styles.actionTitle}>Add New Product</Text>
            <Text style={styles.actionSubtitle}>Add items to inventory</Text>
          </View>
          <ChevronRight color="#CBD5E1" size={20} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionItem}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('AdminAddCategory')}
        >
          <View style={[styles.actionIcon, { backgroundColor: 'rgba(37,99,235,0.1)' }]}>
            <PlusCircle color="#2563EB" size={22} />
          </View>
          <View style={styles.actionTextContainer}>
            <Text style={styles.actionTitle}>Add New Category</Text>
            <Text style={styles.actionSubtitle}>Create shop categories</Text>
          </View>
          <ChevronRight color="#CBD5E1" size={20} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionItem}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('AdminAddSlider')}
        >
          <View style={[styles.actionIcon, { backgroundColor: 'rgba(217,119,6,0.1)' }]}>
            <ImagePlus color="#D97706" size={22} />
          </View>
          <View style={styles.actionTextContainer}>
            <Text style={styles.actionTitle}>Add New Slider</Text>
            <Text style={styles.actionSubtitle}>Update home banners</Text>
          </View>
          <ChevronRight color="#CBD5E1" size={20} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionItem}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('AdminOrdersList')}
        >
          <View style={[styles.actionIcon, { backgroundColor: 'rgba(59,130,246,0.1)' }]}>
            <ClipboardList color="#3B82F6" size={22} />
          </View>
          <View style={styles.actionTextContainer}>
            <Text style={styles.actionTitle}>Manage Orders</Text>
            <Text style={styles.actionSubtitle}>View all customer orders</Text>
          </View>
          <ChevronRight color="#CBD5E1" size={20} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionItem}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('AdminReports')}
        >
          <View style={[styles.actionIcon, { backgroundColor: 'rgba(139,92,246,0.1)' }]}>
            <FileText color="#8B5CF6" size={22} />
          </View>
          <View style={styles.actionTextContainer}>
            <Text style={styles.actionTitle}>System Reports</Text>
            <Text style={styles.actionSubtitle}>Sales, Inventory & more</Text>
          </View>
          <ChevronRight color="#CBD5E1" size={20} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionItem}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('LocationTest')}
        >
          <View style={[styles.actionIcon, { backgroundColor: 'rgba(59,130,246,0.1)' }]}>
            <MapPin color="#3B82F6" size={22} />
          </View>
          <View style={styles.actionTextContainer}>
            <Text style={styles.actionTitle}>Verify GPS Location</Text>
            <Text style={styles.actionSubtitle}>Test live device GPS & accuracy</Text>
          </View>
          <ChevronRight color="#CBD5E1" size={20} />
        </TouchableOpacity>
      </View>



      {/* Sliders List */}
      <View style={styles.productListHeader}>
        <Text style={styles.sectionTitle}>Home Sliders</Text>
        <TouchableOpacity onPress={() => fetchSliders()} style={styles.refreshBtn}>
          <RefreshCw color={colors.primary} size={18} />
        </TouchableOpacity>
      </View>

      {sliders.length === 0 ? (
        <View style={styles.emptyProducts}>
          <ImagePlus color="#CBD5E1" size={32} />
          <Text style={styles.emptySubText}>No custom sliders yet</Text>
        </View>
      ) : (
        <View style={{ marginBottom: 24 }}>
          <FlatList
            data={sliders}
            renderItem={renderSlider}
            keyExtractor={(item) => String(item.id)}
            horizontal
            showsHorizontalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
          />
        </View>
      )}

      {/* Products List */}
      <View style={styles.productListHeader}>
        <Text style={styles.sectionTitle}>All Products</Text>
        <TouchableOpacity onPress={() => fetchData()} style={styles.refreshBtn}>
          <RefreshCw color={colors.primary} size={18} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderFooter = () => (
    <View>
      <View style={{ height: 30 }} />

      {/* Danger Zone */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
        <LogOut color="#EF4444" size={20} />
        <Text style={styles.logoutText}>Secure Logout</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </View>
  );

  const renderEmptyComponent = () => {
    if (isLoading) {
      return <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 30 }} />;
    }
    return (
      <View style={styles.emptyProducts}>
        <Package color="#CBD5E1" size={48} />
        <Text style={styles.emptyText}>No products yet</Text>
        <Text style={styles.emptySubText}>Tap "Add New Product" to get started</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" translucent={false} />

      {/* Clean Modern Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.adminTitle}>Admin Portal</Text>
        </View>
        <TouchableOpacity style={styles.logoutIconBtn} onPress={handleLogout}>
          <LogOut color="#EF4444" size={22} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={products}
        renderItem={renderProduct}
        keyExtractor={(item) => String(item.id)}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmptyComponent}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshing={isLoading}
        onRefresh={fetchData}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
      />

      {/* Logout Modal */}
      <LogoutModal
        visible={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={performLogout}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#F8FAFC',
  },
  greeting: { fontSize: 14, color: colors.textSecondary, marginBottom: 2, fontWeight: '600' },
  adminTitle: { fontSize: 26, fontWeight: '900', color: colors.text, letterSpacing: -1 },
  logoutIconBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(239,68,68,0.1)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)',
  },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 10 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 24 },
  statCard: {
    width: '48%',
    backgroundColor: colors.white,
    padding: 16, borderRadius: 24, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05, shadowRadius: 12, elevation: 2,
    alignItems: 'flex-start',
    borderWidth: 1, borderColor: '#F1F5F9',
  },
  iconBg: { width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  statValue: { fontSize: 24, fontWeight: '900', color: colors.text, letterSpacing: -0.5 },
  statLabel: { fontSize: 13, color: colors.textSecondary, fontWeight: '600', marginTop: 4 },
  sectionTitle: { fontSize: 20, fontWeight: '900', color: colors.text, letterSpacing: -0.5, marginBottom: 14 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  newOrderBadge: {
    backgroundColor: '#FEF3C7',
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 4,
    marginBottom: 14,
  },
  newOrderText: { color: '#B45309', fontSize: 12, fontWeight: '900' },
  ordersPanel: {
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 16,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  orderSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 14,
    marginBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  orderSummaryValue: { fontSize: 17, fontWeight: '900', color: colors.text },
  orderSummaryLabel: { fontSize: 11, color: '#94A3B8', fontWeight: '700', marginTop: 4 },
  orderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  orderIconBox: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  orderInfo: { flex: 1 },
  orderTitleText: { fontSize: 14, fontWeight: '900', color: colors.text, marginBottom: 3 },
  orderSubtitle: { fontSize: 12, color: '#64748B', fontWeight: '600' },
  orderProductsText: { fontSize: 12, color: colors.textSecondary, fontWeight: '700', marginTop: 5, lineHeight: 17 },
  orderAmountBox: { alignItems: 'flex-end', marginLeft: 10 },
  orderAmount: { fontSize: 13, fontWeight: '900', color: colors.text },
  orderStatus: { fontSize: 11, color: colors.primary, fontWeight: '800', marginTop: 3, textTransform: 'capitalize' },
  emptyOrders: { alignItems: 'center', paddingVertical: 22 },
  actionsList: {
    backgroundColor: colors.white, borderRadius: 24, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05, shadowRadius: 12, elevation: 2, marginBottom: 30,
    borderWidth: 1, borderColor: '#F1F5F9',
  },
  actionItem: {
    flexDirection: 'row', alignItems: 'center',
    padding: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  actionIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  actionTextContainer: { flex: 1 },
  actionTitle: { fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: 4 },
  actionSubtitle: { fontSize: 13, color: colors.textSecondary, fontWeight: '500' },
  productListHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  refreshBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: 'rgba(16,185,129,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  productsContainer: {
    backgroundColor: 'transparent',
  },
  productCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 24, padding: 12,
    borderWidth: 1, borderColor: '#F1F5F9',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05, shadowRadius: 12, elevation: 2,
  },
  productImageBox: {
    width: 70, height: 70, borderRadius: 18,
    backgroundColor: '#F8FAFC',
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden', marginRight: 16,
  },
  productImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  productInfo: { flex: 1 },
  productName: { fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: 4 },
  productCategory: { fontSize: 13, color: colors.textSecondary, fontWeight: '600', marginBottom: 8 },
  productMeta: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  productPrice: { fontSize: 16, fontWeight: '900', color: colors.primary },
  stockBadge: {
    backgroundColor: '#F8FAFC', paddingHorizontal: 10,
    paddingVertical: 4, borderRadius: 10,
  },
  stockText: { fontSize: 12, color: colors.textSecondary, fontWeight: '700' },
  actionButtons: { flexDirection: 'row', gap: 8, marginLeft: 12 },
  editBtn: {
    width: 44, height: 44, borderRadius: 16,
    backgroundColor: '#EFF6FF',
    alignItems: 'center', justifyContent: 'center',
  },
  deleteBtn: {
    width: 44, height: 44, borderRadius: 16,
    backgroundColor: '#FEF2F2',
    alignItems: 'center', justifyContent: 'center',
  },
  sliderCard: {
    width: 220, height: 120, borderRadius: 20, overflow: 'hidden',
    backgroundColor: '#F1F5F9', position: 'relative',
  },
  sliderImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  sliderImagePlaceholder: { width: '100%', height: '100%', backgroundColor: '#E2E8F0' },
  sliderOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)', flexDirection: 'row',
    alignItems: 'center', justifyContent: 'space-between', padding: 8,
  },
  sliderText: { color: colors.white, fontSize: 13, fontWeight: '700', flex: 1 },
  sliderDeleteBtn: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: 'rgba(239,68,68,0.2)',
    alignItems: 'center', justifyContent: 'center', marginLeft: 8,
  },
  emptyProducts: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 18, fontWeight: '800', color: colors.text, marginTop: 16 },
  emptySubText: { fontSize: 14, color: colors.textSecondary, marginTop: 6, fontWeight: '500' },
  logoutButton: {
    flexDirection: 'row', backgroundColor: '#FEF2F2',
    paddingVertical: 18, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#FEE2E2',
    marginTop: 10,
  },
  logoutText: { color: '#EF4444', fontSize: 16, fontWeight: '800', marginLeft: 10 },
});

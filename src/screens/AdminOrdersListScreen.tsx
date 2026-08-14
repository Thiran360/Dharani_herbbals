import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Package, Clock, CheckCircle, Truck, MapPin } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../theme/colors';

function formatDate(dateStr: string) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()} ${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
}

function getStatusColor(status: string) {
  const s = (status || '').toLowerCase();
  if (s === 'delivered') return '#15803D';
  if (s === 'shipped') return '#2563EB';
  if (s === 'confirmed') return '#D97706';
  return '#64748B';
}

function getStatusBg(status: string) {
  const s = (status || '').toLowerCase();
  if (s === 'delivered') return '#F0FDF4';
  if (s === 'shipped') return '#EFF6FF';
  if (s === 'confirmed') return '#FFFBEB';
  return '#F1F5F9';
}

export default function AdminOrdersListScreen() {
  const navigation = useNavigation<any>();
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch('https://api.codingboss.in/herbal/orders/');
      const data = await res.json();
      if (!res.ok) throw new Error('Failed to fetch orders');

      const sortedData = data.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setOrders(sortedData);
    } catch (e: any) {
      setError(e.message || 'Could not load orders.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderOrderCard = ({ item }: any) => (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <View style={styles.orderHeaderLeft}>
          <Package color={colors.primary} size={20} />
          <Text style={styles.orderIdText}>Order #{item.order_id}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusBg(item.status) }]}>
          <Text style={[styles.statusBadgeText, { color: getStatusColor(item.status) }]}>
            {item.status ? item.status.charAt(0).toUpperCase() + item.status.slice(1) : 'Pending'}
          </Text>
        </View>
      </View>
      
      <View style={styles.orderBody}>
        <View style={styles.orderRow}>
          <Clock size={16} color="#94A3B8" />
          <Text style={styles.orderRowText}>{formatDate(item.created_at)}</Text>
        </View>
        <View style={styles.orderRow}>
          <MapPin size={16} color="#94A3B8" />
          <Text style={styles.orderRowText} numberOfLines={2}>
            {item.shipping_address || 'Address not provided'}
          </Text>
        </View>
        {item.mobile ? (
          <Text style={styles.customerPhone}>Customer Phone: {item.mobile}</Text>
        ) : null}
      </View>

      <View style={styles.orderFooter}>
        <Text style={styles.itemsCount}>{item.items?.length || 0} Items</Text>
        <Text style={styles.orderTotal}>₹{item.total_amount}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All Orders</Text>
        <View style={{ width: 22 }} />
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading all orders...</Text>
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchOrders}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.centered}>
          <Package size={60} color="#CBD5E1" />
          <Text style={styles.emptyTitle}>No Orders Found</Text>
          <Text style={styles.emptySubtitle}>No customer orders have been placed yet.</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          renderItem={renderOrderCard}
          keyExtractor={(item) => String(item.order_id)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshing={isLoading}
          onRefresh={fetchOrders}
        />
      )}
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
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: colors.text },
  listContent: { padding: 20, paddingBottom: 60 },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  loadingText: { color: '#64748B', fontWeight: '600', fontSize: 15, marginTop: 12 },
  errorText: { color: '#EF4444', fontWeight: '600', fontSize: 15, textAlign: 'center' },
  retryBtn: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingHorizontal: 28,
    paddingVertical: 12,
    marginTop: 12,
  },
  retryText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  emptyTitle: { fontSize: 20, fontWeight: '900', color: '#334155', marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: '#94A3B8', fontWeight: '500', textAlign: 'center', marginTop: 8 },
  
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  orderHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  orderIdText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  orderBody: {
    gap: 8,
    marginBottom: 16,
  },
  orderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  orderRowText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
    flex: 1,
  },
  customerPhone: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '600',
    marginTop: 4,
    marginLeft: 24,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  itemsCount: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },
  orderTotal: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.primary,
  },
});

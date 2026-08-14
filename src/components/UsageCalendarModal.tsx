import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  Dimensions,
  FlatList
} from 'react-native';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Package,
  Clock,
  CheckCircle,
  Truck,
  ShoppingBag,
  ArrowRight,
  Tag
} from 'lucide-react-native';
import { colors } from '../theme/colors';
import { useAuthStore } from '../store/useAuthStore';
import { apiClient } from '../api/client';
import { getImageUrl } from '../utils/imageUrl';

interface UsageCalendarModalProps {
  visible: boolean;
  onClose: () => void;
  onNavigateToShop?: () => void;
}

const { width, height } = Dimensions.get('window');

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function formatYMD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseOrderDateString(dateVal: any): string {
  if (!dateVal) return '';
  const dateStr = String(dateVal).trim();
  if (!dateStr) return '';

  const ymdMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (ymdMatch) {
    return `${ymdMatch[1]}-${ymdMatch[2]}-${ymdMatch[3]}`;
  }

  const slashMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (slashMatch) {
    const p1 = Number(slashMatch[1]);
    const p2 = Number(slashMatch[2]);
    const y = slashMatch[3];
    let m = p1 > 12 ? p2 : p1;
    let d = p1 > 12 ? p1 : p2;
    const mStr = String(m).padStart(2, '0');
    const dStr = String(d).padStart(2, '0');
    return `${y}-${mStr}-${dStr}`;
  }

  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return formatYMD(d);
    }
  } catch (_) {}

  return dateStr.split('T')[0].split(' ')[0];
}

function formatOrderTime(dateVal: any): string {
  if (!dateVal) return '';
  const dateStr = String(dateVal).trim();
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  } catch (_) {}
  return '';
}

export default function UsageCalendarModal({ visible, onClose, onNavigateToShop }: UsageCalendarModalProps) {
  const user = useAuthStore((s) => s.user);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateYMD, setSelectedDateYMD] = useState(formatYMD(new Date()));
  
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchOrders = async () => {
    setIsLoading(true);
    let targetUserId = user?.id ? Number(user.id) : null;

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
        }
      } catch (e) {
        console.warn("Could not resolve customer ID for usage calendar:", e);
      }
    }

    if (!targetUserId || isNaN(targetUserId) || targetUserId <= 0) {
      setOrders([]);
      setIsLoading(false);
      return;
    }

    try {
      const responseData = await apiClient(`/my-orders/${targetUserId}/`);
      let userOrders = Array.isArray(responseData?.orders)
        ? responseData.orders
        : (Array.isArray(responseData) ? responseData : []);

      userOrders = userOrders.filter((ord: any) => {
        if (!ord) return false;
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
        const latestOrd = userOrders[0];
        const rawDate = latestOrd.placed_at || latestOrd.created_at || latestOrd.created_date || latestOrd.order_date || latestOrd.date;
        const latestYMD = parseOrderDateString(rawDate);
        if (latestYMD) {
          setSelectedDateYMD(latestYMD);
          const [y, m] = latestYMD.split('-').map(Number);
          if (y && m) {
            setCurrentDate(new Date(y, m - 1, 1));
          }
        }
      }
    } catch (err) {
      console.warn("Error fetching orders for calendar:", err);
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      fetchOrders();
    }
  }, [visible, user?.id]);

  // Map of YMD date string -> Array of orders placed on that day
  const ordersByDate = useMemo(() => {
    const map: { [ymd: string]: any[] } = {};
    orders.forEach((ord) => {
      const rawDate = ord.placed_at || ord.created_at || ord.created_date || ord.order_date || ord.date || ord.placed_date;
      const dateYMD = parseOrderDateString(rawDate);
      if (dateYMD) {
        if (!map[dateYMD]) {
          map[dateYMD] = [];
        }
        map[dateYMD].push(ord);
      }
    });
    return map;
  }, [orders]);

  // Calendar matrix calculation
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const startDayOfWeek = firstDay.getDay(); // 0 = Sun
    const totalDays = lastDay.getDate();

    const daysArr: Array<{ dayNum: number | null; ymd: string | null; isCurrentMonth: boolean }> = [];

    // Padding for days before month start
    for (let i = 0; i < startDayOfWeek; i++) {
      daysArr.push({ dayNum: null, ymd: null, isCurrentMonth: false });
    }

    // Month days
    for (let d = 1; d <= totalDays; d++) {
      const dayDate = new Date(year, month, d);
      daysArr.push({
        dayNum: d,
        ymd: formatYMD(dayDate),
        isCurrentMonth: true,
      });
    }

    return daysArr;
  }, [currentDate]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const selectedOrders = ordersByDate[selectedDateYMD] || [];

  const formattedSelectedDateDisplay = useMemo(() => {
    try {
      const [y, m, d] = selectedDateYMD.split('-').map(Number);
      if (y && m && d) {
        const dt = new Date(y, m - 1, d);
        return `${d} ${MONTH_NAMES[m - 1]} ${y}`;
      }
    } catch (_) {}
    return selectedDateYMD;
  }, [selectedDateYMD]);

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
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.headerIconBadge}>
                <CalendarIcon color={colors.primary} size={20} />
              </View>
              <View style={{ marginLeft: 10, flex: 1 }}>
                <Text style={styles.headerTitle}>Order & Usage Calendar</Text>
                <Text style={styles.headerSub}>Select any date to view orders placed on that day</Text>
              </View>
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
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Fetching order history...</Text>
            </View>
          ) : (
            <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
              {/* Month Navigation */}
              <View style={styles.monthHeader}>
                <TouchableOpacity onPress={handlePrevMonth} style={styles.monthNavBtn} activeOpacity={0.7}>
                  <ChevronLeft color="#0F172A" size={20} />
                </TouchableOpacity>

                <Text style={styles.monthTitle}>
                  {MONTH_NAMES[currentDate.getMonth()]} {currentDate.getFullYear()}
                </Text>

                <TouchableOpacity onPress={handleNextMonth} style={styles.monthNavBtn} activeOpacity={0.7}>
                  <ChevronRight color="#0F172A" size={20} />
                </TouchableOpacity>
              </View>

              {/* Weekday Labels */}
              <View style={styles.weekdayRow}>
                {WEEKDAYS.map((wd, idx) => (
                  <Text key={idx} style={styles.weekdayText}>{wd}</Text>
                ))}
              </View>

              {/* Calendar Grid */}
              <View style={styles.calendarGrid}>
                {calendarDays.map((cell, idx) => {
                  if (!cell.isCurrentMonth || !cell.ymd) {
                    return <View key={idx} style={styles.emptyDayCell} />;
                  }

                  const isSelected = cell.ymd === selectedDateYMD;
                  const dayOrders = ordersByDate[cell.ymd] || [];
                  const hasOrders = dayOrders.length > 0;
                  const isToday = cell.ymd === formatYMD(new Date());

                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[
                        styles.dayCell,
                        isToday && styles.todayCell,
                        hasOrders && styles.hasOrdersCell,
                        isSelected && styles.selectedDayCell,
                      ]}
                      onPress={() => setSelectedDateYMD(cell.ymd!)}
                      activeOpacity={0.8}
                    >
                      <Text style={[
                        styles.dayText,
                        isToday && styles.todayDayText,
                        hasOrders && styles.hasOrdersText,
                        isSelected && styles.selectedDayText,
                      ]}>
                        {cell.dayNum}
                      </Text>

                      {hasOrders && (
                        <View style={[styles.orderDotBadge, isSelected && styles.selectedDotBadge]}>
                          <Text style={[styles.orderDotText, isSelected && styles.selectedDotText]}>
                            {dayOrders.length}
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Selected Date Orders Section */}
              <View style={styles.ordersSection}>
                <View style={styles.ordersSectionHeader}>
                  <Text style={styles.ordersSectionTitle}>
                    Orders Placed on {formattedSelectedDateDisplay}
                  </Text>
                  {selectedOrders.length > 0 && (
                    <View style={styles.orderCountPill}>
                      <Text style={styles.orderCountPillText}>
                        {selectedOrders.length} {selectedOrders.length === 1 ? 'Order' : 'Orders'}
                      </Text>
                    </View>
                  )}
                </View>

                {selectedOrders.length === 0 ? (
                  <View style={styles.noOrdersCard}>
                    <Package color="#94A3B8" size={36} strokeWidth={1.5} />
                    <Text style={styles.noOrdersTitle}>No Orders Placed On This Date</Text>
                    <Text style={styles.noOrdersSub}>
                      You didn't place any orders on {formattedSelectedDateDisplay}. Dates with orders are highlighted in green.
                    </Text>
                    {onNavigateToShop && (
                      <TouchableOpacity 
                        style={styles.shopNowBtn}
                        onPress={() => {
                          onClose();
                          onNavigateToShop();
                        }}
                        activeOpacity={0.85}
                      >
                        <Text style={styles.shopNowBtnText}>Browse & Place Order</Text>
                        <ArrowRight color="#FFFFFF" size={16} style={{ marginLeft: 6 }} />
                      </TouchableOpacity>
                    )}
                  </View>
                ) : (
                  selectedOrders.map((ord, oIdx) => {
                    const orderItems = ord.items || ord.order_items || [];
                    const orderStatus = (ord.status || 'Order Placed').toUpperCase();
                    const orderTime = formatOrderTime(ord.created_at || ord.date || ord.order_date);

                    return (
                      <View key={ord.id || oIdx} style={styles.orderCard}>
                        {/* Order Top Bar */}
                        <View style={styles.orderCardHeader}>
                          <View>
                            <Text style={styles.orderIdText}>Order Summary</Text>
                            {orderTime ? (
                              <View style={styles.timeRow}>
                                <Clock size={13} color="#64748B" />
                                <Text style={styles.timeText}>Placed at {orderTime}</Text>
                              </View>
                            ) : null}
                          </View>
                          <View style={[
                            styles.statusBadge,
                            orderStatus.includes('DELIVERED') && styles.statusDelivered,
                            orderStatus.includes('SHIPPED') && styles.statusShipped,
                          ]}>
                            <Text style={styles.statusBadgeText}>{ord.status || 'CONFIRMED'}</Text>
                          </View>
                        </View>

                        {/* Items List */}
                        <View style={styles.itemsList}>
                          {orderItems.map((it: any, iIdx: number) => (
                            <View key={iIdx} style={styles.itemRow}>
                              <Image 
                                source={getImageUrl(it.image || it.product_image)} 
                                style={styles.itemImage}
                                resizeMode="contain"
                              />
                              <View style={styles.itemDetails}>
                                <Text style={styles.itemName} numberOfLines={1}>
                                  {it.name || it.product_name || 'Herbal Product'}
                                </Text>
                                <Text style={styles.itemSub}>Qty: {it.quantity || it.qty || 1} • ₹{it.price || 0}</Text>
                              </View>
                              <Text style={styles.itemTotal}>
                                ₹{((parseFloat(it.price) || 0) * (parseInt(it.quantity) || 1)).toFixed(0)}
                              </Text>
                            </View>
                          ))}
                        </View>

                        {/* Order Footer */}
                        <View style={styles.orderCardFooter}>
                          <Text style={styles.totalLabel}>Total Amount Paid:</Text>
                          <Text style={styles.totalValue}>₹{ord.total_amount || ord.total || 0}</Text>
                        </View>
                      </View>
                    );
                  })
                )}
              </View>
            </ScrollView>
          )}
        </View>
      </View>
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
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: height * 0.90,
    minHeight: height * 0.70,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 14,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.4,
  },
  headerSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
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
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 12,
    fontWeight: '600',
  },
  scrollArea: {
    flex: 1,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  monthNavBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekdayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  emptyDayCell: {
    width: `${100 / 7}%`,
    height: 48,
  },
  dayCell: {
    width: `${100 / 7}%`,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    marginVertical: 2,
  },
  todayCell: {
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  hasOrdersCell: {
    backgroundColor: '#DCFCE7',
  },
  selectedDayCell: {
    backgroundColor: colors.primary,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },
  todayDayText: {
    color: colors.primary,
    fontWeight: '900',
  },
  hasOrdersText: {
    color: '#15803D',
    fontWeight: '800',
  },
  selectedDayText: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  orderDotBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedDotBadge: {
    backgroundColor: '#FFFFFF',
  },
  orderDotText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  selectedDotText: {
    color: colors.primary,
  },
  ordersSection: {
    marginTop: 8,
    paddingBottom: 20,
  },
  ordersSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  ordersSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  orderCountPill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  orderCountPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#15803D',
  },
  noOrdersCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  noOrdersTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 10,
  },
  noOrdersSub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 19,
  },
  shopNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 16,
  },
  shopNowBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  orderCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 10,
    marginBottom: 12,
  },
  orderIdText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  timeText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  statusBadge: {
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  statusDelivered: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
  },
  statusShipped: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F172A',
  },
  itemsList: {
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  itemImage: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  itemDetails: {
    flex: 1,
    marginLeft: 12,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  itemSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  orderCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.primary,
  },
});

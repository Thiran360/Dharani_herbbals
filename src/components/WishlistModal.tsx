import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  Image,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { Heart, X, Trash2, ShoppingBag, ArrowRight, Plus } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { useWishlistStore, WishlistItem } from '../store/useWishlistStore';
import { useCartStore } from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore';
import { getImageUrl } from '../utils/imageUrl';

const { width } = Dimensions.get('window');

interface WishlistModalProps {
  visible: boolean;
  onClose: () => void;
  onNavigateToShop?: () => void;
}

export default function WishlistModal({ visible, onClose, onNavigateToShop }: WishlistModalProps) {
  const user = useAuthStore((state) => state.user);
  const { wishlistItems, removeFromWishlist, fetchWishlist } = useWishlistStore();
  const addToCart = useCartStore((state) => state.addToCart);

  useEffect(() => {
    if (visible) {
      fetchWishlist(user?.id);
    }
  }, [visible, user?.id]);

  const handleAddToCart = async (item: WishlistItem) => {
    await addToCart(item, user?.id || '');
  };

  const handleRemove = async (itemId: string | number) => {
    await removeFromWishlist(itemId, user?.id);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          
          {/* Header Bar */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.headerIconCircle}>
                <Heart color="#EF4444" size={22} fill="#EF4444" />
              </View>
              <View>
                <View style={styles.headerTitleRow}>
                  <Text style={styles.headerTitle}>My Wishlist</Text>
                  <View style={styles.countBadge}>
                    <Text style={styles.countBadgeText}>{wishlistItems.length} Saved</Text>
                  </View>
                </View>
                <Text style={styles.headerSubtitle}>Products you've saved to buy later</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <X color="#64748B" size={20} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          {/* List of Wishlisted Products */}
          <FlatList
            data={wishlistItems}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={() => (
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconCircle}>
                  <Heart color="#94A3B8" size={44} strokeWidth={1.5} />
                </View>
                <Text style={styles.emptyTitle}>Your Wishlist is Empty</Text>
                <Text style={styles.emptySubtitle}>
                  You haven't saved any herbal products to your favorites yet.
                </Text>
                {onNavigateToShop && (
                  <TouchableOpacity
                    style={styles.exploreBtn}
                    onPress={() => {
                      onClose();
                      onNavigateToShop();
                    }}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.exploreBtnText}>Explore Products</Text>
                    <ArrowRight size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                )}
              </View>
            )}
            renderItem={({ item }) => {
              const numericPrice = typeof item.price === 'number' ? item.price : parseFloat(String(item.price)) || 0;

              return (
                <View style={styles.itemCard}>
                  {/* Image */}
                  <View style={styles.imageContainer}>
                    <Image source={getImageUrl(item.image)} style={styles.productImage} resizeMode="contain" />
                  </View>

                  {/* Info */}
                  <View style={styles.infoContainer}>
                    <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
                    <Text style={styles.productPrice}>₹{numericPrice.toFixed(0)}</Text>

                    {/* Action Buttons */}
                    <View style={styles.actionRow}>
                      <TouchableOpacity
                        style={styles.addToCartBtn}
                        onPress={() => handleAddToCart(item)}
                        activeOpacity={0.85}
                      >
                        <Plus size={16} color="#FFFFFF" />
                        <Text style={styles.addToCartText}>Add</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.removeBtn}
                        onPress={() => handleRemove(item.id)}
                        activeOpacity={0.7}
                      >
                        <Trash2 size={16} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            }}
          />
        </View>
      </View>
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
    backgroundColor: '#FEF2F2',
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
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#EF4444',
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
  listContent: {
    padding: 20,
    paddingBottom: 60,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#334155',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 30,
    lineHeight: 18,
  },
  exploreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 24,
  },
  exploreBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    alignItems: 'center',
    gap: 14,
  },
  imageContainer: {
    width: 76,
    height: 76,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImg: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContainer: {
    flex: 1,
  },
  productName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 20,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.primary,
    marginTop: 4,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
  },
  addToCartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  addToCartText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  removeBtn: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

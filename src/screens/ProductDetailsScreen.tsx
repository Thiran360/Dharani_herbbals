import React, { useState, useRef, useEffect } from 'react';
import { 
  View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, 
  Dimensions, StatusBar, Animated, Platform, FlatList, Modal 
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { ShoppingCart, Star, Heart, ArrowLeft, ShieldCheck, Truck, Leaf, Sparkles, X, ChevronRight } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { useCartStore } from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore';
import { useWishlistStore } from '../store/useWishlistStore';
import CartSuccessModal from '../components/CartSuccessModal';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { getImageUrl } from '../utils/imageUrl';

const { width, height } = Dimensions.get('window');

const HEADER_HEIGHT = Platform.OS === 'ios' ? 90 : 70;
const IMAGE_HEIGHT = height * 0.65; // Massive edge-to-edge image

export default function ProductDetailsScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { product } = route.params;
  
  const addToCart = useCartStore((state) => state.addToCart);
  const buyNow = useCartStore((state) => state.buyNow);
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  
  const { toggleWishlist: storeToggleWishlist, isInWishlist } = useWishlistStore();
  const isWishlisted = isInWishlist(product?.id);

  const [showCartSuccess, setShowCartSuccess] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isImageViewerVisible, setIsImageViewerVisible] = useState(false);

  // Animations
  const scrollY = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(0)).current;
  const btnScaleAnim = useRef(new Animated.Value(1)).current;
  const heartScaleAnim = useRef(new Animated.Value(1)).current;
  const flatListRef = useRef<FlatList>(null);

  // Dynamic slider images setup from API
  const rawImages = [
    product.image,
    ...(Array.isArray(product.extra_images) ? product.extra_images : [])
  ].filter(Boolean);

  const productImages = rawImages.length > 0
    ? rawImages.map(img => typeof img === 'string' ? getImageUrl(img) : img)
    : [require('../assets/images/logo.png')];



  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      navigation.navigate('MainTabs', { screen: 'Profile' });
      return;
    }
    Animated.sequence([
      Animated.timing(btnScaleAnim, { toValue: 0.9, duration: 100, useNativeDriver: true }),
      Animated.spring(btnScaleAnim, { toValue: 1, friction: 3, tension: 100, useNativeDriver: true })
    ]).start();

    await addToCart(product, user?.id || '');
    setTimeout(() => {
      setShowCartSuccess(true);
    }, 200);
  };

  const handleBuyNow = async () => {
    if (!isAuthenticated) {
      navigation.navigate('MainTabs', { screen: 'Profile' });
      return;
    }
    await buyNow(product, user?.id || '');
    navigation.navigate('MainTabs', { screen: 'Cart' });
  };

  const toggleWishlist = async () => {
    if (!isAuthenticated) {
      navigation.navigate('MainTabs', { screen: 'Profile' });
      return;
    }
    Animated.sequence([
      Animated.timing(heartScaleAnim, { toValue: 0.7, duration: 100, useNativeDriver: true }),
      Animated.spring(heartScaleAnim, { toValue: 1.4, friction: 3, tension: 40, useNativeDriver: true }),
      Animated.spring(heartScaleAnim, { toValue: 1, friction: 5, tension: 40, useNativeDriver: true })
    ]).start();
    await storeToggleWishlist(product, user?.id);
  };

  const onImageScroll = (event: any) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = Math.round(event.nativeEvent.contentOffset.x / slideSize);
    if (activeImageIndex !== index) {
      setActiveImageIndex(index);
    }
  };

  const handleThumbnailPress = (index: number) => {
    setActiveImageIndex(index);
    flatListRef.current?.scrollToIndex({ index, animated: true });
  };

  const imageTranslateY = scrollY.interpolate({
    inputRange: [-100, 0, IMAGE_HEIGHT],
    outputRange: [-50, 0, IMAGE_HEIGHT * 0.4],
    extrapolate: 'clamp',
  });

  const imageScale = scrollY.interpolate({
    inputRange: [-100, 0],
    outputRange: [1.3, 1],
    extrapolateLeft: 'extend',
    extrapolateRight: 'clamp',
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [IMAGE_HEIGHT * 0.4, IMAGE_HEIGHT * 0.55],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const numericPrice = parseFloat(product.price) || 0;
  const numericMrp = parseFloat(product.mrp) || 0;
  const hasDiscount = numericMrp > numericPrice;
  const discountPercent = hasDiscount ? Math.round(((numericMrp - numericPrice) / numericMrp) * 100) : 0;
  const stockCount = Number(product.stock || 0);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      {/* Dynamic Header */}
      <Animated.View style={[styles.headerBg, { opacity: headerOpacity }]} />
      <View style={styles.floatingHeader}>
        <TouchableOpacity style={styles.glassIconBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <ArrowLeft color="#1E293B" size={24} strokeWidth={2.5} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.glassIconBtn} onPress={() => navigation.navigate('MainTabs', { screen: 'Cart' })} activeOpacity={0.7}>
          <ShoppingCart color="#1E293B" size={24} strokeWidth={2.5} />
          {/* Badge */}
          <View style={styles.cartBadge} />
        </TouchableOpacity>
      </View>

      <Animated.ScrollView 
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollContent}
      >
        
        {/* Parallax Image Showcase with Slider */}
        <Animated.View 
          style={[
            styles.imageShowcase, 
            { transform: [{ translateY: imageTranslateY }, { scale: imageScale }] }
          ]}
        >
          <FlatList 
            ref={flatListRef}
            data={productImages}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={onImageScroll}
            keyExtractor={(_, index) => index.toString()}
            renderItem={({ item, index }) => (
              <TouchableOpacity 
                activeOpacity={0.95} 
                onPress={() => setIsImageViewerVisible(true)}
                style={styles.sliderImageContainer}
              >
                <Image 
                  source={item} 
                  style={styles.mainImage} 
                  resizeMethod="resize" 
                  fadeDuration={0} 
                />
              </TouchableOpacity>
            )}
          />

          {/* Floating Ultra Thumbnail Pagination */}
          <View style={styles.paginationContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingHorizontal: 24 }}>
              {productImages.map((img, index) => {
                const isActive = activeImageIndex === index;
                return (
                  <TouchableOpacity 
                    key={index} 
                    onPress={() => handleThumbnailPress(index)}
                    activeOpacity={0.8}
                    style={[
                      styles.thumbnailWrapper,
                      isActive ? styles.activeThumbnailWrapper : null
                    ]}
                  >
                    <Image 
                      source={img} 
                      style={styles.thumbnailImage} 
                      resizeMethod="resize"
                      fadeDuration={0}
                    />
                    {!isActive && <View style={styles.thumbnailOverlay} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </Animated.View>

        {/* Ultra Premium Content Sheet */}
        <Animated.View style={[styles.contentSheet, { transform: [{ translateY: slideUpAnim }] }]}>
          
          <View style={styles.titleRow}>
            <View style={{ flex: 1, paddingRight: 20 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                <View style={styles.categoryBadge}>
                  <Leaf color={colors.primary} size={14} />
                  <Text style={styles.categoryBadgeText}>{product.category_name || 'Herbal'}</Text>
                </View>
                {product.brand ? (
                  <View style={[styles.categoryBadge, { backgroundColor: '#FFFBEB', borderColor: 'rgba(217, 119, 6, 0.3)' }]}>
                    <Sparkles color="#D97706" size={14} />
                    <Text style={[styles.categoryBadgeText, { color: '#D97706' }]}>{product.brand.trim()}</Text>
                  </View>
                ) : null}
                {product.weight_volume && product.weight_volume !== '0' ? (
                  <View style={[styles.categoryBadge, { backgroundColor: '#F1F5F9', borderColor: '#E2E8F0' }]}>
                    <Text style={[styles.categoryBadgeText, { color: colors.textSecondary }]}>{product.weight_volume}</Text>
                  </View>
                ) : null}
              </View>

              <Text style={styles.productName}>{product.name}</Text>
              
              {product.tamil_name ? (
                <Text style={styles.productTamilSubtitle}>{product.tamil_name}</Text>
              ) : null}
            </View>
            <Animated.View style={{ transform: [{ scale: heartScaleAnim }] }}>
              <TouchableOpacity style={styles.wishlistCircle} onPress={toggleWishlist} activeOpacity={0.7}>
                <Heart 
                  color={isWishlisted ? '#EF4444' : '#64748B'} 
                  size={28} 
                  fill={isWishlisted ? '#EF4444' : 'transparent'} 
                  strokeWidth={isWishlisted ? 0 : 2}
                />
              </TouchableOpacity>
            </Animated.View>
          </View>

          <View style={styles.ratingRow}>
            <View style={styles.ratingStars}>
              {[1,2,3,4,5].map(i => (
                <Star key={i} color="#F59E0B" size={16} fill="#F59E0B" style={{ marginRight: 2 }} />
              ))}
              <Text style={styles.ratingValueText}>4.9</Text>
            </View>
            <Text style={styles.reviewCountText}>(3,248 Reviews)</Text>

            {/* Stock Status Badge */}
            <View style={[styles.stockPill, stockCount > 0 ? styles.stockInPill : styles.stockOutPill]}>
              <Text style={[styles.stockPillText, stockCount > 0 ? styles.stockInText : styles.stockOutText]}>
                {stockCount > 0 ? `In Stock (${stockCount})` : 'Out of Stock'}
              </Text>
            </View>
          </View>
          
          <View style={styles.priceContainer}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
              <Text style={styles.currencySymbol}>₹</Text>
              <Text style={styles.productPrice}>{numericPrice}</Text>
            </View>
            {hasDiscount && (
              <View style={styles.originalPriceContainer}>
                <Text style={styles.originalPrice}>₹{numericMrp}</Text>
              </View>
            )}
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>About this product</Text>
          <Text style={styles.descriptionText}>{product.description}</Text>

          {/* Premium Benefits Grid */}
          <View style={styles.premiumBenefitsRow}>
            <View style={styles.premiumBenefitItem}>
              <View style={[styles.benefitIconBox, { backgroundColor: '#F0FDF4' }]}>
                <ShieldCheck color="#16A34A" size={26} />
              </View>
              <Text style={styles.benefitTitle}>100% Pure</Text>
              <Text style={styles.benefitSub}>Authentic</Text>
            </View>
            <View style={styles.premiumBenefitItem}>
              <View style={[styles.benefitIconBox, { backgroundColor: '#EFF6FF' }]}>
                <Sparkles color="#2563EB" size={26} />
              </View>
              <Text style={styles.benefitTitle}>Organic</Text>
              <Text style={styles.benefitSub}>Premium extracts</Text>
            </View>
            <View style={styles.premiumBenefitItem}>
              <View style={[styles.benefitIconBox, { backgroundColor: '#FFF7ED' }]}>
                <Truck color="#EA580C" size={26} />
              </View>
              <Text style={styles.benefitTitle}>Free Ship</Text>
              <Text style={styles.benefitSub}>Nationwide</Text>
            </View>
          </View>

          {/* Ultra Specs Accordion Style */}
          <TouchableOpacity style={styles.specBox} activeOpacity={0.7}>
            <View style={styles.specBoxLeft}>
              <View style={styles.specIconCircle}>
                <Leaf color={colors.textSecondary} size={20} />
              </View>
              <View>
                <Text style={styles.specTitleText}>Ingredients & Usage</Text>
                <Text style={styles.specSubText}>All natural herbal extracts</Text>
              </View>
            </View>
            <ChevronRight color="#CBD5E1" size={24} />
          </TouchableOpacity>

        </Animated.View>
      </Animated.ScrollView>

      {/* Ultra Floating Bottom Bar */}
      <View style={styles.ultraFooter}>
        <Animated.View style={{ flex: 1, transform: [{ scale: btnScaleAnim }] }}>
          <TouchableOpacity 
            style={styles.singleAddToCartBtn} 
            onPress={handleAddToCart} 
            activeOpacity={0.9}
          >
            <ShoppingCart color="#FFFFFF" size={22} />
            <Text style={styles.singleAddToCartText}>Add to Cart</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Full Screen Image Viewer Modal */}
      <Modal visible={isImageViewerVisible} transparent={true} animationType="fade">
        <View style={styles.modalViewerContainer}>
          <StatusBar barStyle="light-content" backgroundColor="black" />
          <TouchableOpacity 
            style={styles.closeViewerBtn} 
            onPress={() => setIsImageViewerVisible(false)}
          >
            <X color="#FFFFFF" size={32} />
          </TouchableOpacity>
          
          <FlatList 
            data={productImages}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={activeImageIndex}
            getItemLayout={(data, index) => ({ length: width, offset: width * index, index })}
            keyExtractor={(_, index) => index.toString()}
            renderItem={({ item }) => (
              <View style={styles.viewerImageWrapper}>
                <Image 
                  source={item} 
                  style={styles.viewerImage} 
                  resizeMethod="resize"
                  fadeDuration={0}
                />
              </View>
            )}
          />
        </View>
      </Modal>

      <CartSuccessModal
        visible={showCartSuccess}
        onClose={() => setShowCartSuccess(false)}
        onViewCart={() => {
          setShowCartSuccess(false);
          navigation.navigate('MainTabs', { screen: 'Cart' });
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', 
  },
  headerBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: HEADER_HEIGHT,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    zIndex: 9,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  floatingHeader: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 35,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    zIndex: 10,
  },
  glassIconBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,1)',
  },
  cartBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EF4444',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  scrollContent: {
    paddingBottom: 150, 
  },
  imageShowcase: {
    width: width,
    height: IMAGE_HEIGHT,
    backgroundColor: '#FFFFFF',
    position: 'relative',
  },
  sliderImageContainer: {
    width: width,
    height: IMAGE_HEIGHT,
  },
  mainImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  paginationContainer: {
    position: 'absolute',
    bottom: 50, 
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  thumbnailWrapper: {
    width: 50,
    height: 50,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
    overflow: 'hidden',
  },
  activeThumbnailWrapper: {
    borderColor: '#FFFFFF',
    transform: [{ scale: 1.1 }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  thumbnailOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  contentSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    minHeight: height * 0.5,
    marginTop: -30,
    paddingHorizontal: 24,
    paddingTop: 30,
    paddingBottom: 40,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
    marginLeft: 6,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  productName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 30,
  },
  productTamilSubtitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#16A34A',
    marginTop: 4,
  },
  stockPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 'auto',
  },
  stockInPill: {
    backgroundColor: '#ECFDF5',
  },
  stockOutPill: {
    backgroundColor: '#FEF2F2',
  },
  stockPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  stockInText: {
    color: '#16A34A',
  },
  stockOutText: {
    color: '#EF4444',
  },
  wishlistCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  ratingStars: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingValueText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
    marginLeft: 6,
  },
  reviewCountText: {
    fontSize: 14,
    color: '#94A3B8',
    marginLeft: 8,
    fontWeight: '600',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    marginRight: 4,
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 46,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -1.5,
  },
  originalPriceContainer: {
    alignItems: 'flex-end',
  },
  originalPrice: {
    fontSize: 20,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
    fontWeight: '700',
    marginBottom: 4,
  },
  discountBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  discountText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  descriptionText: {
    fontSize: 16,
    color: '#475569',
    lineHeight: 28,
    marginBottom: 36,
    fontWeight: '500',
  },
  premiumBenefitsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 36,
    gap: 12,
  },
  premiumBenefitItem: {
    flex: 1,
    backgroundColor: '#FAFAF9',
    paddingVertical: 20,
    paddingHorizontal: 10,
    borderRadius: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F5F5F4',
  },
  benefitIconBox: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  benefitTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1C1917',
    marginBottom: 4,
  },
  benefitSub: {
    fontSize: 12,
    fontWeight: '600',
    color: '#A8A29E',
    textAlign: 'center',
  },
  specBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  specBoxLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  specIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  specTitleText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  specSubText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  ultraFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    backgroundColor: 'rgba(255,255,255,0.95)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  singleAddToCartBtn: {
    height: 56,
    borderRadius: 22,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    gap: 10,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  singleAddToCartText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
  },
  singleAddToCartPrice: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  
  // Modal Viewer Styles
  modalViewerContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
  },
  closeViewerBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    right: 24,
    zIndex: 20,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 22,
  },
  viewerImageWrapper: {
    width: width,
    height: height,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewerImage: {
    width: width,
    height: height * 0.8,
    resizeMode: 'contain',
  }
});

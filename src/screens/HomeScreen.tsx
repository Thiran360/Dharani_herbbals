import React, { useState, useRef, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, 
  FlatList, Dimensions, TextInput, RefreshControl, Animated, Modal 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Plus, Star, Sparkles, Leaf, Search, ArrowRight, X, ChevronRight, Heart } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { useProductStore } from '../store/useProductStore';
import { useCartStore } from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore';
import { useWishlistStore } from '../store/useWishlistStore';
import { useSliderStore } from '../store/useSliderStore';
import CartSuccessModal from '../components/CartSuccessModal';
import { getImageUrl } from '../utils/imageUrl';

const { width } = Dimensions.get('window');

const BANNERS = [
  {
    id: '1',
    title: "Nature's Best",
    subtitle: "Up to 30% Off",
    badge: "Premium Quality",
    icon: Sparkles,
    image: require('../assets/images/nature_hair_care.jpg'),
  },
  {
    id: '2',
    title: "Herbal Glow",
    subtitle: "Buy 1 Get 1 Free",
    badge: "Special Offer",
    icon: Star,
    image: require('../assets/images/herbal_face_wash.jpg'),
  },
  {
    id: '3',
    title: "New Arrivals",
    subtitle: "Discover organic oils",
    badge: "Just Added",
    icon: Leaf,
    image: require('../assets/images/organic_oils.jpg'),
  },
];

const ProductCard = React.memo(({ item, onAddToCart, isWishlisted }: { item: any, onAddToCart: (item: any) => void, isWishlisted?: boolean }) => {
  const navigation = useNavigation<any>();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const toggleWishlist = useWishlistStore((state) => state.toggleWishlist);

  const numericPrice = parseFloat(item.price) || 0;
  const numericMrp = parseFloat(item.mrp) || 0;
  const hasDiscount = numericMrp > numericPrice;
  const discountPercent = hasDiscount ? Math.round(((numericMrp - numericPrice) / numericMrp) * 100) : 0;
  const isOutOfStock = item.stock !== undefined && item.stock !== null && Number(item.stock) === 0 && item.stock !== '0';

  return (
    <View style={styles.productCardWrapper}>
      <TouchableOpacity
        style={styles.productCard}
        onPress={() => navigation.navigate('ProductDetails', { product: item })}
        activeOpacity={0.9}
      >
        <View style={styles.productImageContainer}>
          <Image 
            source={getImageUrl(item.image)} 
            style={styles.productImage} 
            resizeMethod="resize" 
            fadeDuration={0} 
          />
          <TouchableOpacity
            style={styles.cardWishlistBtn}
            onPress={() => {
              if (!isAuthenticated) {
                navigation.navigate('MainTabs', { screen: 'Profile' });
              } else {
                toggleWishlist(item, user?.id);
              }
            }}
            activeOpacity={0.75}
          >
            <Heart 
              size={15} 
              color={isWishlisted ? '#EF4444' : '#64748B'} 
              fill={isWishlisted ? '#EF4444' : 'transparent'} 
            />
          </TouchableOpacity>
          {item.is_new && (
            <View style={[styles.discountTag, { backgroundColor: '#3B82F6' }]}>
              <Text style={styles.discountTagText}>NEW</Text>
            </View>
          )}
          <View style={styles.productRating}>
            <Star color="#FBBF24" size={11} fill="#FBBF24" />
            <Text style={styles.productRatingText}>4.8</Text>
          </View>
        </View>

        <View style={styles.productDetails}>
          <Text style={styles.productCategory} numberOfLines={1}>
            {item.category_name || 'Herbal'}{item.brand ? ` • ${item.brand.trim()}` : ''}
          </Text>
          
          <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>

          {item.weight_volume && item.weight_volume !== '0' ? (
            <View style={styles.weightBadge}>
              <Text style={styles.weightBadgeText}>{item.weight_volume}</Text>
            </View>
          ) : null}

          <View style={styles.productBottomRow}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
                <Text style={styles.productPrice}>₹{item.price}</Text>
                {hasDiscount && (
                  <Text style={styles.productMrp}>₹{item.mrp}</Text>
                )}
              </View>
            </View>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => onAddToCart(item)}
              activeOpacity={0.7}
            >
              <Plus color={colors.white} size={16} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
});

const CategoryCard = ({ cat, count, onPress }: { cat: any, count: number, onPress: () => void }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.93, useNativeDriver: true }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, friction: 4, tension: 70, useNativeDriver: true }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={styles.categoryCard}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
      >
        <View style={styles.categoryCardImageContainer}>
          <Image
            source={getImageUrl(cat.image)}
            style={styles.categoryCardImage}
            resizeMethod="resize"
            fadeDuration={0}
          />
        </View>
        <Text style={styles.categoryCardTitle} numberOfLines={1}>
          {cat.name}
        </Text>
        <Text style={styles.categoryCardCount}>
          {count} {count === 1 ? 'Item' : 'Items'}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const BrandSliderCard = ({ brand, count, onPress }: { brand: any, count: number, onPress: () => void }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, friction: 4, tension: 70, useNativeDriver: true }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }], marginRight: 14 }}>
      <TouchableOpacity
        style={styles.brandSliderCard}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
      >
        <View style={styles.brandSliderLogoContainer}>
          <Image
            source={getImageUrl(brand.logo)}
            style={styles.brandSliderLogo}
            resizeMethod="resize"
            fadeDuration={0}
          />
        </View>

        <View style={styles.brandSliderDetails}>
          <Text style={styles.brandSliderTitle} numberOfLines={1}>
            {brand.name ? brand.name.trim() : 'Brand'}
          </Text>
          <Text style={styles.brandSliderCount}>
            {count} {count === 1 ? 'Product' : 'Products'}
          </Text>
          
          <View style={styles.brandSliderBadge}>
            <Text style={styles.brandSliderBadgeText}>Shop Brand</Text>
            <ChevronRight color="#D97706" size={14} />
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const [activeBanner, setActiveBanner] = useState(0);
  const [activeBrandSlide, setActiveBrandSlide] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [catSearchQuery, setCatSearchQuery] = useState('');
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [brandSearchQuery, setBrandSearchQuery] = useState('');
  const scrollRef = useRef<ScrollView>(null);
  const brandScrollRef = useRef<ScrollView>(null);
  
  const products = useProductStore((s) => s.products);
  const categories = useProductStore((s) => s.categories);
  const brands = useProductStore((s) => s.brands);
  const mostLovedProducts = useProductStore((s) => s.mostLovedProducts);
  const isLoading = useProductStore((s) => s.isLoading);
  const fetchData = useProductStore((s) => s.fetchData);

  const sliders = useSliderStore((s) => s.sliders);
  const fetchSliders = useSliderStore((s) => s.fetchSliders);

  const addToCart = useCartStore((state) => state.addToCart);
  const wishlistItems = useWishlistStore((state) => state.wishlistItems);
  const wishlistedIds = React.useMemo(() => new Set(wishlistItems.map((i) => String(i.id))), [wishlistItems]);

  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [showCartSuccess, setShowCartSuccess] = useState(false);

  useEffect(() => {
    fetchData();
    fetchSliders();
  }, [fetchData, fetchSliders, isAuthenticated]);

  // Auto-slide brands slider every 3 seconds
  useEffect(() => {
    if (!Array.isArray(brands) || brands.length <= 1) return;

    const slideWidth = width * 0.72 + 14;
    const brandAutoSlideTimer = setInterval(() => {
      setActiveBrandSlide((prev) => {
        const nextIndex = prev + 1 >= brands.length ? 0 : prev + 1;
        brandScrollRef.current?.scrollTo({
          x: nextIndex * slideWidth,
          animated: true,
        });
        return nextIndex;
      });
    }, 3000);

    return () => clearInterval(brandAutoSlideTimer);
  }, [brands]);

  const onRefresh = React.useCallback(() => {
    fetchData({ force: true });
    fetchSliders({ force: true });
  }, [fetchData, fetchSliders]);

  const displayBanners = React.useMemo(() => sliders.length > 0 ? sliders.map(s => ({
    id: String(s.id),
    title: s.overlay_text,
    subtitle: "Special Offer",
    badge: "Featured",
    icon: Sparkles,
    image: getImageUrl(s.image)
  })) : BANNERS, [sliders]);

  const handleAddToCart = React.useCallback(async (item: any) => {
    if (!isAuthenticated) {
      navigation.navigate('MainTabs', { screen: 'Profile' });
      return;
    }
    setShowCartSuccess(true);
    await addToCart(item, user?.id || '');
  }, [addToCart, user?.id, isAuthenticated, navigation]);


  const TRENDING_IDS = React.useMemo(() => ['1230', '1228', '1192', '1250', '1199', '1272', '1239', '1246', '1265'], []);
  const trendingProducts = React.useMemo(() => {
    if (!Array.isArray(products) || products.length === 0) return [];
    const matched = products.filter(p => TRENDING_IDS.includes(String(p.id)));
    return matched.length > 0 ? matched : products.slice(0, 9);
  }, [products, TRENDING_IDS]);
  const mostLovedDisplay = React.useMemo(() => (Array.isArray(mostLovedProducts) && mostLovedProducts.length > 0) ? mostLovedProducts : [], [mostLovedProducts]);
  const handpickedProducts = React.useMemo(() => products.slice(4), [products]);

  const homeSearchResults = React.useMemo(() => {
    if (!searchQuery.trim()) return [];
    return products
      .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .slice(0, 20);
  }, [products, searchQuery]);

  const handleScrollEnd = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const itemWidth = width * 0.85 + 20;
    const index = Math.round(scrollPosition / itemWidth);
    if (index !== activeBanner && index >= 0 && index < displayBanners.length) {
      setActiveBanner(index);
    }
  };

  const handleBrandScrollEnd = (e: any) => {
    const contentOffsetX = e.nativeEvent.contentOffset.x;
    const slideWidth = width * 0.72 + 14;
    const currentIndex = Math.round(contentOffsetX / slideWidth);
    setActiveBrandSlide(currentIndex);
  };

  const renderProductItem = React.useCallback(
    ({ item }: { item: any }) => (
      <ProductCard
        item={item}
        onAddToCart={handleAddToCart}
        isWishlisted={wishlistedIds.has(String(item.id))}
      />
    ),
    [handleAddToCart, wishlistedIds]
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
      
      {/* Premium Search Bar */}
      <View style={styles.searchContainerWrapper}>
        <View style={styles.searchBar}>
          <Search color={colors.textSecondary} size={22} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Discover nature's finest..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
          />
          {searchQuery.length > 0 ? (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.searchAction} activeOpacity={0.7}>
              <Text style={{color: colors.primary, fontWeight: '800'}}>X</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.searchAction}>
              <Leaf color={colors.primary} size={18} />
            </View>
          )}
        </View>

        {searchQuery.trim().length > 0 && (
          <View style={styles.searchResultsContainer}>
            <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: 300 }}>
              {homeSearchResults.length > 0 ? (
                homeSearchResults.map((item) => (
                  <TouchableOpacity 
                    key={item.id} 
                    style={styles.searchResultItem}
                    activeOpacity={0.7}
                    onPress={() => {
                      setSearchQuery('');
                      navigation.navigate('ProductDetails', { product: item });
                    }}
                  >
                    <Image 
                      source={getImageUrl(item.image)} 
                      style={styles.searchResultImage} 
                      resizeMethod="resize" 
                      fadeDuration={0} 
                    />
                    <View style={styles.searchResultInfo}>
                      <Text style={styles.searchResultName} numberOfLines={1}>{item.name}</Text>
                      <Text style={styles.searchResultCategory}>{item.category_name || 'Herbal'}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={styles.searchResultPrice}>₹{item.price}</Text>
                      <TouchableOpacity 
                        style={styles.searchAddBtn}
                        onPress={() => handleAddToCart(item)}
                        activeOpacity={0.7}
                      >
                        <Plus color={colors.white} size={14} />
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.noResultsContainer}>
                  <Text style={styles.noResultsText}>No products found matching "{searchQuery}"</Text>
                </View>
              )}
            </ScrollView>
          </View>
        )}
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      >
        
        {/* Ultra Modern Banner Carousel */}
        <View style={styles.carouselSection}>
          <ScrollView 
            ref={scrollRef}
            horizontal 
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleScrollEnd}
            snapToInterval={width * 0.85 + 20}
            decelerationRate="fast"
            contentContainerStyle={styles.carouselContent}
          >
            {displayBanners.map((banner) => {
              const IconComp = banner.icon;
              return (
                <View key={banner.id} style={styles.bannerWrapper}>
                  <View style={styles.bannerContainer}>
                    <Image 
                      source={banner.image} 
                      style={styles.bannerImage} 
                      resizeMethod="resize" 
                      fadeDuration={0} 
                    />
                    <View style={styles.bannerOverlay} />
                    <View style={styles.bannerContent}>
                      <View style={styles.bannerBadge}>
                        <IconComp color={colors.primary} size={12} />
                        <Text style={styles.bannerBadgeText}>{banner.badge}</Text>
                      </View>
                      <Text style={styles.bannerTitle} numberOfLines={2}>{banner.title}</Text>
                      <Text style={styles.bannerSubtitle} numberOfLines={1}>{banner.subtitle}</Text>
                      <TouchableOpacity style={styles.exploreBtn}>
                        <Text style={styles.exploreBtnText}>Explore</Text>
                        <ArrowRight color={colors.text} size={16} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })}
          </ScrollView>

          {/* Morphing Pagination */}
          <View style={styles.paginationContainer}>
            {displayBanners.map((_, index) => (
              <View 
                key={index} 
                style={[
                  styles.dot, 
                  activeBanner === index ? styles.activeDot : null
                ]} 
              />
            ))}
          </View>
        </View>

        {/* Curated Categories */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Shop by Category</Text>
            <Text style={styles.sectionSubtitle}>100% Organic & Herbal Care</Text>
          </View>
          <TouchableOpacity onPress={() => setShowCategoryModal(true)} style={styles.seeAllBtn}>
            <Text style={styles.seeAllText}>View All</Text>
            <ArrowRight color={colors.primary} size={16} />
          </TouchableOpacity>
        </View>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.categoriesScroll} 
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 6 }}
        >
          {(Array.isArray(categories) ? categories : []).map((cat) => {
            const count = (Array.isArray(products) ? products : []).filter(p => 
              String(p.category) === String(cat.id) || 
              (p.category_name && p.category_name.toLowerCase().trim() === cat.name?.toLowerCase().trim())
            ).length;

            return (
              <CategoryCard 
                key={cat.id} 
                cat={cat} 
                count={count}
                onPress={() => navigation.navigate('Shop', { category: cat.name })}
              />
            );
          })}
        </ScrollView>

        {/* Featured Brands Slider */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Featured Brands</Text>
            <Text style={styles.sectionSubtitle}>Authentic Siddha & Herbal Makers</Text>
          </View>
          <TouchableOpacity onPress={() => setShowBrandModal(true)} style={styles.seeAllBtn}>
            <Text style={styles.seeAllText}>View All ({brands.length})</Text>
            <ArrowRight color={colors.primary} size={16} />
          </TouchableOpacity>
        </View>

        <View style={{ marginBottom: 15 }}>
          <ScrollView 
            ref={brandScrollRef}
            horizontal 
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleBrandScrollEnd}
            snapToInterval={width * 0.72 + 14}
            decelerationRate="fast"
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 6 }}
          >
            {(Array.isArray(brands) ? brands : []).map((b, idx) => {
              const count = (Array.isArray(products) ? products : []).filter(p => 
                (p.brand_id !== undefined && b.id !== undefined && String(p.brand_id) === String(b.id)) || 
                (p.brand && b.name && String(p.brand).toLowerCase().trim() === String(b.name).toLowerCase().trim())
              ).length;

              return (
                <BrandSliderCard 
                  key={b.id || idx} 
                  brand={b} 
                  count={count}
                  onPress={() => navigation.navigate('Shop', { brand: b.name ? String(b.name).trim() : '' })}
                />
              );
            })}
          </ScrollView>

          {/* Brands Slider Pagination Dots */}
          {Array.isArray(brands) && brands.length > 1 && (
            <View style={styles.brandPaginationContainer}>
              {brands.map((_, index) => (
                <View 
                  key={index} 
                  style={[
                    styles.brandDot, 
                    activeBrandSlide === index ? styles.activeBrandDot : null
                  ]} 
                />
              ))}
            </View>
          )}
        </View>

        {/* Most Loved Products */}
        {mostLovedDisplay.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Most Loved</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Shop', { filter: 'mostLoved', mostLoved: true })} style={styles.seeAllBtn}>
                <Text style={styles.seeAllText}>See All</Text>
                <ArrowRight color={colors.primary} size={16} />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={mostLovedDisplay}
              renderItem={renderProductItem}
              keyExtractor={(item) => String(item.id)}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.productList}
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          windowSize={9}
          removeClippedSubviews={false}
            />
          </>
        )}

        {/* Trending Products */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Trending Products</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Shop', { filter: 'all', mostLoved: false, category: 'All', brand: 'All' })} style={styles.seeAllBtn}>
            <Text style={styles.seeAllText}>See All</Text>
            <ArrowRight color={colors.primary} size={16} />
          </TouchableOpacity>
        </View>
        
        <FlatList
          data={trendingProducts}
          renderItem={renderProductItem}
          keyExtractor={(item) => String(item.id)}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.productList}
          initialNumToRender={6}
          maxToRenderPerBatch={6}
          windowSize={5}
          removeClippedSubviews={false}
        />

        {/* Handpicked Deals */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Handpicked Deals</Text>
        </View>
        
        <FlatList
          data={handpickedProducts}
          renderItem={renderProductItem}
          keyExtractor={(item) => item.id.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.productList, { paddingBottom: 40 }]}
          initialNumToRender={6}
          maxToRenderPerBatch={6}
          windowSize={5}
          removeClippedSubviews={false}
        />
        
      </ScrollView>

      <CartSuccessModal
        visible={showCartSuccess}
        onClose={() => setShowCartSuccess(false)}
        onViewCart={() => {
          setShowCartSuccess(false);
          navigation.navigate('Cart');
        }}
      />

      {/* All Categories Bottom Sheet Modal */}
      <Modal
        visible={showCategoryModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.catModalContent}>
            <View style={styles.catModalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={styles.catModalHeaderIcon}>
                  <Leaf color={colors.primary} size={20} />
                </View>
                <View style={{ marginLeft: 10 }}>
                  <Text style={styles.catModalTitle}>All Categories</Text>
                  <Text style={styles.catModalSub}>{(Array.isArray(categories) ? categories : []).length} Herbal Collections</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.catModalCloseBtn} onPress={() => setShowCategoryModal(false)}>
                <X color={colors.textSecondary} size={20} />
              </TouchableOpacity>
            </View>

            {/* Filter Search inside Modal */}
            <View style={styles.catModalSearchContainer}>
              <Search color="#94A3B8" size={18} style={{ marginRight: 8 }} />
              <TextInput
                style={styles.catModalSearchInput}
                placeholder="Search category..."
                placeholderTextColor="#94A3B8"
                value={catSearchQuery}
                onChangeText={setCatSearchQuery}
              />
              {catSearchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setCatSearchQuery('')}>
                  <X color="#94A3B8" size={16} />
                </TouchableOpacity>
              )}
            </View>

            <ScrollView contentContainerStyle={styles.catGridContainer} showsVerticalScrollIndicator={false}>
              <View style={styles.catGrid}>
                {(Array.isArray(categories) ? categories : [])
                  .filter(c => !catSearchQuery.trim() || c.name.toLowerCase().includes(catSearchQuery.toLowerCase()))
                  .map((cat) => {
                    const count = (Array.isArray(products) ? products : []).filter(p => 
                      String(p.category) === String(cat.id) || 
                      (p.category_name && p.category_name.toLowerCase().trim() === cat.name?.toLowerCase().trim())
                    ).length;

                    return (
                      <TouchableOpacity
                        key={cat.id}
                        style={styles.catGridItem}
                        activeOpacity={0.85}
                        onPress={() => {
                          setShowCategoryModal(false);
                          navigation.navigate('Shop', { category: cat.name });
                        }}
                      >
                        <Image 
                          source={getImageUrl(cat.image)} 
                          style={styles.catGridImage} 
                          resizeMethod="resize" 
                        />
                        <View style={styles.catGridInfo}>
                          <Text style={styles.catGridName} numberOfLines={1}>{cat.name}</Text>
                          <View style={styles.catGridBadgeRow}>
                            <Text style={styles.catGridCount}>{count} Items</Text>
                            <ArrowRight color={colors.primary} size={14} />
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* All Brands Bottom Sheet Modal */}
      <Modal
        visible={showBrandModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowBrandModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.catModalContent}>
            <View style={styles.catModalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={[styles.catModalHeaderIcon, { backgroundColor: '#FEF3C7' }]}>
                  <Sparkles color="#D97706" size={20} />
                </View>
                <View style={{ marginLeft: 10 }}>
                  <Text style={styles.catModalTitle}>Featured Brands</Text>
                  <Text style={styles.catModalSub}>{(Array.isArray(brands) ? brands : []).length} Authentic Herbal Makers</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.catModalCloseBtn} onPress={() => setShowBrandModal(false)}>
                <X color={colors.textSecondary} size={20} />
              </TouchableOpacity>
            </View>

            {/* Filter Search inside Modal */}
            <View style={styles.catModalSearchContainer}>
              <Search color="#94A3B8" size={18} style={{ marginRight: 8 }} />
              <TextInput
                style={styles.catModalSearchInput}
                placeholder="Search brand..."
                placeholderTextColor="#94A3B8"
                value={brandSearchQuery}
                onChangeText={setBrandSearchQuery}
              />
              {brandSearchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setBrandSearchQuery('')}>
                  <X color="#94A3B8" size={16} />
                </TouchableOpacity>
              )}
            </View>

            <ScrollView contentContainerStyle={styles.catGridContainer} showsVerticalScrollIndicator={false}>
              <View style={styles.catGrid}>
                {(Array.isArray(brands) ? brands : [])
                  .filter(b => !brandSearchQuery.trim() || b.name.toLowerCase().includes(brandSearchQuery.toLowerCase()))
                  .map((b) => {
                    const count = (Array.isArray(products) ? products : []).filter(p => 
                      String(p.brand_id) === String(b.id) || 
                      (p.brand && p.brand.toLowerCase().trim() === b.name?.toLowerCase().trim())
                    ).length;

                    return (
                      <TouchableOpacity
                        key={b.id}
                        style={styles.catGridItem}
                        activeOpacity={0.85}
                        onPress={() => {
                          setShowBrandModal(false);
                          navigation.navigate('Shop', { brand: b.name.trim() });
                        }}
                      >
                        <Image 
                          source={getImageUrl(b.logo)} 
                          style={styles.brandGridLogo} 
                          resizeMethod="resize" 
                        />
                        <View style={styles.catGridInfo}>
                          <Text style={styles.catGridName} numberOfLines={1}>{b.name ? b.name.trim() : ''}</Text>
                          <View style={styles.catGridBadgeRow}>
                            <Text style={styles.catGridCount}>{count} Products</Text>
                            <ArrowRight color={colors.primary} size={14} />
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAFCFC', 
  },
  searchContainerWrapper: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    backgroundColor: '#FAFCFC',
    zIndex: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    height: 56,
    borderRadius: 28,
    paddingHorizontal: 20,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.05)',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
    letterSpacing: 0.2,
    height: '100%',
  },
  searchAction: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchResultsContainer: {
    position: 'absolute',
    top: 75,
    left: 20,
    right: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.05)',
    overflow: 'hidden',
    zIndex: 100,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  searchResultImage: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    marginRight: 12,
  },
  searchResultInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  searchResultName: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 2,
  },
  searchResultCategory: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  searchResultPrice: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.primary,
  },
  noResultsContainer: {
    padding: 24,
    alignItems: 'center',
  },
  noResultsText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  carouselSection: {
    marginTop: 10,
  },
  carouselContent: {
    paddingHorizontal: 20,
  },
  bannerWrapper: {
    width: width * 0.85,
    marginRight: 20,
    height: 220,
  },
  bannerContainer: {
    flex: 1,
    borderRadius: 32,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
  bannerImage: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  bannerOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  bannerContent: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 24,
    paddingBottom: 24,
    zIndex: 2,
  },
  bannerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 12,
  },
  bannerBadgeText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bannerTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginBottom: 4,
    textAlign: 'left',
  },
  bannerSubtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 15,
    marginBottom: 16,
    fontWeight: '500',
    textAlign: 'left',
  },
  exploreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  exploreBtnText: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 14,
    marginRight: 6,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#CBD5E1',
    marginHorizontal: 4,
  },
  activeDot: {
    width: 24,
    backgroundColor: colors.primary,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 30,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: -0.5,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeAllText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 14,
    marginRight: 4,
  },
  sectionSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
    marginTop: 2,
  },
  categoriesScroll: {
    marginBottom: 16,
  },
  categoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 12,
    alignItems: 'center',
    width: 105,
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.12)',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  categoryCardImageContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F0FDF4',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryCardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  categoryCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginTop: 8,
    textAlign: 'center',
  },
  categoryCardCount: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
    marginTop: 2,
  },
  brandSliderCard: {
    width: width * 0.72,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#FEF3C7',
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  brandSliderLogoContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    borderWidth: 2,
    borderColor: '#FDE68A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    overflow: 'hidden',
  },
  brandSliderLogo: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  brandSliderDetails: {
    flex: 1,
  },
  brandSliderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  brandSliderCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 6,
  },
  brandSliderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.25)',
  },
  brandSliderBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#D97706',
    marginRight: 2,
  },
  brandPaginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  brandDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 3,
  },
  activeBrandDot: {
    width: 20,
    backgroundColor: '#D97706',
  },
  brandGridLogo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
  },
  catModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 34,
    maxHeight: '80%',
  },
  catModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 14,
  },
  catModalHeaderIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  catModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  catModalSub: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
  },
  catModalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  catModalSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  catModalSearchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    padding: 0,
  },
  catGridContainer: {
    paddingBottom: 20,
  },
  catGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  catGridItem: {
    width: '48%',
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    padding: 12,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  catGridImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
  },
  catGridInfo: {
    flex: 1,
    marginLeft: 10,
  },
  catGridName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  catGridBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  catGridCount: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
  },
  productList: {
    paddingHorizontal: 20,
  },
  productCardWrapper: {
    width: 170,
    marginRight: 16,
    marginBottom: 20,
  },
  productCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  productImageContainer: {
    width: '100%',
    height: 150,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  cardWishlistBtn: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  productRating: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255,255,255,0.95)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  productRatingText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.text,
    marginLeft: 4,
  },
  productDetails: {
    padding: 14,
  },
  productCategory: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  productName: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '800',
    marginBottom: 2,
  },
  productTamilName: {
    fontSize: 12,
    color: '#16A34A',
    fontWeight: '700',
    marginBottom: 4,
  },
  weightBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 8,
  },
  weightBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },
  discountTag: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#EF4444',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    zIndex: 2,
  },
  discountTagText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  productBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productPrice: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '900',
    marginRight: 6,
  },
  productMrp: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
    textDecorationLine: 'line-through',
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addButtonDisabled: {
    backgroundColor: '#CBD5E1',
    shadowOpacity: 0,
    elevation: 0,
  },
  searchAddBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
});

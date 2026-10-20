import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, Image, 
  TextInput, ScrollView, Dimensions, Animated, Modal, KeyboardAvoidingView, Platform, RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useIsFocused } from '@react-navigation/native';
import { Search, SlidersHorizontal, Star, Plus, X, Leaf, Sparkles, Heart } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { useProductStore } from '../store/useProductStore';
import { useCartStore } from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore';
import { useWishlistStore } from '../store/useWishlistStore';
import CartSuccessModal from '../components/CartSuccessModal';

const { width } = Dimensions.get('window');

import { getImageUrl } from '../utils/imageUrl';

const AnimatedCategoryChip = ({ cat, count, isActive, onPress }: any) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.94, useNativeDriver: true }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }).start();
  };

  const isAll = cat.name === 'All';

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[styles.categoryPill, isActive && styles.categoryPillActive]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
      >
        <View style={[styles.categoryPillImageWrapper, isActive && styles.categoryPillImageWrapperActive]}>
          {isAll ? (
            <Leaf color={isActive ? '#FFFFFF' : colors.primary} size={16} />
          ) : (
            <Image 
              source={getImageUrl(cat.image)} 
              style={styles.categoryPillImage} 
              resizeMethod="resize" 
              fadeDuration={0}
            />
          )}
        </View>
        <Text style={[styles.categoryPillText, isActive && styles.categoryPillTextActive]}>
          {cat.name}
        </Text>
        {count !== undefined && count > 0 && (
          <View style={[styles.countBadge, isActive && styles.countBadgeActive]}>
            <Text style={[styles.countBadgeText, isActive && styles.countBadgeTextActive]}>
              {count}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const AnimatedBrandChip = ({ brand, count, isActive, onPress }: any) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.94, useNativeDriver: true }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }).start();
  };

  const isAll = brand.name === 'All';

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[styles.categoryPill, isActive && styles.brandPillActive]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
      >
        <View style={[styles.categoryPillImageWrapper, isActive && styles.brandPillImageWrapperActive]}>
          {isAll ? (
            <Sparkles color={isActive ? '#FFFFFF' : '#D97706'} size={16} />
          ) : (
            <Image 
              source={getImageUrl(brand.logo)} 
              style={styles.categoryPillImage} 
              resizeMethod="resize" 
              fadeDuration={0}
            />
          )}
        </View>
        <Text style={[styles.categoryPillText, isActive && styles.categoryPillTextActive]}>
          {brand.name ? brand.name.trim() : ''}
        </Text>
        {count !== undefined && count > 0 && (
          <View style={[styles.countBadge, isActive && styles.countBadgeActive]}>
            <Text style={[styles.countBadgeText, isActive && styles.countBadgeTextActive]}>
              {count}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const ProductCard = React.memo(({ item, navigation, onAddToCart, onToggleWishlist, isWishlisted }: { item: any, navigation: any, onAddToCart: (item: any) => void, onToggleWishlist: (item: any) => void, isWishlisted?: boolean }) => {
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
            onPress={() => onToggleWishlist(item)}
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

export default function ShopScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const [activeCategory, setActiveCategory] = useState(route.params?.category || 'All');
  const [activeBrand, setActiveBrand] = useState(route.params?.brand || 'All');
  const [filterTab, setFilterTab] = useState<'categories' | 'brands'>(route.params?.brand ? 'brands' : 'categories');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMostLoved, setIsMostLoved] = useState(route.params?.filter === 'mostLoved' || route.params?.mostLoved === true);

  const isFocused = useIsFocused();
  useEffect(() => {
    if (isFocused) {
      if (route.params?.filter === 'mostLoved' || route.params?.mostLoved === true) {
        setIsMostLoved(true);
        setActiveCategory('All');
        setActiveBrand('All');
      } else {
        setIsMostLoved(false);
        if (route.params?.category) {
          setActiveCategory(route.params.category);
          setActiveBrand('All');
          setFilterTab('categories');
        } else if (route.params?.brand) {
          setActiveBrand(route.params.brand);
          setActiveCategory('All');
          setFilterTab('brands');
        }
      }
    }
  }, [isFocused, route.params]);
  
  const products = useProductStore((s) => s.products);
  const categories = useProductStore((s) => s.categories);
  const brands = useProductStore((s) => s.brands);
  const mostLovedProducts = useProductStore((s) => s.mostLovedProducts);
  const isLoading = useProductStore((s) => s.isLoading);
  const fetchData = useProductStore((s) => s.fetchData);

  const addToCart = useCartStore((state) => state.addToCart);
  const wishlistItems = useWishlistStore((state) => state.wishlistItems);
  const wishlistedIds = React.useMemo(() => new Set(wishlistItems.map((i) => String(i.id))), [wishlistItems]);

  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const toggleWishlist = useWishlistStore((state) => state.toggleWishlist);
  const [showCartSuccess, setShowCartSuccess] = useState(false);

  const [sortOrder, setSortOrder] = useState<'default' | 'asc' | 'desc'>('default');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [tempSortOrder, setTempSortOrder] = useState<'default' | 'asc' | 'desc'>('default');
  const [tempMinPrice, setTempMinPrice] = useState('');
  const [tempMaxPrice, setTempMaxPrice] = useState('');

  useEffect(() => {
    fetchData();
  }, [fetchData, isAuthenticated]);

  const onRefresh = React.useCallback(() => {
    fetchData({ force: true });
  }, [fetchData]);

  const handleAddToCart = React.useCallback(async (item: any) => {
    if (!isAuthenticated) {
      navigation.navigate('MainTabs', { screen: 'Profile' });
      return;
    }
    setShowCartSuccess(true);
    await addToCart(item, user?.id || '');
  }, [addToCart, user?.id, isAuthenticated, navigation]);

  const activeSourceProducts = React.useMemo(() => {
    return isMostLoved ? (mostLovedProducts.length > 0 ? mostLovedProducts : products) : products;
  }, [isMostLoved, mostLovedProducts, products]);

  const categoryCounts = React.useMemo(() => {
    const map: Record<string, number> = { All: activeSourceProducts.length };
    (Array.isArray(categories) ? categories : []).forEach(cat => {
      map[String(cat.id)] = activeSourceProducts.filter(p => 
        String(p.category) === String(cat.id) || 
        (p.category_name && p.category_name.toLowerCase().trim() === cat.name?.toLowerCase().trim())
      ).length;
    });
    return map;
  }, [activeSourceProducts, categories]);

  const brandCounts = React.useMemo(() => {
    const map: Record<string, number> = { All: activeSourceProducts.length };
    (Array.isArray(brands) ? brands : []).forEach(b => {
      map[String(b.id)] = activeSourceProducts.filter(p => 
        String(p.brand_id) === String(b.id) ||
        (p.brand && p.brand.toLowerCase().trim() === b.name?.toLowerCase().trim())
      ).length;
    });
    return map;
  }, [activeSourceProducts, brands]);

  const filteredProducts = React.useMemo(() => {
    let filtered = activeSourceProducts;
    
    if (activeCategory !== 'All') {
      const targetCat = activeCategory.toLowerCase().trim();
      const catObj = (Array.isArray(categories) ? categories : []).find(
        c => String(c.name || '').toLowerCase().trim() === targetCat || String(c.id) === targetCat
      );
      const catId = catObj ? String(catObj.id) : null;

      filtered = filtered.filter(p => {
        const rawCat: any = p.category;
        const pCatId = rawCat && typeof rawCat === 'object' && rawCat.id !== undefined ? String(rawCat.id) : (rawCat !== undefined && rawCat !== null && typeof rawCat !== 'object' ? String(rawCat) : null);
        const pCatName = (p.category_name || (rawCat && typeof rawCat === 'object' ? rawCat.name : '') || (typeof rawCat === 'string' ? rawCat : '')).toLowerCase().trim();

        if (catId && pCatId === catId) return true;
        if (pCatName && (pCatName === targetCat || pCatName.includes(targetCat))) return true;
        return false;
      });
    }

    if (activeBrand !== 'All') {
      const targetBrand = activeBrand.toLowerCase().trim();
      const brandObj = (Array.isArray(brands) ? brands : []).find(
        b => String(b.name || '').toLowerCase().trim() === targetBrand || String(b.id) === targetBrand
      );
      const brandId = brandObj ? String(brandObj.id) : null;

      filtered = filtered.filter(p => {
        const rawBrand: any = p.brand;
        const pBrandId = p.brand_id !== undefined ? String(p.brand_id) : (rawBrand && typeof rawBrand === 'object' && rawBrand.id !== undefined ? String(rawBrand.id) : '');
        const pBrandName = ((p as any).brand_name || (rawBrand && typeof rawBrand === 'object' ? rawBrand.name : '') || (typeof rawBrand === 'string' ? rawBrand : '')).toLowerCase().trim();

        if (brandId && pBrandId === brandId) return true;
        if (pBrandName && (pBrandName === targetBrand || pBrandName.includes(targetBrand))) return true;
        return false;
      });
    }
    
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        (p.name && p.name.toLowerCase().includes(q)) || 
        (p.brand && p.brand.toLowerCase().includes(q))
      );
    }

    if (minPrice.trim() !== '') {
      filtered = filtered.filter(p => Number(p.price || 0) >= Number(minPrice));
    }
    if (maxPrice.trim() !== '') {
      filtered = filtered.filter(p => Number(p.price || 0) <= Number(maxPrice));
    }

    if (sortOrder === 'asc') {
      filtered = [...filtered].sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
    } else if (sortOrder === 'desc') {
      filtered = [...filtered].sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
    }

    return filtered;
  }, [activeSourceProducts, categories, brands, activeCategory, activeBrand, searchQuery, minPrice, maxPrice, sortOrder]);

  const searchResults = React.useMemo(() => {
    if (!searchQuery.trim()) return [];
    return products
      .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .slice(0, 20);
  }, [products, searchQuery]);

  const openFilter = () => {
    setTempSortOrder(sortOrder);
    setTempMinPrice(minPrice);
    setTempMaxPrice(maxPrice);
    setIsFilterVisible(true);
  };

  const applyFilter = () => {
    setSortOrder(tempSortOrder);
    setMinPrice(tempMinPrice);
    setMaxPrice(tempMaxPrice);
    setIsFilterVisible(false);
  };

  const resetFilter = () => {
    setTempSortOrder('default');
    setTempMinPrice('');
    setTempMaxPrice('');
    setSortOrder('default');
    setMinPrice('');
    setMaxPrice('');
    setIsFilterVisible(false);
  };
  const clearFilter = resetFilter;

  const handleToggleWishlist = React.useCallback((item: any) => {
    if (!isAuthenticated) {
      navigation.navigate('MainTabs', { screen: 'Profile' });
    } else {
      toggleWishlist(item, user?.id);
    }
  }, [isAuthenticated, navigation, toggleWishlist, user?.id]);

  const renderProduct = React.useCallback(({ item }: { item: any }) => (
    <ProductCard
      item={item}
      navigation={navigation}
      onAddToCart={handleAddToCart}
      onToggleWishlist={handleToggleWishlist}
      isWishlisted={wishlistedIds.has(String(item.id))}
    />
  ), [handleAddToCart, handleToggleWishlist, navigation, wishlistedIds]);

  const hasActiveFilters = sortOrder !== 'default' || minPrice !== '' || maxPrice !== '';

  const displayCategories = React.useMemo(() => [{ id: 'all', name: 'All' }, ...(Array.isArray(categories) ? categories : [])], [categories]);
  const displayBrands = React.useMemo(() => [{ id: 'all', name: 'All' }, ...(Array.isArray(brands) ? brands : [])], [brands]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>

      <View style={[styles.searchRow, { zIndex: 10 }]}>
        <View style={styles.searchContainer}>
          <Search color={colors.textSecondary} size={20} style={styles.searchIcon} />
          <TextInput 
            style={styles.searchInput}
            placeholder="Search products..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearchBtn}>
              <X color={colors.textSecondary} size={16} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={[styles.filterButton, hasActiveFilters && styles.filterButtonActive]} onPress={openFilter} activeOpacity={0.8}>
          <SlidersHorizontal color={hasActiveFilters ? colors.white : colors.text} size={20} />
          {hasActiveFilters && (
             <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>!</Text>
             </View>
          )}
        </TouchableOpacity>

          {searchQuery.trim().length > 0 && (
          <View style={styles.searchResultsContainer}>
            <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: 300 }}>
              {searchResults.length > 0 ? (
                searchResults.map((item) => (
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

      <View style={styles.filterTabContainer}>
        <TouchableOpacity
          style={[styles.filterTabBtn, filterTab === 'categories' && styles.filterTabBtnActive]}
          onPress={() => setFilterTab('categories')}
          activeOpacity={0.8}
        >
          <Leaf size={14} color={filterTab === 'categories' ? colors.primary : colors.textSecondary} />
          <Text style={[styles.filterTabText, filterTab === 'categories' && styles.filterTabTextActive]}>
            Categories {activeCategory !== 'All' ? `(${activeCategory})` : ''}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterTabBtn, filterTab === 'brands' && styles.filterTabBtnActiveBrand]}
          onPress={() => setFilterTab('brands')}
          activeOpacity={0.8}
        >
          <Sparkles size={14} color={filterTab === 'brands' ? '#D97706' : colors.textSecondary} />
          <Text style={[styles.filterTabText, filterTab === 'brands' && styles.filterTabTextActiveBrand]}>
            Brands {activeBrand !== 'All' ? `(${activeBrand.trim()})` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.categoriesWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesScroll}>
          {filterTab === 'categories' ? (
            displayCategories.map((cat) => {
              const count = cat.name === 'All' ? categoryCounts['All'] : (categoryCounts[String(cat.id)] || 0);
              return (
                <AnimatedCategoryChip 
                  key={cat.id}
                  cat={cat} 
                  count={count}
                  isActive={activeCategory === cat.name} 
                  onPress={() => setActiveCategory(cat.name)} 
                />
              );
            })
          ) : (
            displayBrands.map((b) => {
              const count = b.name === 'All' ? brandCounts['All'] : (brandCounts[String(b.id)] || 0);
              return (
                <AnimatedBrandChip
                  key={b.id}
                  brand={b}
                  count={count}
                  isActive={activeBrand.toLowerCase().trim() === b.name.toLowerCase().trim()}
                  onPress={() => setActiveBrand(b.name.trim())}
                />
              );
            })
          )}
        </ScrollView>
      </View>

      <FlatList
        style={styles.flatList}
        data={filteredProducts}
        renderItem={renderProduct}
        keyExtractor={(item) => String(item.id)}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={11}
        removeClippedSubviews={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={onRefresh} colors={[colors.primary]} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Search color="#CBD5E1" size={48} />
            <Text style={styles.emptyTitle}>No products found</Text>
            <Text style={styles.emptySubtitle}>Try adjusting your search or filters.</Text>
          </View>
        }
      />

      <CartSuccessModal
        visible={showCartSuccess}
        onClose={() => setShowCartSuccess(false)}
        onViewCart={() => {
          setShowCartSuccess(false);
          navigation.navigate('Cart');
        }}
      />

      <Modal visible={isFilterVisible} transparent animationType="fade" onRequestClose={() => setIsFilterVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filters & Sorting</Text>
              <TouchableOpacity onPress={() => setIsFilterVisible(false)} style={styles.closeModalBtn}>
                <X color={colors.textSecondary} size={24} />
              </TouchableOpacity>
            </View>
            
            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalBody}>
              <Text style={styles.filterSectionTitle}>Sort By</Text>
              <View style={styles.sortOptionsRow}>
                <TouchableOpacity 
                  style={[styles.sortOptionBtn, tempSortOrder === 'default' && styles.sortOptionBtnActive]}
                  onPress={() => setTempSortOrder('default')}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.sortOptionText, tempSortOrder === 'default' && styles.sortOptionTextActive]}>Relevance</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.sortOptionBtn, tempSortOrder === 'asc' && styles.sortOptionBtnActive]}
                  onPress={() => setTempSortOrder('asc')}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.sortOptionText, tempSortOrder === 'asc' && styles.sortOptionTextActive]}>Price: Low to High</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.sortOptionBtn, tempSortOrder === 'desc' && styles.sortOptionBtnActive]}
                  onPress={() => setTempSortOrder('desc')}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.sortOptionText, tempSortOrder === 'desc' && styles.sortOptionTextActive]}>Price: High to Low</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.filterSectionTitle}>Price Range</Text>
              <View style={styles.priceInputRow}>
                <View style={styles.priceInputWrapper}>
                  <Text style={styles.currencyPrefix}>₹</Text>
                  <TextInput 
                    style={styles.priceInput}
                    placeholder="Min Price"
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                    value={tempMinPrice}
                    onChangeText={setTempMinPrice}
                  />
                </View>
                <Text style={styles.priceToText}>-</Text>
                <View style={styles.priceInputWrapper}>
                  <Text style={styles.currencyPrefix}>₹</Text>
                  <TextInput 
                    style={styles.priceInput}
                    placeholder="Max Price"
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                    value={tempMaxPrice}
                    onChangeText={setTempMaxPrice}
                  />
                </View>
              </View>
              <View style={{ height: 20 }} />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.clearBtn} onPress={resetFilter} activeOpacity={0.7}>
                <Text style={styles.clearBtnText}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.applyBtn} onPress={applyFilter} activeOpacity={0.8}>
                <Text style={styles.applyBtnText}>Apply Settings</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAFCFC',
  },
  searchRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 16,
    marginBottom: 14,
    alignItems: 'center',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    height: 56,
    paddingHorizontal: 18,
    borderRadius: 28,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 15,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.05)',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    fontWeight: '500',
    height: '100%',
  },
  clearSearchBtn: {
    padding: 5,
  },
  filterButton: {
    width: 56,
    height: 56,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    marginLeft: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.2,
  },
  filterBadge: {
    position: 'absolute', 
    top: 12, 
    right: 12, 
    backgroundColor: '#EF4444', 
    borderRadius: 8, 
    width: 14, 
    height: 14, 
    alignItems: 'center', 
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  filterBadgeText: {
    color: '#FFFFFF', 
    fontSize: 8, 
    fontWeight: '900',
  },
  searchResultsContainer: {
    position: 'absolute',
    top: 65,
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
  categoriesWrapper: {
    marginBottom: 20,
  },
  categoriesScroll: {
    paddingHorizontal: 20,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 30,
    marginRight: 10,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  categoryPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  categoryPillImageWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  categoryPillImageWrapperActive: {
    borderColor: '#FFFFFF',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  categoryPillImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  categoryPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginLeft: 8,
    marginRight: 4,
  },
  categoryPillTextActive: {
    color: '#FFFFFF',
  },
  countBadge: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 4,
  },
  countBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  countBadgeTextActive: {
    color: '#FFFFFF',
  },
  brandPillActive: {
    backgroundColor: '#D97706',
    borderColor: '#D97706',
    shadowColor: '#D97706',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  brandPillImageWrapperActive: {
    borderColor: '#FFFFFF',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  filterTabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  filterTabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    marginRight: 8,
  },
  filterTabBtnActive: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  filterTabBtnActiveBrand: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.3)',
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    marginLeft: 6,
  },
  filterTabTextActive: {
    color: colors.primary,
  },
  filterTabTextActiveBrand: {
    color: '#D97706',
  },
  flatList: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  row: {
    justifyContent: 'space-between',
  },
  productCardWrapper: {
    width: (width - 48) / 2, // Accounting for paddings and gap
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
    height: 140,
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
    padding: 12,
  },
  productCategory: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '800',
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
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    marginTop: 16,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '500',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: 40,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: -0.5,
  },
  closeModalBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    marginBottom: 20,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 14,
    marginTop: 10,
  },
  sortOptionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  sortOptionBtn: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  sortOptionBtnActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: colors.primary,
  },
  sortOptionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  sortOptionTextActive: {
    color: colors.primary,
  },
  priceInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
    borderRadius: 16,
    paddingHorizontal: 16,
    flex: 1,
    height: 56,
    backgroundColor: '#FFFFFF',
  },
  currencyPrefix: {
    fontSize: 18,
    color: '#94A3B8',
    marginRight: 10,
    fontWeight: '600',
  },
  priceInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  priceToText: {
    marginHorizontal: 16,
    color: '#94A3B8',
    fontWeight: '800',
  },
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  clearBtn: {
    flex: 1,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  clearBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#64748B',
  },
  applyBtn: {
    flex: 2,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  applyBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
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

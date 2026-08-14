import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  Alert, ScrollView, Image, ActivityIndicator, Modal, FlatList,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { launchImageLibrary } from 'react-native-image-picker';
import { useProductStore } from '../store/useProductStore';
import { colors } from '../theme/colors';
import { ArrowLeft, Save, ImagePlus, X, ChevronDown, Check, Tag, Banknote, Package, LayoutGrid, FileText } from 'lucide-react-native';
import SuccessModal from '../components/SuccessModal';

export default function AdminAddProductScreen() {
  const navigation = useNavigation();
  const { addProduct, categories } = useProductStore();

  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<{ id: string | number; name: string } | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handlePickImage = async () => {
    try {
      const response = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        selectionLimit: 1,
      });
      if (response.didCancel) return;
      if (response.errorCode) {
        Alert.alert('Error', response.errorMessage || 'Could not open gallery');
        return;
      }
      const asset = response.assets?.[0];
      if (asset?.uri) {
        setImageUri(asset.uri);
        setImageFile(asset);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to open gallery');
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !price.trim() || !selectedCategory) {
      Alert.alert('Missing Fields', 'Please fill in Name, Price, and select a Category.');
      return;
    }
    setIsLoading(true);
    try {
      const stockNum = parseInt(stock, 10);
      await addProduct({
        name: name.trim(),
        price: price.trim(),
        description: description.trim(),
        category: Number(selectedCategory.id),
        stock: isNaN(stockNum) ? 0 : stockNum,
        imageFile: imageFile || null,
      });
      setShowSuccess(true);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to add product.');
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = name.trim() && price.trim() && selectedCategory;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft color={colors.text} size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Product</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.form}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Hero Image Picker */}
        <View style={styles.heroContainer}>
          {imageUri ? (
            <View style={styles.heroImageWrapper}>
              <Image source={{ uri: imageUri }} style={styles.heroImage} />
              <View style={styles.heroOverlay} />
              
              <View style={styles.heroActions}>
                <TouchableOpacity style={styles.changePhotoBtn} onPress={handlePickImage}>
                  <ImagePlus color={colors.white} size={16} />
                  <Text style={styles.changePhotoText}>Change</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.removePhotoBtn}
                  onPress={() => { setImageUri(null); setImageFile(null); }}
                >
                  <X color="#EF4444" size={16} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.heroFileLabel}>
                <Text style={styles.heroFileLabelText} numberOfLines={1}>
                  ✅ {imageFile?.fileName || 'Image selected'}
                </Text>
              </View>
            </View>
          ) : (
            <TouchableOpacity style={styles.heroPlaceholder} onPress={handlePickImage} activeOpacity={0.75}>
              <View style={styles.heroPlaceholderIcon}>
                <ImagePlus color={colors.primary} size={44} />
              </View>
              <Text style={styles.heroPlaceholderTitle}>Upload Product Photo</Text>
              <Text style={styles.heroPlaceholderSub}>Tap to browse from gallery</Text>
              <View style={styles.heroBadge}>
                <Text style={styles.heroBadgeText}>JPG • PNG • WEBP</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Product Name */}
        <View style={styles.fieldGroup}>
          <View style={styles.labelRow}>
            <Tag color={colors.primary} size={18} />
            <Text style={styles.label}>Product Name *</Text>
          </View>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Aloe Face Wash"
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="words"
          />
        </View>

        {/* Price & Stock Row */}
        <View style={styles.row}>
          <View style={[styles.fieldGroup, { flex: 1, marginRight: 10 }]}>
            <View style={styles.labelRow}>
              <Banknote color={colors.primary} size={18} />
              <Text style={styles.label}>Price (₹) *</Text>
            </View>
            <TextInput
              style={styles.input}
              value={price}
              onChangeText={setPrice}
              placeholder="0.00"
              keyboardType="numeric"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={[styles.fieldGroup, { flex: 1, marginLeft: 10 }]}>
            <View style={styles.labelRow}>
              <Package color={colors.primary} size={18} />
              <Text style={styles.label}>Stock Count</Text>
            </View>
            <TextInput
              style={styles.input}
              value={stock}
              onChangeText={setStock}
              placeholder="0"
              keyboardType="numeric"
              placeholderTextColor={colors.textSecondary}
            />
          </View>
        </View>

        {/* Category Picker */}
        <View style={styles.fieldGroup}>
          <View style={styles.labelRow}>
            <LayoutGrid color={colors.primary} size={18} />
            <Text style={styles.label}>Category *</Text>
          </View>
          <TouchableOpacity style={styles.dropdownBtn} onPress={() => setShowCategoryModal(true)} activeOpacity={0.7}>
            <Text style={selectedCategory ? styles.dropdownSelected : styles.dropdownPlaceholder}>
              {selectedCategory ? selectedCategory.name : 'Select a category...'}
            </Text>
            <ChevronDown color={colors.textSecondary} size={20} />
          </TouchableOpacity>
        </View>

        {/* Description */}
        <View style={styles.fieldGroup}>
          <View style={styles.labelRow}>
            <FileText color={colors.primary} size={18} />
            <Text style={styles.label}>Description</Text>
          </View>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Describe the product, ingredients, and benefits..."
            multiline
            textAlignVertical="top"
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveBtn, (!isFormValid || isLoading) && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={!isFormValid || isLoading}
          activeOpacity={0.85}
        >
          {isLoading ? (
            <ActivityIndicator color={colors.white} size="small" />
          ) : (
            <>
              <Save color={colors.white} size={20} />
              <Text style={styles.saveBtnText}>Publish Product</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Tip */}
        <View style={styles.tipBox}>
          <Text style={styles.tipText}>
            💡 Tip: High-quality square photos and detailed descriptions help increase sales!
          </Text>
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>

      {/* Category Modal */}
      <Modal
        visible={showCategoryModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCategoryModal(false)}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Select Category</Text>
            <FlatList
              data={Array.isArray(categories) ? categories : []}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    setSelectedCategory(item);
                    setShowCategoryModal(false);
                  }}
                  activeOpacity={0.6}
                >
                  <Text style={[styles.modalItemText, selectedCategory?.id === item.id && styles.modalItemTextSelected]}>
                    {item.name}
                  </Text>
                  {selectedCategory?.id === item.id && (
                    <View style={styles.checkIconBg}>
                      <Check color={colors.white} size={16} />
                    </View>
                  )}
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              contentContainerStyle={{ paddingBottom: 20 }}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Success Modal */}
      <SuccessModal
        visible={showSuccess}
        title="Product Added!"
        message="The new product has been successfully published to your shop."
        onClose={() => {
          setShowSuccess(false);
          navigation.goBack();
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#F8FAFC',
  },
  backBtn: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: colors.white,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
    borderWidth: 1, borderColor: '#F1F5F9',
  },
  headerTitle: { fontSize: 22, fontWeight: '900', color: colors.text, letterSpacing: -0.5 },
  form: { padding: 20 },
  
  /* Hero Image */
  heroContainer: { marginBottom: 28 },
  heroPlaceholder: {
    height: 220, backgroundColor: colors.white,
    borderRadius: 24, borderWidth: 2, borderColor: 'rgba(16,185,129,0.3)',
    borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 8,
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06, shadowRadius: 12, elevation: 2,
  },
  heroPlaceholderIcon: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: 'rgba(16,185,129,0.08)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  heroPlaceholderTitle: { fontSize: 17, fontWeight: '800', color: colors.text },
  heroPlaceholderSub: { fontSize: 13, color: colors.textSecondary, fontWeight: '500' },
  heroBadge: {
    marginTop: 6, backgroundColor: '#F1F5F9',
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20,
  },
  heroBadgeText: { fontSize: 12, color: colors.textSecondary, fontWeight: '700' },
  heroImageWrapper: {
    height: 220, borderRadius: 24, overflow: 'hidden',
    position: 'relative', backgroundColor: '#F1F5F9',
  },
  heroImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  heroOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: 100, backgroundColor: 'rgba(0,0,0,0.4)',
  },
  heroActions: {
    position: 'absolute', top: 12, right: 12,
    flexDirection: 'row', gap: 8,
  },
  changePhotoBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12,
  },
  changePhotoText: { color: colors.white, fontSize: 13, fontWeight: '700' },
  removePhotoBtn: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center', justifyContent: 'center',
  },
  heroFileLabel: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 16, paddingVertical: 12,
  },
  heroFileLabelText: { color: colors.white, fontSize: 13, fontWeight: '600' },

  /* Form Fields */
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  fieldGroup: { marginBottom: 24 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  label: {
    fontSize: 14, fontWeight: '800', color: colors.text,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  input: {
    backgroundColor: colors.white,
    paddingHorizontal: 18, paddingVertical: 16,
    borderRadius: 16, borderWidth: 1.5, borderColor: '#E2E8F0',
    color: colors.text, fontSize: 16, fontWeight: '600',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03, shadowRadius: 6, elevation: 1,
  },
  textArea: {
    height: 120, paddingTop: 16,
    ...Platform.select({ ios: { lineHeight: 22 } }),
  },

  /* Dropdown */
  dropdownBtn: {
    backgroundColor: colors.white,
    paddingHorizontal: 18, paddingVertical: 16,
    borderRadius: 16, borderWidth: 1.5, borderColor: '#E2E8F0',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03, shadowRadius: 6, elevation: 1,
  },
  dropdownSelected: { fontSize: 16, fontWeight: '700', color: colors.text },
  dropdownPlaceholder: { fontSize: 16, fontWeight: '500', color: colors.textSecondary },

  /* Save Button */
  saveBtn: {
    backgroundColor: colors.primary,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 18, borderRadius: 20, gap: 10,
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3, shadowRadius: 16, elevation: 8,
    marginBottom: 20, marginTop: 10,
  },
  saveBtnDisabled: { backgroundColor: '#CBD5E1', shadowOpacity: 0, elevation: 0 },
  saveBtnText: { color: colors.white, fontSize: 17, fontWeight: '800', letterSpacing: 0.5 },

  /* Tip Box */
  tipBox: {
    backgroundColor: 'rgba(16,185,129,0.06)',
    borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: 'rgba(16,185,129,0.15)',
  },
  tipText: { fontSize: 13, color: '#047857', lineHeight: 20, fontWeight: '600' },

  /* Modal */
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.5)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 32, borderTopRightRadius: 32,
    paddingHorizontal: 24, paddingBottom: 40, maxHeight: '75%',
    shadowColor: '#000', shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1, shadowRadius: 20, elevation: 10,
  },
  modalHandle: {
    width: 48, height: 5, borderRadius: 2.5,
    backgroundColor: '#E2E8F0', alignSelf: 'center', marginVertical: 14,
  },
  modalTitle: { fontSize: 22, fontWeight: '900', color: colors.text, marginBottom: 20, letterSpacing: -0.5 },
  modalItem: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingVertical: 16,
  },
  modalItemText: { fontSize: 17, fontWeight: '600', color: colors.text },
  modalItemTextSelected: { color: colors.primary, fontWeight: '800' },
  checkIconBg: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  separator: { height: 1, backgroundColor: '#F1F5F9' },
});

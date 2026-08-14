import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  Alert, ScrollView, Image, ActivityIndicator,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { launchImageLibrary } from 'react-native-image-picker';
import { useProductStore } from '../store/useProductStore';
import { colors } from '../theme/colors';
import { ArrowLeft, Save, ImagePlus, X, Tag } from 'lucide-react-native';
import SuccessModal from '../components/SuccessModal';

export default function AdminAddCategoryScreen() {
  const navigation = useNavigation();
  const { addCategory } = useProductStore();

  const [name, setName] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handlePickImage = async () => {
    try {
      const response = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.9,
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
    if (!name.trim()) {
      Alert.alert('Missing Field', 'Please enter a category name.');
      return;
    }
    setIsLoading(true);
    try {
      await addCategory({ name: name.trim(), imageFile: imageFile || null });
      setShowSuccess(true);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to add category.');
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = name.trim().length > 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" translucent={false} />

      {/* Clean Modern Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft color={colors.text} size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Category</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        style={styles.form}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Hero Image Picker */}
        <View style={styles.heroContainer}>
          {imageUri ? (
            /* Image Preview */
            <View style={styles.heroImageWrapper}>
              <Image source={{ uri: imageUri }} style={styles.heroImage} />
              {/* Dark overlay gradient */}
              <View style={styles.heroOverlay} />

              {/* Actions row over image */}
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

              {/* File name label */}
              <View style={styles.heroFileLabel}>
                <Text style={styles.heroFileLabelText} numberOfLines={1}>
                  ✅ {imageFile?.fileName || 'Image selected'}
                </Text>
              </View>
            </View>
          ) : (
            /* Placeholder */
            <TouchableOpacity style={styles.heroPlaceholder} onPress={handlePickImage} activeOpacity={0.75}>
              <View style={styles.heroPlaceholderIcon}>
                <ImagePlus color={colors.primary} size={44} />
              </View>
              <Text style={styles.heroPlaceholderTitle}>Upload Category Image</Text>
              <Text style={styles.heroPlaceholderSub}>Tap to browse from gallery</Text>
              <View style={styles.heroBadge}>
                <Text style={styles.heroBadgeText}>JPG • PNG • WEBP</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Category Name */}
        <View style={styles.fieldGroup}>
          <View style={styles.labelRow}>
            <Tag color={colors.primary} size={18} />
            <Text style={styles.label}>Category Name *</Text>
          </View>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Hair Care, Skin Care..."
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="words"
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
              <Text style={styles.saveBtnText}>Publish Category</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Tip */}
        <View style={styles.tipBox}>
          <Text style={styles.tipText}>
            💡 Tip: Use a clean, aesthetic image that represents the whole collection! Square photos look best.
          </Text>
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>

      {/* Success Modal */}
      <SuccessModal
        visible={showSuccess}
        title="Category Added!"
        message="The new category has been successfully published to your shop."
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

  /* Header */
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

  /* Hero image area */
  heroContainer: { marginBottom: 28 },

  heroPlaceholder: {
    height: 220,
    backgroundColor: colors.white,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'rgba(16,185,129,0.3)',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  heroPlaceholderIcon: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: 'rgba(16,185,129,0.08)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  heroPlaceholderTitle: {
    fontSize: 17, fontWeight: '800', color: colors.text,
  },
  heroPlaceholderSub: {
    fontSize: 13, color: colors.textSecondary, fontWeight: '500',
  },
  heroBadge: {
    marginTop: 6,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: 20,
  },
  heroBadgeText: { fontSize: 12, color: colors.textSecondary, fontWeight: '700' },

  heroImageWrapper: {
    height: 220, borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#F1F5F9',
  },
  heroImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  heroOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: 100,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  heroActions: {
    position: 'absolute', top: 12, right: 12,
    flexDirection: 'row', gap: 8,
  },
  changePhotoBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 12,
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
  heroFileLabelText: {
    color: colors.white, fontSize: 13, fontWeight: '600',
  },

  /* Form fields */
  fieldGroup: { marginBottom: 24 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  label: {
    fontSize: 14, fontWeight: '800', color: colors.text,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  input: {
    backgroundColor: colors.white,
    paddingHorizontal: 18, paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1.5, borderColor: '#E2E8F0',
    color: colors.text, fontSize: 16, fontWeight: '600',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03, shadowRadius: 6, elevation: 1,
  },

  /* Save button */
  saveBtn: {
    backgroundColor: colors.primary,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 18, borderRadius: 20,
    gap: 10,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3, shadowRadius: 16, elevation: 8,
    marginBottom: 20, marginTop: 10,
  },
  saveBtnDisabled: {
    backgroundColor: '#CBD5E1',
    shadowOpacity: 0, elevation: 0,
  },
  saveBtnText: { color: colors.white, fontSize: 17, fontWeight: '800', letterSpacing: 0.5 },

  /* Tip */
  tipBox: {
    backgroundColor: 'rgba(16,185,129,0.06)',
    borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: 'rgba(16,185,129,0.15)',
  },
  tipText: { fontSize: 13, color: '#047857', lineHeight: 20, fontWeight: '600' },
});

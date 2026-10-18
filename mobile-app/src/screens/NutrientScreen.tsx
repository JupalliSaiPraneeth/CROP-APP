import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from 'react-native';
import { colors, shadows } from '../theme/colors';
import { Header } from '../components/Header';
import { ImagePickerModal } from '../components/ImagePickerModal';
import { ConfidenceBar } from '../components/ConfidenceBar';
import { api } from '../api/client';
import { NutrientPredictionResponse } from '../types/api';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const CROPS = ['All', 'Tomato', 'Potato', 'Rice', 'Wheat', 'Maize', 'Cotton'];

export const NutrientScreen = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedCrop, setSelectedCrop] = useState('All');
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<NutrientPredictionResponse | null>(null);

  const handleAnalyze = async () => {
    if (!selectedImage) {
      Alert.alert('No Image Selected', 'Please take or select a crop leaf photo first.');
      return;
    }

    try {
      setLoading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const data = await api.predictNutrient(selectedImage, selectedCrop);
      setResult(data);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Analysis Failed', err.message || 'Could not diagnose nutrient deficiency.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedImage(null);
    setResult(null);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Nutrient Deficiency" subtitle="MobileNetV3 OLID-I Deficiency Model" showStatus={false} />

      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Crop Hint Filter Chips */}
        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>Target Crop Context:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
            {CROPS.map((crop) => (
              <TouchableOpacity
                key={crop}
                style={[styles.chip, selectedCrop === crop && styles.chipActive]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setSelectedCrop(crop);
                }}
              >
                <Text style={[styles.chipText, selectedCrop === crop && styles.chipTextActive]}>
                  {crop}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Upload Box */}
        <View style={styles.uploadCard}>
          {selectedImage ? (
            <View style={styles.previewContainer}>
              <Image source={{ uri: selectedImage }} style={styles.previewImage} resizeMode="cover" />
              <TouchableOpacity
                style={styles.changePhotoButton}
                onPress={() => setModalVisible(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="camera" size={16} color="#FFFFFF" />
                <Text style={styles.changePhotoText}>Change Leaf Photo</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.placeholderBox}
              onPress={() => setModalVisible(true)}
              activeOpacity={0.7}
            >
              <View style={[styles.placeholderIcon, { backgroundColor: '#CCFBF1' }]}>
                <Ionicons name="flask-outline" size={36} color="#0D9488" />
              </View>
              <Text style={styles.placeholderTitle}>Scan Leaf for Nutrient Deficiencies</Text>
              <Text style={styles.placeholderSubtitle}>
                Identify Nitrogen (N), Phosphorus (P), Potassium (K), Zinc, or Iron chlorosis
              </Text>
              <View style={[styles.uploadBadge, { backgroundColor: '#0D9488' }]}>
                <Text style={styles.uploadBadgeText}>Tap to Open Camera</Text>
              </View>
            </TouchableOpacity>
          )}

          {selectedImage && !loading && (
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
                <Text style={styles.resetButtonText}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.diagnoseButton, { backgroundColor: '#0D9488' }]}
                onPress={handleAnalyze}
                activeOpacity={0.85}
              >
                <Ionicons name="sparkles" size={18} color="#FFFFFF" />
                <Text style={styles.diagnoseButtonText}>Analyze Nutrients</Text>
              </TouchableOpacity>
            </View>
          )}

          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#0D9488" />
              <Text style={styles.loadingText}>Analyzing leaf chlorosis & micronutrient levels...</Text>
            </View>
          )}
        </View>

        {/* Results */}
        {result && (
          <View style={styles.resultContainer}>
            <View style={styles.resultHeader}>
              <View style={[styles.statusTag, result.is_healthy ? styles.healthyTag : styles.deficiencyTag]}>
                <Ionicons
                  name={result.is_healthy ? 'checkmark-circle' : 'alert-circle'}
                  size={16}
                  color={result.is_healthy ? '#059669' : '#D97706'}
                />
                <Text style={[styles.statusTagText, { color: result.is_healthy ? '#059669' : '#D97706' }]}>
                  {result.is_healthy ? 'Optimal Nutrition' : `${result.severity || 'Moderate'} Deficiency`}
                </Text>
              </View>
              <Text style={styles.inferenceTime}>Speed: {Math.round(result.inference_time_ms)}ms</Text>
            </View>

            <Text style={styles.diagnosisTitle}>
              {result.deficiency_title || result.predicted_class}
            </Text>

            <View style={styles.confidenceSection}>
              <ConfidenceBar
                label="Diagnosis Confidence"
                percentage={result.confidence * 100}
                highlight
              />
            </View>

            {/* Agronomic Fertilizer Remedy */}
            {result.remedy && (
              <View style={styles.adviceSection}>
                {result.remedy.primary_symptom ? (
                  <View style={styles.adviceCard}>
                    <View style={styles.adviceHeader}>
                      <Ionicons name="eye-outline" size={18} color="#0D9488" />
                      <Text style={styles.adviceTitle}>Primary Foliar Symptoms</Text>
                    </View>
                    <Text style={styles.adviceBody}>{result.remedy.primary_symptom}</Text>
                  </View>
                ) : null}

                {result.remedy.chemical_remedies && result.remedy.chemical_remedies.length > 0 ? (
                  <View style={styles.adviceCard}>
                    <View style={styles.adviceHeader}>
                      <Ionicons name="nutrition-outline" size={18} color="#059669" />
                      <Text style={[styles.adviceTitle, { color: '#059669' }]}>
                        Recommended Fertilizer Application
                      </Text>
                    </View>
                    {result.remedy.chemical_remedies.map((chem, idx) => (
                      <View key={idx} style={styles.bulletRow}>
                        <Text style={styles.bulletDot}>•</Text>
                        <Text style={styles.bulletText}>{chem}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}

                {result.remedy.organic_remedies && result.remedy.organic_remedies.length > 0 ? (
                  <View style={styles.adviceCard}>
                    <View style={styles.adviceHeader}>
                      <Ionicons name="leaf-outline" size={18} color="#16A34A" />
                      <Text style={[styles.adviceTitle, { color: '#16A34A' }]}>
                        Organic & Soil Amendments
                      </Text>
                    </View>
                    {result.remedy.organic_remedies.map((org, idx) => (
                      <View key={idx} style={styles.bulletRow}>
                        <Text style={styles.bulletDot}>•</Text>
                        <Text style={styles.bulletText}>{org}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      <ImagePickerModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onImageSelected={(uri) => setSelectedImage(uri)}
        title="Photograph Crop Leaf for Nutrients"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 18,
    paddingBottom: 40,
  },
  filterSection: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
    marginBottom: 8,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: '#0D9488',
    borderColor: '#0D9488',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  uploadCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
    ...shadows.sm,
  },
  placeholderBox: {
    height: 240,
    borderWidth: 2,
    borderColor: '#99F6E4',
    borderStyle: 'dashed',
    borderRadius: 16,
    backgroundColor: '#F0FDFA',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  placeholderIcon: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  placeholderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F766E',
    marginBottom: 6,
  },
  placeholderSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  uploadBadge: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  uploadBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  previewContainer: {
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: 260,
    borderRadius: 14,
  },
  changePhotoButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  changePhotoText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  resetButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textMuted,
  },
  diagnoseButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  diagnoseButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  loadingContainer: {
    paddingVertical: 24,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
  },
  resultContainer: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.md,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  healthyTag: {
    backgroundColor: '#ECFDF5',
  },
  deficiencyTag: {
    backgroundColor: '#FEF3C7',
  },
  statusTagText: {
    fontSize: 12,
    fontWeight: '700',
  },
  inferenceTime: {
    fontSize: 11,
    color: colors.textSubtle,
  },
  diagnosisTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    lineHeight: 26,
    marginBottom: 16,
  },
  confidenceSection: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 12,
    padding: 12,
    marginBottom: 18,
  },
  adviceSection: {
    gap: 12,
  },
  adviceCard: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 14,
    padding: 14,
    borderLeftWidth: 4,
    borderLeftColor: '#0D9488',
  },
  adviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  adviceTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  adviceBody: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 19,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 4,
  },
  bulletDot: {
    fontSize: 16,
    color: colors.textMuted,
    lineHeight: 18,
  },
  bulletText: {
    flex: 1,
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 19,
  },
});

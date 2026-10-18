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
import { api } from '../api/client';
import { PestDetectionResponse } from '../types/api';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

export const PestDetectionScreen = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PestDetectionResponse | null>(null);

  const handleDetect = async () => {
    if (!selectedImage) {
      Alert.alert('No Image Selected', 'Please take or choose a pest photo first.');
      return;
    }

    try {
      setLoading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const data = await api.predictPest(selectedImage);
      setResult(data);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Detection Failed', err.message || 'Could not analyze pest photograph.');
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
      <Header title="Pest Detection" subtitle="YOLO11 97-Species Computer Vision" showStatus={false} />

      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
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
                <Text style={styles.changePhotoText}>Change Pest Photo</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.placeholderBox}
              onPress={() => setModalVisible(true)}
              activeOpacity={0.7}
            >
              <View style={[styles.placeholderIcon, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="bug-outline" size={36} color="#D97706" />
              </View>
              <Text style={styles.placeholderTitle}>Photograph Field Insect / Pest</Text>
              <Text style={styles.placeholderSubtitle}>
                Take a close-up photo of the insect on leaves, crops, or soil
              </Text>
              <View style={[styles.uploadBadge, { backgroundColor: '#D97706' }]}>
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
                style={[styles.diagnoseButton, { backgroundColor: '#D97706' }]}
                onPress={handleDetect}
                activeOpacity={0.85}
              >
                <Ionicons name="scan-outline" size={18} color="#FFFFFF" />
                <Text style={styles.diagnoseButtonText}>Detect Pests (YOLO11)</Text>
              </TouchableOpacity>
            </View>
          )}

          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#D97706" />
              <Text style={styles.loadingText}>Running YOLO11 neural network inference...</Text>
            </View>
          )}
        </View>

        {/* Results */}
        {result && (
          <View style={styles.resultContainer}>
            <View style={styles.resultHeader}>
              <View style={[styles.countBadge, result.count > 0 ? styles.countWarning : styles.countClean]}>
                <Ionicons
                  name={result.count > 0 ? 'warning' : 'shield-checkmark'}
                  size={16}
                  color={result.count > 0 ? '#B45309' : '#059669'}
                />
                <Text style={[styles.countBadgeText, { color: result.count > 0 ? '#B45309' : '#059669' }]}>
                  {result.count > 0 ? `${result.count} Pest(s) Detected` : 'No Pests Detected'}
                </Text>
              </View>
              <Text style={styles.inferenceTime}>Speed: {Math.round(result.inference_time_ms)}ms</Text>
            </View>

            {result.detections && result.detections.length > 0 ? (
              <View style={styles.detectionsList}>
                <Text style={styles.sectionHeader}>Identified Insect Species</Text>
                {result.detections.map((det, idx) => (
                  <View key={idx} style={styles.detectionCard}>
                    <View style={styles.detectionTop}>
                      <View style={styles.detectionTitleWrap}>
                        <Text style={styles.detectionName}>{det.display_name || det.class_name}</Text>
                        <Text style={styles.detectionLatin}>Species ID: #{det.class_id}</Text>
                      </View>
                      <View style={styles.confidencePill}>
                        <Text style={styles.confidencePillText}>
                          {Math.round(det.confidence_percentage || det.confidence * 100)}%
                        </Text>
                      </View>
                    </View>

                    {/* Integrated Pest Management (IPM) */}
                    <View style={styles.ipmBox}>
                      <Text style={styles.ipmTitle}>Recommended IPM Controls:</Text>
                      <Text style={styles.ipmBody}>
                        • Bio-controls: Apply Neem seed kernel extract (NSKE 5%) or release Trichogramma egg parasitoids.
                      </Text>
                      <Text style={styles.ipmBody}>
                        • Chemical remedy: In case of heavy infestation above Economic Threshold Level (ETL), spray Chlorantraniliprole 18.5% SC @ 0.3ml/L or Emamectin Benzoate 5% SG @ 0.5g/L.
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.cleanState}>
                <Ionicons name="checkmark-circle-outline" size={48} color={colors.primary} />
                <Text style={styles.cleanStateTitle}>Crops Appear Clean</Text>
                <Text style={styles.cleanStateSubtitle}>
                  No active insect infestation was detected above threshold in this photograph.
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      <ImagePickerModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onImageSelected={(uri) => setSelectedImage(uri)}
        title="Photograph Crop Pest"
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
    borderColor: '#FDE68A',
    borderStyle: 'dashed',
    borderRadius: 16,
    backgroundColor: '#FFFBEB',
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
    color: '#92400E',
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
    marginBottom: 16,
  },
  countBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  countWarning: {
    backgroundColor: '#FEF3C7',
  },
  countClean: {
    backgroundColor: '#ECFDF5',
  },
  countBadgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  inferenceTime: {
    fontSize: 11,
    color: colors.textSubtle,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  detectionsList: {
    gap: 14,
  },
  detectionCard: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 14,
    padding: 14,
    borderLeftWidth: 4,
    borderLeftColor: '#D97706',
  },
  detectionTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  detectionTitleWrap: {
    flex: 1,
  },
  detectionName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  detectionLatin: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  confidencePill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  confidencePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B45309',
  },
  ipmBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 10,
    marginTop: 6,
  },
  ipmTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  ipmBody: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 18,
    marginTop: 2,
  },
  cleanState: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  cleanStateTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  cleanStateSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 20,
  },
});

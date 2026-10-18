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
import { PredictionResponse } from '../types/api';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

export const DiseaseDetectionScreen = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PredictionResponse | null>(null);

  const handleDiagnose = async () => {
    if (!selectedImage) {
      Alert.alert('No Image Selected', 'Please take or choose a leaf photo first.');
      return;
    }

    try {
      setLoading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const data = await api.predictDisease(selectedImage);
      setResult(data);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Diagnosis Failed', err.message || 'Could not analyze leaf photograph.');
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
      <Header title="Disease Detection" subtitle="PlantVillage 38-Class Vision AI" showStatus={false} />

      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Leaf Upload / Preview Area */}
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
              <View style={styles.placeholderIcon}>
                <Ionicons name="camera-outline" size={36} color={colors.primary} />
              </View>
              <Text style={styles.placeholderTitle}>Upload Leaf Photograph</Text>
              <Text style={styles.placeholderSubtitle}>
                Take a close-up photo of infected leaves, stems, or fruits
              </Text>
              <View style={styles.uploadBadge}>
                <Text style={styles.uploadBadgeText}>Tap to Open Camera</Text>
              </View>
            </TouchableOpacity>
          )}

          {/* Action Buttons */}
          {selectedImage && !loading && (
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
                <Text style={styles.resetButtonText}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.diagnoseButton} onPress={handleDiagnose} activeOpacity={0.85}>
                <Ionicons name="sparkles" size={18} color="#FFFFFF" />
                <Text style={styles.diagnoseButtonText}>Run AI Diagnosis</Text>
              </TouchableOpacity>
            </View>
          )}

          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Analyzing leaf cellular structure & symptoms...</Text>
            </View>
          )}
        </View>

        {/* Diagnosis Results */}
        {result && (
          <View style={styles.resultContainer}>
            <View style={styles.resultHeader}>
              <View style={[styles.statusTag, result.treatment?.is_healthy ? styles.healthyTag : styles.diseaseTag]}>
                <Ionicons
                  name={result.treatment?.is_healthy ? 'checkmark-circle' : 'alert-circle'}
                  size={16}
                  color={result.treatment?.is_healthy ? '#059669' : '#DC2626'}
                />
                <Text style={[styles.statusTagText, { color: result.treatment?.is_healthy ? '#059669' : '#DC2626' }]}>
                  {result.treatment?.is_healthy ? 'Healthy Leaf' : 'Pathogen Detected'}
                </Text>
              </View>
              <Text style={styles.inferenceTime}>Inference: {Math.round(result.inference_time_ms)}ms</Text>
            </View>

            <Text style={styles.diagnosisTitle}>
              {result.predicted_class.replace(/___/g, ' - ').replace(/_/g, ' ')}
            </Text>

            {/* Confidence Bar */}
            <View style={styles.confidenceSection}>
              <ConfidenceBar
                label="Confidence Score"
                percentage={result.confidence * 100}
                highlight
              />
            </View>

            {/* Top Predictions Breakdown */}
            {result.top_predictions && result.top_predictions.length > 1 && (
              <View style={styles.subSection}>
                <Text style={styles.subSectionTitle}>Alternative Hypotheses (Top Matches)</Text>
                {result.top_predictions.slice(1, 4).map((p, idx) => (
                  <ConfidenceBar
                    key={idx}
                    label={p.class_name.replace(/___/g, ' - ').replace(/_/g, ' ')}
                    percentage={p.percentage}
                  />
                ))}
              </View>
            )}

            {/* Agronomic Symptoms & Treatments */}
            {result.treatment && (
              <View style={styles.treatmentSection}>
                {result.treatment.symptoms ? (
                  <View style={styles.adviceCard}>
                    <View style={styles.adviceHeader}>
                      <Ionicons name="eye-outline" size={18} color={colors.primary} />
                      <Text style={styles.adviceTitle}>Identified Symptoms</Text>
                    </View>
                    <Text style={styles.adviceBody}>{result.treatment.symptoms}</Text>
                  </View>
                ) : null}

                {result.treatment.management && result.treatment.management.length > 0 ? (
                  <View style={styles.adviceCard}>
                    <View style={styles.adviceHeader}>
                      <Ionicons name="medkit-outline" size={18} color="#D97706" />
                      <Text style={[styles.adviceTitle, { color: '#B45309' }]}>
                        Recommended Treatment & Dosages
                      </Text>
                    </View>
                    {result.treatment.management.map((item, i) => (
                      <View key={i} style={styles.bulletRow}>
                        <Text style={styles.bulletDot}>•</Text>
                        <Text style={styles.bulletText}>{item}</Text>
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
        title="Photograph Crop Leaf"
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
    borderColor: colors.primaryBorder,
    borderStyle: 'dashed',
    borderRadius: 16,
    backgroundColor: colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  placeholderIcon: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    ...shadows.sm,
  },
  placeholderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primaryDark,
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
    backgroundColor: colors.primary,
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
    backgroundColor: colors.primary,
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
  diseaseTag: {
    backgroundColor: '#FEF2F2',
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
  subSection: {
    marginBottom: 18,
  },
  subSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  treatmentSection: {
    gap: 12,
  },
  adviceCard: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 14,
    padding: 14,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
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

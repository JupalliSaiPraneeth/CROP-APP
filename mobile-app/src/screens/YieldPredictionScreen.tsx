import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from 'react-native';
import { colors, shadows } from '../theme/colors';
import { Header } from '../components/Header';
import { api } from '../api/client';
import { CropYieldPredictionResponse } from '../types/api';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const POPULAR_STATES = ['Punjab', 'Telangana', 'Uttar Pradesh', 'Maharashtra', 'Andhra Pradesh', 'Madhya Pradesh', 'Haryana'];
const SEASONS = ['Kharif', 'Rabi', 'Whole Year', 'Summer'];
const CROPS = ['Rice', 'Wheat', 'Cotton(lint)', 'Sugarcane', 'Maize', 'Groundnut', 'Soyabean'];

export const YieldPredictionScreen = () => {
  const [state, setState] = useState('Punjab');
  const [district, setDistrict] = useState('Ludhiana');
  const [season, setSeason] = useState('Kharif');
  const [crop, setCrop] = useState('Rice');
  const [area, setArea] = useState('2.5');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CropYieldPredictionResponse | null>(null);

  const handlePredict = async () => {
    const areaNum = parseFloat(area);
    if (isNaN(areaNum) || areaNum <= 0) {
      Alert.alert('Invalid Area', 'Please enter a valid cultivated area in hectares.');
      return;
    }

    try {
      setLoading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const data = await api.predictYield({
        state,
        district,
        season,
        crop,
        area: areaNum,
        crop_year: 2024,
      });
      setResult(data);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Prediction Error', err.message || 'Could not calculate crop yield.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Yield Forecast" subtitle="Tabular Machine Learning Regression" showStatus={false} />

      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Form Card */}
        <View style={styles.formCard}>
          <Text style={styles.sectionHeader}>Farm Parameters</Text>

          {/* State Picker */}
          <Text style={styles.fieldLabel}>State:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
            {POPULAR_STATES.map((s) => (
              <TouchableOpacity
                key={s}
                style={[styles.chip, state === s && styles.chipActive]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setState(s);
                  if (s === 'Telangana') setDistrict('Warangal');
                  else if (s === 'Punjab') setDistrict('Ludhiana');
                  else if (s === 'Maharashtra') setDistrict('Nashik');
                  else setDistrict('Central');
                }}
              >
                <Text style={[styles.chipText, state === s && styles.chipTextActive]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* District Input */}
          <Text style={styles.fieldLabel}>District:</Text>
          <TextInput
            style={styles.input}
            value={district}
            onChangeText={setDistrict}
            placeholder="e.g. Ludhiana, Warangal, Nashik"
            placeholderTextColor={colors.textSubtle}
          />

          {/* Crop Chips */}
          <Text style={styles.fieldLabel}>Crop Type:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
            {CROPS.map((c) => (
              <TouchableOpacity
                key={c}
                style={[styles.chip, crop === c && styles.chipActive]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setCrop(c);
                }}
              >
                <Text style={[styles.chipText, crop === c && styles.chipTextActive]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Season Chips */}
          <Text style={styles.fieldLabel}>Cultivation Season:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
            {SEASONS.map((s) => (
              <TouchableOpacity
                key={s}
                style={[styles.chip, season === s && styles.chipActive]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setSeason(s);
                }}
              >
                <Text style={[styles.chipText, season === s && styles.chipTextActive]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Cultivated Area (Hectares) */}
          <Text style={styles.fieldLabel}>Cultivated Land Area (Hectares):</Text>
          <TextInput
            style={styles.input}
            value={area}
            onChangeText={setArea}
            keyboardType="decimal-pad"
            placeholder="e.g. 2.5"
            placeholderTextColor={colors.textSubtle}
          />

          {/* Submit Button */}
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handlePredict}
            activeOpacity={0.85}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="calculator-outline" size={20} color="#FFFFFF" />
                <Text style={styles.submitButtonText}>Calculate Expected Yield</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Prediction Results */}
        {result && (
          <View style={styles.resultContainer}>
            <View style={styles.resultHeader}>
              <View style={styles.yieldTag}>
                <Ionicons name="trending-up" size={16} color="#1D4ED8" />
                <Text style={styles.yieldTagText}>{result.yield_category || 'Yield Projection'}</Text>
              </View>
              <Text style={styles.timestamp}>{result.state} • {result.district}</Text>
            </View>

            {/* Production Numbers */}
            <View style={styles.metricsGrid}>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Total Production</Text>
                <Text style={styles.metricValue}>
                  {result.estimated_total_production_tonnes.toFixed(1)}
                </Text>
                <Text style={styles.metricUnit}>Tonnes</Text>
              </View>

              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Yield per Hectare</Text>
                <Text style={styles.metricValue}>
                  {result.predicted_yield_per_hectare.toFixed(2)}
                </Text>
                <Text style={styles.metricUnit}>Tonnes / Ha</Text>
              </View>
            </View>

            {/* Advisory */}
            {result.agronomic_advisory && result.agronomic_advisory.length > 0 && (
              <View style={styles.advisoryCard}>
                <View style={styles.advisoryHeader}>
                  <Ionicons name="bulb-outline" size={18} color="#2563EB" />
                  <Text style={styles.advisoryTitle}>Agronomic Recommendations</Text>
                </View>
                {result.agronomic_advisory.map((adv, idx) => (
                  <View key={idx} style={styles.bulletRow}>
                    <Text style={styles.bulletDot}>•</Text>
                    <Text style={styles.bulletText}>{adv}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>
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
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
    ...shadows.sm,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
    marginBottom: 8,
    marginTop: 10,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 4,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  input: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 20,
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
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
  yieldTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  yieldTagText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  timestamp: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 6,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
  },
  metricUnit: {
    fontSize: 11,
    color: colors.textSubtle,
    marginTop: 2,
  },
  advisoryCard: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 14,
    padding: 14,
    borderLeftWidth: 4,
    borderLeftColor: '#2563EB',
  },
  advisoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  advisoryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
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

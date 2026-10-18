import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from 'react-native';
import { colors, shadows } from '../theme/colors';
import { Header } from '../components/Header';
import { api, getBaseUrl, setBaseUrl, resetBaseUrl } from '../api/client';
import { HealthResponse } from '../types/api';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

export const SettingsScreen = () => {
  const [apiUrl, setApiUrlState] = useState('');
  const [loading, setLoading] = useState(false);
  const [health, setHealth] = useState<HealthResponse | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const url = await getBaseUrl();
    setApiUrlState(url);
    checkHealth();
  };

  const checkHealth = async () => {
    try {
      setLoading(true);
      const data = await api.checkHealth();
      setHealth(data);
    } catch {
      setHealth({ status: 'disconnected', model_loaded: false });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await setBaseUrl(apiUrl);
      await checkHealth();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Settings Saved', 'Backend API URL updated successfully.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not save settings.');
    }
  };

  const handleReset = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await resetBaseUrl();
      const def = await getBaseUrl();
      setApiUrlState(def);
      await checkHealth();
      Alert.alert('Reset Complete', 'Reverted to default production Render cloud endpoint.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not reset.');
    }
  };

  const isConnected = health?.status === 'healthy';

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Settings" subtitle="System Architecture & Cloud Configuration" isConnected={isConnected} onRefresh={checkHealth} />

      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Backend Endpoint Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Backend API Configuration</Text>
          <Text style={styles.cardSubtitle}>
            CropAI connects to your cloud or local FastAPI service to run deep learning inferences.
          </Text>

          <Text style={styles.fieldLabel}>FastAPI Base URL:</Text>
          <TextInput
            style={styles.input}
            value={apiUrl}
            onChangeText={setApiUrlState}
            placeholder="https://your-api.onrender.com"
            placeholderTextColor={colors.textSubtle}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.secondaryButton} onPress={handleReset}>
              <Text style={styles.secondaryButtonText}>Reset to Cloud</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.primaryButton} onPress={handleSave} activeOpacity={0.85}>
              <Ionicons name="save-outline" size={16} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>Save & Ping</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Diagnostic Status Card */}
        <View style={styles.card}>
          <View style={styles.diagnosticHeader}>
            <Text style={styles.cardTitle}>Model Diagnostics</Text>
            {loading ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <TouchableOpacity onPress={checkHealth} style={styles.refreshPill}>
                <Ionicons name="refresh" size={14} color={colors.primary} />
                <Text style={styles.refreshPillText}>Check</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.statusList}>
            {/* 1. Disease Model */}
            <View style={styles.statusItem}>
              <View style={[styles.dot, { backgroundColor: health?.model_loaded ? colors.success : colors.danger }]} />
              <View style={styles.statusTextCol}>
                <Text style={styles.modelName}>Crop Disease Classifier</Text>
                <Text style={styles.modelDetail}>
                  MobileNetV2 • {health?.classes_count || 38} Plant Classes
                </Text>
              </View>
              <Text style={[styles.badge, health?.model_loaded ? styles.badgeSuccess : styles.badgeFail]}>
                {health?.model_loaded ? 'Active' : 'Offline'}
              </Text>
            </View>

            {/* 2. Pest Model */}
            <View style={styles.statusItem}>
              <View style={[styles.dot, { backgroundColor: health?.pest_model_loaded ? colors.success : colors.danger }]} />
              <View style={styles.statusTextCol}>
                <Text style={styles.modelName}>Pest Detection Model</Text>
                <Text style={styles.modelDetail}>
                  YOLO11 • {health?.pest_classes_count || 97} Insect Species
                </Text>
              </View>
              <Text style={[styles.badge, health?.pest_model_loaded ? styles.badgeSuccess : styles.badgeFail]}>
                {health?.pest_model_loaded ? 'Active' : 'Offline'}
              </Text>
            </View>

            {/* 3. Nutrient Model */}
            <View style={styles.statusItem}>
              <View style={[styles.dot, { backgroundColor: health?.nutrient_model_loaded ? colors.success : colors.danger }]} />
              <View style={styles.statusTextCol}>
                <Text style={styles.modelName}>Nutrient Deficiency Model</Text>
                <Text style={styles.modelDetail}>
                  MobileNetV3 OLID-I • {health?.nutrient_classes_count || 36} Conditions
                </Text>
              </View>
              <Text style={[styles.badge, health?.nutrient_model_loaded ? styles.badgeSuccess : styles.badgeFail]}>
                {health?.nutrient_model_loaded ? 'Active' : 'Offline'}
              </Text>
            </View>

            {/* 4. Yield Model */}
            <View style={styles.statusItem}>
              <View style={[styles.dot, { backgroundColor: health?.yield_model_loaded ? colors.success : colors.danger }]} />
              <View style={styles.statusTextCol}>
                <Text style={styles.modelName}>Crop Yield Regression Engine</Text>
                <Text style={styles.modelDetail}>
                  Tabular ML • {health?.yield_crops_count || 115} Crops • {health?.yield_districts_count || 632} Districts
                </Text>
              </View>
              <Text style={[styles.badge, health?.yield_model_loaded ? styles.badgeSuccess : styles.badgeFail]}>
                {health?.yield_model_loaded ? 'Active' : 'Offline'}
              </Text>
            </View>

            {/* 5. Market Model */}
            <View style={styles.statusItem}>
              <View style={[styles.dot, { backgroundColor: health?.market_price_loaded ? colors.success : colors.danger }]} />
              <View style={styles.statusTextCol}>
                <Text style={styles.modelName}>Mandi Market Price Engine</Text>
                <Text style={styles.modelDetail}>
                  Time-Series ML • {health?.market_price_commodities_count || 13} Commodities
                </Text>
              </View>
              <Text style={[styles.badge, health?.market_price_loaded ? styles.badgeSuccess : styles.badgeFail]}>
                {health?.market_price_loaded ? 'Active' : 'Offline'}
              </Text>
            </View>
          </View>
        </View>

        {/* App Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>About CropAI Ecosystem</Text>
          <Text style={styles.infoRow}>• Client: Native React Native + Expo</Text>
          <Text style={styles.infoRow}>• Backend: Python 3.12 FastAPI + TensorFlow Lite + YOLO11</Text>
          <Text style={styles.infoRow}>• Target Platforms: Android & iOS</Text>
          <Text style={styles.infoRow}>• Production Cloud: Render (`https://crop-app-419s.onrender.com`)</Text>
          <Text style={styles.infoRow}>• Live Web App: Vercel (`https://crop-ai-ecosystem.vercel.app`)</Text>
        </View>
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
    gap: 16,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.text,
    fontFamily: 'monospace',
    marginBottom: 14,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  diagnosticHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  refreshPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primaryTint,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  refreshPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  statusList: {
    gap: 12,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceAlt,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  statusTextCol: {
    flex: 1,
  },
  modelName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  modelDetail: {
    fontSize: 11,
    color: colors.textSubtle,
    marginTop: 2,
  },
  badge: {
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeSuccess: {
    backgroundColor: colors.primaryTint,
    color: colors.primary,
  },
  badgeFail: {
    backgroundColor: colors.dangerLight,
    color: colors.danger,
  },
  infoRow: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 22,
  },
});

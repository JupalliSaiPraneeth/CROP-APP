import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { colors, shadows } from '../theme/colors';
import { Header } from '../components/Header';
import { api } from '../api/client';
import { HealthResponse } from '../types/api';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

export const HomeScreen = ({ navigation }: any) => {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHealth = useCallback(async () => {
    try {
      const data = await api.checkHealth();
      setHealth(data);
    } catch {
      setHealth({ status: 'disconnected', model_loaded: false });
    }
  }, []);

  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  const onRefresh = async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await fetchHealth();
    setRefreshing(false);
  };

  const isConnected = health?.status === 'healthy';

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="CropAI"
        subtitle="5-in-1 Precision AgTech Platform"
        isConnected={isConnected}
        onRefresh={fetchHealth}
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroBadge}>
            <Ionicons name="sparkles" size={14} color="#FFFFFF" />
            <Text style={styles.heroBadgeText}>AI Farm Diagnostics</Text>
          </View>
          <Text style={styles.heroTitle}>Protect Your Harvest with Real-Time Vision AI</Text>
          <Text style={styles.heroDescription}>
            Instant disease identification, pest detection, nutrient remediation, and harvest yield forecasts.
          </Text>

          <TouchableOpacity
            style={styles.heroButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              navigation.navigate('Disease');
            }}
            activeOpacity={0.85}
          >
            <Ionicons name="scan" size={20} color={colors.primaryDark} />
            <Text style={styles.heroButtonText}>Diagnose Leaf Disease</Text>
            <Ionicons name="arrow-forward" size={18} color={colors.primaryDark} />
          </TouchableOpacity>
        </View>

        {/* Live Backend Status Banner */}
        <View style={styles.statusBanner}>
          <View style={[styles.statusIconWrap, { backgroundColor: isConnected ? colors.primaryTint : colors.dangerLight }]}>
            <Ionicons
              name={isConnected ? 'cloud-done' : 'cloud-offline'}
              size={20}
              color={isConnected ? colors.primary : colors.danger}
            />
          </View>
          <View style={styles.statusTextWrap}>
            <Text style={styles.statusTitle}>
              {isConnected ? 'Connected to Render Cloud API' : 'Backend Disconnected'}
            </Text>
            <Text style={styles.statusSubtitle} numberOfLines={1}>
              {isConnected ? 'All 5 AI Models Online & Ready' : 'Tap Settings to verify backend connection'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.statusAction}
            onPress={() => navigation.navigate('Settings')}
          >
            <Ionicons name="settings-outline" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Ecosystem Features Grid */}
        <Text style={styles.sectionTitle}>Precision AI Capabilities</Text>

        <View style={styles.grid}>
          {/* 1. Disease Detection */}
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.8}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.navigate('Disease');
            }}
          >
            <View style={[styles.cardIconWrap, { backgroundColor: '#ECFDF5' }]}>
              <Ionicons name="leaf" size={24} color={colors.primary} />
            </View>
            <Text style={styles.cardTitle}>Leaf Disease</Text>
            <Text style={styles.cardSubtitle}>38 crop diseases with symptoms & chemical dosages</Text>
            <View style={styles.cardFooter}>
              <Text style={styles.cardBadge}>MobileNetV2</Text>
              <Ionicons name="arrow-forward" size={16} color={colors.primary} />
            </View>
          </TouchableOpacity>

          {/* 2. Pest Detection */}
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.8}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.navigate('Pest');
            }}
          >
            <View style={[styles.cardIconWrap, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="bug" size={24} color="#D97706" />
            </View>
            <Text style={styles.cardTitle}>Pest Detection</Text>
            <Text style={styles.cardSubtitle}>97 insect species with YOLO11 bounding boxes</Text>
            <View style={styles.cardFooter}>
              <Text style={[styles.cardBadge, { backgroundColor: '#FEF3C7', color: '#B45309' }]}>
                YOLO11
              </Text>
              <Ionicons name="arrow-forward" size={16} color="#D97706" />
            </View>
          </TouchableOpacity>

          {/* 3. Nutrient Deficiency */}
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.8}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.navigate('Nutrient');
            }}
          >
            <View style={[styles.cardIconWrap, { backgroundColor: '#F0FDFA' }]}>
              <Ionicons name="flask" size={24} color="#0D9488" />
            </View>
            <Text style={styles.cardTitle}>Nutrient Scanner</Text>
            <Text style={styles.cardSubtitle}>N-P-K & micronutrient deficiency remedies</Text>
            <View style={styles.cardFooter}>
              <Text style={[styles.cardBadge, { backgroundColor: '#F0FDFA', color: '#0F766E' }]}>
                MobileNetV3
              </Text>
              <Ionicons name="arrow-forward" size={16} color="#0D9488" />
            </View>
          </TouchableOpacity>

          {/* 4. Crop Yield Prediction */}
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.8}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.navigate('Yield');
            }}
          >
            <View style={[styles.cardIconWrap, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="analytics" size={24} color="#2563EB" />
            </View>
            <Text style={styles.cardTitle}>Yield Forecast</Text>
            <Text style={styles.cardSubtitle}>Predict tonnes per hectare across 632 districts</Text>
            <View style={styles.cardFooter}>
              <Text style={[styles.cardBadge, { backgroundColor: '#EFF6FF', color: '#1D4ED8' }]}>
                Tabular ML
              </Text>
              <Ionicons name="arrow-forward" size={16} color="#2563EB" />
            </View>
          </TouchableOpacity>

          {/* 5. Market Price */}
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.8}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.navigate('Market');
            }}
          >
            <View style={[styles.cardIconWrap, { backgroundColor: '#FAF5FF' }]}>
              <Ionicons name="trending-up" size={24} color="#7C3AED" />
            </View>
            <Text style={styles.cardTitle}>Mandi Prices</Text>
            <Text style={styles.cardSubtitle}>13 commodities mandi price forecasts</Text>
            <View style={styles.cardFooter}>
              <Text style={[styles.cardBadge, { backgroundColor: '#FAF5FF', color: '#6D28D9' }]}>
                Price AI
              </Text>
              <Ionicons name="arrow-forward" size={16} color="#7C3AED" />
            </View>
          </TouchableOpacity>
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
    paddingBottom: 36,
  },
  heroCard: {
    backgroundColor: colors.primaryDark,
    borderRadius: 22,
    padding: 22,
    marginBottom: 18,
    ...shadows.lg,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    marginBottom: 14,
  },
  heroBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 28,
    marginBottom: 8,
  },
  heroDescription: {
    fontSize: 14,
    color: '#A7F3D0',
    lineHeight: 20,
    marginBottom: 20,
  },
  heroButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#34D399',
    paddingVertical: 14,
    borderRadius: 14,
  },
  heroButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 24,
    ...shadows.sm,
  },
  statusIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  statusTextWrap: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  statusSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  statusAction: {
    padding: 6,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 14,
  },
  grid: {
    gap: 14,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  cardIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
    marginBottom: 14,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceAlt,
  },
  cardBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    backgroundColor: colors.primaryTint,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
});

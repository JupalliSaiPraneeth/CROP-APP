import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { colors, shadows } from '../theme/colors';
import { Header } from '../components/Header';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface CommodityItem {
  name: string;
  category: string;
  currentPrice: number;
  forecastPrice: number;
  trend: 'up' | 'down' | 'stable';
  changePct: number;
  market: string;
  recommendation: string;
}

const COMMODITIES: CommodityItem[] = [
  {
    name: 'Wheat (Sharbati)',
    category: 'Cereals',
    currentPrice: 2450,
    forecastPrice: 2620,
    trend: 'up',
    changePct: 6.9,
    market: 'Khanna Mandi, Punjab',
    recommendation: 'Hold harvest for 2 weeks to maximize price premium.',
  },
  {
    name: 'Paddy / Rice (Basmati 1121)',
    category: 'Cereals',
    currentPrice: 3850,
    forecastPrice: 3950,
    trend: 'up',
    changePct: 2.6,
    market: 'Karnal Mandi, Haryana',
    recommendation: 'Stable export demand. Good window for gradual release.',
  },
  {
    name: 'Cotton (Medium Staple)',
    category: 'Commercial',
    currentPrice: 7100,
    forecastPrice: 6850,
    trend: 'down',
    changePct: -3.5,
    market: 'Warangal APMC, Telangana',
    recommendation: 'Sell current inventory to avoid seasonal post-harvest dip.',
  },
  {
    name: 'Soybean (Yellow)',
    category: 'Oilseeds',
    currentPrice: 4750,
    forecastPrice: 4900,
    trend: 'up',
    changePct: 3.1,
    market: 'Indore Mandi, MP',
    recommendation: 'Firm crushing demand expected next month.',
  },
  {
    name: 'Tomato (Hybrid)',
    category: 'Vegetables',
    currentPrice: 1650,
    forecastPrice: 1950,
    trend: 'up',
    changePct: 18.2,
    market: 'Kolar Mandi, Karnataka',
    recommendation: 'Supply contraction in southern belts will support prices.',
  },
  {
    name: 'Onion (Red Nashik)',
    category: 'Vegetables',
    currentPrice: 2200,
    forecastPrice: 2050,
    trend: 'down',
    changePct: -6.8,
    market: 'Lasalgaon Mandi, Maharashtra',
    recommendation: 'Kharif arrivals starting, sell grade-A bulbs early.',
  },
];

export const MarketPriceScreen = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const categories = ['All', 'Cereals', 'Commercial', 'Oilseeds', 'Vegetables'];

  const filtered = selectedCategory === 'All'
    ? COMMODITIES
    : COMMODITIES.filter((c) => c.category === selectedCategory);

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Mandi Price Forecast" subtitle="Predictive Agricultural Market Intelligence" showStatus={false} />

      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Category Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.chip, selectedCategory === cat && styles.chipActive]}
              onPress={() => {
                Haptics.selectionAsync();
                setSelectedCategory(cat);
              }}
            >
              <Text style={[styles.chipText, selectedCategory === cat && styles.chipTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Commodity Cards List */}
        <View style={styles.list}>
          {filtered.map((item, idx) => (
            <View key={idx} style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.nameWrap}>
                  <Text style={styles.commodityName}>{item.name}</Text>
                  <Text style={styles.marketText}>{item.market}</Text>
                </View>

                <View style={[styles.trendBadge, item.trend === 'up' ? styles.trendUp : styles.trendDown]}>
                  <Ionicons
                    name={item.trend === 'up' ? 'trending-up' : 'trending-down'}
                    size={16}
                    color={item.trend === 'up' ? '#059669' : '#DC2626'}
                  />
                  <Text style={[styles.trendText, { color: item.trend === 'up' ? '#059669' : '#DC2626' }]}>
                    {item.changePct > 0 ? `+${item.changePct}%` : `${item.changePct}%`}
                  </Text>
                </View>
              </View>

              {/* Price Grid */}
              <View style={styles.priceGrid}>
                <View style={styles.priceCol}>
                  <Text style={styles.priceLabel}>Current Modal Price</Text>
                  <Text style={styles.priceValue}>₹{item.currentPrice.toLocaleString()}</Text>
                  <Text style={styles.priceUnit}>per Quintal</Text>
                </View>

                <View style={styles.priceDivider} />

                <View style={styles.priceCol}>
                  <Text style={styles.priceLabel}>30-Day Forecast</Text>
                  <Text style={[styles.priceValue, { color: item.trend === 'up' ? '#059669' : '#DC2626' }]}>
                    ₹{item.forecastPrice.toLocaleString()}
                  </Text>
                  <Text style={styles.priceUnit}>Expected Modal</Text>
                </View>
              </View>

              {/* Recommendation Box */}
              <View style={styles.recommendationBox}>
                <Ionicons name="bulb-outline" size={15} color="#D97706" />
                <Text style={styles.recommendationText}>{item.recommendation}</Text>
              </View>
            </View>
          ))}
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
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 18,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  list: {
    gap: 14,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  nameWrap: {
    flex: 1,
  },
  commodityName: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  marketText: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  trendUp: {
    backgroundColor: '#ECFDF5',
  },
  trendDown: {
    backgroundColor: '#FEF2F2',
  },
  trendText: {
    fontSize: 12,
    fontWeight: '700',
  },
  priceGrid: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceAlt,
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
  },
  priceCol: {
    flex: 1,
    alignItems: 'center',
  },
  priceDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginVertical: 4,
  },
  priceLabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  priceUnit: {
    fontSize: 10,
    color: colors.textSubtle,
    marginTop: 2,
  },
  recommendationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFBEB',
    borderRadius: 10,
    padding: 10,
  },
  recommendationText: {
    flex: 1,
    fontSize: 12,
    color: '#92400E',
    lineHeight: 17,
    fontWeight: '500',
  },
});

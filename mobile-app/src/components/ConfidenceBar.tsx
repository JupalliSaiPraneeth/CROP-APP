import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

interface ConfidenceBarProps {
  label: string;
  percentage: number;
  highlight?: boolean;
}

export const ConfidenceBar: React.FC<ConfidenceBarProps> = ({
  label,
  percentage,
  highlight = false,
}) => {
  const clamped = Math.max(0, Math.min(100, Math.round(percentage)));

  const getBarColor = (pct: number) => {
    if (pct >= 80) return colors.primary;
    if (pct >= 60) return colors.warning;
    return colors.danger;
  };

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={[styles.label, highlight && styles.labelHighlight]} numberOfLines={1}>
          {label}
        </Text>
        <Text style={[styles.percentage, highlight && styles.percentageHighlight]}>
          {clamped}%
        </Text>
      </View>
      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            { width: `${clamped}%`, backgroundColor: getBarColor(clamped) },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  label: {
    fontSize: 13,
    color: colors.text,
    flex: 1,
    marginRight: 8,
  },
  labelHighlight: {
    fontWeight: '700',
    color: colors.primaryDark,
  },
  percentage: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
  },
  percentageHighlight: {
    fontWeight: '700',
    color: colors.primary,
  },
  track: {
    height: 8,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
});

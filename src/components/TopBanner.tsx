// このファイルは Cursor により生成された
// Home の目標カード: 目標名・残額・残り期間を表示

import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { colors, spacing, radius, typography } from '../styles/theme';

type Props = {
  title: string;
  imageUrl?: string;
  remainingAmount: number;
  monthsRemaining: number;
};

export const TopBanner: React.FC<Props> = ({ title, imageUrl, remainingAmount, monthsRemaining }) => {
  return (
    <View style={styles.card}>
      {imageUrl ? <Image source={{ uri: imageUrl }} style={styles.image} /> : null}
      <View style={styles.textWrap}>
        <View style={styles.headRow}>
          <Image source={require('../icons/goal.png')} style={styles.headIcon} />
          <Text style={styles.headLabel}>目標</Text>
        </View>
        <Text style={styles.title}>
          <Text style={styles.titleWeakBlack}>あと</Text>
          <Text style={styles.titleStrongBlack}>{monthsRemaining}</Text>
          <Text style={styles.titleWeakBlack}>ヶ月で</Text>
          {"\n"}
          <Text style={styles.titleStrong}>{title}</Text>
        </Text>
        <Text style={styles.remaining}>
          目標達成まであと{"\n"}
          <Text style={styles.remainingNumber}>{remainingAmount.toLocaleString()}</Text>
          円
        </Text>
      </View>
    </View>
  );
};

const baseTitleSize = Math.round((typography.heading || 18) * 1.5);

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  image: {
    width: 64,
    height: 64,
    borderRadius: radius.md,
    marginRight: spacing.md,
    backgroundColor: '#1A1A1A',
  },
  textWrap: { flex: 1 },
  headRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  headIcon: { width: 18, height: 18, marginRight: 6, borderRadius: 4 },
  headLabel: {
    color: '#000',
    textDecorationLine: 'none',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 0,
  },
  title: {
    color: '#FDB523',
    fontSize: baseTitleSize,
    fontFamily: typography.fontFamily,
    marginBottom: spacing.xs,
  },
  titleWeak: {
    color: '#FDB523',
    fontSize: 18,
  },
  titleWeakBlack: {
    color: '#000000',
    fontSize: 18,
  },
  titleStrong: {
    color: '#FDB523',
    fontSize: 24,
    fontWeight: '700',
  },
  titleStrongBlack: {
    color: '#000000',
    fontSize: 18,
    fontWeight: '700',
  },
  remaining: {
    color: '#000000',
    fontSize: 18,
    marginBottom: spacing.xs,
  },
  remainingNumber: {
    color: '#FDB523',
    fontSize: 24,
    fontWeight: '700',
  },
});

export default TopBanner;



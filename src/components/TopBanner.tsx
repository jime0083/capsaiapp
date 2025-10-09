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
        <Text style={styles.headLabel}>目標</Text>
        <Text style={styles.title}>
          <Text style={styles.titleWeak}>あと</Text>
          <Text style={styles.titleStrong}>{monthsRemaining}</Text>
          <Text style={styles.titleWeak}>ヶ月で</Text>
          {"\n"}
          <Text style={styles.titleStrong}>{title}</Text>
        </Text>
        <Text style={styles.remaining}>
          目標達成まであと
          <Text style={styles.remainingNumber}>{`${remainingAmount.toLocaleString()}円`}</Text>
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
  headLabel: {
    color: '#000',
    textDecorationLine: 'underline',
    fontSize: Math.round(baseTitleSize * 0.7), // 見出しより30%小さく
    marginBottom: 2,
  },
  title: {
    color: '#FDB523',
    fontSize: baseTitleSize,
    fontFamily: typography.fontFamily,
    marginBottom: spacing.xs,
  },
  titleWeak: {
    color: '#FDB523',
    fontSize: Math.round(baseTitleSize * 0.8),
  },
  titleStrong: {
    color: '#FDB523',
    fontSize: baseTitleSize,
    fontWeight: '700',
  },
  remaining: {
    color: '#000000',
    fontSize: 18,
    marginBottom: spacing.xs,
  },
  remainingNumber: {
    color: '#000000',
    fontSize: 22,
    fontWeight: '700',
  },
});

export default TopBanner;



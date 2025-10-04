// このファイルは Cursor により生成された
// Home の目標カード: 目標名・画像（任意）・残額・今月の支出を表示

import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { colors, spacing, radius, typography } from '../styles/theme';

type Props = {
  title: string;
  imageUrl?: string;
  remainingAmount: number;
  thisMonthSpending: number;
};

export const TopBanner: React.FC<Props> = ({ title, imageUrl, remainingAmount, thisMonthSpending }) => {
  return (
    <View style={styles.card}>
      {imageUrl ? <Image source={{ uri: imageUrl }} style={styles.image} /> : null}
      <View style={styles.textWrap}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.remaining}>あと{remainingAmount.toLocaleString()}円</Text>
        <Text style={styles.monthSpend}>今月の支出 {thisMonthSpending.toLocaleString()}円</Text>
      </View>
    </View>
  );
};

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
  title: {
    color: colors.text,
    fontSize: typography.heading,
    fontFamily: typography.fontFamily,
    marginBottom: spacing.xs,
  },
  remaining: {
    color: colors.positive,
    fontSize: 18,
    marginBottom: spacing.xs,
  },
  monthSpend: {
    color: colors.text,
    fontSize: 14,
  },
});

export default TopBanner;



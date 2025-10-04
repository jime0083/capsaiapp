// このファイルは Cursor により生成された
// Insight: 円グラフ、今週/先月比較、12ヶ月線グラフ（ダミー）

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors, spacing } from '../styles/theme';
import PlaceholderChart from '../components/PlaceholderChart';

const InsightScreen: React.FC = () => {
  const pieData = [40, 30, 20, 10];
  const weekly = { thisWeek: 18000, lastWeek: 20000 };
  const monthly = { thisMonth: 95000, lastMonth: 105000 };
  const weekDiff = weekly.thisWeek - weekly.lastWeek;
  const monthDiff = monthly.thisMonth - monthly.lastMonth;

  const lineData = useMemo(() => Array.from({ length: 12 }).map((_, i) => ({ x: i + 1, y: 60000 + i * 1500 })), []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>支出内訳</Text>
      <PlaceholderChart type="pie" data={pieData} />

      <View style={{ height: spacing.lg }} />
      <Text style={styles.title}>期間比較</Text>
      <Text style={[styles.row, { color: weekDiff <= 0 ? colors.positive : colors.negative }]}>今週: {weekly.thisWeek.toLocaleString()} 円（先週比 {weekDiff}）</Text>
      <Text style={[styles.row, { color: monthDiff <= 0 ? colors.positive : colors.negative }]}>今月: {monthly.thisMonth.toLocaleString()} 円（先月比 {monthDiff}）</Text>

      <View style={{ height: spacing.lg }} />
      <Text style={styles.title}>過去12ヶ月</Text>
      <PlaceholderChart type="line" data={lineData} height={180} />
      <View style={{ height: 24 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg },
  title: { color: colors.text, fontSize: 18, marginBottom: spacing.sm },
  row: { fontSize: 14, marginTop: spacing.xs },
});

export default InsightScreen;



// このファイルは Cursor により生成された
// Home: 目標カード、ダミーチャート、今週サマリ、記録ボタン

import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { colors, spacing } from '../styles/theme';
import TopBanner from '../components/TopBanner';
import PlaceholderChart from '../components/PlaceholderChart';
import { sampleGoal, sampleTransactions } from '../mock/sampleData';

type Props = { navigation: any };

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const [showWeeklyNotice, setShowWeeklyNotice] = useState(false);
  const [showMonthlyNotice, setShowMonthlyNotice] = useState(false);

  const thisMonthSpending = useMemo(() => {
    const month = new Date().getMonth() + 1;
    const pfx = `2025-${String(month).padStart(2, '0')}`;
    return sampleTransactions
      .filter((t) => t.date.startsWith(pfx))
      .reduce((sum, t) => sum + t.totalAmount, 0);
  }, []);

  const lastWeek = 12000; // mock
  const thisWeek = 10000; // mock
  const diff = thisWeek - lastWeek;

  const remaining = Math.max(sampleGoal.targetAmount - sampleGoal.currentAmount, 0);

  // 週次/月次ポップアップトリガー（簡易）
  useEffect(() => {
    const now = new Date();
    const isMonday = now.getDay() === 1; // 0:Sun,1:Mon
    const isFirstDay = now.getDate() === 1;
    setShowWeeklyNotice(isMonday);
    setShowMonthlyNotice(isFirstDay);
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TopBanner title={sampleGoal.title} imageUrl={sampleGoal.imageUrl} remainingAmount={remaining} thisMonthSpending={thisMonthSpending} />

      <View style={styles.section}>
        {showWeeklyNotice && <Text style={styles.notice}>今週の目標を設定してみましょう（週次）</Text>}
        {showMonthlyNotice && <Text style={styles.notice}>月初です。予算と目標を見直しましょう（月次）</Text>}
        <PlaceholderChart type="pie" data={[40, 30, 20, 10]} />
        <Text style={[styles.delta, { color: diff <= 0 ? colors.positive : colors.negative }]}>
          {diff <= 0 ? `先週より ${Math.abs(diff).toLocaleString()} 円少ない` : `先週より ${diff.toLocaleString()} 円多い`}
        </Text>
      </View>

      <TouchableOpacity style={styles.cta} activeOpacity={0.8} onPress={() => navigation.navigate('Input')}>
        <Text style={styles.ctaText}>記録する</Text>
      </TouchableOpacity>
      <View style={{ height: 24 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg },
  section: { marginTop: spacing.lg },
  notice: { color: colors.text, marginBottom: spacing.sm },
  delta: { marginTop: spacing.sm, fontSize: 14 },
  cta: {
    backgroundColor: colors.positive,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderRadius: 12,
    marginTop: spacing.lg,
  },
  ctaText: { color: '#000', fontWeight: '700' },
});

export default HomeScreen;



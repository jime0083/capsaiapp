// このファイルは Cursor により生成された
// Home: 最新目標、残額、今月の出費(共有出費)/予算残、用途別グラフ、記録ボタン

import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { colors, spacing } from '../styles/theme';
import TopBanner from '../components/TopBanner';
import PlaceholderChart from '../components/PlaceholderChart';
import { getFirebaseAuth } from '../lib/firebase';
import { getUserProfile, subscribeLatestGoal, subscribeUserTransactionsUnion } from '../lib/firestoreApi';
import { useIsFocused } from '@react-navigation/native';
import { categoryColors } from '../mock/sampleData';

function toMonthString(value: any): string | null {
  try {
    if (typeof value === 'string') {
      const s = value.replace(/\//g, '-');
      if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s.slice(0, 7);
      if (/^\d{4}-\d{2}$/.test(s)) return s;
      const d = new Date(s);
      if (!isNaN(d.getTime())) return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      return null;
    }
    if (value && typeof value.seconds === 'number') {
      const d = new Date(value.seconds * 1000);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    }
    const d = new Date(value);
    if (!isNaN(d.getTime())) return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    return null;
  } catch { return null; }
}

function isThisMonth(dateLike: any): boolean {
  const m = toMonthString(dateLike);
  const now = toMonthString(new Date());
  return !!m && m === now;
}

type Props = { navigation: any };

type GoalVM = {
  title: string;
  targetAmount: number;
  currentAmount: number;
  monthlyIncome: number;
  deadline: number;
};

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const [goal, setGoal] = useState<GoalVM | null>(null);
  const [thisMonthSpending, setThisMonthSpending] = useState(0);
  const [pie, setPie] = useState<{ key: string; value: number; color: string }[]>([]);
  const [eatingOut, setEatingOut] = useState<{ count: number; total: number }>({ count: 0, total: 0 });
  const [convenienceCount, setConvenienceCount] = useState<number>(0);
  const isFocused = useIsFocused();

  useEffect(() => {
    let unsubGoal: (() => void) | null = null;
    let unsubUserTx: (() => void) | null = null;

    const start = async () => {
      const auth = getFirebaseAuth();
      const uid = auth.currentUser?.uid;
      if (!uid) return;
      const profile = await getUserProfile(uid);
      const householdId = (profile && (profile['householdId'] as string)) || null;
      const pairUserIds: string[] = (profile && (profile['pairUserIds'] as string[])) || [];
      const allowedUserIds = [uid, ...pairUserIds];
      if (!householdId) return;

      unsubGoal = subscribeLatestGoal(householdId, (g) => {
        if (g) {
          setGoal({
            title: g.title,
            targetAmount: g.targetAmount,
            currentAmount: g.currentAmount,
            monthlyIncome: Number(g.monthlyIncome || 0),
            deadline: g.deadline,
          });
        } else { setGoal(null); }
      });

      unsubUserTx = subscribeUserTransactionsUnion(householdId, allowedUserIds, (txs) => {
        const thisMonth = txs.filter((t) => isThisMonth(t.date));
        const sumShared = thisMonth.reduce((acc, t) => acc + (Number(t.sharedAmount) || 0), 0);
        setThisMonthSpending(sumShared);
        const byCat = new Map<string, number>();
        thisMonth.forEach((t) => {
          const k = t.category || 'その他';
          byCat.set(k, (byCat.get(k) || 0) + (Number(t.sharedAmount) || 0));
        });
        const pieData = Array.from(byCat.entries()).map(([key, value]) => ({ key, value, color: categoryColors[key] || '#888' }));
        setPie(pieData);
        const eating = thisMonth.filter((t) => t.category === '外食');
        const count = eating.length;
        const total = eating.reduce((a, t) => a + (Number(t.sharedAmount) || 0), 0);
        setEatingOut({ count, total });
        const convenience = thisMonth.filter((t) => t.category === 'コンビニ');
        setConvenienceCount(convenience.length);
      });
    };

    if (isFocused) start();
    return () => { if (unsubGoal) unsubGoal(); if (unsubUserTx) unsubUserTx(); };
  }, [isFocused]);

  const remainingToTarget = useMemo(() => !goal ? 0 : Math.max(goal.targetAmount - goal.currentAmount, 0), [goal]);
  const monthsRemaining = useMemo(() => {
    if (!goal) return 0;
    const now = new Date();
    const end = new Date(goal.deadline);
    const years = end.getFullYear() - now.getFullYear();
    const months = years * 12 + (end.getMonth() - now.getMonth());
    return Math.max(months, 0);
  }, [goal]);
  const thisMonthBudgetLeft = useMemo(() => !goal ? 0 : Math.max(goal.monthlyIncome - thisMonthSpending, 0), [goal, thisMonthSpending]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* 目標ヘッダを別要素として改行分離 */}
      <TopBanner
        title={goal?.title || '目標未設定'}
        imageUrl={undefined}
        remainingAmount={remainingToTarget}
        monthsRemaining={monthsRemaining}
      />

      <View style={[styles.section, styles.rowGap]}> 
        <View style={[styles.badge, { backgroundColor: '#F3E0E4' }]}> 
          <Text style={styles.badgeTitleLight}>今月の出費</Text>
          <Text style={styles.badgeValueLarge}>
            <Text style={styles.valueSpendingNumber}>{thisMonthSpending.toLocaleString()}</Text>
            <Text style={styles.badgeUnit}> 円</Text>
          </Text>
        </View>
        <View style={[styles.badge, { backgroundColor: '#DDE9F7' }]}> 
          <Text style={styles.badgeTitleLight}>今月の予算あと</Text>
          <Text style={styles.badgeValueLarge}>
            <Text style={styles.valueBudgetNumber}>{thisMonthBudgetLeft.toLocaleString()}</Text>
            <Text style={styles.badgeUnit}> 円</Text>
          </Text>
        </View>
      </View>

      <View style={[styles.section, styles.rowGap, { marginTop: spacing.sm }]}> 
        <View style={[styles.miniBadge, { backgroundColor: '#F3E9DF' }]}> 
          <Text style={styles.miniTitle}>外食回数</Text>
          <Text style={[styles.miniValue, { color: '#FF7F00' }]}>{eatingOut.count} <Text style={styles.badgeUnit}>回</Text></Text>
        </View>
        <View style={[styles.miniBadge, { backgroundColor: '#DFEEE7' }]}> 
          <Text style={styles.miniTitle}>コンビニ利用</Text>
          <Text style={[styles.miniValue, { color: '#0DFF00' }]}>{convenienceCount} <Text style={styles.badgeUnit}>回</Text></Text>
        </View>
      </View>

      <View style={[styles.section, { marginTop: spacing.md, width: '100%' }]}> 
        <PlaceholderChart type="pie" title="今月の支出内訳" height={220} data={pie.length ? pie : [{ key: 'なし', value: 1, color: '#444' }]} />
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
  section: { marginTop: spacing.lg, alignItems: 'flex-start' },
  sectionCenter: { marginTop: spacing.lg, alignItems: 'center' },
  sub: { color: colors.text, marginTop: 6, textAlign: 'left' },
  rowGap: { flexDirection: 'row', gap: 12, width: '100%' },
  badge: { flex: 1, borderRadius: 12, padding: spacing.md, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  badgeTitleLight: { color: '#000', fontWeight: '700', marginBottom: 4 },
  badgeValueLarge: { color: '#000', fontSize: 21, fontWeight: '700' },
  badgeUnit: { color: '#000', fontSize: 14, fontWeight: '700' },
  valueSpendingNumber: { color: '#FF0036' },
  valueBudgetNumber: { color: '#0076FF' },
  miniBadge: { flex: 1, borderRadius: 12, padding: spacing.md, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  miniTitle: { color: '#000', fontWeight: '700', marginBottom: 2 },
  miniValue: { color: '#000', fontSize: 18, fontWeight: '700' },
  cta: { backgroundColor: colors.positive, paddingVertical: spacing.md, alignItems: 'center', borderRadius: 12, marginTop: spacing.lg },
  ctaText: { color: '#000', fontWeight: '700' },
});

export default HomeScreen;



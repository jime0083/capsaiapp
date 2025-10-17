// このファイルは Cursor により生成された
// Insight: 今月の支出内訳（円グラフ）＋ 今月/今週の比較表示 ＋ 直近1年の折れ線グラフ

import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { colors, spacing } from '../styles/theme';
import PlaceholderChart from '../components/PlaceholderChart';
import LineChart, { LinePoint } from '../components/LineChart';
import { getFirebaseAuth } from '../lib/firebase';
import { getUserProfile, subscribeUserTransactionsUnion, subscribeLatestGoal } from '../lib/firestoreApi';
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

function weekKey(d: Date): string { // YYYY-Www（簡易: 週は月曜起点）
  const date = new Date(d);
  const day = (date.getDay() + 6) % 7; // 0=Mon
  date.setDate(date.getDate() - day);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`; // 週の月曜日付で識別
}

const InsightScreen: React.FC = () => {
  const [pie, setPie] = useState<{ key: string; value: number; color: string }[]>([]);
  const [thisMonth, setThisMonth] = useState(0);
  const [lastMonth, setLastMonth] = useState(0);
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [line, setLine] = useState<LinePoint[]>([]);

  useEffect(() => {
    let unsub: (() => void) | null = null;
    let unsubGoal: (() => void) | null = null;

    (async () => {
      const uid = getFirebaseAuth().currentUser?.uid;
      if (!uid) return;
      const profile = await getUserProfile(uid);
      const householdId = (profile && (profile['householdId'] as string)) || null;
      const pairUserIds: string[] = (profile && (profile['pairUserIds'] as string[])) || [];
      const allowedUserIds = [uid, ...pairUserIds];
      if (!householdId) return;

      unsub = subscribeUserTransactionsUnion(householdId, allowedUserIds, (txs) => {
        const now = new Date();
        const thisMonthKey = toMonthString(now)!;
        const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthKey = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`;

        // 今月/先月
        let mThis = 0, mLast = 0;
        const byCat = new Map<string, number>();
        txs.forEach((t) => {
          const mk = toMonthString(t.date);
          const val = Number(t.sharedAmount) || 0;
          if (mk === thisMonthKey) {
            mThis += val;
            const k = t.category || 'その他';
            byCat.set(k, (byCat.get(k) || 0) + val);
          } else if (mk === lastMonthKey) {
            mLast += val;
          }
        });
        setThisMonth(mThis);
        setLastMonth(mLast);
        const pieData = Array.from(byCat.entries()).map(([key, value]) => ({ key, value, color: categoryColors[key] || '#888' }));
        setPie(pieData);

        // 直近12ヶ月ライン
        const arr: LinePoint[] = [];
        for (let i = 11; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          const label = String(d.getMonth() + 1);
          const sum = txs.filter((t) => toMonthString(t.date) === key)
                         .reduce((a, t) => a + (Number(t.sharedAmount) || 0), 0);
          arr.push({ label, value: sum });
        }
        setLine(arr);
      });

      // Home と同様に最新ゴールから月の予算（monthlyIncome）を取得
      unsubGoal = subscribeLatestGoal(householdId, (g) => {
        setMonthlyIncome(Number(g?.monthlyIncome || 0));
      });
    })();

    return () => { if (unsub) unsub(); if (unsubGoal) unsubGoal(); };
  }, []);

  const thisMonthBudgetLeft = useMemo(() => Math.max(monthlyIncome - thisMonth, 0), [monthlyIncome, thisMonth]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={{ width: '100%', marginTop: spacing.sm }}>
        <PlaceholderChart
          type="pie"
          title="今月の支出内訳"
          titleIcon={require('../icons/data5.png')}
          height={220}
          data={pie.length ? pie : [{ key: 'なし', value: 1, color: '#444' }]}
        />
      </View>

      <View style={[styles.section, styles.stack]}> 
        <View style={[styles.badge, { backgroundColor: '#F3E0E4' }]}> 
          <View style={styles.rowAlignCenter}>
            <Image source={require('../icons/wallet2.png')} style={styles.titleIcon} />
            <Text style={styles.badgeTitleLight}>今月の出費</Text>
          </View>
          <Text style={styles.badgeValueLarge}>
            <Text style={styles.valueSpendingNumber}>{thisMonth.toLocaleString()}</Text>
            <Text style={styles.badgeUnit}> 円</Text>
          </Text>
        </View>
        <View style={[styles.badge, { backgroundColor: '#DDE9F7' }]}> 
          <View style={styles.rowAlignCenter}>
            <Image source={require('../icons/money4.png')} style={styles.titleIcon} />
            <Text style={styles.badgeTitleLight}>今月の予算あと</Text>
          </View>
          <Text style={styles.badgeValueLarge}>
            <Text style={styles.valueBudgetNumber}>{thisMonthBudgetLeft.toLocaleString()}</Text>
            <Text style={styles.badgeUnit}> 円</Text>
          </Text>
        </View>
      </View>

      <View style={{ height: spacing.lg }} />
      <View style={{ width: '100%', marginTop: spacing.lg }}>
        <View style={{ borderWidth: 1, borderColor: '#E5E5EA', backgroundColor: '#F3F2F7', borderRadius: 12, paddingVertical: 8, paddingHorizontal: spacing.md, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.16, shadowRadius: 12, elevation: 6 }}>
          <View style={styles.titleRow}> 
            <Image source={require('../icons/graph3.png')} style={styles.titleIcon} />
            <Text style={[styles.graphHeader]}>直近1年の出費</Text>
          </View>
          <LineChart data={line} height={220} />
        </View>
      </View>
      <View style={{ height: 24 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg },
  // Home と同等のスタイルを再現
  section: { marginTop: spacing.lg, alignItems: 'flex-start' },
  stack: { flexDirection: 'column', gap: 12, width: '100%' },
  rowAlignCenter: { flexDirection: 'row', alignItems: 'flex-end', gap: 0, height: 18 },
  badge: { width: '100%', borderRadius: 12, padding: spacing.md, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  badgeTitleLight: { color: '#000', fontWeight: '700', marginBottom: 0, fontSize: 14, lineHeight: 14 },
  badgeValueLarge: { color: '#000', fontSize: 21, fontWeight: '700' },
  badgeUnit: { color: '#000', fontSize: 14, fontWeight: '700' },
  valueSpendingNumber: { color: '#FF0036' },
  valueBudgetNumber: { color: '#0076FF' },
  titleIcon: { width: 18, height: 18, marginRight: 0, borderRadius: 4 },
  graphHeader: { color: '#000', fontWeight: '700', marginLeft: 6, marginBottom: 0, fontSize: 14, lineHeight: 18 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-end', height: 18 },
});

export default InsightScreen;



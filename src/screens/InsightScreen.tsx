// このファイルは Cursor により生成された
// Insight: 今月の支出内訳（円グラフ）＋ 今月/今週の比較表示 ＋ 直近1年の折れ線グラフ

import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors, spacing } from '../styles/theme';
import PlaceholderChart from '../components/PlaceholderChart';
import LineChart, { LinePoint } from '../components/LineChart';
import { getFirebaseAuth } from '../lib/firebase';
import { getUserProfile, subscribeUserTransactionsUnion } from '../lib/firestoreApi';
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
  const [thisWeek, setThisWeek] = useState(0);
  const [lastWeek, setLastWeek] = useState(0);
  const [line, setLine] = useState<LinePoint[]>([]);

  useEffect(() => {
    let unsub: (() => void) | null = null;

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

        // 今週/先週（週の月曜でキー）
        const thisW = weekKey(now);
        const lastW = weekKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7));
        let wThis = 0, wLast = 0;
        txs.forEach((t) => {
          const d = new Date(t.date);
          const wk = weekKey(d);
          const val = Number(t.sharedAmount) || 0;
          if (wk === thisW) wThis += val;
          else if (wk === lastW) wLast += val;
        });
        setThisWeek(wThis);
        setLastWeek(wLast);

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
    })();

    return () => { if (unsub) unsub(); };
  }, []);

  const monthDiff = useMemo(() => thisMonth - lastMonth, [thisMonth, lastMonth]);
  const weekDiff = useMemo(() => thisWeek - lastWeek, [thisWeek, lastWeek]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>今月の支出内訳</Text>
      <View style={styles.centerRow}>
        <PlaceholderChart type="pie" data={pie.length ? pie : [{ key: 'なし', value: 1, color: '#444' }]} />
      </View>
      <Text style={styles.row}>{`今月の支出額: ${thisMonth.toLocaleString()} 円 (先月比 ${monthDiff >= 0 ? '+' : ''}${monthDiff.toLocaleString()} 円)`}</Text>
      <Text style={styles.row}>{`今週の支出額: ${thisWeek.toLocaleString()} 円 (先週比 ${weekDiff >= 0 ? '+' : ''}${weekDiff.toLocaleString()} 円)`}</Text>

      <View style={{ height: spacing.lg }} />
      <Text style={styles.title}>期間比較（直近1年）</Text>
      <View style={styles.centerRow}>
        <LineChart data={line} height={200} />
      </View>
      <View style={{ height: 24 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg },
  title: { color: colors.text, fontSize: 18, marginBottom: spacing.sm },
  row: { color: colors.text, fontSize: 14, marginTop: spacing.xs },
  centerRow: { alignItems: 'center' },
});

export default InsightScreen;



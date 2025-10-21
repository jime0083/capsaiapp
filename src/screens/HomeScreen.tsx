// このファイルは Cursor により生成された
// Home: 最新目標、残額、今月の出費(共有出費)/予算残、用途別グラフ、記録ボタン

import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { colors, spacing } from '../styles/theme';
import TopBanner from '../components/TopBanner';
import FadeInUp from '../components/FadeInUp';
import PlaceholderChart from '../components/PlaceholderChart';
import { getFirebaseAuth } from '../lib/firebase';
import { getUserProfile, subscribeLatestGoal, subscribeUserTransactionsUnion, upsertCookingEvent, subscribeWeeklyCooking } from '../lib/firestoreApi';
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
  const [foodMonthTotal, setFoodMonthTotal] = useState<number>(0);
  const [dinnerCookCount, setDinnerCookCount] = useState<number>(0);
  const [lunchCookCount, setLunchCookCount] = useState<number>(0);
  const [dinnerDaysThisWeek, setDinnerDaysThisWeek] = useState<string[]>([]);
  const [lunchDaysThisWeek, setLunchDaysThisWeek] = useState<string[]>([]);
  const isFocused = useIsFocused();
  const weekStart = useMemo(() => {
    const d = new Date();
    const day = (d.getDay() + 6) % 7; // Mon=0
    d.setHours(0,0,0,0);
    d.setDate(d.getDate() - day);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
  }, []);

  useEffect(() => {
    let unsubGoal: (() => void) | null = null;
    let unsubUserTx: (() => void) | null = null;
    let unsubCook: (() => void) | null = null;

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
        const eating = thisMonth.filter((t) => t.category === '食費(外食)');
        const count = eating.length;
        const total = eating.reduce((a, t) => a + (Number(t.sharedAmount) || 0), 0);
        setEatingOut({ count, total });
        const convenience = thisMonth.filter((t) => t.category === '食費(コンビニ)');
        setConvenienceCount(convenience.length);
        const monthFoodTotal = thisMonth
          .filter((t) => ['食費', '食費(コンビニ)', '食費(外食)'].includes(String(t.category)))
          .reduce((a, t) => a + (Number(t.sharedAmount) || 0), 0);
        setFoodMonthTotal(monthFoodTotal);
      });

      // Weekly cooking events
      unsubCook = subscribeWeeklyCooking(householdId, weekStart, (events) => {
        const dinnerDays = Array.from(new Set(events.filter(e => e.kind === 'dinner').map(e => e.date)));
        const lunchDays = Array.from(new Set(events.filter(e => e.kind === 'lunch').map(e => e.date)));
        setDinnerDaysThisWeek(dinnerDays);
        setLunchDaysThisWeek(lunchDays);
        setDinnerCookCount(dinnerDays.length);
        setLunchCookCount(lunchDays.length);
      });
    };

    if (isFocused) start();
    return () => { if (unsubGoal) unsubGoal(); if (unsubUserTx) unsubUserTx(); if (unsubCook) unsubCook(); };
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
  const goalPercent = useMemo(() => {
    if (!goal) return 0;
    const p = Math.round((goal.currentAmount / goal.targetAmount) * 100);
    return isFinite(p) ? p : 0;
  }, [goal]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* 目標（Missionの現在の目標と同レイアウト） */}
      <FadeInUp distance={20}>
        <View style={styles.goalSection}>
          <View style={[styles.leftStripe, { backgroundColor: '#FFD166' }]} />
          <View style={styles.titleRow}>
            <Image source={require('../icons/flag.png')} style={styles.titleIcon} />
            <View style={styles.titleTextWrap}>
              <Text style={[styles.title, styles.headerTight]}>現在の目標</Text>
            </View>
          </View>
          <Text style={styles.goalName}>{goal?.title || '未設定'}</Text>
          <Text style={styles.sub}>目標額: {goal ? goal.targetAmount.toLocaleString() : 0} 円</Text>
          <Text style={styles.sub}>目標達成まであと: <Text style={styles.remainingBig}>{remainingToTarget.toLocaleString()}</Text> 円</Text>
          <View style={styles.barBg}>
            <View style={[styles.barFill, { width: `${goalPercent}%` }]} />
          </View>
          <Text style={styles.sub}>{goalPercent}% 達成</Text>
        </View>
      </FadeInUp>

      <FadeInUp delay={60} distance={20}>
        <View style={[styles.section, styles.stack]}> 
        <View style={[styles.badge, { backgroundColor: '#F3F2F7' }]}> 
          <View style={[styles.leftStripe, { backgroundColor: '#FF6B9A' }]} />
          <View style={styles.rowAlignCenter}>
            <Image source={require('../icons/wallet.png')} style={styles.titleIcon} />
            <Text style={styles.badgeTitleLight}>今月の出費</Text>
          </View>
          <Text style={styles.badgeValueLarge}>
            <Text style={styles.valueSpendingNumber}>{thisMonthSpending.toLocaleString()}</Text>
            <Text style={styles.badgeUnit}> 円</Text>
          </Text>
        </View>
        <View style={[styles.badge, { backgroundColor: '#F3F2F7' }]}> 
          <View style={[styles.leftStripe, { backgroundColor: '#66A6FF' }]} />
          <View style={styles.rowAlignCenter}>
            <Image source={require('../icons/money3.png')} style={styles.titleIcon} />
            <Text style={styles.badgeTitleLight}>今月の予算あと</Text>
          </View>
          <Text style={styles.badgeValueLarge}>
            <Text style={styles.valueBudgetNumber}>{thisMonthBudgetLeft.toLocaleString()}</Text>
            <Text style={styles.badgeUnit}> 円</Text>
          </Text>
        </View>
        </View>
      </FadeInUp>

      <FadeInUp delay={120} distance={20}>
        <View style={[styles.section, styles.stack, { marginTop: spacing.sm }]}> 
        <View style={[styles.miniBadge, { backgroundColor: '#F3F2F7', borderColor: '#F4A261', borderWidth: 1 }]}> 
          <View style={[styles.leftStripe, { backgroundColor: '#F4A261' }]} />
          <View style={styles.rowAlignCenter}>
            <Image source={require('../icons/food.png')} style={styles.titleIcon} />
            <Text style={styles.miniTitle}>今週の外食回数</Text>
          </View>
          <Text style={[styles.miniValue, { color: '#FF7F00' }]}>{eatingOut.count} <Text style={styles.badgeUnit}>回</Text></Text>
        </View>
        <View style={[styles.miniBadge, { backgroundColor: '#F3F2F7' }]}> 
          <View style={[styles.leftStripe, { backgroundColor: '#81E6D9' }]} />
          <View style={styles.rowAlignCenter}>
            <Image source={require('../icons/shop.png')} style={styles.titleIcon} />
            <Text style={styles.miniTitle}>今週のコンビニ利用</Text>
          </View>
          <Text style={[styles.miniValue, { color: '#0DFF00' }]}>{convenienceCount} <Text style={styles.badgeUnit}>回</Text></Text>
        </View>
        <View style={[styles.miniBadge, { backgroundColor: '#F3F2F7', borderColor: '#A29BFE', borderWidth: 1 }]}> 
          <View style={[styles.leftStripe, { backgroundColor: '#A29BFE' }]} />
          <View style={styles.rowAlignCenter}>
            <Image source={require('../icons/money5.png')} style={styles.titleIcon} />
            <Text style={styles.miniTitle}>今月の食費</Text>
          </View>
          <Text style={[styles.miniValue, { color: '#000' }]}>{foodMonthTotal.toLocaleString()} <Text style={styles.badgeUnit}>円</Text></Text>
        </View>
        <View style={[styles.miniBadge, { backgroundColor: '#F3F2F7' }]}> 
          <View style={[styles.leftStripe, { backgroundColor: '#66D0FF' }]} />
          <View style={styles.rowAlignCenter}>
            <Image source={require('../icons/food3.png')} style={styles.titleIcon} />
            <Text style={styles.miniTitle}>今週の夕食自炊回数</Text>
          </View>
          <Text style={[styles.miniValue, { color: '#000' }]}>{dinnerCookCount} <Text style={styles.badgeUnit}>回</Text></Text>
          <TouchableOpacity style={[styles.moreBtn, { backgroundColor: '#66D0FF' }]} onPress={async () => {
            const uid = getFirebaseAuth().currentUser?.uid;
            if (!uid) return;
            const profile = await getUserProfile(uid);
            const householdId = (profile && (profile['householdId'] as string)) || '';
            if (!householdId) return;
            const today = new Date();
            const dateKey = today.toISOString().slice(0,10);
            // 楽観的更新（同日二重加算を防止）
            setDinnerDaysThisWeek((prev) => {
              if (prev.includes(dateKey)) return prev;
              const next = [...prev, dateKey];
              setDinnerCookCount(next.length);
              return next;
            });
            await upsertCookingEvent({ householdId, weekStart, date: dateKey, kind: 'dinner', userId: uid });
          }}>
            <Text style={styles.moreBtnText}>夕食自炊した</Text>
          </TouchableOpacity>
        </View>
        <View style={[styles.miniBadge, { backgroundColor: '#F3F2F7' }]}> 
          <View style={[styles.leftStripe, { backgroundColor: '#E7A0E2' }]} />
          <View style={styles.rowAlignCenter}>
            <Image source={require('../icons/food4.png')} style={styles.titleIcon} />
            <Text style={styles.miniTitle}>今週の昼食自炊・弁当回数</Text>
          </View>
          <Text style={[styles.miniValue, { color: '#000' }]}>{lunchCookCount} <Text style={styles.badgeUnit}>回</Text></Text>
          <TouchableOpacity style={[styles.moreBtn, { backgroundColor: '#FFA8A8' }]} onPress={async () => {
            const uid = getFirebaseAuth().currentUser?.uid;
            if (!uid) return;
            const profile = await getUserProfile(uid);
            const householdId = (profile && (profile['householdId'] as string)) || '';
            if (!householdId) return;
            const today = new Date();
            const dateKey = today.toISOString().slice(0,10);
            // 楽観的更新（同日二重加算を防止）
            setLunchDaysThisWeek((prev) => {
              if (prev.includes(dateKey)) return prev;
              const next = [...prev, dateKey];
              setLunchCookCount(next.length);
              return next;
            });
            await upsertCookingEvent({ householdId, weekStart, date: dateKey, kind: 'lunch', userId: uid });
          }}>
            <Text style={styles.moreBtnText}>昼食自炊した</Text>
          </TouchableOpacity>
        </View>
        </View>
      </FadeInUp>

      <FadeInUp delay={180} distance={20}>
        <View style={[styles.section, { marginTop: spacing.md, width: '100%' }]}> 
          <PlaceholderChart
            type="pie"
            title="今月の支出内訳"
            titleIcon={require('../icons/data5.png')}
            height={220}
            data={pie.length ? pie : [{ key: 'なし', value: 1, color: '#444' }]}
          />
        </View>
      </FadeInUp>

      

      <TouchableOpacity style={styles.cta} activeOpacity={0.8} onPress={() => navigation.navigate('Input')}>
        <Text style={styles.ctaText}>出費記録する</Text>
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
  stack: { flexDirection: 'column', gap: 12, width: '100%' },
  rowAlignCenter: { flexDirection: 'row', alignItems: 'flex-end', gap: 0, height: 18 },
  goalSection: { backgroundColor: '#F3F2F7', borderRadius: 12, padding: spacing.md, paddingLeft: 24, marginTop: spacing.lg, borderWidth: 1, borderColor: '#FFD166', shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.16, shadowRadius: 12, elevation: 6, position: 'relative' },
  title: { color: colors.text, fontSize: 16, marginBottom: spacing.sm, fontWeight: '700' },
  headerTight: { marginBottom: 0, fontSize: 14, lineHeight: 18 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-end', height: 18 },
  titleTextWrap: { justifyContent: 'flex-end', height: 18 },
  goalName: { color: '#FFB202', fontSize: 20, fontWeight: '700', marginBottom: 0 },
  barBg: { height: 10, backgroundColor: '#EEE', borderRadius: 6, overflow: 'hidden' },
  barFill: { height: 10, backgroundColor: colors.positive },
  remainingBig: { fontSize: 14 * 1.2, fontWeight: '700', color: '#000' },
  badge: { width: '100%', borderRadius: 12, padding: spacing.md, paddingLeft: 24, marginBottom: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3, position: 'relative' },
  badgeTitleLight: { color: '#000', fontWeight: '700', marginBottom: 0, fontSize: 14, lineHeight: 14 },
  badgeValueLarge: { color: '#000', fontSize: 21, fontWeight: '700' },
  badgeUnit: { color: '#000', fontSize: 14, fontWeight: '700' },
  valueSpendingNumber: { color: '#FF0036' },
  valueBudgetNumber: { color: '#0076FF' },
  titleIcon: { width: 18, height: 18, marginRight: 0, borderRadius: 4 },
  miniBadge: { width: '100%', borderRadius: 12, padding: spacing.md, paddingLeft: 24, marginBottom: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3, position: 'relative' },
  leftStripe: { position: 'absolute', left: 8, top: 10, bottom: 10, width: 6, borderRadius: 4 },
  miniTitle: { color: '#000', fontWeight: '700', marginBottom: 0, fontSize: 14, lineHeight: 14 },
  miniValue: { color: '#000', fontSize: 18, fontWeight: '700' },
  moreBtn: { marginTop: spacing.sm, alignSelf: 'flex-start', backgroundColor: colors.positive, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  moreBtnText: { color: '#000', fontWeight: '700' },
  cta: { backgroundColor: colors.positive, paddingVertical: spacing.md, alignItems: 'center', borderRadius: 12, marginTop: spacing.lg },
  ctaText: { color: '#000', fontWeight: '700' },
});

export default HomeScreen;



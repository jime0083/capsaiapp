// このファイルは Cursor により生成された
// Goals: 現在の目標、履歴簡易リスト、ウィークリーアクション with CongratsEffect

import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, Alert, Image } from 'react-native';
import { colors, spacing } from '../styles/theme';
import CongratsEffect from '../components/CongratsEffect';
import FadeInUp from '../components/FadeInUp';
import { getFirebaseAuth } from '../lib/firebase';
import { getUserProfile, getCarryOverHistory, getWeekStart, subscribeLatestGoal, subscribeUserTransactionsUnion, subscribeWeeklySelections, upsertWeeklySelection } from '../lib/firestoreApi';
import { categoryColors } from '../mock/sampleData';

const GoalsScreen: React.FC = () => {
  const [showCongrats, setShowCongrats] = useState(false);
  const [showMoreCarry, setShowMoreCarry] = useState(false);
  const [goal, setGoal] = useState<{ title: string; targetAmount: number; currentAmount: number; monthlyIncome: number } | null>(null);
  const [carryLatest5, setCarryLatest5] = useState<{ month: string; amount: number }[]>([]);
  const [carryAll, setCarryAll] = useState<{ month: string; amount: number }[]>([]);
  const [myWeekly, setMyWeekly] = useState<string | null>(null);
  const [partnerWeekly, setPartnerWeekly] = useState<string | null>(null);
  const [showWeeklyPicker, setShowWeeklyPicker] = useState(false);
  const [selectedWeeklyId, setSelectedWeeklyId] = useState<string | null>(null);

  useEffect(() => {
    let unsubGoal: (() => void) | null = null;
    let unsubWeekly: (() => void) | null = null;

    (async () => {
      const uid = getFirebaseAuth().currentUser?.uid;
      if (!uid) return;
      const profile = await getUserProfile(uid);
      const householdId = (profile && (profile['householdId'] as string)) || null;
      const pairUserIds: string[] = (profile && (profile['pairUserIds'] as string[])) || [];
      const allowedUserIds = [uid, ...pairUserIds];
      if (!householdId) return;

      unsubGoal = subscribeLatestGoal(householdId, (g) => {
        if (!g) { setGoal(null); return; }
        setGoal({
          title: g.title,
          targetAmount: g.targetAmount,
          currentAmount: g.currentAmount,
          monthlyIncome: Number(g.monthlyIncome || 0),
        });
      });

      // キャリーオーバー: ユーザーの利用開始以降のみ表示
      const all = await getCarryOverHistory(householdId, allowedUserIds, 24);
      // createdAt から 'YYYY-MM' を作成
      const createdAt = (profile && (profile['createdAt'] as any)) || null;
      const toMonthString = (value: any): string | null => {
        try {
          if (!value) return null;
          if (typeof value === 'string') {
            const s = value.replace(/\//g, '-');
            if (/^\d{4}-\d{2}$/.test(s)) return s;
            if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s.slice(0, 7);
            const d = new Date(s);
            if (!isNaN(d.getTime())) return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            return null;
          }
          if (typeof value === 'number') {
            const d = new Date(value);
            if (!isNaN(d.getTime())) return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            return null;
          }
          if (value && typeof value.seconds === 'number') {
            const d = new Date(value.seconds * 1000);
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          }
          return null;
        } catch { return null; }
      };
      const startMonth = toMonthString(createdAt);
      const filtered = startMonth ? all.filter((c) => c.month >= startMonth) : all;
      setCarryAll(filtered);
      setCarryLatest5(filtered.slice(0, 5));

      // 今週のウィークリーアクション購読（週開始をキーに）
      const weekStart = getWeekStart(new Date());
      unsubWeekly = subscribeWeeklySelections(householdId, weekStart, allowedUserIds, (items) => {
        const me = items.find(i => i.userId === uid) || null;
        const partner = items.find(i => i.userId !== uid) || null;
        setMyWeekly(me ? me.selectedActionId : null);
        setPartnerWeekly(partner ? partner.selectedActionId : null);
        // ここで決定: 自分の今週のアクションが未設定のときだけ表示
        setShowWeeklyPicker(!me);
      });
    })();

    return () => { if (unsubGoal) unsubGoal(); if (unsubWeekly) unsubWeekly(); };
  }, []);

  const percent = useMemo(() => {
    if (!goal) return 0;
    const p = Math.round((goal.currentAmount / goal.targetAmount) * 100);
    return isFinite(p) ? p : 0;
  }, [goal]);

  const carrySumUntilPrev = useMemo(() => {
    // 直近分が最新月なので、前月までを合算
    if (!carryAll.length) return 0;
    // carryAll[0] が先月、[1] が先々月... の形
    return carryAll.reduce((acc, cur) => acc + (Number(cur.amount) || 0), 0);
  }, [carryAll]);

  const remainingAfterCarry = useMemo(() => {
    if (!goal) return 0;
    const raw = goal.targetAmount - goal.currentAmount - carrySumUntilPrev;
    return Math.max(raw, 0);
  }, [goal, carrySumUntilPrev]);

  const actionLabel = (id: string | null) => {
    switch (id) {
      case 'limit_convenience_2': return 'コンビニ利用を2回までにする';
      case 'limit_diningout_1': return '外食を1回までにする';
      case 'food_under_3000': return '食費を3000円までに抑える';
      default: return 'ウィークリーアクション未設定';
    }
  };

  const saveWeeklyAction = async (selectedId: string) => {
    const uid = getFirebaseAuth().currentUser?.uid;
    if (!uid) return;
    const profile = await getUserProfile(uid);
    const householdId = (profile && (profile['householdId'] as string)) || null;
    if (!householdId) return;
    try {
      await upsertWeeklySelection({ householdId, userId: uid, weekStart: getWeekStart(new Date()), selectedActionId: selectedId });
      setShowWeeklyPicker(false);
      Alert.alert('保存しました', '今週のウィークリーアクションを設定しました。');
    } catch (e) {
      Alert.alert('保存に失敗しました', String(e));
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <FadeInUp delay={0} distance={20}>
        <View style={styles.goalSection}>
          <View style={[styles.leftStripe, { backgroundColor: '#F3E9DF' }]} />
          <View style={styles.titleRow}>
            <Image source={require('../icons/flag.png')} style={styles.titleIcon} />
            <View style={styles.titleTextWrap}>
              <Text style={[styles.title, styles.headerTight]}>現在の目標</Text>
            </View>
          </View>
          <Text style={styles.goalName}>{goal?.title || '未設定'}</Text>
          <Text style={styles.sub}>目標額: {goal ? goal.targetAmount.toLocaleString() : 0} 円</Text>
          <Text style={styles.sub}>目標達成まであと: <Text style={styles.remainingBig}>{remainingAfterCarry.toLocaleString()}</Text> 円</Text>
          <View style={styles.barBg}>
            <View style={[styles.barFill, { width: `${percent}%` }]} />
          </View>
          <Text style={styles.sub}>{percent}% 達成</Text>
        </View>
        </FadeInUp>

        <FadeInUp delay={60} distance={20}>
        <View style={styles.sectionCarry}>
          <View style={[styles.leftStripe, { backgroundColor: '#DFEEE7' }]} />
          <View style={styles.titleRow}>
            <Image source={require('../icons/money6.png')} style={styles.titleIcon} />
            <View style={styles.titleTextWrap}>
              <Text style={[styles.title, styles.headerTight]}>積み上げ履歴</Text>
            </View>
          </View>
          <View>
            {carryLatest5.length === 0 ? (
              <Text style={styles.sub}>まだ表示するデータがありません</Text>
            ) : (
              carryLatest5.map((c) => (
                <Text key={c.month} style={styles.sub}>{`${c.month}: ${c.amount.toLocaleString()} 円`}</Text>
              ))
            )}
            <TouchableOpacity style={styles.moreBtn} onPress={() => setShowMoreCarry(true)}>
              <Text style={styles.moreBtnText}>もっと見る</Text>
            </TouchableOpacity>
          </View>
        </View>
        </FadeInUp>

        {/* ウィークリーアクション（タイトル・グレー背景なし） */}
        <FadeInUp delay={120} distance={20}>
          <View style={styles.cardSelf}>
            <View style={[styles.leftStripe, { backgroundColor: '#F3E0E4' }]} />
            <View style={styles.titleRow}>
              <Image source={require('../icons/run.png')} style={styles.titleIcon} />
              <View style={styles.titleTextWrap}>
                <Text style={[styles.name, { fontWeight: '700' }, styles.headerTight]}>自分のアクション</Text>
              </View>
            </View>
            <Text style={styles.sub}>{actionLabel(myWeekly)}</Text>
            {!myWeekly && (
              <TouchableOpacity style={[styles.primary, { backgroundColor: '#FFA8A8' }]} onPress={() => setShowWeeklyPicker(true)}>
                <Text style={styles.primaryText}>ウィークリーアクションを設定</Text>
              </TouchableOpacity>
            )}
        </View>
        </FadeInUp>

        <FadeInUp delay={180} distance={20}>
        <View style={styles.cardAction}>
          <View style={[styles.leftStripe, { backgroundColor: '#DDE9F7' }]} />
          <View style={styles.titleRow}>
            <Image source={require('../icons/run2.png')} style={styles.titleIcon} />
            <View style={styles.titleTextWrap}>
              <Text style={[styles.name, { fontWeight: '700' }, styles.headerTight]}>パートナーのアクション</Text>
            </View>
          </View>
          <Text style={styles.sub}>{actionLabel(partnerWeekly)}</Text>
        </View>
        </FadeInUp>
        <View style={{ height: 24 }} />
      </ScrollView>
      {/* キャリーオーバー履歴モーダル */}
      <Modal visible={showMoreCarry} transparent animationType="fade" onRequestClose={() => setShowMoreCarry(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.title}>過去のキャリーオーバー</Text>
            <ScrollView style={{ maxHeight: 320 }}>
              {carryAll.length === 0 ? (
                <Text style={styles.sub}>まだ表示するデータがありません</Text>
              ) : (
                carryAll.map((c) => (
                  <Text key={`all-${c.month}`} style={styles.sub}>{`${c.month}: ${c.amount.toLocaleString()} 円`}</Text>
                ))
              )}
            </ScrollView>
            <TouchableOpacity style={[styles.primary, { marginTop: spacing.md }]} onPress={() => setShowMoreCarry(false)}>
              <Text style={styles.primaryText}>閉じる</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* ウィークリーアクション設定モーダル（共通） */}
      <Modal visible={showWeeklyPicker} transparent animationType="fade" onRequestClose={() => setShowWeeklyPicker(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.title}>今週のウィークリーアクションを設定</Text>
            <TouchableOpacity
              style={[styles.actionPick, selectedWeeklyId === 'limit_convenience_2' && styles.actionPickSelected]}
              onPress={() => setSelectedWeeklyId('limit_convenience_2')}
            >
              <Text style={[styles.actionPickText, selectedWeeklyId === 'limit_convenience_2' && styles.actionPickTextSelected]}>コンビニ利用を2回までにする</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionPick, selectedWeeklyId === 'limit_diningout_1' && styles.actionPickSelected]}
              onPress={() => setSelectedWeeklyId('limit_diningout_1')}
            >
              <Text style={[styles.actionPickText, selectedWeeklyId === 'limit_diningout_1' && styles.actionPickTextSelected]}>外食を1回までにする</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionPick, selectedWeeklyId === 'food_under_3000' && styles.actionPickSelected]}
              onPress={() => setSelectedWeeklyId('food_under_3000')}
            >
              <Text style={[styles.actionPickText, selectedWeeklyId === 'food_under_3000' && styles.actionPickTextSelected]}>食費を3000円までに抑える</Text>
            </TouchableOpacity>
            <View style={styles.btnRow}> 
              <TouchableOpacity style={[styles.secondary, { flex: 1 }]} onPress={() => setShowWeeklyPicker(false)}>
                <Text style={styles.secondaryText}>閉じる</Text>
              </TouchableOpacity>
              <View style={{ width: 12 }} />
              <TouchableOpacity
                style={[styles.primary, { flex: 1, opacity: selectedWeeklyId ? 1 : 0.5 }]}
                disabled={!selectedWeeklyId}
                onPress={() => selectedWeeklyId && saveWeeklyAction(selectedWeeklyId)}
              >
                <Text style={styles.primaryText}>設定</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <CongratsEffect visible={showCongrats} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg },
  title: { color: colors.text, fontSize: 16, marginBottom: spacing.sm, fontWeight: '700' },
  headerTight: { marginBottom: 0, fontSize: 14, lineHeight: 18 },
  goalName: { color: '#FFB202', fontSize: 20, fontWeight: '700', marginBottom: 0 },
  card: { backgroundColor: colors.card, padding: spacing.md, borderRadius: 12, marginBottom: spacing.md, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.16, shadowRadius: 12, elevation: 6 },
  cardPrimary: { backgroundColor: colors.card, padding: spacing.md, borderRadius: 12, marginBottom: spacing.md, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.16, shadowRadius: 12, elevation: 6 },
  goalSection: { backgroundColor: '#F3F2F7', borderRadius: 12, padding: spacing.md, paddingLeft: 24, marginBottom: spacing.md, borderWidth: 1, borderColor: '#E5E5EA', shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.16, shadowRadius: 12, elevation: 6, position: 'relative' },
  sectionGray: { backgroundColor: '#F3F2F7', borderRadius: 12, padding: spacing.md, paddingLeft: 24, marginBottom: spacing.md, borderWidth: 1, borderColor: '#E5E5EA', shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.16, shadowRadius: 12, elevation: 6, position: 'relative' },
  sectionCarry: { backgroundColor: '#F3F2F7', borderRadius: 12, padding: spacing.md, paddingLeft: 24, marginBottom: spacing.md, borderWidth: 1, borderColor: '#CFE2DB', shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.12, shadowRadius: 10, elevation: 5, position: 'relative' },
  cardAction: { backgroundColor: '#F3F2F7', padding: spacing.md, paddingLeft: 24, borderRadius: 12, marginBottom: spacing.md, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.16, shadowRadius: 12, elevation: 6, position: 'relative' },
  cardSelf: { backgroundColor: '#F3F2F7', padding: spacing.md, paddingLeft: 24, borderRadius: 12, marginBottom: spacing.md, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.16, shadowRadius: 12, elevation: 6, position: 'relative' },
  name: { color: '#000', fontSize: 16, marginBottom: spacing.sm },
  barBg: { height: 10, backgroundColor: '#EEE', borderRadius: 6, overflow: 'hidden' },
  barFill: { height: 10, backgroundColor: colors.positive },
  sub: { color: '#000', marginTop: spacing.xs },
  row: { flexDirection: 'row', gap: 12 },
  action: { flex: 1, backgroundColor: colors.card, padding: spacing.md, borderRadius: 12, alignItems: 'center' },
  actionText: { color: colors.text },
  remainingBig: { fontSize: 14 * 1.2, fontWeight: '700', color: '#000' },
  titleRow: { flexDirection: 'row', alignItems: 'flex-end', height: 18 },
  titleTextWrap: { justifyContent: 'flex-end', height: 18 },
  titleIcon: { width: 18, height: 18, marginRight: 0, borderRadius: 4 },
  leftStripe: { position: 'absolute', left: 8, top: 10, bottom: 10, width: 6, borderRadius: 4 },
  moreBtn: { marginTop: spacing.sm, alignSelf: 'flex-start', backgroundColor: colors.positive, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  moreBtnText: { color: '#000', fontWeight: '700' },
  primary: { backgroundColor: colors.positive, paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: 10, alignItems: 'center', alignSelf: 'flex-start' },
  primaryText: { color: '#000', fontWeight: '700' },
  secondary: { backgroundColor: '#EEE', paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: 10, alignItems: 'center', alignSelf: 'flex-start' },
  secondaryText: { color: '#000', fontWeight: '700' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  modalCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: spacing.lg, width: '90%', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  actionPick: { backgroundColor: '#F3F3F3', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, marginTop: 8 },
  actionPickSelected: { backgroundColor: '#E7FFE7', borderWidth: 1, borderColor: colors.positive },
  actionPickText: { color: '#000' },
  actionPickTextSelected: { color: '#000', fontWeight: '700' },
  btnRow: { flexDirection: 'row', marginTop: spacing.md, alignItems: 'center' },
});

export default GoalsScreen;



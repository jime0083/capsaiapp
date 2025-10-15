// このファイルは Cursor により生成された
// MyPage: ユーザー名、種別、使用日数、バッジ一覧（ダミー）

import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, Modal, TextInput } from 'react-native';
import { colors, spacing } from '../styles/theme';
import { getFirebaseAuth } from '../lib/firebase';
import { getUserProfile, getLatestGoal, getBadges, updateUserDisplayName, updateGoalTitle, updateGoalPlan, cancelSubscription } from '../lib/firestoreApi';

const MyPageScreen: React.FC = () => {
  const [displayName, setDisplayName] = useState<string>('');
  const [isOwner, setIsOwner] = useState<boolean>(false);
  const [startedAt, setStartedAt] = useState<Date | null>(null);
  const [pairUsers, setPairUsers] = useState<string[]>([]);
  const [goalId, setGoalId] = useState<string | null>(null);
  const [goalTitle, setGoalTitle] = useState<string>('');
  const [badges, setBadges] = useState<{ id: string; name: string; awardedAt: number }[]>([]);
  const [showEdit, setShowEdit] = useState(false);
  const [showSubs, setShowSubs] = useState(false);
  const [targetAmount, setTargetAmount] = useState<string>('');
  const [months, setMonths] = useState<string>('');

  useEffect(() => {
    (async () => {
      const uid = getFirebaseAuth().currentUser?.uid;
      if (!uid) return;
      const profile = await getUserProfile(uid);
      if (profile) {
        setDisplayName(String(profile['displayName'] || 'No Name'));
        setIsOwner(!!profile['isOwner']);
        const created = profile['createdAt'];
        if (created && typeof created === 'object' && 'seconds' in created) {
          setStartedAt(new Date((created as any).seconds * 1000));
        } else if (typeof created === 'number') {
          setStartedAt(new Date(created));
        } else {
          setStartedAt(new Date());
        }
        const pairIds: string[] = (profile['pairUserIds'] as string[]) || [];
        setPairUsers(pairIds);
        const householdId = (profile['householdId'] as string) || '';
        if (householdId) {
          const g = await getLatestGoal(householdId);
          if (g) { 
            setGoalId(g.id); 
            setGoalTitle(g.title);
            if (g.targetAmount) setTargetAmount(String(g.targetAmount));
            if (g.durationMonths) setMonths(String(g.durationMonths));
          }
          const bs = await getBadges(householdId);
          setBadges(bs.map(b => ({ id: b.id, name: b.name, awardedAt: b.awardedAt })));
        }
      }
    })();
  }, []);

  const days = useMemo(() => startedAt ? Math.floor((Date.now() - startedAt.getTime()) / (1000 * 60 * 60 * 24)) : 0, [startedAt]);
  const userTypeLabel = isOwner ? 'メインユーザー' : 'ペアユーザー';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* 上部情報カード */}
      <View style={styles.headerCard}>
        <Text style={styles.name}>{displayName}</Text>
        <Text style={styles.sub}>ユーザー識別: {userTypeLabel}</Text>
        <Text style={styles.sub}>使用日数: {days} 日</Text>
        <Text style={styles.sub}>ペアユーザー: {pairUsers.length ? `${pairUsers.length}人` : '未設定'}</Text>
      </View>

      {/* バッジセクション */}
      <View style={styles.sectionGray}>
        <Text style={styles.title}>獲得バッジ</Text>
        <View style={{ gap: 8 }}>
          {badges.length === 0 ? (
            <Text style={styles.sub}>まだバッジがありません</Text>
          ) : badges.map((b) => (
            <Text key={b.id} style={styles.sub}>🏅 {b.name}</Text>
          ))}
        </View>
      </View>

      {/* アクションボタン */}
      <View style={styles.row}>
        <TouchableOpacity style={styles.btn} onPress={() => setShowEdit(true)}>
          <Text style={styles.btnText}>プロフィール編集</Text>
        </TouchableOpacity>
        {isOwner ? (
          <TouchableOpacity style={styles.btn} onPress={() => setShowSubs(true)}>
            <Text style={styles.btnText}>サブスク管理</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      <View style={{ height: 24 }} />

      {/* プロフィール編集モーダル */}
      <Modal visible={showEdit} transparent animationType="fade" onRequestClose={() => setShowEdit(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.title}>プロフィール編集</Text>
            <Text style={styles.sub}>ユーザー名</Text>
            <TextInput style={styles.input} value={displayName} onChangeText={setDisplayName} />
            <Text style={[styles.sub, { marginTop: 12 }]}>目標</Text>
            <TextInput style={styles.input} value={goalTitle} onChangeText={setGoalTitle} />
            <Text style={[styles.sub, { marginTop: 12 }]}>目標金額（円）</Text>
            <TextInput style={styles.input} value={targetAmount} onChangeText={setTargetAmount} keyboardType="numeric" />
            <Text style={[styles.sub, { marginTop: 12 }]}>目標期間（ヶ月）</Text>
            <TextInput style={styles.input} value={months} onChangeText={setMonths} keyboardType="numeric" />
            <View style={styles.row}>
              <TouchableOpacity style={[styles.secondary, { flex: 1 }]} onPress={() => setShowEdit(false)}>
                <Text style={styles.secondaryText}>閉じる</Text>
              </TouchableOpacity>
              <View style={{ width: 12 }} />
              <TouchableOpacity
                style={[styles.primary, { flex: 1 }]} onPress={async () => {
                  try {
                    const uid = getFirebaseAuth().currentUser?.uid;
                    if (uid) await updateUserDisplayName(uid, displayName);
                    if (goalId) await updateGoalTitle(goalId, goalTitle);
                    if (goalId) {
                      const t = Number(targetAmount);
                      const m = Number(months);
                      if (t && m) await updateGoalPlan(goalId, t, m);
                    }
                    setShowEdit(false);
                    Alert.alert('保存しました');
                  } catch (e) { Alert.alert('保存に失敗しました', String(e)); }
                }}
              >
                <Text style={styles.primaryText}>保存</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* サブスク管理モーダル（オーナーのみ） */}
      <Modal visible={showSubs} transparent animationType="fade" onRequestClose={() => setShowSubs(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.title}>現在加入しているサブスクリプション</Text>
            <Text style={styles.sub}>プラン: メインユーザー（月額）</Text>
            <View style={{ height: 8 }} />
            <TouchableOpacity
              style={[styles.primary, { backgroundColor: colors.negative }]}
              onPress={async () => {
                const uid = getFirebaseAuth().currentUser?.uid;
                if (!uid) return;
                const profile = await getUserProfile(uid);
                const householdId = (profile && (profile['householdId'] as string)) || '';
                await cancelSubscription(householdId);
                Alert.alert('解約手続きを開始しました');
              }}
            >
              <Text style={styles.primaryText}>サブスクリプションを解約する</Text>
            </TouchableOpacity>
            <View style={{ height: 8 }} />
            <TouchableOpacity style={styles.secondary} onPress={() => setShowSubs(false)}>
              <Text style={styles.secondaryText}>閉じる</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg },
  headerCard: { backgroundColor: '#F3F2F7', borderRadius: 12, padding: spacing.md, marginBottom: spacing.md, borderWidth: 1, borderColor: '#E5E5EA', shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.16, shadowRadius: 12, elevation: 6 },
  sectionGray: { backgroundColor: '#F3F2F7', borderRadius: 12, padding: spacing.md, marginBottom: spacing.md, borderWidth: 1, borderColor: '#E5E5EA', shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.16, shadowRadius: 12, elevation: 6 },
  name: { color: colors.text, fontSize: 18, fontWeight: '700' },
  sub: { color: '#000', marginTop: 4 },
  title: { color: colors.text, fontSize: 16, marginBottom: spacing.sm, fontWeight: '700' },
  row: { flexDirection: 'row', gap: 12, marginTop: spacing.md },
  btn: { flex: 1, backgroundColor: colors.positive, padding: spacing.md, borderRadius: 12, alignItems: 'center' },
  btnText: { color: '#000', fontWeight: '700' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  modalCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: spacing.lg, width: '90%', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  input: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#DDD', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, color: '#000', marginTop: 4 },
  primary: { backgroundColor: colors.positive, paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: 10, alignItems: 'center', alignSelf: 'flex-start' },
  primaryText: { color: '#000', fontWeight: '700' },
  secondary: { backgroundColor: '#EEE', paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: 10, alignItems: 'center', alignSelf: 'flex-start' },
  secondaryText: { color: '#000', fontWeight: '700' },
});

export default MyPageScreen;



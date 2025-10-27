// このファイルは Cursor により生成された
// MyPage: ユーザー名、種別、使用日数、バッジ一覧（ダミー）

import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, Modal, TextInput, Image } from 'react-native';
import { colors, spacing } from '../styles/theme';
import { getFirebaseAuth } from '../lib/firebase';
import { getUserProfile, getLatestGoal, getBadges, updateUserDisplayName, updateGoalTitle, updateGoalPlan, cancelSubscription, updateGoalDeadline, getCookingCounts, getWeeklyActionCompletedCount, countMonthsFoodUnder50k, countMonthsBudgetAchieved, getTotalSavedAmount, subscribeCookingTotals, subscribeCookingTotalsFromEvents } from '../lib/firestoreApi';
import FadeInUp from '../components/FadeInUp';
import { Picker } from '@react-native-picker/picker';
import { useIsFocused } from '@react-navigation/native';

// バッジ判定用閾値
const LUNCH_THRESHOLDS = [5, 10, 20, 50, 100];
const DINNER_THRESHOLDS = [5, 10, 20, 50, 100];
const WEEKLY_THRESHOLDS = [2, 5, 10, 30, 100];
const MONTHS_THRESHOLDS = [1, 3, 6, 12, 24]; // 月回数系（食費5万以下、予算達成）
const SAVED_THRESHOLDS = [10000, 30000, 50000, 100000, 300000]; // 通算節約（円）

// バッジ画像マッピング（require は静的に記述する必要がある）
const BADGE_SOURCES = {
  lunch: [
    require('../assets/badges/medal-blue1.png'),
    require('../assets/badges/medal-red1.png'),
    require('../assets/badges/medal-bronds1.png'),
    require('../assets/badges/medal-silver1.png'),
    require('../assets/badges/medal-gold1.png'),
  ],
  dinner: [
    require('../assets/badges/medal-blue2.png'),
    require('../assets/badges/medal-red2.png'),
    require('../assets/badges/medal-bronds2.png'),
    require('../assets/badges/medal-silver2.png'),
    require('../assets/badges/medal-gold2.png'),
  ],
  weekly: [
    require('../assets/badges/medal-blue3.png'),
    require('../assets/badges/medal-red3.png'),
    require('../assets/badges/medal-bronds3.png'),
    require('../assets/badges/medal-silver3.png'),
    require('../assets/badges/medal-gold3.png'),
  ],
  monthsUnder50k: [
    require('../assets/badges/medal-blue5.png'),
    require('../assets/badges/medal-red5.png'),
    require('../assets/badges/medal-bronds5.png'),
    require('../assets/badges/medal-silver5.png'),
    require('../assets/badges/medal-gold5.png'),
  ],
  monthsBudgetAchieved: [
    require('../assets/badges/medal-blue4.png'),
    require('../assets/badges/medal-red4.png'),
    require('../assets/badges/medal-bronds4.png'),
    require('../assets/badges/medal-silver4.png'),
    require('../assets/badges/medal-gold4.png'),
  ],
  totalSaved: [
    require('../assets/badges/medal-blue6.png'),
    require('../assets/badges/medal-red6.png'),
    require('../assets/badges/medal-bronds6.png'),
    require('../assets/badges/medal-silver6.png'),
    require('../assets/badges/medal-gold6.png'),
  ],
} as const;

// 下限/上限専用の白/黒メダル
const WHITE_SOURCES = {
  lunch: require('../assets/badges/medal-white.png'),
  dinner: require('../assets/badges/medal-white2.png'),
  weekly: require('../assets/badges/medal-white3.png'),
  monthsBudgetAchieved: require('../assets/badges/medal-white4.png'),
  monthsUnder50k: require('../assets/badges/medal-white5.png'),
  totalSaved: require('../assets/badges/medal-white6.png'),
} as const;

const BLACK_SOURCES = {
  lunch: require('../assets/badges/medal-black.png'),
  dinner: require('../assets/badges/medal-black3.png'),
  weekly: require('../assets/badges/medal-black3.png'),
  monthsBudgetAchieved: require('../assets/badges/medal-black4.png'),
  monthsUnder50k: require('../assets/badges/medal-black5.png'),
  totalSaved: require('../assets/badges/medal-black6.png'),
} as const;

type BadgeKind = 'lunch' | 'dinner' | 'weekly' | 'monthsUnder50k' | 'monthsBudgetAchieved' | 'totalSaved';

function getAchievedLevelIndex(count: number, thresholds: number[]): number {
  let idx = -1;
  for (let i = 0; i < thresholds.length; i++) {
    if (count > thresholds[i]) idx = i;
  }
  return idx; // -1 の場合は未獲得
}

function getThresholds(kind: BadgeKind): number[] {
  if (kind === 'lunch') return LUNCH_THRESHOLDS;
  if (kind === 'dinner') return DINNER_THRESHOLDS;
  if (kind === 'weekly') return WEEKLY_THRESHOLDS;
  if (kind === 'monthsUnder50k' || kind === 'monthsBudgetAchieved') return MONTHS_THRESHOLDS;
  if (kind === 'totalSaved') return SAVED_THRESHOLDS;
  return [];
}

function getBadgeImage(kind: BadgeKind, count: number) {
  const thresholds = getThresholds(kind);
  // 下限: 白メダル
  if (kind === 'lunch' && count < 5) return WHITE_SOURCES.lunch;
  if (kind === 'dinner' && count < 5) return WHITE_SOURCES.dinner;
  if (kind === 'weekly' && count <= 2) return WHITE_SOURCES.weekly;
  if (kind === 'monthsUnder50k' && count < 1) return WHITE_SOURCES.monthsUnder50k;
  if (kind === 'monthsBudgetAchieved' && count < 1) return WHITE_SOURCES.monthsBudgetAchieved;
  if (kind === 'totalSaved' && count < 10000) return WHITE_SOURCES.totalSaved;

  // 上限: 黒メダル
  if (kind === 'lunch' && count >= 300) return BLACK_SOURCES.lunch;
  if (kind === 'dinner' && count >= 300) return BLACK_SOURCES.dinner;
  if (kind === 'weekly' && count > 200) return BLACK_SOURCES.weekly;
  if (kind === 'monthsUnder50k' && count >= 50) return BLACK_SOURCES.monthsUnder50k;
  if (kind === 'monthsBudgetAchieved' && count >= 50) return BLACK_SOURCES.monthsBudgetAchieved;
  if (kind === 'totalSaved' && count >= 1000000) return BLACK_SOURCES.totalSaved;

  const level = getAchievedLevelIndex(count, thresholds);
  if (level < 0) return null;
  return BADGE_SOURCES[kind][level];
}

function renderProgressBar(kind: BadgeKind, count: number) {
  const thresholds = getThresholds(kind);
  const level = getAchievedLevelIndex(count, thresholds);
  const prevThreshold = level >= 0 ? thresholds[level] : 0;
  const nextThreshold = thresholds[level + 1];
  if (nextThreshold == null) {
    return (
      <View style={{ gap: 6 }}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: '100%' }]} />
        </View>
        <Text style={styles.progressText}>最高バッジ獲得済み</Text>
      </View>
    );
  }
  const progress = Math.max(0, Math.min(1, (count - prevThreshold) / (nextThreshold - prevThreshold)));
  const remain = Math.max(0, nextThreshold - count);
  return (
    <View style={{ gap: 6 }}>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
      </View>
      <Text style={styles.progressText}>次のバッジまで あと {remain} {kind === 'totalSaved' ? '円' : '回'}</Text>
    </View>
  );
}

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
  const [deadlineTs, setDeadlineTs] = useState<number | null>(null);
  const [showDeadlinePicker, setShowDeadlinePicker] = useState(false);
  const [pickYear, setPickYear] = useState<number>(new Date().getFullYear());
  const [pickMonth, setPickMonth] = useState<number>(new Date().getMonth() + 1);
  const [pickDay, setPickDay] = useState<number>(new Date().getDate());
  const [lunchCookTotal, setLunchCookTotal] = useState<number>(0);
  const [dinnerCookTotal, setDinnerCookTotal] = useState<number>(0);
  const [weeklyActionDoneTotal, setWeeklyActionDoneTotal] = useState<number>(0);
  const [monthsFoodUnder50k, setMonthsFoodUnder50k] = useState<number>(0);
  const [monthsBudgetAchieved, setMonthsBudgetAchieved] = useState<number>(0);
  const [totalSavedAmount, setTotalSavedAmount] = useState<number>(0);
  const isFocused = useIsFocused();

  useEffect(() => {
    let unsubscribeTotals: (() => void) | null = null;
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
            if (g.deadline) {
              setDeadlineTs(Number(g.deadline));
              const d = new Date(Number(g.deadline));
              setPickYear(d.getFullYear());
              setPickMonth(d.getMonth() + 1);
              setPickDay(d.getDate());
            }
          }
          const bs = await getBadges(householdId);
          setBadges(bs.map(b => ({ id: b.id, name: b.name, awardedAt: b.awardedAt })));
          // 累計カウント取得（自炊・ウィークリーアクション）
          // 初回は現在値を取得し、その後リアルタイム購読で反映
          const cook = await getCookingCounts(householdId);
          setLunchCookTotal(cook.lunchTotal);
          setDinnerCookTotal(cook.dinnerTotal);
          // counters を購読（優先）。万一 counters が未作成/遅延の環境でも events 集計をフォールバック購読
          unsubscribeTotals = subscribeCookingTotals(householdId, (totals) => {
            setLunchCookTotal(totals.lunchTotal);
            setDinnerCookTotal(totals.dinnerTotal);
          });
          const unsubscribeFallback = subscribeCookingTotalsFromEvents(householdId, (totals) => {
            // counters が 0 のまま、events は >0 のケースに備え、大きい方を採用
            setLunchCookTotal((prev) => Math.max(prev, totals.lunchTotal));
            setDinnerCookTotal((prev) => Math.max(prev, totals.dinnerTotal));
          });
          // 月次メトリクスも取得
          const wa = await getWeeklyActionCompletedCount(householdId);
          setWeeklyActionDoneTotal(wa);
          const underCount = await countMonthsFoodUnder50k(householdId);
          setMonthsFoodUnder50k(underCount);
          const budgetAchieved = await countMonthsBudgetAchieved(householdId);
          setMonthsBudgetAchieved(budgetAchieved);
          const savedTotal = await getTotalSavedAmount(householdId);
          setTotalSavedAmount(savedTotal);
        }
      }
    })();
    return () => { if (unsubscribeTotals) unsubscribeTotals(); };
  }, [isFocused]);

  const days = useMemo(() => startedAt ? Math.floor((Date.now() - startedAt.getTime()) / (1000 * 60 * 60 * 24)) : 0, [startedAt]);
  const userTypeLabel = isOwner ? 'メインユーザー' : 'ペアユーザー';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* バッジセクション（上部に配置） */}
      <FadeInUp delay={0} distance={20}>
        <View style={styles.sectionGray}>
          <Text style={styles.title}>獲得バッジ</Text>
          <View style={{ gap: 12 }}>
            {/* 昼食自炊回数 */}
            <View style={styles.badgeRow}>
              {getBadgeImage('lunch', lunchCookTotal) ? (
                <Image source={getBadgeImage('lunch', lunchCookTotal) as any} style={styles.badgeIcon} />
              ) : (
                <View style={[styles.badgeIcon, { backgroundColor: '#E5E5EA', borderRadius: 8 }]} />
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.sub}>昼食自炊回数: {lunchCookTotal} 回</Text>
                {renderProgressBar('lunch', lunchCookTotal)}
              </View>
            </View>
            {/* 夕食自炊回数 */}
            <View style={styles.badgeRow}>
              {getBadgeImage('dinner', dinnerCookTotal) ? (
                <Image source={getBadgeImage('dinner', dinnerCookTotal) as any} style={styles.badgeIcon} />
              ) : (
                <View style={[styles.badgeIcon, { backgroundColor: '#E5E5EA', borderRadius: 8 }]} />
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.sub}>夕食自炊回数: {dinnerCookTotal} 回</Text>
                {renderProgressBar('dinner', dinnerCookTotal)}
              </View>
            </View>
            {/* ウィークリーアクション達成回数 */}
            <View style={styles.badgeRow}>
              {getBadgeImage('weekly', weeklyActionDoneTotal) ? (
                <Image source={getBadgeImage('weekly', weeklyActionDoneTotal) as any} style={styles.badgeIcon} />
              ) : (
                <View style={[styles.badgeIcon, { backgroundColor: '#E5E5EA', borderRadius: 8 }]} />
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.sub}>ウィークリーアクション達成回数: {weeklyActionDoneTotal} 回</Text>
                {renderProgressBar('weekly', weeklyActionDoneTotal)}
              </View>
            </View>
            {/* 既存（Firestore保管のバッジ一覧） */}
            {badges.map((b) => (
              <Text key={b.id} style={styles.sub}>🏅 {b.name}</Text>
            ))}
            {/* 月の食費5万以下 回数 */}
            <View style={styles.badgeRow}>
              {getBadgeImage('monthsUnder50k', monthsFoodUnder50k) ? (
                <Image source={getBadgeImage('monthsUnder50k', monthsFoodUnder50k) as any} style={styles.badgeIcon} />
              ) : (
                <View style={[styles.badgeIcon, { backgroundColor: '#E5E5EA', borderRadius: 8 }]} />
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.sub}>月の食費5万以下: {monthsFoodUnder50k} 回</Text>
                {renderProgressBar('monthsUnder50k', monthsFoodUnder50k)}
              </View>
            </View>
            {/* 今月の予算達成 回数 */}
            <View style={styles.badgeRow}>
              {getBadgeImage('monthsBudgetAchieved', monthsBudgetAchieved) ? (
                <Image source={getBadgeImage('monthsBudgetAchieved', monthsBudgetAchieved) as any} style={styles.badgeIcon} />
              ) : (
                <View style={[styles.badgeIcon, { backgroundColor: '#E5E5EA', borderRadius: 8 }]} />
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.sub}>今月の予算達成回数: {monthsBudgetAchieved} 回</Text>
                {renderProgressBar('monthsBudgetAchieved', monthsBudgetAchieved)}
              </View>
            </View>
            {/* 通算節約 金額 */}
            <View style={styles.badgeRow}>
              {getBadgeImage('totalSaved', totalSavedAmount) ? (
                <Image source={getBadgeImage('totalSaved', totalSavedAmount) as any} style={styles.badgeIcon} />
              ) : (
                <View style={[styles.badgeIcon, { backgroundColor: '#E5E5EA', borderRadius: 8 }]} />
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.sub}>通算節約: {totalSavedAmount.toLocaleString()} 円</Text>
                {renderProgressBar('totalSaved', totalSavedAmount)}
              </View>
            </View>
          </View>
        </View>
      </FadeInUp>

      {/* ユーザー情報カード */}
      <FadeInUp delay={60} distance={20}>
        <View style={styles.headerCard}>
          <Text style={styles.title}>ユーザー情報</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={styles.sub}>ユーザー名:</Text>
            <Text style={styles.sub}>{displayName}</Text>
          </View>
          <Text style={styles.sub}>ユーザー識別: {userTypeLabel}</Text>
          <Text style={styles.sub}>使用日数: {days} 日</Text>
          <Text style={styles.sub}>ペアユーザー: {pairUsers.length ? `${pairUsers.length}人` : '未設定'}</Text>
        </View>
      </FadeInUp>

      {/* アクションボタン */}
      <FadeInUp delay={120} distance={20}>
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
      </FadeInUp>

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
            <Text style={[styles.sub, { marginTop: 12 }]}>目標期限（日付）</Text>
            <TouchableOpacity style={[styles.input, { justifyContent: 'center' }]} onPress={() => setShowDeadlinePicker(true)}>
              <Text style={{ color: '#000' }}>{deadlineTs ? new Date(deadlineTs).toISOString().slice(0,10) : '未設定 - タップで選択'}</Text>
            </TouchableOpacity>
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
                    if (goalId && deadlineTs) {
                      await updateGoalDeadline(goalId, deadlineTs);
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
      {/* 期限選択モーダル */}
      <Modal visible={showDeadlinePicker} transparent animationType="fade" onRequestClose={() => setShowDeadlinePicker(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.title}>目標期限を選択</Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1, backgroundColor: '#000', borderRadius: 8, overflow: 'hidden' }}>
                <Picker selectedValue={pickYear} onValueChange={(v) => setPickYear(Number(v))} dropdownIconColor="#fff">
                  {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i).map(y => (
                    <Picker.Item key={y} label={`${y}`} value={y} color="#fff" />
                  ))}
                </Picker>
              </View>
              <View style={{ flex: 1, backgroundColor: '#000', borderRadius: 8, overflow: 'hidden' }}>
                <Picker selectedValue={pickMonth} onValueChange={(v) => setPickMonth(Number(v))} dropdownIconColor="#fff">
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                    <Picker.Item key={m} label={`${m}`} value={m} color="#fff" />
                  ))}
                </Picker>
              </View>
              <View style={{ flex: 1, backgroundColor: '#000', borderRadius: 8, overflow: 'hidden' }}>
                <Picker selectedValue={pickDay} onValueChange={(v) => setPickDay(Number(v))} dropdownIconColor="#fff">
                  {Array.from({ length: new Date(pickYear, pickMonth, 0).getDate() }, (_, i) => i + 1).map(d => (
                    <Picker.Item key={d} label={`${d}`} value={d} color="#fff" />
                  ))}
                </Picker>
              </View>
            </View>
            <View style={styles.row}>
              <TouchableOpacity style={[styles.secondary, { flex: 1 }]} onPress={() => setShowDeadlinePicker(false)}>
                <Text style={styles.secondaryText}>閉じる</Text>
              </TouchableOpacity>
              <View style={{ width: 12 }} />
              <TouchableOpacity style={[styles.primary, { flex: 1 }]} onPress={() => {
                const dt = new Date(pickYear, pickMonth - 1, pickDay);
                // 月末にそろえる
                const last = new Date(dt.getFullYear(), dt.getMonth() + 1, 0);
                setDeadlineTs(last.getTime());
                setShowDeadlinePicker(false);
              }}>
                <Text style={styles.primaryText}>決定</Text>
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
  badgeRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  badgeIcon: { width: 48, height: 48 },
  progressBar: { height: 10, backgroundColor: '#E5E5EA', borderRadius: 6, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.positive },
  progressText: { color: '#000', marginTop: 2, fontSize: 12 },
});

export default MyPageScreen;



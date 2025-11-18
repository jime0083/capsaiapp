// このファイルは Cursor により生成された
// Firestore CRUD のラッパー（関数スタブ）

import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { GoogleAuthProvider, signInWithCredential, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc, updateDoc, collection, getDocs, query, where, limit, onSnapshot, orderBy, increment } from 'firebase/firestore';
import { getFirebaseAuth, getFirebaseFirestore } from './firebase';
import { User, Goal, Budget, Transaction, Timestamp, WeeklySelection, Badge } from '../types';

WebBrowser.maybeCompleteAuthSession();

function getGoogleClientId(): string {
  const extra = (Constants as any).expoConfig?.extra || (Constants as any).manifest?.extra;
  const g = extra?.googleAuth || {};
  if (g.expoClientId) return g.expoClientId;
  if (Platform.OS === 'ios') return g.iosClientId || '';
  if (Platform.OS === 'android') return g.androidClientId || '';
  return g.webClientId || '';
}

function toAppUser(u: FirebaseUser): User {
  return {
    uid: u.uid,
    displayName: u.displayName || 'No Name',
    email: u.email || '',
    isOwner: false,
    createdAt: Date.now(),
  };
}

function generateNonce(): string {
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
}

export async function signInWithGoogle(): Promise<User> {
  const discovery = {
    authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenEndpoint: 'https://oauth2.googleapis.com/token',
  };

  const redirectUri = Platform.OS === 'web'
    ? (typeof window !== 'undefined' ? window.location.origin : AuthSession.makeRedirectUri({ useProxy: true } as any))
    : AuthSession.makeRedirectUri({ useProxy: true } as any);

  const clientId = getGoogleClientId();
  if (!clientId) throw new Error('Google Client ID が未設定です（app.json の extra.googleAuth を設定）');

  const request = new AuthSession.AuthRequest({
    clientId,
    scopes: ['openid', 'profile', 'email'],
    redirectUri,
    responseType: AuthSession.ResponseType.IdToken,
    usePKCE: false,
    extraParams: { prompt: 'select_account', nonce: generateNonce() },
  });

  await request.makeAuthUrlAsync(discovery);
  const result = await (request as any).promptAsync(discovery, Platform.OS === 'web' ? {} : { useProxy: true });
  if (result.type !== 'success' || !result.params.id_token) {
    throw new Error('Google 認証がキャンセルまたは失敗しました');
  }

  const auth = getFirebaseAuth();
  const credential = GoogleAuthProvider.credential(result.params.id_token);
  const { user } = await signInWithCredential(auth, credential);
  return toAppUser(user);
}

export async function createUserIfNotExists(user: User): Promise<void> {
  const db = getFirebaseFirestore();
  const ref = doc(db, 'users', user.uid);
  const snap = await getDoc(ref);
  const base = {
    uid: user.uid,
    displayName: user.displayName,
    email: user.email,
    provider: 'google',
    photoURL: (getFirebaseAuth().currentUser?.photoURL as string | null) ?? null,
  };
  if (!snap.exists()) {
    await setDoc(ref, {
      ...base,
      isOwner: !!user.isOwner,
      isAdmin: false, // 初期値（後からコンソールで true に切替可能）
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
      householdId: `hh-${user.uid}`,
    }, { merge: true });
  } else {
    await updateDoc(ref, {
      ...base,
      lastLoginAt: serverTimestamp(),
    });
    const data = (await getDoc(ref)).data() as Record<string, unknown> | undefined;
    if (!data || !data.householdId) {
      await updateDoc(ref, { householdId: `hh-${user.uid}` });
    }
  }
}

export async function getUserProfile(uid: string): Promise<Record<string, unknown> | null> {
  const db = getFirebaseFirestore();
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return snap.data() as Record<string, unknown>;
}

export async function isAdmin(uid: string): Promise<boolean> {
  const profile = await getUserProfile(uid);
  return !!(profile && profile['isAdmin'] === true);
}

export async function ensureUserHousehold(uid: string, householdId: string): Promise<void> {
  const db = getFirebaseFirestore();
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, { householdId }, { merge: true });
    return;
  }
  const data = snap.data() as Record<string, unknown>;
  if (!data.householdId) {
    await updateDoc(ref, { householdId });
  }
}

export async function createGoal(goal: Goal): Promise<void> {
  const db = getFirebaseFirestore();
  const ref = doc(collection(db, 'goals'), goal.id);
  await setDoc(ref, {
    ...goal,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export async function createBudget(budget: Budget): Promise<void> { return Promise.resolve(); }
export async function createSubscription(householdId: string, stripeInfo: unknown): Promise<void> { return Promise.resolve(); }
export async function createMembershipRequest(ownerEmail: string, requesterUid: string): Promise<void> { return Promise.resolve(); }
export async function createTransaction(tx: Transaction): Promise<void> {
  const db = getFirebaseFirestore();
  const ref = doc(collection(db, 'transactions'), tx.id);
  await setDoc(ref, {
    ...tx,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

function includeTx(
  data: any,
  householdId: string,
  userId?: string,
  legacyHouseholdIds: string[] = [],
  legacyUserIds: string[] = [],
  allowedUserIds: string[] = []
): boolean {
  const hhMatch = data.householdId === householdId || legacyHouseholdIds.includes(String(data.householdId));
  const uidField = data.uid ?? data.userId; // 後方互換
  const uidMatch = (userId && uidField === userId) || (legacyUserIds.length > 0 && legacyUserIds.includes(String(uidField)));
  const allowedMatch = allowedUserIds.length > 0 && allowedUserIds.includes(String(uidField));
  const noUserIdButHousehold = (uidField === undefined || uidField === null || uidField === '') && hhMatch;
  return allowedMatch || uidMatch || noUserIdButHousehold;
}

export async function getMonthlyTransactions(
  householdId: string,
  month: string,
  userId?: string,
  legacyHouseholdIds: string[] = [],
  legacyUserIds: string[] = [],
  allowedUserIds: string[] = []
): Promise<Transaction[]> {
  const db = getFirebaseFirestore();
  const col = collection(db, 'transactions');
  const start = `${month}-01`;
  const end = `${month}-31`;
  const q = query(col, where('date', '>=', start), where('date', '<=', end));
  const snap = await getDocs(q);
  const items: Transaction[] = [];
  snap.forEach((d) => {
    const data = d.data() as any;
    if (!includeTx(data, householdId, userId, legacyHouseholdIds, legacyUserIds, allowedUserIds)) return;
    items.push({
      id: d.id,
      householdId: data.householdId,
      uid: data.uid ?? data.userId,
      date: data.date,
      totalAmount: Number(data.totalAmount) || 0,
      personalAmount: Number(data.personalAmount) || 0,
      sharedAmount: Number(data.sharedAmount) || 0,
      category: data.category || 'その他',
      isShared: !!data.isShared,
      note: data.note || undefined,
    });
  });
  return items;
}

export async function getLatestGoal(householdId: string): Promise<Goal | null> {
  const db = getFirebaseFirestore();
  const col = collection(db, 'goals');
  const q = query(col, where('householdId', '==', householdId), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  const data = d.data() as any;
  const goal: Goal = {
    id: d.id,
    householdId: data.householdId,
    title: data.title,
    targetAmount: Number(data.targetAmount) || 0,
    currentAmount: Number(data.currentAmount) || 0,
    deadline: data.deadline,
    imageUrl: data.imageUrl || undefined,
    monthlyIncome: Number(data.monthlyIncome) || undefined,
    durationMonths: Number(data.durationMonths) || undefined,
    // createdAt は Timestamp | number | string いずれかの可能性があるため素直に通す
    // number化は呼び出し側で toMonthString を使って処理
    // @ts-ignore 既存の Goal 型にオプショナルで許容
    createdAt: (data.createdAt?.seconds ? data.createdAt.seconds * 1000 : data.createdAt) || undefined,
  };
  return goal;
}

export async function getWeeklyTransactions(householdId: string, weekStart: string): Promise<Transaction[]> { return Promise.resolve([]); }
export async function getHouseholdSummary(householdId: string): Promise<{ thisWeekTotal: number; lastWeekTotal: number; thisMonthTotal: number; lastMonthTotal: number; }> { return Promise.resolve({ thisWeekTotal: 0, lastWeekTotal: 0, thisMonthTotal: 0, lastMonthTotal: 0 }); }

export async function startSubscriptionCheckout(): Promise<void> {
  const checkoutUrl = 'https://checkout.stripe.com/pay/cs_test_example';
  await WebBrowser.openBrowserAsync(checkoutUrl);
}

export function hashPairPassword(raw: string): string { return `hash:${raw}`; }
export function nowTs(): Timestamp { return Date.now(); }

export function subscribeLatestGoal(householdId: string, onChange: (goal: Goal | null) => void): () => void {
  const db = getFirebaseFirestore();
  const col = collection(db, 'goals');
  const q = query(col, where('householdId', '==', householdId), limit(1));
  const unsub = onSnapshot(q, (snap) => {
    if (snap.empty) {
      onChange(null);
      return;
    }
    const d = snap.docs[0];
    const data = d.data() as any;
    onChange({
      id: d.id,
      householdId: data.householdId,
      title: data.title,
      targetAmount: Number(data.targetAmount) || 0,
      currentAmount: Number(data.currentAmount) || 0,
      deadline: data.deadline,
      imageUrl: data.imageUrl || undefined,
      monthlyIncome: Number(data.monthlyIncome) || undefined,
      durationMonths: Number(data.durationMonths) || undefined,
    });
  });
  return unsub;
}

export function subscribeMonthlyTransactions(
  householdId: string,
  month: string,
  onChange: (txs: Transaction[]) => void,
  userId?: string,
  legacyHouseholdIds: string[] = [],
  legacyUserIds: string[] = [],
  allowedUserIds: string[] = []
): () => void {
  const db = getFirebaseFirestore();
  const col = collection(db, 'transactions');
  const start = `${month}-01`;
  const end = `${month}-31`;
  const q = query(col, where('date', '>=', start), where('date', '<=', end));
  const unsub = onSnapshot(q, (snap) => {
    const items: Transaction[] = [];
    snap.forEach((d) => {
      const data = d.data() as any;
      if (!includeTx(data, householdId, userId, legacyHouseholdIds, legacyUserIds, allowedUserIds)) return;
      items.push({
        id: d.id,
        householdId: data.householdId,
        uid: data.uid ?? data.userId,
        date: data.date,
        totalAmount: Number(data.totalAmount) || 0,
        personalAmount: Number(data.personalAmount) || 0,
        sharedAmount: Number(data.sharedAmount) || 0,
        category: data.category || 'その他',
        isShared: !!data.isShared,
        note: data.note || undefined,
      });
    });
    // 当月のメトリクスも更新して保存
    const monthKey = month;
    (async () => {
      if (!items.length) {
        // 取引が0でも、月予算があるなら savedAmount を 予算 で保存（0支出）
        const goal = await getLatestGoal(householdId);
        const budget = Number(goal?.monthlyIncome || 0);
        if (budget > 0) await upsertMonthlyMetrics({ householdId, month: monthKey, foodUnder50k: true, budgetAchieved: true, savedAmount: budget });
      } else {
        const goal = await getLatestGoal(householdId);
        const budget = Number(goal?.monthlyIncome || 0);
        const spending = items.reduce((a, t) => a + (Number(t.sharedAmount) || 0), 0);
        const savedAmount = Math.max(budget - spending, 0);
        const targetCategories = new Set<string>(['食費', '食費(コンビニ)', '食費(外食)', '外食']);
        const monthlyFood = items
          .filter((t) => targetCategories.has(String(t.category)))
          .reduce((a, t) => a + (Number(t.sharedAmount) || 0), 0);
        const foodUnder50k = monthlyFood < 50000;
        const budgetAchieved = budget > 0 && spending <= budget;
        await upsertMonthlyMetrics({ householdId, month: monthKey, foodUnder50k, budgetAchieved, savedAmount });
      }
    })();
    onChange(items);
  });
  return unsub;
}

export function subscribeTransactionsRange(
  householdId: string,
  startDate: string,
  endDate: string,
  onChange: (txs: Transaction[]) => void,
  userId?: string,
  legacyHouseholdIds: string[] = [],
  legacyUserIds: string[] = [],
  allowedUserIds: string[] = []
): () => void {
  const db = getFirebaseFirestore();
  const col = collection(db, 'transactions');
  const q = query(col, where('date', '>=', startDate), where('date', '<=', endDate));
  const unsub = onSnapshot(q, (snap) => {
    const items: Transaction[] = [];
    snap.forEach((d) => {
      const data = d.data() as any;
      if (!includeTx(data, householdId, userId, legacyHouseholdIds, legacyUserIds, allowedUserIds)) return;
      items.push({
        id: d.id,
        householdId: data.householdId,
        uid: data.uid ?? data.userId,
        date: data.date,
        totalAmount: Number(data.totalAmount) || 0,
        personalAmount: Number(data.personalAmount) || 0,
        sharedAmount: Number(data.sharedAmount) || 0,
        category: data.category || 'その他',
        isShared: !!data.isShared,
        note: data.note || undefined,
      });
    });
    onChange(items);
  });
  return unsub;
}

export function subscribeUserTransactionsUnion(
  householdId: string,
  allowedUserIds: string[],
  onChange: (txs: Transaction[]) => void
): () => void {
  const db = getFirebaseFirestore();
  const col = collection(db, 'transactions');
  const unsubs: Array<() => void> = [];
  const idToTx = new Map<string, Transaction>();

  const applySnap = (snap: any) => {
    let changed = false;
    snap.forEach((d: any) => {
      const data = d.data();
      const uidField = data.uid ?? data.userId;
      if (!allowedUserIds.includes(String(uidField))) return;
      // householdId が存在し、別世帯なら除外
      if (data.householdId && data.householdId !== householdId) return;
      const tx: Transaction = {
        id: d.id,
        householdId: data.householdId || householdId,
        uid: uidField,
        date: data.date,
        totalAmount: Number(data.totalAmount) || 0,
        personalAmount: Number(data.personalAmount) || 0,
        sharedAmount: Number(data.sharedAmount) || 0,
        category: data.category || 'その他',
        isShared: !!data.isShared,
        note: data.note || undefined,
      };
      const before = idToTx.get(tx.id);
      if (!before || JSON.stringify(before) !== JSON.stringify(tx)) {
        idToTx.set(tx.id, tx);
        changed = true;
      }
    });
    if (changed) onChange(Array.from(idToTx.values()));
  };

  if (allowedUserIds.length > 0 && allowedUserIds.length <= 10) {
    unsubs.push(onSnapshot(query(col, where('uid', 'in', allowedUserIds)), applySnap));
    unsubs.push(onSnapshot(query(col, where('userId', 'in', allowedUserIds)), applySnap)); // 旧データ互換
  } else {
    // フォールバック: 各 uid で購読
    for (const u of allowedUserIds) {
      unsubs.push(onSnapshot(query(col, where('uid', '==', u)), applySnap));
      unsubs.push(onSnapshot(query(col, where('userId', '==', u)), applySnap));
    }
  }

  return () => unsubs.forEach((u) => u());
}

// 週の月曜日を返す（YYYY-MM-DD）
export function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7; // 0=Mon
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - day);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

// WeeklySelection CRUD
export async function upsertWeeklySelection(params: {
  householdId: string;
  userId: string;
  weekStart: string; // YYYY-MM-DD (Mon)
  selectedActionId: string; // 'limit_convenience_2' | 'limit_diningout_1' | 'food_under_3000'
}): Promise<void> {
  const db = getFirebaseFirestore();
  const id = `${params.householdId}_${params.userId}_${params.weekStart}`;
  const ref = doc(collection(db, 'weeklySelections'), id);
  await setDoc(ref, {
    householdId: params.householdId,
    userId: params.userId,
    weekStart: params.weekStart,
    selectedActionId: params.selectedActionId,
    completed: false,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export function subscribeWeeklySelections(
  householdId: string,
  weekStart: string,
  userIds: string[],
  onChange: (items: WeeklySelection[]) => void
): () => void {
  const db = getFirebaseFirestore();
  const col = collection(db, 'weeklySelections');
  const q1 = query(col, where('householdId', '==', householdId), where('weekStart', '==', weekStart));
  const unsub = onSnapshot(q1, (snap) => {
    const items: WeeklySelection[] = [];
    snap.forEach((d) => {
      const data = d.data() as any;
      if (!userIds.includes(String(data.userId))) return;
      items.push({
        householdId: data.householdId,
        userId: data.userId,
        weekStart: data.weekStart,
        selectedActionId: data.selectedActionId,
        completed: !!data.completed,
        completedBy: data.completedBy,
        completedAt: data.completedAt,
      });
    });
    onChange(items);
  });
  return unsub;
}

// キャリーオーバー: 各月の (monthlyIncome - 支出合計) の累積（過去分）
export async function getCarryOverHistory(
  householdId: string,
  allowedUserIds: string[],
  monthsBack: number
): Promise<{ month: string; amount: number }[]> {
  const now = new Date();
  const results: { month: string; amount: number }[] = [];
  // 最新から過去に向けて monthsBack 分作成
  for (let i = 1; i <= monthsBack; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    // その月のトランザクション合計
    const txs = await getMonthlyTransactions(householdId, monthKey, undefined, [], [], allowedUserIds);
    const spending = txs.reduce((a, t) => a + (Number(t.sharedAmount) || 0), 0);
    // その月に存在する最新ゴールを取得（なければ0）
    const goal = await getLatestGoal(householdId);
    const monthlyIncome = Number(goal?.monthlyIncome || 0);
    const carry = Math.max(monthlyIncome - spending, 0);
    results.push({ month: monthKey, amount: carry });
  }
  // 新しい -> 古い順のまま返す
  return results;
}

// ===== MyPage 追加ユーティリティ =====
export async function updateUserDisplayName(uid: string, displayName: string): Promise<void> {
  const db = getFirebaseFirestore();
  const ref = doc(db, 'users', uid);
  await updateDoc(ref, { displayName, updatedAt: serverTimestamp() });
}

export async function updateGoalTitle(goalId: string, title: string): Promise<void> {
  const db = getFirebaseFirestore();
  const ref = doc(db, 'goals', goalId);
  await updateDoc(ref, { title, updatedAt: serverTimestamp() });
}

export async function updateGoalPlan(goalId: string, targetAmount: number, months: number): Promise<void> {
  const db = getFirebaseFirestore();
  const ref = doc(db, 'goals', goalId);
  const deadlineDate = new Date();
  deadlineDate.setMonth(deadlineDate.getMonth() + months);
  // 当該月の末日タイムスタンプ
  const deadlineTs = new Date(deadlineDate.getFullYear(), deadlineDate.getMonth() + 1, 0).getTime();
  await updateDoc(ref, {
    targetAmount,
    durationMonths: months,
    deadline: deadlineTs,
    updatedAt: serverTimestamp(),
  });
}

export async function updateGoalDeadline(goalId: string, deadlineTs: number): Promise<void> {
  const db = getFirebaseFirestore();
  const ref = doc(db, 'goals', goalId);
  await updateDoc(ref, {
    deadline: deadlineTs,
    updatedAt: serverTimestamp(),
  });
}

// ===== Weekly cooking counters =====
export async function upsertCookingEvent(params: {
  householdId: string;
  weekStart: string; // YYYY-MM-DD (Mon)
  date: string; // YYYY-MM-DD
  kind: 'dinner' | 'lunch';
  userId?: string;
}): Promise<void> {
  const db = getFirebaseFirestore();
  const id = `${params.householdId}_${params.weekStart}_${params.kind}_${params.date}`;
  const ref = doc(collection(db, 'weeklyCooking'), id);
  await setDoc(ref, {
    householdId: params.householdId,
    weekStart: params.weekStart,
    date: params.date,
    kind: params.kind,
    userId: params.userId || null,
    createdAt: serverTimestamp(),
  }, { merge: true });
}

// 保存＋集計カウンタ更新（重複押下時はカウント増加を抑止）
export async function upsertCookingEventAndCounters(params: {
  householdId: string;
  weekStart: string;
  date: string;
  kind: 'dinner' | 'lunch';
  userId?: string;
}): Promise<void> {
  const db = getFirebaseFirestore();
  const id = `${params.householdId}_${params.weekStart}_${params.kind}_${params.date}`;
  const ref = doc(collection(db, 'weeklyCooking'), id);
  const exists = await getDoc(ref);
  if (exists.exists()) {
    // 既に当日分が登録済みなら何もしない（カウンタは過去に更新済みのはず）
    return;
  }
  await setDoc(ref, {
    householdId: params.householdId,
    weekStart: params.weekStart,
    date: params.date,
    kind: params.kind,
    userId: params.userId || null,
    createdAt: serverTimestamp(),
  }, { merge: true });

  // 世帯別の累計カウンタ
  const countersRef = doc(collection(db, 'counters'), params.householdId);
  await setDoc(countersRef, {
    householdId: params.householdId,
    dinnerTotal: params.kind === 'dinner' ? increment(1) : increment(0),
    lunchTotal: params.kind === 'lunch' ? increment(1) : increment(0),
    updatedAt: serverTimestamp(),
  }, { merge: true });

  // 週別のカウンタ
  const weeklyRef = doc(collection(db, 'weeklyCookingCounters'), `${params.householdId}_${params.weekStart}`);
  await setDoc(weeklyRef, {
    householdId: params.householdId,
    weekStart: params.weekStart,
    dinnerCount: params.kind === 'dinner' ? increment(1) : increment(0),
    lunchCount: params.kind === 'lunch' ? increment(1) : increment(0),
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export function subscribeWeeklyCooking(
  householdId: string,
  weekStart: string,
  onChange: (events: Array<{ kind: 'dinner' | 'lunch'; date: string }>) => void,
): () => void {
  const db = getFirebaseFirestore();
  const col = collection(db, 'weeklyCooking');
  const q1 = query(col, where('householdId', '==', householdId), where('weekStart', '==', weekStart));
  const unsub = onSnapshot(q1, (snap) => {
    const items: Array<{ kind: 'dinner' | 'lunch'; date: string }> = [];
    snap.forEach((d) => {
      const data = d.data() as any;
      items.push({ kind: data.kind, date: data.date });
    });
    onChange(items);
  });
  return unsub;
}

export function subscribeWeeklyCookingCounters(
  householdId: string,
  weekStart: string,
  onChange: (counts: { dinnerCount: number; lunchCount: number }) => void,
): () => void {
  const db = getFirebaseFirestore();
  const ref = doc(collection(db, 'weeklyCookingCounters'), `${householdId}_${weekStart}`);
  const unsub = onSnapshot(ref, (snap) => {
    const d = snap.data() as any | undefined;
    onChange({ dinnerCount: Number(d?.dinnerCount || 0), lunchCount: Number(d?.lunchCount || 0) });
  });
  return unsub;
}

export function subscribeCookingTotals(
  householdId: string,
  onChange: (totals: { dinnerTotal: number; lunchTotal: number }) => void,
): () => void {
  const db = getFirebaseFirestore();
  const ref = doc(collection(db, 'counters'), householdId);
  const unsub = onSnapshot(ref, (snap) => {
    const d = snap.data() as any | undefined;
    onChange({ dinnerTotal: Number(d?.dinnerTotal || 0), lunchTotal: Number(d?.lunchTotal || 0) });
  });
  return unsub;
}

export function subscribeCookingTotalsFromEvents(
  householdId: string,
  onChange: (totals: { dinnerTotal: number; lunchTotal: number }) => void,
): () => void {
  const db = getFirebaseFirestore();
  const colRef = collection(db, 'weeklyCooking');
  const q1 = query(colRef, where('householdId', '==', householdId));
  const unsub = onSnapshot(q1, (snap) => {
    let dinner = 0, lunch = 0;
    snap.forEach((d) => {
      const data = d.data() as any;
      if (data.kind === 'dinner') dinner += 1;
      else if (data.kind === 'lunch') lunch += 1;
    });
    onChange({ dinnerTotal: dinner, lunchTotal: lunch });
  });
  return unsub;
}

// 追加: 週イベントから通算自炊回数を都度集計（初期表示用の非リアルタイム版）
export async function getCookingCountsFromEvents(
  householdId: string,
): Promise<{ dinnerTotal: number; lunchTotal: number }> {
  const db = getFirebaseFirestore();
  const colRef = collection(db, 'weeklyCooking');
  const q1 = query(colRef, where('householdId', '==', householdId));
  const snap = await getDocs(q1);
  let dinner = 0, lunch = 0;
  snap.forEach((d) => {
    const data = d.data() as any;
    if (data.kind === 'dinner') dinner += 1;
    else if (data.kind === 'lunch') lunch += 1;
  });
  return { dinnerTotal: dinner, lunchTotal: lunch };
}

export async function getCookingCounts(householdId: string): Promise<{ dinnerTotal: number; lunchTotal: number }> {
  const db = getFirebaseFirestore();
  // まず counters から取得
  const countersRef = doc(collection(db, 'counters'), householdId);
  const cSnap = await getDoc(countersRef);
  if (cSnap.exists()) {
    const d = cSnap.data() as any;
    return { dinnerTotal: Number(d.dinnerTotal || 0), lunchTotal: Number(d.lunchTotal || 0) };
  }
  // フォールバック: 全イベントを集計
  const colRef = collection(db, 'weeklyCooking');
  const q1 = query(colRef, where('householdId', '==', householdId));
  const snap = await getDocs(q1);
  let dinner = 0, lunch = 0;
  snap.forEach((d) => {
    const data = d.data() as any;
    if (data.kind === 'dinner') dinner += 1;
    else if (data.kind === 'lunch') lunch += 1;
  });
  return { dinnerTotal: dinner, lunchTotal: lunch };
}

export async function getWeeklyActionCompletedCount(householdId: string): Promise<number> {
  const db = getFirebaseFirestore();
  const col = collection(db, 'weeklySelections');
  const q1 = query(col, where('householdId', '==', householdId), where('completed', '==', true));
  const snap = await getDocs(q1);
  return snap.size;
}

// ===== Monthly achievements & savings =====
function buildMonthKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

type MonthlyMetrics = {
  householdId: string;
  month: string; // YYYY-MM
  foodUnder50k: boolean;
  budgetAchieved: boolean;
  savedAmount: number; // >=0
  updatedAt?: Timestamp;
};

async function getMonthlyMetricsDoc(householdId: string, month: string): Promise<MonthlyMetrics | null> {
  const db = getFirebaseFirestore();
  const id = `${householdId}_${month}`;
  const ref = doc(db, 'monthlyMetrics', id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const d = snap.data() as any;
  return {
    householdId: d.householdId,
    month: d.month,
    foodUnder50k: !!d.foodUnder50k,
    budgetAchieved: !!d.budgetAchieved,
    savedAmount: Number(d.savedAmount) || 0,
    updatedAt: Number(d.updatedAt) || undefined,
  };
}

async function upsertMonthlyMetrics(mm: MonthlyMetrics): Promise<void> {
  const db = getFirebaseFirestore();
  const id = `${mm.householdId}_${mm.month}`;
  const ref = doc(collection(db, 'monthlyMetrics'), id);
  await setDoc(ref, { ...mm, updatedAt: serverTimestamp() }, { merge: true });
}

async function getOrComputeMonthlyMetrics(householdId: string, month: string): Promise<MonthlyMetrics> {
  const existing = await getMonthlyMetricsDoc(householdId, month);
  if (existing) return existing;
  // Compute from transactions + goal
  const txs = await getMonthlyTransactions(householdId, month);
  const goal = await getLatestGoal(householdId);
  const budget = Number(goal?.monthlyIncome || 0);
  const spending = txs.reduce((a, t) => a + (Number(t.sharedAmount) || 0), 0);
  const savedAmount = Math.max(budget - spending, 0);
  const targetCategories = new Set<string>(['食費', '食費(コンビニ)', '食費(外食)', '外食']);
  const monthlyFood = txs
    .filter((t) => targetCategories.has(String(t.category)))
    .reduce((a, t) => a + (Number(t.sharedAmount) || 0), 0);
  const foodUnder50k = monthlyFood < 50000;
  const budgetAchieved = budget > 0 && spending <= budget;
  const mm: MonthlyMetrics = { householdId, month, foodUnder50k, budgetAchieved, savedAmount };
  await upsertMonthlyMetrics(mm);
  return mm;
}

export async function countMonthsFoodUnder50k(
  householdId: string,
  monthsBack: number = 36,
): Promise<number> {
  const now = new Date();
  let count = 0;
  for (let i = 0; i < monthsBack; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = buildMonthKey(d);
    const mm = await getOrComputeMonthlyMetrics(householdId, monthKey);
    if (mm.foodUnder50k) count += 1;
  }
  return count;
}

export async function countMonthsBudgetAchieved(
  householdId: string,
  monthsBack: number = 36,
): Promise<number> {
  const now = new Date();
  let count = 0;
  for (let i = 0; i < monthsBack; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = buildMonthKey(d);
    const mm = await getOrComputeMonthlyMetrics(householdId, monthKey);
    if (mm.budgetAchieved) count += 1;
  }
  return count;
}

export async function getTotalSavedAmount(
  householdId: string,
  monthsBack: number = 60,
): Promise<number> {
  const now = new Date();
  let total = 0;
  for (let i = 0; i < monthsBack; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = buildMonthKey(d);
    const mm = await getOrComputeMonthlyMetrics(householdId, monthKey);
    if (mm.savedAmount > 0) total += mm.savedAmount;
  }
  return total;
}

export async function getBadges(householdId: string): Promise<Badge[]> {
  const db = getFirebaseFirestore();
  const col = collection(db, 'badges');
  const q = query(col, where('householdId', '==', householdId), orderBy('awardedAt', 'desc'));
  const snap = await getDocs(q);
  const items: Badge[] = [];
  snap.forEach((d) => {
    const b = d.data() as any;
    items.push({ id: d.id, householdId: b.householdId, name: b.name, awardedAt: b.awardedAt });
  });
  return items;
}

export async function cancelSubscription(householdId: string): Promise<void> {
  // 実際の解約フローは別途実装。ここではスタブ。
  console.log('Cancel subscription requested for', householdId);
}



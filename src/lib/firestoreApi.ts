// このファイルは Cursor により生成された
// Firestore CRUD のラッパー（関数スタブ）

import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { GoogleAuthProvider, signInWithCredential, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { getFirebaseAuth, getFirebaseFirestore } from './firebase';
import { User, Goal, Budget, Transaction, Timestamp } from '../types';

WebBrowser.maybeCompleteAuthSession();

function toAppUser(u: FirebaseUser): User {
  return {
    uid: u.uid,
    displayName: u.displayName || 'No Name',
    email: u.email || '',
    isOwner: false,
    createdAt: Date.now(),
  };
}

export async function signInWithGoogle(): Promise<User> {
  const discovery = {
    authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenEndpoint: 'https://oauth2.googleapis.com/token',
  };

  const redirectUri = AuthSession.makeRedirectUri({ useProxy: true });

  const request = new AuthSession.AuthRequest({
    clientId: (AuthSession as any).getDefaultBrowserClientId?.() || '',
    // 実運用では app.json の extra.googleAuth.* を使い分け
    scopes: ['openid', 'profile', 'email'],
    redirectUri,
    responseType: AuthSession.ResponseType.IdToken,
    extraParams: { prompt: 'select_account' },
  });

  await request.makeAuthUrlAsync(discovery);
  const result = await request.promptAsync(discovery, { useProxy: true });
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
  if (!snap.exists()) {
    await setDoc(ref, {
      uid: user.uid,
      displayName: user.displayName,
      email: user.email,
      isOwner: !!user.isOwner,
      createdAt: serverTimestamp(),
    });
  }
}

export async function createGoal(goal: Goal): Promise<void> {
  // 省略（後で実装）
  return Promise.resolve();
}

export async function createBudget(budget: Budget): Promise<void> {
  return Promise.resolve();
}

export async function createSubscription(householdId: string, stripeInfo: unknown): Promise<void> {
  return Promise.resolve();
}

export async function createMembershipRequest(ownerEmail: string, requesterUid: string): Promise<void> {
  return Promise.resolve();
}

export async function createTransaction(tx: Transaction): Promise<void> {
  return Promise.resolve();
}

export async function getMonthlyTransactions(householdId: string, month: string): Promise<Transaction[]> {
  return Promise.resolve([]);
}

export async function getWeeklyTransactions(householdId: string, weekStart: string): Promise<Transaction[]> {
  return Promise.resolve([]);
}

export async function getHouseholdSummary(householdId: string): Promise<{
  thisWeekTotal: number;
  lastWeekTotal: number;
  thisMonthTotal: number;
  lastMonthTotal: number;
}> {
  return Promise.resolve({ thisWeekTotal: 0, lastWeekTotal: 0, thisMonthTotal: 0, lastMonthTotal: 0 });
}

export function hashPairPassword(raw: string): string {
  return `hash:${raw}`;
}

export function nowTs(): Timestamp {
  return Date.now();
}



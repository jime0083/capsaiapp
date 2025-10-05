// このファイルは Cursor により生成された
// Firestore CRUD のラッパー（関数スタブ）

import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { GoogleAuthProvider, signInWithCredential, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { getFirebaseAuth, getFirebaseFirestore } from './firebase';
import { User, Goal, Budget, Transaction, Timestamp } from '../types';

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
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
    }, { merge: true });
  } else {
    await updateDoc(ref, {
      ...base,
      lastLoginAt: serverTimestamp(),
    });
  }
}

export async function getUserProfile(uid: string): Promise<Record<string, unknown> | null> {
  const db = getFirebaseFirestore();
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return snap.data() as Record<string, unknown>;
}

export async function createGoal(goal: Goal): Promise<void> { return Promise.resolve(); }
export async function createBudget(budget: Budget): Promise<void> { return Promise.resolve(); }
export async function createSubscription(householdId: string, stripeInfo: unknown): Promise<void> { return Promise.resolve(); }
export async function createMembershipRequest(ownerEmail: string, requesterUid: string): Promise<void> { return Promise.resolve(); }
export async function createTransaction(tx: Transaction): Promise<void> { return Promise.resolve(); }
export async function getMonthlyTransactions(householdId: string, month: string): Promise<Transaction[]> { return Promise.resolve([]); }
export async function getWeeklyTransactions(householdId: string, weekStart: string): Promise<Transaction[]> { return Promise.resolve([]); }
export async function getHouseholdSummary(householdId: string): Promise<{ thisWeekTotal: number; lastWeekTotal: number; thisMonthTotal: number; lastMonthTotal: number; }> { return Promise.resolve({ thisWeekTotal: 0, lastWeekTotal: 0, thisMonthTotal: 0, lastMonthTotal: 0 }); }

export function hashPairPassword(raw: string): string { return `hash:${raw}`; }
export function nowTs(): Timestamp { return Date.now(); }



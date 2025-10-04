// このファイルは Cursor により生成された
// Firestore CRUD のラッパー（関数スタブ）

import { User, Goal, Budget, Transaction, Timestamp } from '../types';

// 実装メモ:
// - 実環境では Firebase SDK v9 の firestore, auth を用いて CRUD を実行
// - 今は Promise.resolve でモック応答を返す

export async function signInWithGoogle(): Promise<User> {
  // TODO: Firebase Auth Google Sign-In 実装
  const mock: User = {
    uid: 'mock-uid',
    displayName: 'Mock User',
    email: 'mock@example.com',
    isOwner: false,
    createdAt: Date.now(),
  };
  return Promise.resolve(mock);
}

export async function createUserIfNotExists(user: User): Promise<void> {
  // TODO: users コレクションに upsert
  return Promise.resolve();
}

export async function createGoal(goal: Goal): Promise<void> {
  // TODO: goals コレクションに追加
  return Promise.resolve();
}

export async function createBudget(budget: Budget): Promise<void> {
  // TODO: budgets コレクションに追加
  return Promise.resolve();
}

export async function createSubscription(householdId: string, stripeInfo: unknown): Promise<void> {
  // TODO: subscriptions コレクションに追加
  return Promise.resolve();
}

export async function createMembershipRequest(ownerEmail: string, requesterUid: string): Promise<void> {
  // TODO: membershipRequests コレクションに追加
  return Promise.resolve();
}

export async function createTransaction(tx: Transaction): Promise<void> {
  // TODO: transactions コレクションに追加
  return Promise.resolve();
}

export async function getMonthlyTransactions(householdId: string, month: string): Promise<Transaction[]> {
  // TODO: クエリで month のトランザクションを取得
  return Promise.resolve([]);
}

export async function getWeeklyTransactions(householdId: string, weekStart: string): Promise<Transaction[]> {
  // TODO: 週開始日で範囲取得
  return Promise.resolve([]);
}

export async function getHouseholdSummary(householdId: string): Promise<{
  thisWeekTotal: number;
  lastWeekTotal: number;
  thisMonthTotal: number;
  lastMonthTotal: number;
}> {
  // TODO: サマリー計算
  return Promise.resolve({ thisWeekTotal: 0, lastWeekTotal: 0, thisMonthTotal: 0, lastMonthTotal: 0 });
}

// ユーティリティ
export function hashPairPassword(raw: string): string {
  // TODO: 適切なハッシュへ置換
  return `hash:${raw}`;
}

export function nowTs(): Timestamp {
  return Date.now();
}



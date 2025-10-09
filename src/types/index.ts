// このファイルは Cursor により生成された
// 型定義（User, Household, Goal, Transaction 等）

export type Timestamp = number; // Firebase Timestamp 代替（実装時に置換）

export interface User {
  uid: string;
  displayName: string;
  email: string;
  isOwner: boolean;
  householdId?: string;
  pairInvitePasswordHash?: string;
  createdAt: Timestamp;
}

export interface Household {
  id: string;
  ownerUserId: string;
  name: string;
}

export interface Goal {
  id: string;
  householdId: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline: Timestamp;
  imageUrl?: string;
  monthlyIncome?: number; // 追加: 月の予算・収入
  durationMonths?: number; // 追加: 目標期間（月）
}

export interface Budget {
  householdId: string;
  month: string; // YYYY-MM
  monthlyBudget: number;
}

export interface Transaction {
  id: string;
  householdId: string;
  uid: string; // ログインユーザーの uid
  date: string; // YYYY-MM-DD
  totalAmount: number;
  personalAmount: number;
  sharedAmount: number;
  category: string;
  isShared: boolean;
  note?: string;
}

export interface WeeklySelection {
  householdId: string;
  weekStart: string; // YYYY-MM-DD (Mon)
  userId: string; // 追加: 対象ユーザーの uid
  selectedActionId: string;
  completed: boolean;
  completedBy?: string;
  completedAt?: Timestamp;
}

export interface Badge {
  id: string;
  householdId: string;
  name: string;
  awardedAt: Timestamp;
}



// このファイルは Cursor により生成された
// 各スクリーンで使えるダミーデータ

import { Goal, Transaction } from '../types';

export const sampleGoal: Goal = {
  id: 'g1',
  householdId: 'h1',
  title: 'ドラム式洗濯機',
  targetAmount: 120000,
  currentAmount: 42000,
  deadline: new Date('2025-12-31').getTime(),
  imageUrl: undefined,
};

export const sampleTransactions: Transaction[] = Array.from({ length: 12 }).flatMap((_, idx) => {
  const month = idx + 1;
  const date = `2025-${String(month).padStart(2, '0')}-15`;
  return [
    {
      id: `t-food-${idx}`,
      householdId: 'h1',
      userId: 'u1',
      date,
      totalAmount: 1200 + idx * 50,
      personalAmount: 600 + idx * 20,
      sharedAmount: 600 + idx * 30,
      category: '食費',
      isShared: true,
    },
    {
      id: `t-utilities-${idx}`,
      householdId: 'h1',
      userId: 'u2',
      date,
      totalAmount: 5000 + idx * 100,
      personalAmount: 0,
      sharedAmount: 5000 + idx * 100,
      category: '光熱費',
      isShared: true,
    },
  ];
});

export const categoryColors: Record<string, string> = {
  食費: '#5CC8FF',
  光熱費: '#FFB86B',
  交通: '#A29BFE',
  娯楽: '#FF6B9A',
  その他: '#9E9E9E',
};



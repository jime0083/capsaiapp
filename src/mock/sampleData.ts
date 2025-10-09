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
      uid: 'u1',
      date,
      totalAmount: 1200 + idx * 50,
      personalAmount: 600 + idx * 20,
      sharedAmount: 600 + idx * 30,
      category: '食費',
      isShared: true,
    },
  ];
});

export const categoryColors: Record<string, string> = {
  '食費': '#5CC8FF',
  '食費(コンビニ)': '#66D0FF',
  '外食': '#4FBDF2',
  '交際費': '#FF6B9A',
  '日用品': '#A0E7A5',
  '交通費': '#A29BFE',
  '服・美容': '#E7A0E2',
  '趣味': '#FFD166',
  '教育・書籍': '#8ED1FC',
  '家賃': '#FFA8A8',
  '水道': '#66A6FF',
  '電気': '#FFD166',
  'ガス・灯油': '#FFB86B',
  'スマホ': '#A0AEC0',
  'ネット': '#9AE6B4',
  '医療': '#F4A261',
  '保険': '#81E6D9',
  '税金': '#F6AD55',
  'サブスク': '#C3DAFE',
  'その他': '#9E9E9E',
};



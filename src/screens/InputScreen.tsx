// このファイルは Cursor により生成された
// Input: 支出を記録（個人出費を差し引いた残りを共有出費として保存）

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Alert, ScrollView } from 'react-native';
import { colors, spacing } from '../styles/theme';
import ExpenseForm from '../components/ExpenseForm';
import { categoryColors } from '../mock/sampleData';
import { createTransaction, getUserProfile, ensureUserHousehold } from '../lib/firestoreApi';
import { Transaction } from '../types';
import { getFirebaseAuth } from '../lib/firebase';
import { useIsFocused } from '@react-navigation/native';

type Props = { navigation: any };

const InputScreen: React.FC<Props> = ({ navigation }) => {
  const categoryOptions = Object.entries(categoryColors).map(([name, color]) => ({ name, color }));
  const isFocused = useIsFocused();
  const [formKey, setFormKey] = useState<number>(0);

  useEffect(() => {
    // 画面に戻ってきたときにフォームを再マウントして値を初期化
    if (isFocused) setFormKey((k) => k + 1);
  }, [isFocused]);

  const handleSubmit = async (p: {
    date: string;
    category: string;
    totalAmount: number;
    personalAmount: number;
    sharedAmount: number;
    isShared: boolean;
  }) => {
    const uid = getFirebaseAuth().currentUser?.uid;
    if (!uid) {
      Alert.alert('エラー', 'ログイン状態を確認できません');
      return;
    }
    const profile = await getUserProfile(uid);
    const householdId = (profile && (profile['householdId'] as string)) || `hh-${uid}`;
    // ルール満たすため householdId をユーザープロファイルに保証
    await ensureUserHousehold(uid, householdId);

    const tx: Transaction = {
      id: `tx-${Date.now()}`,
      householdId,
      uid,
      date: p.date,
      totalAmount: p.totalAmount,
      personalAmount: p.personalAmount,
      sharedAmount: p.sharedAmount,
      category: p.category,
      isShared: true,
    };
    await createTransaction(tx);
    Alert.alert('保存しました');
    navigation.goBack();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ExpenseForm key={formKey} onSubmit={handleSubmit} categoryOptions={categoryOptions} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg },
});

export default InputScreen;



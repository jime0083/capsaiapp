// このファイルは Cursor により生成された
// Input: 合算モードで sharedAmount を計算して保存

import React from 'react';
import { View, StyleSheet, Alert, ScrollView } from 'react-native';
import { colors, spacing } from '../styles/theme';
import ExpenseForm from '../components/ExpenseForm';
import { categoryColors } from '../mock/sampleData';
import { createTransaction } from '../lib/firestoreApi';
import { Transaction } from '../types';

type Props = { navigation: any };

const InputScreen: React.FC<Props> = ({ navigation }) => {
  const categoryOptions = Object.entries(categoryColors).map(([name, color]) => ({ name, color }));

  const handleSubmit = async (p: {
    date: string;
    category: string;
    totalAmount: number;
    personalAmount: number;
    sharedAmount: number;
    isShared: boolean;
  }) => {
    const tx: Transaction = {
      id: `tx-${Date.now()}`,
      householdId: 'h1',
      userId: 'u1',
      date: p.date,
      totalAmount: p.totalAmount,
      personalAmount: p.personalAmount,
      sharedAmount: p.sharedAmount,
      category: p.category,
      isShared: p.isShared,
    };
    await createTransaction(tx);
    Alert.alert('保存しました');
    navigation.goBack();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ExpenseForm onSubmit={handleSubmit} categoryOptions={categoryOptions} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg },
});

export default InputScreen;



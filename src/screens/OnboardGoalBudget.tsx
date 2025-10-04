// このファイルは Cursor により生成された
// 目標/予算入力 → createGoal / createBudget → SubscriptionChoice

import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { colors, spacing, radius } from '../styles/theme';
import { createGoal, createBudget } from '../lib/firestoreApi';
import { Goal, Budget } from '../types';

type Props = { navigation: any };

const OnboardGoalBudget: React.FC<Props> = ({ navigation }) => {
  const [title, setTitle] = useState('ドラム式洗濯機');
  const [targetAmount, setTargetAmount] = useState('120000');
  const [deadline, setDeadline] = useState('2025-12-31');
  const [monthlyBudget, setMonthlyBudget] = useState('30000');

  const onSubmit = async () => {
    const t = Number(targetAmount);
    const mb = Number(monthlyBudget);
    if (!title || !t || !deadline || !mb) {
      Alert.alert('入力エラー', '必須項目を入力してください');
      return;
    }
    const goal: Goal = {
      id: `goal-${Date.now()}`,
      householdId: 'h1',
      title,
      targetAmount: t,
      currentAmount: 0,
      deadline: new Date(deadline).getTime(),
    };
    const budget: Budget = { householdId: 'h1', month: deadline.slice(0, 7), monthlyBudget: mb };
    await createGoal(goal);
    await createBudget(budget);
    Alert.alert('保存しました');
    navigation.replace('SubscriptionChoice');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>目標設定</Text>
      <Text style={styles.label}>目標名</Text>
      <TextInput value={title} onChangeText={setTitle} style={styles.input} />
      <Text style={styles.label}>目標金額（円）</Text>
      <TextInput value={targetAmount} onChangeText={setTargetAmount} keyboardType="numeric" style={styles.input} />
      <Text style={styles.label}>目標期限（YYYY-MM-DD）</Text>
      <TextInput value={deadline} onChangeText={setDeadline} style={styles.input} />

      <Text style={[styles.title, { marginTop: spacing.lg }]}>月の予算</Text>
      <Text style={styles.label}>monthlyBudget</Text>
      <TextInput value={monthlyBudget} onChangeText={setMonthlyBudget} keyboardType="numeric" style={styles.input} />

      <TouchableOpacity style={styles.submit} onPress={onSubmit} activeOpacity={0.8}>
        <Text style={styles.submitText}>続ける</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg },
  title: { color: colors.text, fontSize: 18, marginBottom: spacing.sm },
  label: { color: colors.text, marginTop: spacing.md, marginBottom: spacing.xs },
  input: { borderWidth: 1, borderColor: '#222', borderRadius: radius.md, color: colors.text, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  submit: { backgroundColor: colors.positive, borderRadius: 12, paddingVertical: spacing.md, alignItems: 'center', marginTop: spacing.lg },
  submitText: { color: '#000', fontWeight: '700' },
});

export default OnboardGoalBudget;



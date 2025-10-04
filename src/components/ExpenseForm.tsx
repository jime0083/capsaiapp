// このファイルは Cursor により生成された
// 入力フォーム（合算モード対応）

import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, StyleSheet, Switch, TouchableOpacity } from 'react-native';
import { colors, spacing, radius } from '../styles/theme';
import CategoryTag from './CategoryTag';

type Props = {
  onSubmit: (params: {
    date: string;
    category: string;
    totalAmount: number;
    personalAmount: number;
    sharedAmount: number;
    isShared: boolean;
  }) => void;
  categoryOptions: { name: string; color: string }[];
};

export const ExpenseForm: React.FC<Props> = ({ onSubmit, categoryOptions }) => {
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [category, setCategory] = useState<string>(categoryOptions[0]?.name ?? 'その他');
  const [isShared, setIsShared] = useState<boolean>(false);
  const [totalAmount, setTotalAmount] = useState<string>('0');
  const [personalAmount, setPersonalAmount] = useState<string>('0');

  const sharedAmount = useMemo(() => {
    const t = Number(totalAmount) || 0;
    const p = Number(personalAmount) || 0;
    return Math.max(t - p, 0);
  }, [totalAmount, personalAmount]);

  const submit = () => {
    const t = Number(totalAmount) || 0;
    const p = Number(personalAmount) || 0;
    onSubmit({
      date,
      category,
      totalAmount: t,
      personalAmount: isShared ? p : t,
      sharedAmount: isShared ? Math.max(t - p, 0) : 0,
      isShared,
    });
  };

  return (
    <View>
      <Text style={styles.label}>カテゴリ</Text>
      <View style={styles.rowWrap}>
        {categoryOptions.map((c) => (
          <CategoryTag key={c.name} name={c.name} color={c.color} selected={category === c.name} onPress={() => setCategory(c.name)} />
        ))}
      </View>

      <Text style={styles.label}>日付 (YYYY-MM-DD)</Text>
      <TextInput value={date} onChangeText={setDate} style={styles.input} placeholder="2025-01-01" placeholderTextColor={colors.muted} />

      <View style={styles.switchRow}>
        <Text style={styles.label}>合算モード</Text>
        <Switch value={isShared} onValueChange={setIsShared} trackColor={{ true: colors.positive }} />
      </View>

      <Text style={styles.label}>合計金額</Text>
      <TextInput value={totalAmount} onChangeText={setTotalAmount} keyboardType="numeric" style={styles.input} />

      {isShared ? (
        <>
          <Text style={styles.label}>個人金額</Text>
          <TextInput value={personalAmount} onChangeText={setPersonalAmount} keyboardType="numeric" style={styles.input} />
          <Text style={styles.helper}>共有金額（自動計算）: {sharedAmount} 円</Text>
        </>
      ) : null}

      <TouchableOpacity style={styles.submit} onPress={submit} activeOpacity={0.8}>
        <Text style={styles.submitText}>保存</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  label: { color: colors.text, marginTop: spacing.md, marginBottom: spacing.xs },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap' },
  input: {
    borderWidth: 1,
    borderColor: '#222',
    borderRadius: radius.md,
    color: colors.text,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.md },
  helper: { color: colors.muted, marginTop: spacing.xs },
  submit: {
    backgroundColor: colors.positive,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  submitText: { color: '#000', fontWeight: '700' },
});

export default ExpenseForm;



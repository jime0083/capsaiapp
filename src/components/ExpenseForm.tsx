// このファイルは Cursor により生成された
// 入力フォーム（支出: 総額から個人出費を差し引いた残りを共有出費として保存）

import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, radius } from '../styles/theme';
import CategoryTag from './CategoryTag';

type Props = {
  onSubmit: (params: {
    date: string;
    category: string;
    totalAmount: number; // 支出
    personalAmount: number; // 差し引く個人出費
    sharedAmount: number; // 自動: total - personal
    isShared: boolean; // 常に true 扱いで保存
  }) => void;
  categoryOptions: { name: string; color: string }[];
};

export const ExpenseForm: React.FC<Props> = ({ onSubmit, categoryOptions }) => {
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [category, setCategory] = useState<string>(categoryOptions[0]?.name ?? 'その他');
  const [totalAmount, setTotalAmount] = useState<string>('0');
  const [personalAmount, setPersonalAmount] = useState<string>('0');

  const onlyDigits = (s: string) => s.replace(/[^0-9]/g, '');

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
      personalAmount: p,
      sharedAmount: Math.max(t - p, 0),
      isShared: true,
    });
  };

  const adjustDate = (deltaDays: number) => {
    const d = new Date(date);
    if (isNaN(d.getTime())) return;
    d.setDate(d.getDate() + deltaDays);
    setDate(d.toISOString().slice(0, 10));
  };

  return (
    <View>
      <Text style={styles.label}>カテゴリ</Text>
      <View style={styles.rowWrap}>
        {categoryOptions.map((c) => (
          <CategoryTag key={c.name} name={c.name} color={c.color} selected={category === c.name} onPress={() => setCategory(c.name)} />
        ))}
      </View>

      <Text style={styles.label}>日付</Text>
      <View style={styles.dateRow}>
        <TouchableOpacity style={styles.stepBtn} onPress={() => adjustDate(-1)}>
          <Text style={styles.stepText}>-</Text>
        </TouchableOpacity>
        <TextInput value={date} onChangeText={setDate} style={[styles.input, { flex: 1 }]} placeholder="2025-01-01" placeholderTextColor={colors.muted} />
        <TouchableOpacity style={styles.stepBtn} onPress={() => adjustDate(1)}>
          <Text style={styles.stepText}>+</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>支出（円）</Text>
      <TextInput value={totalAmount} onChangeText={(v) => setTotalAmount(onlyDigits(v))} keyboardType="number-pad" style={styles.input} />

      <Text style={styles.label}>差し引く個人出費（円）</Text>
      <TextInput value={personalAmount} onChangeText={(v) => setPersonalAmount(onlyDigits(v))} keyboardType="number-pad" style={styles.input} />
      <Text style={styles.helper}>保存される共有出費: {sharedAmount} 円</Text>

      <TouchableOpacity style={styles.submit} onPress={submit} activeOpacity={0.8}>
        <Text style={styles.submitText}>保存</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  label: { color: '#000', marginTop: spacing.md, marginBottom: spacing.xs },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap' },
  input: {
    borderWidth: 1,
    borderColor: '#222',
    borderRadius: radius.md,
    color: '#000',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepBtn: { borderWidth: 1, borderColor: '#333', borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  stepText: { color: '#000', fontWeight: '700' },
  helper: { color: '#000', marginTop: spacing.xs },
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



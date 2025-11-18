// このファイルは Cursor により生成された
// 入力フォーム（支出: 総額から個人出費を差し引いた残りを共有出費として保存）

import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, radius } from '../styles/theme';
import CategoryTag from './CategoryTag';
import FadeInUp from './FadeInUp';

type Props = {
  onSubmit: (params: {
    date: string;
    category: string;
    totalAmount: number; // 支出
    personalAmount: number; // 差し引く個人出費
    sharedAmount: number; // 自動: total - personal
    isShared: boolean; // 常に true 扱いで保存
  }) => void | Promise<void>;
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

  const submit = async () => {
    const t = Number(totalAmount) || 0;
    const p = Number(personalAmount) || 0;
    await Promise.resolve(onSubmit({
      date,
      category,
      totalAmount: t,
      personalAmount: p,
      sharedAmount: Math.max(t - p, 0),
      isShared: true,
    }));
    // 送信後はフォームを初期化
    setDate(new Date().toISOString().slice(0, 10));
    setCategory(categoryOptions[0]?.name ?? 'その他');
    setTotalAmount('0');
    setPersonalAmount('0');
  };

  const adjustDate = (deltaDays: number) => {
    const d = new Date(date);
    if (isNaN(d.getTime())) return;
    d.setDate(d.getDate() + deltaDays);
    setDate(d.toISOString().slice(0, 10));
  };

  return (
    <FadeInUp delay={0} distance={20}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>日付</Text>
        <View style={styles.dateRow}>
          <TouchableOpacity style={styles.stepBtn} onPress={() => adjustDate(-1)}>
            <Text style={styles.stepText}>-</Text>
          </TouchableOpacity>
            <TextInput value={date} onChangeText={setDate} style={[styles.input, styles.dateInput]} placeholder="2025-01-01" placeholderTextColor={colors.muted} />
          <TouchableOpacity style={styles.stepBtn} onPress={() => adjustDate(1)}>
            <Text style={styles.stepText}>+</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.cardTitle, { marginTop: spacing.md }]}>支出（円）</Text>
        <TextInput value={totalAmount} onChangeText={(v) => setTotalAmount(onlyDigits(v))} keyboardType="number-pad" style={styles.input} />

        <Text style={[styles.cardTitle, { marginTop: spacing.md }]}>差し引く個人出費（円）</Text>
        <TextInput value={personalAmount} onChangeText={(v) => setPersonalAmount(onlyDigits(v))} keyboardType="number-pad" style={styles.input} />
        <Text style={styles.helper}>保存される共有出費: {sharedAmount} 円</Text>

        <Text style={[styles.cardTitle, { marginTop: spacing.md }]}>カテゴリ</Text>
        <View style={styles.rowWrap}>
          {categoryOptions.map((c) => {
            const name = c.name === '外食' ? '食費(外食)' : c.name;
            return (
              <CategoryTag key={name} name={name} color={c.color} selected={category === name} onPress={() => setCategory(name)} />
            );
          })}
        </View>

        <TouchableOpacity style={[styles.submit, { marginTop: spacing.md }]} onPress={submit} activeOpacity={0.8}>
          <Text style={styles.submitText}>保存</Text>
        </TouchableOpacity>
      </View>
    </FadeInUp>
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
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    height: 36,
    fontSize: 14,
  },
  card: { backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md, marginTop: spacing.md, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.16, shadowRadius: 12, elevation: 6 },
  cardTitle: { color: '#000', fontWeight: '700', marginBottom: spacing.xs },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dateInput: { flexBasis: '70%', maxWidth: '70%', height: 36 },
  stepBtn: { borderWidth: 1, borderColor: '#333', borderRadius: radius.md, paddingHorizontal: spacing.sm, paddingVertical: 6, height: 36, alignItems: 'center', justifyContent: 'center' },
  stepText: { color: '#000', fontWeight: '700', fontSize: 16 },
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



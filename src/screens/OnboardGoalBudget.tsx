// このファイルは Cursor により生成された
// 目標/予算入力 → createGoal / createBudget → SubscriptionChoice

import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { colors, spacing, radius } from '../styles/theme';
import { createGoal, getUserProfile, ensureUserHousehold } from '../lib/firestoreApi';
import { Goal } from '../types';
import { Picker } from '@react-native-picker/picker';
import FadeInUp from '../components/FadeInUp';
import { getFirebaseAuth } from '../lib/firebase';
import Constants from 'expo-constants';

const isAdminEmail = (email: string | undefined | null): boolean => {
  const extra = (Constants as any).expoConfig?.extra || (Constants as any).manifest?.extra;
  const admins: string[] = extra?.adminEmails || [];
  return !!email && admins.includes(email);
};

type Props = { navigation: any };

const OnboardGoalBudget: React.FC<Props> = ({ navigation }) => {
  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [pickYear, setPickYear] = useState<number>(new Date().getFullYear());
  const [pickMonth, setPickMonth] = useState<number>(new Date().getMonth() + 1);
  const [pickDay, setPickDay] = useState<number>(new Date().getDate());

  const yearOptions = useMemo(() => Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i), []);
  const monthOptions = useMemo(() => Array.from({ length: 12 }, (_, i) => i + 1), []);
  const dayOptions = useMemo(() => Array.from({ length: new Date(pickYear, pickMonth, 0).getDate() }, (_, i) => i + 1), [pickYear, pickMonth]);

  const onSubmit = async () => {
    const t = Number(targetAmount);
    const mi = Number(monthlyIncome);
    if (!title || !t || !mi) {
      Alert.alert('入力エラー', '必須項目を入力してください');
      return;
    }
    const auth = getFirebaseAuth();
    const uid = auth.currentUser?.uid;
    const email = auth.currentUser?.email;
    if (!uid) {
      Alert.alert('エラー', 'ログイン状態を確認できません');
      return;
    }
    const profile = await getUserProfile(uid);
    const householdId = (profile && (profile['householdId'] as string)) || `hh-${uid}`;
    await ensureUserHousehold(uid, householdId);

    const deadlineDate = new Date(pickYear, pickMonth - 1, pickDay);
    const deadlineTs = new Date(deadlineDate.getFullYear(), deadlineDate.getMonth() + 1, 0).getTime();

    const goal: Goal = {
      id: `goal-${Date.now()}`,
      householdId,
      title,
      targetAmount: t,
      currentAmount: 0,
      deadline: deadlineTs,
      monthlyIncome: mi,
      durationMonths: undefined,
    };

    await createGoal(goal);
    Alert.alert('保存しました');

    const latest = await getUserProfile(uid);
    const adminFromFirestore = !!(latest && latest['isAdmin'] === true);

    if (adminFromFirestore || isAdminEmail(email)) {
      navigation.replace('Home');
    } else {
      navigation.replace('Subscription');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <FadeInUp delay={0}><Text style={styles.title}>目標設定</Text></FadeInUp>

      <FadeInUp delay={60}>
        <Text style={styles.label}>目標</Text>
        <TextInput value={title} onChangeText={setTitle} style={styles.input} placeholder="例: 新しいPC" placeholderTextColor="#666" />
      </FadeInUp>

      <FadeInUp delay={120}>
        <Text style={styles.label}>目標金額（円）</Text>
        <TextInput value={targetAmount} onChangeText={setTargetAmount} keyboardType="numeric" style={styles.input} placeholder="例: 120000" placeholderTextColor="#666" />
      </FadeInUp>

      <FadeInUp delay={180}>
        <Text style={styles.label}>月の予算・収入（円）</Text>
        <TextInput value={monthlyIncome} onChangeText={setMonthlyIncome} keyboardType="numeric" style={styles.input} placeholder="例: 250000" placeholderTextColor="#666" />
      </FadeInUp>

      <FadeInUp delay={240}>
        <Text style={styles.label}>目標期限（日付）</Text>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={styles.pickerBox}>
            <Picker selectedValue={pickYear} onValueChange={(v) => setPickYear(Number(v))} dropdownIconColor="#fff">
              {yearOptions.map((y) => (
                <Picker.Item key={y} label={`${y}`} value={y} color="#fff" />
              ))}
            </Picker>
          </View>
          <View style={styles.pickerBox}>
            <Picker selectedValue={pickMonth} onValueChange={(v) => setPickMonth(Number(v))} dropdownIconColor="#fff">
              {monthOptions.map((m) => (
                <Picker.Item key={m} label={`${m}`} value={m} color="#fff" />
              ))}
            </Picker>
          </View>
          <View style={styles.pickerBox}>
            <Picker selectedValue={pickDay} onValueChange={(v) => setPickDay(Number(v))} dropdownIconColor="#fff">
              {dayOptions.map((d) => (
                <Picker.Item key={d} label={`${d}`} value={d} color="#fff" />
              ))}
            </Picker>
          </View>
        </View>
      </FadeInUp>

      <FadeInUp delay={300}>
        <TouchableOpacity style={styles.submit} onPress={onSubmit} activeOpacity={0.8}>
          <Text style={styles.submitText}>続ける</Text>
        </TouchableOpacity>
      </FadeInUp>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg },
  title: { color: colors.text, fontSize: 18, marginBottom: spacing.sm },
  label: { color: colors.text, marginTop: spacing.md, marginBottom: spacing.xs },
  input: { borderWidth: 1, borderColor: '#fff', backgroundColor: '#fff', borderRadius: radius.md, color: '#000', paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  pickerBox: { borderWidth: 1, borderColor: '#fff', backgroundColor: '#000', borderRadius: radius.md, overflow: 'hidden', paddingTop: 5, paddingBottom: 5 },
  submit: { backgroundColor: colors.positive, borderRadius: 12, paddingVertical: spacing.md, alignItems: 'center', marginTop: spacing.lg, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  submitText: { color: '#000', fontWeight: '700' },
});

export default OnboardGoalBudget;



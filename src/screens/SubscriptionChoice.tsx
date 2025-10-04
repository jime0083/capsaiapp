// このファイルは Cursor により生成された
// サブスク課金 or ペア登録の必須選択

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ScrollView } from 'react-native';
import { colors, spacing, radius } from '../styles/theme';
import { createMembershipRequest, createSubscription } from '../lib/firestoreApi';

type Props = { navigation: any };

const SubscriptionChoice: React.FC<Props> = ({ navigation }) => {
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');
  const [selected, setSelected] = useState<'owner' | 'pair' | null>(null);

  const stripeCheckout = async () => {
    // スタブ: 成功扱い
    await createSubscription('h1', { ok: true });
    Alert.alert('決済成功');
    navigation.replace('SetPairPassword');
  };

  const submitPair = async () => {
    if (!ownerEmail || !ownerPassword) {
      Alert.alert('入力エラー', 'メールとパスワードは必須です');
      return;
    }
    await createMembershipRequest(ownerEmail, 'u1');
    Alert.alert('申請送信済み');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>アカウント種別を選択</Text>
      <View style={styles.row}>
        <TouchableOpacity style={[styles.card, selected === 'owner' && styles.cardSelected]} onPress={() => setSelected('owner')}>
          <Text style={styles.cardText}>サブスク課金（owner）</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.card, selected === 'pair' && styles.cardSelected]} onPress={() => setSelected('pair')}>
          <Text style={styles.cardText}>ペアとして登録（pair）</Text>
        </TouchableOpacity>
      </View>

      {selected === 'owner' && (
        <TouchableOpacity style={styles.primary} onPress={stripeCheckout}>
          <Text style={styles.primaryText}>Stripe 決済へ（スタブ）</Text>
        </TouchableOpacity>
      )}

      {selected === 'pair' && (
        <View>
          <Text style={styles.label}>オーナーのメール</Text>
          <TextInput value={ownerEmail} onChangeText={setOwnerEmail} style={styles.input} />
          <Text style={styles.label}>招待パスワード</Text>
          <TextInput value={ownerPassword} onChangeText={setOwnerPassword} style={styles.input} secureTextEntry />
          <TouchableOpacity style={styles.primary} onPress={submitPair}>
            <Text style={styles.primaryText}>申請送信</Text>
          </TouchableOpacity>
        </View>
      )}

      <Text style={styles.notice}>選択完了まで Home へ進めません</Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg },
  title: { color: colors.text, fontSize: 18, marginBottom: spacing.md },
  row: { flexDirection: 'row', gap: 12 },
  card: { flex: 1, backgroundColor: colors.card, padding: spacing.lg, borderRadius: radius.md, alignItems: 'center' },
  cardSelected: { borderWidth: 1, borderColor: colors.positive },
  cardText: { color: colors.text },
  label: { color: colors.text, marginTop: spacing.md, marginBottom: spacing.xs },
  input: { borderWidth: 1, borderColor: '#222', borderRadius: radius.md, color: colors.text, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  primary: { backgroundColor: colors.positive, borderRadius: 12, paddingVertical: spacing.md, alignItems: 'center', marginTop: spacing.lg },
  primaryText: { color: '#000', fontWeight: '700' },
  notice: { color: colors.muted, marginTop: spacing.lg },
});

export default SubscriptionChoice;



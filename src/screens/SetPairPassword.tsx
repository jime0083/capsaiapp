// このファイルは Cursor により生成された
// オーナーがペア招待用パスワードを設定 → Home へ

import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { colors, spacing, radius } from '../styles/theme';
import { hashPairPassword } from '../lib/firestoreApi';

type Props = { navigation: any };

const SetPairPassword: React.FC<Props> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const onSave = async () => {
    if (!email || !password) {
      Alert.alert('入力エラー', 'メールアドレスとペア用パスワードを入力してください');
      return;
    }
    const hash = hashPairPassword(password);
    // TODO: 連携申請の作成・検証は後で実装
    console.log('pair-link request:', { email, hash });
    Alert.alert('入力を受け付けました（連携は後で実装）');
    navigation.replace('Home');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>ペアユーザーのメールアドレス</Text>
      <TextInput value={email} onChangeText={setEmail} style={styles.input} keyboardType="email-address" autoCapitalize="none" />

      <Text style={styles.label}>ペア用パスワード</Text>
      <TextInput value={password} onChangeText={setPassword} style={styles.input} secureTextEntry />

      <TouchableOpacity style={styles.primary} onPress={onSave}>
        <Text style={styles.primaryText}>入力して進む</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
  label: { color: colors.text, marginBottom: spacing.xs, marginTop: spacing.md },
  input: { borderWidth: 1, borderColor: '#222', borderRadius: radius.md, color: colors.text, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  primary: { backgroundColor: colors.positive, borderRadius: 12, paddingVertical: spacing.md, alignItems: 'center', marginTop: spacing.lg },
  primaryText: { color: '#000', fontWeight: '700' },
});

export default SetPairPassword;



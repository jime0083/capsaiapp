// このファイルは Cursor により生成された
// オーナーがペア招待用パスワードを設定 → Home へ

import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { colors, spacing, radius } from '../styles/theme';
import { hashPairPassword } from '../lib/firestoreApi';

type Props = { navigation: any };

const SetPairPassword: React.FC<Props> = ({ navigation }) => {
  const [password, setPassword] = useState('');

  const onSave = async () => {
    if (!password) {
      Alert.alert('入力エラー', 'パスワードを入力してください');
      return;
    }
    const hash = hashPairPassword(password);
    // TODO: users/{uid}.pairInvitePasswordHash に保存（スタブ）
    console.log('save pairInvitePasswordHash:', hash);
    Alert.alert('保存しました');
    navigation.replace('Home');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>招待用パスワード</Text>
      <TextInput value={password} onChangeText={setPassword} style={styles.input} secureTextEntry />
      <TouchableOpacity style={styles.primary} onPress={onSave}>
        <Text style={styles.primaryText}>保存して進む</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
  label: { color: colors.text, marginBottom: spacing.xs },
  input: { borderWidth: 1, borderColor: '#222', borderRadius: radius.md, color: colors.text, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  primary: { backgroundColor: colors.positive, borderRadius: 12, paddingVertical: spacing.md, alignItems: 'center', marginTop: spacing.lg },
  primaryText: { color: '#000', fontWeight: '700' },
});

export default SetPairPassword;



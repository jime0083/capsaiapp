// このファイルは Cursor により生成された
// Google OAuth ボタン（スタブ）→ createUserIfNotExists → OnboardGoalBudget へ

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { colors, spacing } from '../styles/theme';
import { signInWithGoogle, createUserIfNotExists } from '../lib/firestoreApi';

type Props = { navigation: any };

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const onPressGoogle = async () => {
    try {
      const user = await signInWithGoogle();
      await createUserIfNotExists(user);
      Alert.alert('ログイン成功', user.displayName);
      navigation.replace('OnboardGoalBudget');
    } catch (e) {
      Alert.alert('ログイン失敗', String(e));
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.google} onPress={onPressGoogle} activeOpacity={0.8}>
        <Text style={styles.googleText}>Google で続行</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  google: { backgroundColor: colors.positive, paddingVertical: spacing.md, paddingHorizontal: spacing.xl, borderRadius: 12 },
  googleText: { color: '#000', fontWeight: '700' },
});

export default LoginScreen;



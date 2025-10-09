// このファイルは Cursor により生成された
// Google OAuth ボタン（スタブ）→ createUserIfNotExists → OnboardGoalBudget へ

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { colors, spacing } from '../styles/theme';
import { signInWithGoogle, createUserIfNotExists, getUserProfile } from '../lib/firestoreApi';
import Constants from 'expo-constants';

type Props = { navigation: any };

const isAdminEmail = (email: string | undefined | null): boolean => {
  const extra = (Constants as any).expoConfig?.extra || (Constants as any).manifest?.extra;
  const admins: string[] = extra?.adminEmails || [];
  return !!email && admins.includes(email);
};

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const onPressGoogle = async () => {
    try {
      const user = await signInWithGoogle();
      await createUserIfNotExists(user);
      const profile = await getUserProfile(user.uid);
      if (!profile) throw new Error('ユーザープロファイルの取得に失敗しました');
      Alert.alert('ログイン成功', String(profile['displayName'] || user.displayName));

      const adminFromFirestore = profile['isAdmin'] === true;
      if (adminFromFirestore || isAdminEmail(user.email)) {
        navigation.replace('Home');
        return;
      }

      navigation.replace('SubscriptionChoice');
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
  google: { backgroundColor: colors.positive, paddingVertical: spacing.md, paddingHorizontal: spacing.xl, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  googleText: { color: '#000', fontWeight: '700' },
});

export default LoginScreen;



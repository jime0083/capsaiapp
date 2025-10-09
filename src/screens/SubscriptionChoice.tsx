// このファイルは Cursor により生成された
// サブスク課金 or ペア登録の必須選択

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing } from '../styles/theme';
import FadeInUp from '../components/FadeInUp';

type Props = { navigation: any };

const SubscriptionChoice: React.FC<Props> = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <FadeInUp delay={0}>
        <Text style={styles.title}>ログイン完了</Text>
      </FadeInUp>
      <FadeInUp delay={120}>
        <TouchableOpacity style={styles.primary} onPress={() => navigation.navigate('SetPairPassword')}>
          <Text style={styles.primaryText}>課金ユーザーとアカウントを連携する</Text>
        </TouchableOpacity>
      </FadeInUp>
      <FadeInUp delay={240}>
        <TouchableOpacity style={styles.secondary} onPress={() => navigation.replace('OnboardGoalBudget')}>
          <Text style={styles.secondaryText}>スキップする</Text>
        </TouchableOpacity>
      </FadeInUp>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg, justifyContent: 'center' },
  title: { color: colors.text, fontSize: 18, marginBottom: spacing.lg, textAlign: 'center' },
  primary: { backgroundColor: colors.positive, borderRadius: 12, paddingVertical: spacing.md, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  primaryText: { color: '#000', fontWeight: '700' },
  secondary: { marginTop: spacing.md, borderRadius: 12, paddingVertical: spacing.md, alignItems: 'center', borderWidth: 1, borderColor: '#000', backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  secondaryText: { color: '#000', fontWeight: '600' },
});

export default SubscriptionChoice;



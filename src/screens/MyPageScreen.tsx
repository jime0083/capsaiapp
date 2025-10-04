// このファイルは Cursor により生成された
// MyPage: ユーザー名、種別、使用日数、バッジ一覧（ダミー）

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { colors, spacing } from '../styles/theme';

const MyPageScreen: React.FC = () => {
  const user = { name: 'Mock User', type: 'pair' as 'owner' | 'pair', startedAt: new Date('2025-01-01') };
  const days = Math.floor((Date.now() - user.startedAt.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.sub}>アカウント種別: {user.type}</Text>
        <Text style={styles.sub}>使用日数: {days} 日</Text>
      </View>

      <Text style={styles.title}>バッジ</Text>
      <View style={styles.card}><Text style={styles.sub}>🏅 初回記録バッジ</Text></View>

      <View style={styles.row}>
        <TouchableOpacity style={styles.btn} onPress={() => Alert.alert('プロフィール編集（モーダル・スタブ）')}> 
          <Text style={styles.btnText}>プロフィール編集</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btn} onPress={() => Alert.alert('サブスク管理（モーダル・スタブ）')}>
          <Text style={styles.btnText}>サブスク管理</Text>
        </TouchableOpacity>
      </View>
      <View style={{ height: 24 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg },
  card: { backgroundColor: colors.card, padding: spacing.md, borderRadius: 12, marginBottom: spacing.md },
  name: { color: colors.text, fontSize: 18 },
  sub: { color: colors.muted, marginTop: 4 },
  title: { color: colors.text, fontSize: 18, marginBottom: spacing.sm },
  row: { flexDirection: 'row', gap: 12 },
  btn: { flex: 1, backgroundColor: colors.positive, padding: spacing.md, borderRadius: 12, alignItems: 'center' },
  btnText: { color: '#000', fontWeight: '700' },
});

export default MyPageScreen;



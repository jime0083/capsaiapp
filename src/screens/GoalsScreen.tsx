// このファイルは Cursor により生成された
// Goals: 現在の目標、履歴簡易リスト、ウィークリーアクション with CongratsEffect

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { colors, spacing } from '../styles/theme';
import { sampleGoal } from '../mock/sampleData';
import CongratsEffect from '../components/CongratsEffect';

const GoalsScreen: React.FC = () => {
  const [showCongrats, setShowCongrats] = useState(false);

  const percent = Math.round((sampleGoal.currentAmount / sampleGoal.targetAmount) * 100);

  const handleComplete = () => {
    setShowCongrats(true);
    setTimeout(() => setShowCongrats(false), 1200);
    // TODO: firestore に weeklySelections 書き込み
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>現在の目標</Text>
        <View style={styles.card}>
          <Text style={styles.name}>{sampleGoal.title}</Text>
          <View style={styles.barBg}>
            <View style={[styles.barFill, { width: `${percent}%` }]} />
          </View>
          <Text style={styles.sub}>{percent}% 達成</Text>
        </View>

        <Text style={styles.title}>積み上げ履歴</Text>
        <View style={styles.card}><Text style={styles.sub}>- 3,000 円積立 (今週)</Text></View>

        <Text style={styles.title}>ウィークリーアクション</Text>
        <View style={styles.row}>
          <TouchableOpacity style={styles.action} onPress={handleComplete}>
            <Text style={styles.actionText}>自分のアクション</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.action} onPress={handleComplete}>
            <Text style={styles.actionText}>パートナーのアクション</Text>
          </TouchableOpacity>
        </View>
        <View style={{ height: 24 }} />
      </ScrollView>
      <CongratsEffect visible={showCongrats} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg },
  title: { color: colors.text, fontSize: 18, marginBottom: spacing.sm },
  card: { backgroundColor: colors.card, padding: spacing.md, borderRadius: 12, marginBottom: spacing.md },
  name: { color: colors.text, fontSize: 16, marginBottom: spacing.sm },
  barBg: { height: 10, backgroundColor: '#1F1F1F', borderRadius: 6, overflow: 'hidden' },
  barFill: { height: 10, backgroundColor: colors.positive },
  sub: { color: colors.muted, marginTop: spacing.xs },
  row: { flexDirection: 'row', gap: 12 },
  action: { flex: 1, backgroundColor: colors.card, padding: spacing.md, borderRadius: 12, alignItems: 'center' },
  actionText: { color: colors.text },
});

export default GoalsScreen;



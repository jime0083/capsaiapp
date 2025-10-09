import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { colors, spacing } from '../styles/theme';
import FadeInUp from '../components/FadeInUp';
import { startSubscriptionCheckout } from '../lib/firestoreApi';

const SubscriptionScreen: React.FC = () => {
  const [loading, setLoading] = useState(false);

  const onSubscribe = async () => {
    try {
      setLoading(true);
      await startSubscriptionCheckout();
    } catch (e) {
      Alert.alert('エラー', String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <FadeInUp delay={0}>
        <Text style={styles.title}>月額サブスク</Text>
      </FadeInUp>
      <FadeInUp delay={120}>
        <Text style={styles.price}>¥300 / 月</Text>
      </FadeInUp>
      <FadeInUp delay={240}>
        <TouchableOpacity style={styles.primary} onPress={onSubscribe} disabled={loading}>
          {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.primaryText}>Stripeで購入</Text>}
        </TouchableOpacity>
      </FadeInUp>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg, justifyContent: 'center', alignItems: 'center' },
  title: { color: colors.text, fontSize: 22, marginBottom: spacing.sm },
  price: { color: colors.text, fontSize: 18, marginBottom: spacing.lg },
  primary: { backgroundColor: colors.positive, borderRadius: 12, paddingVertical: spacing.md, paddingHorizontal: spacing.xl },
  primaryText: { color: '#000', fontWeight: '700' },
});

export default SubscriptionScreen;

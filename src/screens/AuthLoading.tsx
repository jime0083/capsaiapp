// このファイルは Cursor により生成された
// 起動時に currentUser を確認して Login or Home へ

import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { colors } from '../styles/theme';
import { ensureFirebaseInitialized, getFirebaseAuth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

type Props = { navigation: any };

const AuthLoading: React.FC<Props> = ({ navigation }) => {
  useEffect(() => {
    ensureFirebaseInitialized();
    const auth = getFirebaseAuth();
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) {
        navigation.replace('Home');
      } else {
        navigation.replace('Login');
      }
    });
    return () => unsub();
  }, [navigation]);

  return (
    <View style={styles.container}>
      <ActivityIndicator color={colors.positive} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
});

export default AuthLoading;



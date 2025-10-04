// このファイルは Cursor により生成された
// 達成年の簡易コンフェッティ（ダミー）

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../styles/theme';

type Props = { visible: boolean };

export const CongratsEffect: React.FC<Props> = ({ visible }) => {
  if (!visible) return null;
  return (
    <View style={styles.overlay} pointerEvents="none">
      <Text style={styles.text}>🎉 Congrats! 🎉</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  text: { color: colors.positive, fontSize: 24, fontWeight: '800' },
});

export default CongratsEffect;



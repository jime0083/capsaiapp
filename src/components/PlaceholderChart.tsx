// このファイルは Cursor により生成された
// 円・線グラフのダミー描画（後で react-native-svg へ差し替え可能）

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../styles/theme';

type Props = {
  type: 'pie' | 'line';
  data: number[] | { x: number; y: number }[];
  colors?: string[];
  height?: number;
};

export const PlaceholderChart: React.FC<Props> = ({ type, data, colors: segColors, height = 160 }) => {
  return (
    <View style={[styles.container, { height }]}> 
      <Text style={styles.label}>Chart: {type}</Text>
      <Text style={styles.sub}>{Array.isArray(data) ? `points=${data.length}` : 'data'}</Text>
      {/* TODO: react-native-svg 等で実グラフ差し替え */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: '#1F1F1F',
    backgroundColor: '#0B0B0B',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { color: colors.text, fontSize: 14 },
  sub: { color: colors.muted, fontSize: 12, marginTop: 4 },
});

export default PlaceholderChart;



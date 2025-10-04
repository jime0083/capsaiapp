// このファイルは Cursor により生成された
// 色付きカテゴリタグ

import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors, spacing, radius } from '../styles/theme';

type Props = {
  name: string;
  color: string;
  selected?: boolean;
  onPress?: () => void;
};

export const CategoryTag: React.FC<Props> = ({ name, color, selected, onPress }) => {
  return (
    <TouchableOpacity
      style={[styles.tag, { borderColor: color, backgroundColor: selected ? color : 'transparent' }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.text, { color: selected ? '#000' : color }]}>{name}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  tag: {
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.lg,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default CategoryTag;



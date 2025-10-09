// このファイルは Cursor により生成された
// 円グラフの簡易実装（react-native-svg）

import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../styles/theme';
import Svg, { G, Path } from 'react-native-svg';

type Slice = { key: string; value: number; color: string };

type Props = {
  type: 'pie';
  data: Slice[]; // カテゴリ別の {key,value,color}
  height?: number;
};

function polarToCartesian(cx: number, cy: number, r: number, angle: number) {
  const rad = (angle - 90) * (Math.PI / 180);
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y} L ${cx} ${cy} Z`;
}

export const PlaceholderChart: React.FC<Props> = ({ data, height = 160 }) => {
  const total = useMemo(() => data.reduce((a, s) => a + (s.value || 0), 0) || 1, [data]);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const size = height;
  const r = size / 2 - 8;
  const cx = size / 2;
  const cy = size / 2;
  let angle = 0;

  const hovered = hoverIdx != null ? data[hoverIdx] : null;

  return (
    <View style={[styles.container, { height, width: '100%' }]}> 
      <Svg height={size} width={size}>
        <G>
          {data.map((s, idx) => {
            const sliceAngle = (s.value / total) * 360;
            const d = arcPath(cx, cy, r, angle, angle + sliceAngle);
            const thisIdx = idx;
            angle += sliceAngle;
            return (
              <Path
                key={s.key + idx}
                d={d}
                fill={s.color}
                onPressIn={() => setHoverIdx(thisIdx)}
                // @ts-ignore web only
                onMouseEnter={() => setHoverIdx(thisIdx)}
                // @ts-ignore web only
                onMouseLeave={() => setHoverIdx(null)}
              />
            );
          })}
        </G>
      </Svg>
      {hovered ? (
        <View style={styles.tooltip}>
          <Text style={styles.tooltipText}>{hovered.key}</Text>
          <Text style={styles.tooltipText}>{`${hovered.value.toLocaleString()} 円`}</Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    backgroundColor: '#F3F2F7',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 6,
  },
  tooltip: {
    position: 'absolute',
    top: 8,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tooltipText: { color: '#fff', fontSize: 12 },
  label: { color: colors.text, fontSize: 14 },
});

export default PlaceholderChart;



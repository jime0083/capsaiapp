import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { G, Line, Path, Circle, Text as SvgText, Rect } from 'react-native-svg';

export type LinePoint = { label: string; value: number };

type Props = {
  data: LinePoint[]; // 例: 12ヶ月の {label: '10', value: 12345}
  height?: number;
};

export const LineChart: React.FC<Props> = ({ data, height = 180 }) => {
  const width = 320; // シンプルに固定（横幅はコンテナで調整される）
  const padding = 24;
  const innerW = width - padding * 2;
  const innerH = height - padding * 2;

  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const minVal = 0;
  const stepX = innerW / Math.max(data.length - 1, 1);

  const points = useMemo(() => {
    return data.map((d, i) => {
      const x = padding + i * stepX;
      const y = padding + innerH - ((d.value - minVal) / (maxVal - minVal)) * innerH;
      return { ...d, x, y } as any;
    });
  }, [data, innerH, innerW, maxVal, minVal, padding, stepX]);

  const pathD = useMemo(() => {
    if (points.length === 0) return '';
    return points.map((p: any, i: number) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  }, [points]);

  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const hovered = hoverIdx != null ? points[hoverIdx] : null;

  return (
    <View style={[styles.container, { height, width: '100%' }]}> 
      <Svg height={height} width={width}>
        <G>
          {/* 軸 */}
          <Line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#555" strokeWidth={1} />
          <Line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#555" strokeWidth={1} />

          {/* 線 */}
          <Path d={pathD} stroke="#6EE785" strokeWidth={2} fill="none" />

          {/* ポイント */}
          {points.map((p: any, idx: number) => (
            <Circle
              key={idx}
              cx={p.x}
              cy={p.y}
              r={4}
              fill="#6EE785"
              onPressIn={() => setHoverIdx(idx)}
              // @ts-ignore web only
              onMouseEnter={() => setHoverIdx(idx)}
              // @ts-ignore web only
              onMouseLeave={() => setHoverIdx(null)}
            />
          ))}

          {/* X 軸ラベル（間引き） */}
          {points.map((p: any, idx: number) => (
            idx % 2 === 0 ? (
              <SvgText key={`x-${idx}`} x={p.x} y={height - padding + 14} fill="#888" fontSize={10} textAnchor="middle">{p.label}</SvgText>
            ) : null
          ))}
        </G>
      </Svg>
      {hovered ? (
        <View style={styles.tooltip}> 
          <Text style={styles.tooltipText}>{`${hovered.label}月`}</Text>
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
});

export default LineChart;

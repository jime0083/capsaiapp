// このファイルは Cursor により生成された
// 円グラフの簡易実装（react-native-svg）

import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { colors, spacing } from '../styles/theme';
import Svg, { G, Path, Circle } from 'react-native-svg';

type Slice = { key: string; value: number; color: string };

type Props = {
  type: 'pie';
  data: Slice[]; // カテゴリ別の {key,value,color}
  height?: number;
  title?: string; // グラフタイトル（背景内上部）
  titleIcon?: any; // 追加: タイトル左のアイコン(require資産)
  emptyMessage?: string; // データが空のときに表示する文言
  emptyHeight?: number; // データが空のときの全体高さ（未指定なら120）
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

export const PlaceholderChart: React.FC<Props> = ({ data, height = 160, title, titleIcon, emptyMessage, emptyHeight }) => {
  const totalRaw = useMemo(() => data.reduce((a, s) => a + (s.value || 0), 0), [data]);
  // データが全く無いときのみ「空」扱い。値が0のときは等分して可視化する
  const isEmpty = !data || data.length === 0;
  const normalizedData = useMemo(() => {
    if (isEmpty) return [];
    if (totalRaw > 0) return data;
    // すべて0の場合は等分して描画（視覚的な空白回避）
    return data.map((d) => ({ ...d, value: 1 }));
  }, [data, isEmpty, totalRaw]);
  const total = useMemo(() => {
    if (isEmpty) return 1;
    const t = normalizedData.reduce((a, s) => a + (s.value || 0), 0);
    return t > 0 ? t : 1;
  }, [isEmpty, normalizedData]);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const headerH = title ? 28 + spacing.md : 0; // タイトル行 + 上部パディング分
  // コンテナの高さ（空時と通常時で分岐）
  const effectiveHeight = isEmpty ? (emptyHeight ?? 120) : height;
  // 実際に SVG に割り当てるサイズ（最低 80px を確保して 0 にならないようにする）
  const size = Math.max(80, effectiveHeight - headerH - spacing.sm);
  const r = size / 2 - 8;
  const cx = size / 2;
  const cy = size / 2;
  let angle = 0;

  const hovered = hoverIdx != null ? normalizedData[hoverIdx] : null;
  const hoverPos = useMemo(() => {
    if (hoverIdx == null) return null;
    // 再計算: ポイントの中心近傍座標
    let ang = 0;
    for (let i = 0; i <= hoverIdx; i++) {
      const slice = normalizedData[i];
      const a = (slice.value / total) * 360;
      if (i === hoverIdx) {
        ang += a / 2; // そのスライスの中央
        break;
      }
      ang += a;
    }
    const rad = (ang - 90) * (Math.PI / 180);
    const x = cx + (r * 0.7) * Math.cos(rad);
    const y = cy + (r * 0.7) * Math.sin(rad);
    return { x, y };
  }, [hoverIdx, normalizedData, total, cx, cy, r]);

  return (
    <View style={[styles.container, { height: effectiveHeight, width: '100%' }]}> 
      <View style={styles.leftStripe} />
      {title ? (
        <View style={styles.titleRow}>
          {titleIcon ? <Image source={titleIcon} style={styles.titleIcon} /> : null}
          <View style={styles.titleTextWrap}>
            <Text style={styles.title}>{title}</Text>
          </View>
        </View>
      ) : null}
      {isEmpty ? (
        <View style={[styles.emptyWrap, { height: size, width: '100%' }]}>
          <Text style={styles.emptyText}>{emptyMessage || 'データがありません'}</Text>
        </View>
      ) : (
        <>
          <View style={[styles.chartWrap, { height: size, width: '100%' }]}> 
            <Svg height={size} width={size} viewBox={`0 0 ${size} ${size}`}>
              <G>
              {normalizedData.map((s, idx) => {
                const sliceAngle = (s.value / total) * 360;
                const d = arcPath(cx, cy, r, angle, angle + sliceAngle);
                const thisIdx = idx;
                angle += sliceAngle;
                const isWeb = typeof document !== 'undefined';
                const eventProps = isWeb
                  ? {
                      // Web: マウスホバーのみを使用（Responder系プロパティをDOMに渡さない）
                      // @ts-ignore web only
                      onMouseEnter: () => setHoverIdx(thisIdx),
                      // @ts-ignore web only
                      onMouseLeave: () => setHoverIdx(null),
                    }
                  : {
                      // ネイティブ: タップでホバー扱い
                      onPressIn: () => setHoverIdx(thisIdx),
                    };
                return (
                  <Path
                    key={s.key + idx}
                    d={d}
                    fill={s.color}
                    {...eventProps}
                  />
                );
              })}
              </G>
            </Svg>
          </View>
          {hovered && hoverPos ? (
            <View style={[styles.tooltip, { left: hoverPos.x + 8, top: hoverPos.y - 10 }]}>
              <Text style={styles.tooltipText}>{hovered.key}</Text>
              <Text style={styles.tooltipText}>{`${hovered.value.toLocaleString()} 円`}</Text>
            </View>
          ) : null}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    backgroundColor: '#F3F2F7',
    borderRadius: 12,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingLeft: 24,
    alignItems: 'stretch',
    justifyContent: 'flex-start',
    position: 'relative',
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 6,
  },
  title: {
    alignSelf: 'flex-start',
    marginTop: 8,
    marginLeft: 0,
    color: '#000',
    fontWeight: '700',
    fontSize: 14,
    lineHeight: 18,
  },
  titleRow: { flexDirection: 'row', alignItems: 'flex-end', height: 18 },
  titleTextWrap: { justifyContent: 'flex-end', height: 18 },
  titleIcon: { width: 18, height: 18, marginLeft: 0, marginRight: 0, borderRadius: 4 },
  chartWrap: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyWrap: {
    width: '100%',
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#6B7280',
    fontSize: 14,
    textAlign: 'left',
    width: '100%',
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
  leftStripe: { position: 'absolute', left: 8, top: 10, bottom: 10, width: 6, borderRadius: 4, backgroundColor: '#000000' },
});

export default PlaceholderChart;



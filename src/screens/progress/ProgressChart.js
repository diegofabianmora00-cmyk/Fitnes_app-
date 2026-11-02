import React, { useState } from 'react';
import { View, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Circle, Line, Text as SvgText, Polygon } from 'react-native-svg';
import { C } from '../../theme';
import { Card, Press, T } from '../../ui';
import ExercisePicker from '../../ExercisePicker';
import { progressSeries } from '../../recommend';
import { exerciseById } from '../../exercises';

const METRICS = ['Puntaje', 'Peso', 'Volumen', 'e1RM'];

export default function ProgressChart({ data, rango, stats, selectedExId, setSelectedExId }) {
  const [metric, setMetric] = useState('Puntaje');
  const [pickerOpen, setPickerOpen] = useState(false);
  const u = data.unit || 'kg';

  const [scrollX, setScrollX] = useState(0);
  const [contentWidth, setContentWidth] = useState(1);
  const [containerWidth, setContainerWidth] = useState(1);

  const maxScroll = Math.max(1, contentWidth - containerWidth);
  const thumbWidthPct = Math.max(20, (containerWidth / contentWidth) * 100);
  const maxTranslate = containerWidth * (1 - thumbWidthPct / 100);
  const translateX = maxScroll > 0 ? (scrollX / maxScroll) * maxTranslate : 0;

  const series = progressSeries(data, rango, metric, selectedExId);
  const totalSessions = stats.sessions;
  const showEmpty = totalSessions < 3;

  const exName = selectedExId ? (exerciseById(selectedExId)?.name || 'Ejercicio') : 'Todos los ejercicios';
  const pctDiff = stats.diffScore >= 0 ? `+${stats.diffScore}%` : `${stats.diffScore}%`;

  // SVG dimensions
  const width = 346;
  const height = 196;
  const padLeft = 35;
  const padBottom = 25;
  const chartW = width - padLeft - 10;
  const chartH = height - padBottom - 15;

  const values = series.map((s) => s.value);
  const maxVal = values.length ? Math.max(10, ...values) : (metric === 'Puntaje' ? 100 : 50);
  const minVal = 0;
  const rangeVal = Math.max(1, maxVal - minVal);

  const getX = (index, total) => {
    if (total <= 1) return padLeft + chartW / 2;
    return padLeft + (index / (total - 1)) * chartW;
  };

  const getY = (val) => {
    const clamped = Math.max(minVal, Math.min(maxVal, val));
    return 15 + chartH - ((clamped - minVal) / rangeVal) * chartH;
  };

  let pointsStr = '';
  let polygonStr = '';
  if (!showEmpty && series.length > 0) {
    const pts = series.map((s, i) => ({ x: getX(i, series.length), y: getY(s.value) }));
    pointsStr = pts.map((p) => `${p.x},${p.y}`).join(' ');
    const first = pts[0];
    const last = pts[pts.length - 1];
    polygonStr = `${first.x},${15 + chartH} ${pointsStr} ${last.x},${15 + chartH}`;
  }

  return (
    <Card style={{ padding: 16, marginTop: 12 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View>
          <T style={{ fontSize: 16, fontWeight: '700' }}>Tu progreso</T>
          <T mute style={{ fontSize: 13, marginTop: 1 }}>vs. periodo anterior</T>
        </View>
        <View style={{ backgroundColor: C.accentDim, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6 }}>
          <T style={{ fontSize: 13, fontWeight: '700', color: C.accent }}>{pctDiff}</T>
        </View>
      </View>

      <Press
        onPress={() => setPickerOpen(true)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: C.field,
          borderWidth: 1,
          borderColor: C.line,
          borderRadius: 16,
          padding: 12,
          marginTop: 12,
        }}
      >
        <T mute style={{ fontSize: 13, marginRight: 8 }}>Ejercicio</T>
        <T style={{ flex: 1, fontSize: 14, fontWeight: '600', color: C.text }} numberOfLines={1}>{exName}</T>
        <Ionicons name="chevron-down" size={18} color={C.muteText} />
      </Press>

      <ScrollView
        horizontal
        nestedScrollEnabled={true}
        directionalLockEnabled={true}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, marginTop: 12 }}
        onScroll={(e) => setScrollX(e.nativeEvent.contentOffset.x)}
        onContentSizeChange={(w) => setContentWidth(w)}
        onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
        scrollEventThrottle={16}
        onTouchStart={(e) => e.stopPropagation()}
      >
        {METRICS.map((m) => {
          const on = metric === m;
          return (
            <Press
              key={m}
              onPress={() => setMetric(m)}
              style={{
                height: 44,
                paddingHorizontal: 16,
                borderRadius: 16,
                backgroundColor: on ? C.accentDim : C.card2,
                borderWidth: 1,
                borderColor: on ? C.accent : C.line,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <T style={{ fontSize: 14, fontWeight: '600', color: on ? C.accent : C.muteText }}>{m}</T>
            </Press>
          );
        })}
      </ScrollView>

      {contentWidth > containerWidth && (
        <View style={{ height: 3, backgroundColor: C.track, borderRadius: 1.5, marginTop: 10, width: '100%', overflow: 'hidden' }}>
          <View
            style={{
              height: '100%',
              backgroundColor: C.accent,
              borderRadius: 1.5,
              width: `${thumbWidthPct}%`,
              transform: [{ translateX }],
            }}
          />
        </View>
      )}

      <View style={{ marginTop: 14, alignItems: 'center' }}>
        <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
          {/* 3 Guide lines */}
          {[0, 0.5, 1].map((ratio, idx) => {
            const y = 15 + chartH * ratio;
            const labelVal = Math.round(maxVal * (1 - ratio));
            return (
              <React.Fragment key={idx}>
                <Line x1={padLeft} y1={y} x2={width - 10} y2={y} stroke={C.line} strokeWidth="1" />
                <SvgText x={padLeft - 8} y={y + 4} fill={C.muteText} fontSize="10" textAnchor="end">
                  {metric === 'Puntaje' ? [100, 50, 0][idx] : labelVal}
                </SvgText>
              </React.Fragment>
            );
          })}

          {showEmpty ? (
            <>
              {/* Dashed baseline */}
              <Line x1={padLeft} y1={15 + chartH} x2={width - 10} y2={15 + chartH} stroke={C.segmentOff} strokeWidth="3" strokeDasharray="6,8" />
              <SvgText x={width / 2} y={height / 2 - 10} fill={C.muteText} fontSize="13" textAnchor="middle">
                La gráfica aparece desde tu 3.ª sesión.
              </SvgText>
            </>
          ) : (
            <>
              {/* Polygon fill */}
              {polygonStr ? <Polygon points={polygonStr} fill={C.accent} opacity="0.14" /> : null}
              {/* Line */}
              {series.length > 1 ? (
                <Path d={`M ${series.map((s, i) => `${getX(i, series.length)},${getY(s.value)}`).join(' L ')}`} fill="none" stroke={C.accent} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              ) : null}
              {/* Points */}
              {series.map((s, i) => {
                const x = getX(i, series.length);
                const y = getY(s.value);
                const isLast = i === series.length - 1;
                return (
                  <React.Fragment key={i}>
                    {isLast && <Circle cx={x} cy={y} r="11" fill={C.accent} opacity="0.2" />}
                    <Circle cx={x} cy={y} r={isLast ? 5 : 4} fill={C.accent} />
                  </React.Fragment>
                );
              })}
            </>
          )}

          {/* X Axis labels */}
          <SvgText x={padLeft} y={height - 5} fill={C.muteText} fontSize="10">Inicio</SvgText>
          <SvgText x={width - 10} y={height - 5} fill={C.muteText} fontSize="10" textAnchor="end">Hoy</SvgText>
        </Svg>

        {showEmpty && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}>
            {[1, 2, 3].map((num) => (
              <View
                key={num}
                style={{
                  width: 24,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: totalSessions >= num ? C.accent : C.segmentOff,
                }}
              />
            ))}
            <T mute style={{ fontSize: 12, marginLeft: 8 }}>{totalSessions} de 3 sesiones</T>
          </View>
        )}
      </View>

      <ExercisePicker
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        selectedId={selectedExId}
        allowAll={true}
        onSelectAll={() => setSelectedExId(null)}
        onSelect={(item) => setSelectedExId(item ? item.id : null)}
      />
    </Card>
  );
}

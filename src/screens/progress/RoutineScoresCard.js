import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import { C } from '../../theme';
import { Card, T } from '../../ui';
import { routineScores, movingAverage4w } from '../../recommend';

const trendInfo = (trend) => {
  if (trend === null) return { text: 'sin tendencia', color: C.mute };
  if (trend > 2) return { text: `+${trend} pts`, color: C.accent };
  if (trend < -2) return { text: `${trend} pts`, color: C.danger };
  return { text: `${trend >= 0 ? '+' : ''}${trend} pts`, color: C.warn };
};

export default function RoutineScoresCard({ data }) {
  const routines = routineScores(data);
  const movAvg = movingAverage4w(data);
  const grow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    grow.setValue(0);
    Animated.timing(grow, { toValue: 1, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [routines.length]);

  if (!routines.length) return null;

  return (
    <Card style={{ marginTop: 12, padding: 18 }}>
      <T mute style={{ fontSize: 11, letterSpacing: 1 }}>PUNTAJE POR RUTINA</T>
      <T style={{ fontSize: 18, fontWeight: '700', marginTop: 4 }}>Tu rendimiento por rutina</T>
      <T mute style={{ fontSize: 12, marginTop: 4 }}>Media histórica, última sesión y tendencia de cada rutina.</T>

      {movAvg !== null && (
        <View style={{ marginTop: 12, backgroundColor: C.card2, padding: 12, borderRadius: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <T style={{ fontSize: 13, fontWeight: '600' }}>Promedio móvil (últimas 4 semanas)</T>
          <T style={{ fontSize: 16, fontWeight: '800', color: C.accent }}>{movAvg} pts</T>
        </View>
      )}

      {routines.map((r, index) => {
        const trend = trendInfo(r.trend);
        return (
          <View
            key={r.routineId}
            style={{
              marginTop: index === 0 ? 14 : 12,
              paddingTop: index === 0 ? 0 : 12,
              borderTopWidth: index === 0 ? 0 : 1,
              borderTopColor: C.line,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <T style={{ fontSize: 15, fontWeight: '700' }} numberOfLines={1}>{r.name}</T>
                <T mute style={{ fontSize: 12, marginTop: 2 }}>
                  {r.sessions} {r.sessions === 1 ? 'sesión' : 'sesiones'} · última {r.lastScore} · mejor {r.bestScore}
                </T>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <T style={{ fontSize: 26, fontWeight: '800', color: C.accent, lineHeight: 28 }}>{r.avgScore}</T>
                <T style={{ fontSize: 11, fontWeight: '700', color: trend.color }}>{trend.text}</T>
              </View>
            </View>

            {r.consistency !== null && (
              <View style={{ marginTop: 9 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <T mute style={{ fontSize: 11 }}>Constancia en 4 semanas</T>
                  <T style={{ fontSize: 11, fontWeight: '700' }}>{r.consistency}%</T>
                </View>
                <View style={{ height: 6, borderRadius: 3, backgroundColor: C.track, overflow: 'hidden' }}>
                  <Animated.View
                    style={{
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: C.accent,
                      width: grow.interpolate({ inputRange: [0, 1], outputRange: ['0%', `${r.consistency}%`] }),
                    }}
                  />
                </View>
              </View>
            )}
          </View>
        );
      })}
    </Card>
  );
}

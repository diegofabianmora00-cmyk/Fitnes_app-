import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { C } from '../../theme';
import { Card, Press, T, Btn } from '../../ui';
import { sessionProgress } from '../../recommend';
import SessionDetail from './SessionDetail';

const FILTERS = ['Todas', 'Con comentario', 'Con récord'];

const formatDay = (ms) => {
  const d = new Date(ms);
  return {
    day: d.getDate(),
    month: d.toLocaleDateString('es-DO', { month: 'short' }).toUpperCase().replace('.', ''),
  };
};

const clockMin = (sec) => `${Math.floor((sec || 0) / 60)} min`;

export default function HistoryList({ data }) {
  const workouts = data.workouts || [];
  const [filter, setFilter] = useState('Todas');
  const [limit, setLimit] = useState(10);
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [focusComment, setFocusComment] = useState(false);

  const filtered = workouts.filter((w) => {
    if (filter === 'Con comentario') return !!w.comment;
    if (filter === 'Con récord') return !!(w.prs && w.prs.length > 0);
    return true;
  });

  const visibleWorkouts = filtered.slice(0, limit);
  const hasMore = limit < filtered.length;

  const handlePressCard = (w, focus = false) => {
    setSelectedWorkout(w);
    setFocusComment(focus);
  };

  return (
    <View style={{ marginTop: 22 }}>
      <T style={{ fontSize: 20, fontWeight: '700', marginBottom: 12 }}>Historial</T>

      <ScrollView
        horizontal
        nestedScrollEnabled={true}
        directionalLockEnabled={true}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, marginBottom: 14 }}
        onTouchStart={(e) => e.stopPropagation()}
      >
        {FILTERS.map((f) => {
          const on = filter === f;
          return (
            <Press
              key={f}
              onPress={() => setFilter(f)}
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
              <T style={{ fontSize: 14, fontWeight: '600', color: on ? C.accent : C.muteText }}>{f}</T>
            </Press>
          );
        })}
      </ScrollView>

      {visibleWorkouts.length === 0 ? (
        <Card style={{ padding: 24, alignItems: 'center' }}>
          <T mute>No hay sesiones en este filtro.</T>
        </Card>
      ) : (
        <View style={{ gap: 12 }}>
          {visibleWorkouts.map((w) => {
            const { day, month } = formatDay(w.date);
            const setsCount = (w.exercises || []).flatMap((e) => e.sets || []).filter((s) => !s.unconfirmed).length;
            const diff = sessionProgress(data, w);
            const avanceStr = diff !== null ? `${diff >= 0 ? '+' : ''}${diff} pts` : '';
            const subtitle = `${clockMin(w.durationSec)} · ${(w.exercises || []).length} ejercicios${avanceStr ? ` · ${avanceStr}` : ''}`;
            const scoreVal = w.score?.score || 0;

            // Score circle SVG
            const r = 20;
            const circ = 2 * Math.PI * r;
            const offset = circ - (scoreVal / 100) * circ;

            return (
              <Card key={w.id} style={{ padding: 16 }}>
                <Press onPress={() => handlePressCard(w, false)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  {/* Date block 52x52 */}
                  <View style={{ width: 52, height: 52, borderRadius: 14, backgroundColor: C.accentDim, alignItems: 'center', justifyContent: 'center' }}>
                    <T style={{ fontSize: 18, fontWeight: '800', color: C.accent, lineHeight: 20 }}>{day}</T>
                    <T style={{ fontSize: 10, fontWeight: '700', color: C.accent, textTransform: 'uppercase' }}>{month}</T>
                  </View>

                  <View style={{ flex: 1 }}>
                    <T style={{ fontSize: 16, fontWeight: '700' }} numberOfLines={1}>{w.routineName}</T>
                    <T mute style={{ fontSize: 13, marginTop: 2 }}>{subtitle}</T>
                  </View>

                  {/* Score circle 48x48 */}
                  <View style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}>
                    <Svg width="48" height="48">
                      <Circle cx="24" cy="24" r={r} stroke={C.line} strokeWidth="3" fill="none" />
                      <Circle
                        cx="24"
                        cy="24"
                        r={r}
                        stroke={C.accent}
                        strokeWidth="3"
                        fill="none"
                        strokeDasharray={circ}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        transform="rotate(-90 24 24)"
                      />
                    </Svg>
                    <View style={{ position: 'absolute' }}>
                      <T style={{ fontSize: 15, fontWeight: '800', color: C.accent }}>{scoreVal}</T>
                    </View>
                  </View>
                </Press>

                {/* Separator and comment / add comment */}
                <View style={{ borderTopWidth: 1, borderTopColor: C.line, marginTop: 12, paddingTop: 10 }}>
                  {w.comment ? (
                    <Press onPress={() => handlePressCard(w, true)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Ionicons name="chatbubble-outline" size={16} color={C.accent} />
                      <T style={{ flex: 1, fontSize: 13, color: C.softText }} numberOfLines={2}>{w.comment}</T>
                    </Press>
                  ) : (
                    <Press onPress={() => handlePressCard(w, true)}>
                      <T mute style={{ fontSize: 13 }}>+ Añadir comentario</T>
                    </Press>
                  )}
                </View>
              </Card>
            );
          })}
        </View>
      )}

      {hasMore && (
        <View style={{ alignItems: 'center', marginTop: 16 }}>
          <Press
            onPress={() => setLimit((l) => l + 10)}
            style={{ height: 44, paddingHorizontal: 24, borderRadius: 18, backgroundColor: C.card2, borderWidth: 1, borderColor: C.line, alignItems: 'center', justifyContent: 'center' }}
          >
            <T style={{ fontSize: 14, fontWeight: '600', color: C.text }}>Cargar más sesiones</T>
          </Press>
        </View>
      )}

      <SessionDetail
        visible={!!selectedWorkout}
        workout={selectedWorkout}
        initialFocusComment={focusComment}
        onClose={() => setSelectedWorkout(null)}
      />
    </View>
  );
}

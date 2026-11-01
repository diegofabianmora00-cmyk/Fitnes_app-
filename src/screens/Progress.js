import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { C } from '../theme';
import { Card, FadeIn, H, Press, T } from '../ui';
import { toU, useStore } from '../store';
import { exerciseById, workoutKcal } from '../exercises';
import { recommendFor } from '../recommend';

const fmt = (ms) => new Date(ms).toLocaleDateString('es-DO', { day: 'numeric', month: 'short' });
const ACTION_LABEL = {
  up: 'Listo para subir',
  maintain: 'Mantenlo',
  stall: 'Revisar estancamiento',
  start: 'Sin historial',
};

export default function Progress() {
  const { data } = useStore();
  const u = data.unit, ws = data.workouts;
  const [sel, setSel] = useState(null);
  const bodyKg = Number(data.profile && data.profile.weightKg) || 0;
  const exs = [...new Map(ws.flatMap((w) => w.exercises).map((e) => [e.exId, e.name])).entries()];
  const cur = sel || (exs[0] && exs[0][0]);
  const recs = exs.map(([id, name]) => {
    const db = exerciseById(id);
    const last = ws.find((w) => w.exercises.some((e) => e.exId === id));
    const lastEx = last && last.exercises.find((e) => e.exId === id);
    return {
      id,
      name,
      rec: recommendFor(data, {
        id,
        name,
        group: db ? db.group : '',
        type: db ? db.type : 'compuesto',
        reps: Number(lastEx && lastEx.targetReps) || 8,
      }),
    };
  });
  const stalled = recs.filter((r) => r.rec.action === 'stall');
  const series = ws.filter((w) => w.exercises.some((e) => e.exId === cur)).slice(0, 8).reverse()
    .map((w) => {
      const e = w.exercises.find((x) => x.exId === cur);
      const sets = (e.sets || []).filter((s) => !s.unconfirmed);
      return sets.length ? { date: w.date, v: Math.max(...sets.map((s) => Number(s.w) || 0)) } : null;
    })
    .filter(Boolean);
  const max = Math.max(1, ...series.map((s) => s.v));
  const count = (days) => ws.filter((w) => Date.now() - w.date < days * 864e5).length;
  const kcal7 = ws.filter((w) => Date.now() - w.date < 7 * 864e5).reduce((a, w) => a + workoutKcal(w, bodyKg), 0);
  const curRec = recs.find((r) => r.id === cur);

  if (!ws.length) {
    return (
      <View style={{ width: '100%', padding: 22 }}>
        <H>Progreso</H>
        <Card style={{ marginTop: 16 }}><T mute>Cuando registres tu primer entrenamiento, aquí verás tu evolución.</T></Card>
      </View>
    );
  }

  return (
    <ScrollView style={{ width: '100%' }} contentContainerStyle={{ padding: 22, paddingBottom: 30 }} showsVerticalScrollIndicator={false}>
      <FadeIn><H>Progreso</H></FadeIn>
      <FadeIn delay={80}>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
          {[['7 días', count(7)], ['30 días', count(30)], ['kcal · 7 d', bodyKg ? kcal7 : '—']].map(([l, n]) => (
            <Card key={l} style={{ flex: 1 }}>
              <T style={{ fontSize: 30, fontWeight: '700', color: C.accent }}>{n}</T>
              <T mute style={{ fontSize: 12 }}>{l === 'kcal · 7 d' ? 'kcal · 7 días' : `entrenos · ${l}`}</T>
            </Card>
          ))}
        </View>
      </FadeIn>

      {!!stalled.length && (
        <FadeIn delay={120}>
          <Card style={{ marginTop: 12 }}>
            <T mute style={{ fontSize: 11, letterSpacing: 1, marginBottom: 4 }}>POR REVISAR</T>
            {stalled.map((s, i) => (
              <Press key={s.id} onPress={() => setSel(s.id)} style={{ paddingVertical: 8, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: C.line }} hitSlop={4}>
                <T style={{ fontWeight: '600' }}>{s.name}</T>
                <T mute style={{ fontSize: 12, marginTop: 2 }}>{s.rec.text}</T>
              </Press>
            ))}
          </Card>
        </FadeIn>
      )}

      <FadeIn delay={160}>
        <Card style={{ marginTop: 12 }}>
          <T mute>Peso máximo por sesión ({u})</T>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10, marginBottom: 6 }}>
            {exs.map(([id, name]) => (
              <Press key={id} onPress={() => setSel(id)} style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 14, marginRight: 8, backgroundColor: id === cur ? C.accentDim : C.card2 }}>
                <T style={{ color: id === cur ? C.accent : C.mute, fontSize: 14 }}>{name}</T>
              </Press>
            ))}
          </ScrollView>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', height: 150, marginTop: 8 }}>
            {series.map((s, i) => (
              <View key={i} style={{ alignItems: 'center', width: 30 }}>
                <T mute style={{ fontSize: 11, marginBottom: 4 }}>{toU(s.v, u)}</T>
                <View style={{ width: 22, height: 8 + (s.v / max) * 90, borderRadius: 8, backgroundColor: i === series.length - 1 ? C.accent : C.line }} />
                <T mute style={{ fontSize: 10, marginTop: 6 }}>{fmt(s.date)}</T>
              </View>
            ))}
          </View>
          {curRec && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 10 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: curRec.rec.action === 'up' ? C.accent : curRec.rec.action === 'stall' ? C.warn : C.mute }} />
              <T mute style={{ fontSize: 12 }}>{ACTION_LABEL[curRec.rec.action]}</T>
            </View>
          )}
        </Card>
      </FadeIn>

      <T mute style={{ marginTop: 22, marginBottom: 4 }}>Historial</T>
      {ws.slice(0, 15).map((w, i) => {
        const sets = w.exercises.flatMap((e) => e.sets || []).filter((s) => !s.unconfirmed);
        const kcal = workoutKcal(w, bodyKg);
        return (
          <FadeIn key={w.id} delay={240 + i * 40}>
            <Card style={{ marginTop: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <T style={{ fontWeight: '600', fontSize: 16 }}>{w.routineName}</T>
                <T mute style={{ marginTop: 2 }}>{fmt(w.date)} · {sets.length} series{kcal ? ` · ≈${kcal} kcal` : ''}</T>
              </View>
              <T mute>{Math.round(toU(sets.reduce((a, s) => a + (Number(s.w) || 0) * (Number(s.r) || 0), 0), u))} {u}</T>
            </Card>
          </FadeIn>
        );
      })}
    </ScrollView>
  );
}

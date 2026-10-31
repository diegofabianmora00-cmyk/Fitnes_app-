import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { C } from '../theme';
import { Card, FadeIn, H, Press, T } from '../ui';
import { toU, useStore } from '../store';

const fmt = (ms) => new Date(ms).toLocaleDateString('es-DO', { day: 'numeric', month: 'short' });

export default function Progress() {
  const { data } = useStore();
  const u = data.unit, ws = data.workouts;
  const [sel, setSel] = useState(null);
  const exs = [...new Map(ws.flatMap((w) => w.exercises).map((e) => [e.exId, e.name])).entries()];
  const cur = sel || (exs[0] && exs[0][0]);
  const series = ws.filter((w) => w.exercises.some((e) => e.exId === cur)).slice(0, 8).reverse()
    .map((w) => ({ date: w.date, v: Math.max(...w.exercises.find((e) => e.exId === cur).sets.map((s) => s.w)) }));
  const max = Math.max(1, ...series.map((s) => s.v));
  const count = (days) => ws.filter((w) => Date.now() - w.date < days * 864e5).length;

  if (!ws.length) {
    return (
      <View style={{ padding: 22 }}>
        <H>Progreso</H>
        <Card style={{ marginTop: 16 }}><T mute>Cuando registres tu primer entrenamiento, aquí verás tu evolución.</T></Card>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 22, paddingBottom: 30 }} showsVerticalScrollIndicator={false}>
      <FadeIn><H>Progreso</H></FadeIn>
      <FadeIn delay={80}>
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 14 }}>
          {[['7 días', count(7)], ['30 días', count(30)]].map(([l, n]) => (
            <Card key={l} style={{ flex: 1 }}>
              <T style={{ fontSize: 34, fontWeight: '700', color: C.accent }}>{n}</T>
              <T mute>entrenos · {l}</T>
            </Card>
          ))}
        </View>
      </FadeIn>

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
        </Card>
      </FadeIn>

      <T mute style={{ marginTop: 22, marginBottom: 4 }}>Historial</T>
      {ws.slice(0, 15).map((w, i) => (
        <FadeIn key={w.id} delay={240 + i * 40}>
          <Card style={{ marginTop: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <T style={{ fontWeight: '600', fontSize: 16 }}>{w.routineName}</T>
              <T mute style={{ marginTop: 2 }}>{fmt(w.date)} · {w.exercises.reduce((a, e) => a + e.sets.length, 0)} series</T>
            </View>
            <T mute>{Math.round(toU(w.exercises.reduce((a, e) => a + e.sets.reduce((b, s) => b + s.w * s.r, 0), 0), u))} {u}</T>
          </Card>
        </FadeIn>
      ))}
    </ScrollView>
  );
}

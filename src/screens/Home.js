import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { C } from '../theme';
import { Btn, Card, FadeIn, H, Press, T } from '../ui';
import Coach, { COACH } from '../Coach';
import { useStore } from '../store';
import { coachMessage, weekSummary } from '../recommend';
import { calculateFacts, getCoachMessage } from '../coachMemory';
import RuleInfo from '../RuleInfo';

export default function Home({ go, start, isActive }) {
  const { data, update } = useStore();
  const [why, setWhy] = useState(null);
  const [coachMsg, setCoachMsg] = useState(null);
  const lastIdRef = useRef(null);

  useEffect(() => {
    if (isActive === false) return;
    try {
      const facts = calculateFacts(data);
      const tone = data.profile?.tone || 'tranquilo';
      const recent = data.coachMemory || [];
      const ctx = facts.daysSinceLast >= 3 ? 'regreso_ausencia' : 'inicio';
      const res = getCoachMessage(ctx, facts, tone, recent);
      const mood = facts.daysSinceLast >= 3 ? 'alert' : (facts.improvedExercises?.length ? 'happy' : 'neutral');
      if (lastIdRef.current !== res.id) {
        lastIdRef.current = res.id;
        setCoachMsg({ mood, text: res.texto, rule: null, rules: [] });
        update(d => {
          const mem = [...(d.coachMemory || []), res.id].slice(-8);
          if (d.coachMemory && d.coachMemory[d.coachMemory.length - 1] === res.id) return d;
          return { ...d, coachMemory: mem };
        });
      }
    } catch (e) {}
  }, [isActive, data.profile?.tone]);

  const fallbackMsg = coachMessage(data);
  const msg = coachMsg || fallbackMsg;
  const summary = weekSummary(data);
  const next = data.routines.length ? data.routines[data.workouts.length % data.routines.length] : null;

  const now = new Date();
  const mon = new Date(now); mon.setHours(0, 0, 0, 0); mon.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  const weekDays = 'LMXJVSD'.split('').map((l, i) => {
    const a = mon.getTime() + i * 864e5;
    return { l, done: data.workouts.some((w) => w.date >= a && w.date < a + 864e5) };
  });
  const date = now.toLocaleDateString('es-DO', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <>
    <ScrollView style={{ width: '100%' }} contentContainerStyle={{ padding: 22, paddingBottom: 30 }} showsVerticalScrollIndicator={false}>
      <FadeIn>
        <T mute style={{ textTransform: 'capitalize' }}>{date}</T>
        <H style={{ marginTop: 2 }}>Hoy toca entrenar</H>
      </FadeIn>

      <View style={{ alignItems: 'center', marginTop: 10 }}>
        <Coach mood={msg.mood} />
      </View>
      <FadeIn key={msg.text} delay={150}>
        <Card style={{ marginTop: 4 }}>
          <T mute style={{ fontSize: 12, letterSpacing: 1, marginBottom: 6 }}>{COACH.name.toUpperCase()}</T>
          <T style={{ fontSize: 17, lineHeight: 24 }}>{msg.text}</T>
          {!!(msg.rules && msg.rules.length) && (
            <Press
              onPress={() => setWhy(msg.rules)}
              hitSlop={12}
              style={{ marginTop: 10, alignSelf: 'flex-start' }}
            >
              <T style={{ fontSize: 12, color: C.accent, fontWeight: '600' }}>¿Por qué digo esto?</T>
            </Press>
          )}
        </Card>
      </FadeIn>

      <FadeIn delay={250}>
        <Card style={{ marginTop: 14 }}>
          {next ? (
            <>
              <T mute>Siguiente rutina</T>
              <T style={{ fontSize: 22, fontWeight: '700', marginTop: 2 }}>{next.name}</T>
              <T mute style={{ marginTop: 4 }}>{next.exercises.length} ejercicios</T>
              <Btn label="Empezar entrenamiento" onPress={() => start(next)} style={{ marginTop: 16 }} />
            </>
          ) : (
            <>
              <T>Aún no tienes rutinas.</T>
              <Btn label="Crear una rutina" kind="ghost" onPress={() => go('routines')} style={{ marginTop: 14 }} />
            </>
          )}
        </Card>
      </FadeIn>

      <FadeIn delay={350}>
        <Card style={{ marginTop: 14 }}>
          <T mute style={{ marginBottom: 12 }}>Esta semana</T>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            {weekDays.map((d, i) => (
              <View key={i} style={{ alignItems: 'center', gap: 6 }}>
                <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: d.done ? C.accent : C.card2 }} />
                <T mute style={{ fontSize: 12 }}>{d.l}</T>
              </View>
            ))}
          </View>
          <T mute style={{ fontSize: 12, lineHeight: 18, marginTop: 12 }}>
            {summary.sessions} de {summary.target} entrenos esta semana
            {summary.prs ? ` · ${summary.prs} récord${summary.prs === 1 ? '' : 's'}` : ''}
            {summary.up ? ` · ${summary.up} listo${summary.up === 1 ? '' : 's'} para subir` : ''}
            {summary.stall ? ` · ${summary.stall} por revisar` : ''}
          </T>
        </Card>
      </FadeIn>
    </ScrollView>
    <RuleInfo visible={!!why} rules={why || []} onClose={() => setWhy(null)} />
    </>
  );
}

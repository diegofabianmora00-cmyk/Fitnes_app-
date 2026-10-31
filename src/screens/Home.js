import React from 'react';
import { ScrollView, View } from 'react-native';
import { C } from '../theme';
import { Btn, Card, FadeIn, H, T } from '../ui';
import Coach, { COACH } from '../Coach';
import { coachMessage, useStore } from '../store';

export default function Home({ go, start }) {
  const { data } = useStore();
  const msg = coachMessage(data);
  const next = data.routines.length ? data.routines[data.workouts.length % data.routines.length] : null;

  const now = new Date();
  const mon = new Date(now); mon.setHours(0, 0, 0, 0); mon.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  const week = 'LMXJVSD'.split('').map((l, i) => {
    const a = mon.getTime() + i * 864e5;
    return { l, done: data.workouts.some((w) => w.date >= a && w.date < a + 864e5) };
  });
  const date = now.toLocaleDateString('es-DO', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <ScrollView contentContainerStyle={{ padding: 22, paddingBottom: 30 }} showsVerticalScrollIndicator={false}>
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
            {week.map((d, i) => (
              <View key={i} style={{ alignItems: 'center', gap: 6 }}>
                <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: d.done ? C.accent : C.card2 }} />
                <T mute style={{ fontSize: 12 }}>{d.l}</T>
              </View>
            ))}
          </View>
        </Card>
      </FadeIn>
    </ScrollView>
  );
}

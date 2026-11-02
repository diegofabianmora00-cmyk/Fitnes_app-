import React from 'react';
import { View } from 'react-native';
import { C } from '../../theme';
import { Card, T } from '../../ui';
import { streakInfo, weekSummary } from '../../recommend';

export default function QuickSummary({ data }) {
  const workouts = data.workouts || [];
  if (workouts.length === 0) return null;

  const streak = streakInfo(data).current;
  const summary = weekSummary(data);
  const lastWorkout = workouts[0];
  const lastScore = lastWorkout?.score?.score ?? '—';

  return (
    <Card style={{ marginTop: 14, paddingVertical: 14, paddingHorizontal: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <T style={{ fontSize: 20, fontWeight: '800', color: C.accent }}>{streak}</T>
          <T mute style={{ fontSize: 12, marginTop: 2, textAlign: 'center' }}>días de racha</T>
        </View>

        <View style={{ width: 1, height: 32, backgroundColor: C.line }} />

        <View style={{ flex: 1, alignItems: 'center' }}>
          <T style={{ fontSize: 20, fontWeight: '800', color: C.text }}>{summary.sessions}/{summary.target}</T>
          <T mute style={{ fontSize: 12, marginTop: 2, textAlign: 'center' }}>esta semana</T>
        </View>

        <View style={{ width: 1, height: 32, backgroundColor: C.line }} />

        <View style={{ flex: 1, alignItems: 'center' }}>
          <T style={{ fontSize: 20, fontWeight: '800', color: C.text }}>{lastScore}</T>
          <T mute style={{ fontSize: 12, marginTop: 2, textAlign: 'center' }}>último puntaje</T>
        </View>
      </View>
    </Card>
  );
}

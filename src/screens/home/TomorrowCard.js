import React from 'react';
import { View } from 'react-native';
import { C } from '../../theme';
import { Btn, Card, Press, T } from '../../ui';
import { routineEstimate, nextWeightHint } from '../../recommend';

export default function TomorrowCard({ data, nextRoutineInfo, onGoRoutines }) {
  if (!nextRoutineInfo) {
    return (
      <Card style={{ marginTop: 14, padding: 18 }}>
        <T style={{ fontSize: 16, fontWeight: '700', color: C.text, marginBottom: 8 }}>Aún no tienes rutinas programadas.</T>
        <T mute style={{ fontSize: 13, lineHeight: 18, marginBottom: 16 }}>Programa días en tus rutinas para que Atlas te guíe cada jornada.</T>
        <Btn label="Ver o crear rutinas" onPress={onGoRoutines} style={{ minHeight: 56, borderRadius: 24 }} />
      </Card>
    );
  }

  const { routine, date, daysAway } = nextRoutineInfo;
  const estimate = routineEstimate(data, routine);
  const hintText = nextWeightHint(data, routine);

  const dayLabel = daysAway === 1 ? 'MAÑANA' : date.toLocaleDateString('es-DO', { weekday: 'long' }).toUpperCase();
  const dayNum = date.getDate();
  const monthName = date.toLocaleDateString('es-DO', { month: 'short' }).replace('.', '').toUpperCase();

  const estText = estimate.minutes
    ? `${estimate.exercises} ejercicios · ~${estimate.minutes} min`
    : `${estimate.exercises} ejercicios`;

  const btnLabel = daysAway === 1 ? 'Ver rutina de mañana' : `Ver rutina del ${date.toLocaleDateString('es-DO', { weekday: 'long' })}`;

  return (
    <Card style={{ marginTop: 14, padding: 16 }}>
      <T mute style={{ fontSize: 12, fontWeight: '600', letterSpacing: 1.4, marginBottom: 12, textTransform: 'uppercase' }}>
        {dayLabel}
      </T>

      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
        <View style={{ width: 52, height: 52, borderRadius: 14, backgroundColor: C.accentDim, alignItems: 'center', justifyContent: 'center' }}>
          <T style={{ fontSize: 18, fontWeight: '800', color: C.accent, lineHeight: 20 }}>{dayNum}</T>
          <T style={{ fontSize: 10, fontWeight: '700', color: C.accent, letterSpacing: 0.6, textTransform: 'uppercase' }}>{monthName}</T>
        </View>
        <View style={{ flex: 1, marginLeft: 14 }}>
          <T style={{ fontSize: 16, fontWeight: '700', color: C.text }}>{routine.name}</T>
          <T mute style={{ fontSize: 13, marginTop: 2 }}>{estText}</T>
        </View>
      </View>

      <View style={{ height: 1, backgroundColor: C.line, marginBottom: 12 }} />

      <T style={{ fontSize: 13, color: C.softText, lineHeight: 19, marginBottom: 16 }}>
        {hintText}
      </T>

      <Btn label={btnLabel} onPress={onGoRoutines} style={{ minHeight: 56, borderRadius: 24, marginBottom: 8 }} />
      <Press onPress={onGoRoutines} style={{ minHeight: 44, alignItems: 'center', justifyContent: 'center' }} accessibilityLabel="Ver o crear rutinas">
        <T style={{ fontSize: 14, fontWeight: '600', color: C.softText }}>Ver o crear rutinas</T>
      </Press>
    </Card>
  );
}

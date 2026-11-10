import React from 'react';
import { View } from 'react-native';
import { C } from '../../theme';
import { Card, Press, T } from '../../ui';
import Coach from '../../Coach';
import { coachMessage, recommendFor } from '../../recommend';
import { exerciseById } from '../../exercises';

export default function CoachCard({ data, onSelectExercise }) {
  const msg = coachMessage(data);
  const workouts = data.workouts || [];
  
  let stalledEx = null;
  if (workouts.length > 0) {
    const uniqueExIds = [...new Set(workouts.flatMap((w) => (w.exercises || []).map((e) => e.exId)))];
    for (const exId of uniqueExIds) {
      const db = exerciseById(exId);
      const name = db ? db.name : 'Ejercicio';
      const last = workouts.find((w) => (w.exercises || []).some((e) => e.exId === exId));
      const lastEx = last && last.exercises.find((e) => e.exId === exId);
      const rec = recommendFor(data, {
        id: exId,
        name,
        group: db ? db.group : '',
        type: db ? db.type : 'compuesto',
        reps: Number(lastEx && lastEx.targetReps) || 8,
      });
      if (rec.action === 'stall') {
        stalledEx = { id: exId, name, rec };
        break;
      }
    }
  }

  return (
    <View style={{ gap: 12, marginTop: 12 }}>
      <Card style={{ padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: C.card2, borderWidth: 1, borderColor: C.line, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          <Coach mood={msg.mood || 'neutral'} size="sm" />
        </View>
        <T style={{ flex: 1, fontSize: 14, color: C.softText, lineHeight: 20 }}>{msg.text}</T>
      </Card>

      {stalledEx && (
        <Card style={{ padding: 16, flexDirection: 'row', gap: 14, alignItems: 'flex-start' }}>
          <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: C.card2, borderWidth: 1, borderColor: C.line, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            <Coach mood="alert" size="sm" />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ alignSelf: 'flex-start', backgroundColor: C.amberDim, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4, marginBottom: 6 }}>
              <T style={{ fontSize: 11, fontWeight: '700', color: C.amber, letterSpacing: 0.06 * 11 }}>SIN AVANCE</T>
            </View>
            <T style={{ fontSize: 16, fontWeight: '700' }}>{stalledEx.name}</T>
            <T mute style={{ fontSize: 13, lineHeight: 19, marginTop: 4 }}>{stalledEx.rec.text}</T>
            <Press
              onPress={() => onSelectExercise && onSelectExercise(stalledEx.id)}
              style={{ alignSelf: 'flex-start', marginTop: 10 }}
            >
              <T style={{ fontSize: 13, fontWeight: '600', color: C.accent }}>Ver ejercicio</T>
            </Press>
          </View>
        </Card>
      )}
    </View>
  );
}

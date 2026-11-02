import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C } from '../../theme';
import { Card, Press, T } from '../../ui';

export default function TodayGoal({ nextRoutineInfo, checkin, onCheckin }) {
  let title = 'Recuperar y recargar';
  if (nextRoutineInfo) {
    if (nextRoutineInfo.daysAway === 1) {
      title = 'Recuperar para mañana';
    } else {
      const dayName = nextRoutineInfo.date.toLocaleDateString('es-DO', { weekday: 'long' });
      title = `Recuperar para el ${dayName}`;
    }
  }

  const levels = [
    { id: 'bien', label: 'Bien' },
    { id: 'normal', label: 'Normal' },
    { id: 'cansado', label: 'Cansado' },
  ];

  return (
    <Card style={{ marginTop: 14, padding: 18 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <T mute style={{ fontSize: 12, fontWeight: '600', letterSpacing: 1.4, textTransform: 'uppercase' }}>META DE HOY</T>
        <View style={{ backgroundColor: C.accentDim, borderRadius: 12, paddingVertical: 6, paddingHorizontal: 10 }}>
          <T style={{ fontSize: 13, fontWeight: '700', color: C.accent }}>Descanso</T>
        </View>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
        <View style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: C.accentDim, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="cafe-outline" size={24} color={C.accent} />
        </View>
        <View style={{ flex: 1, marginLeft: 14 }}>
          <T style={{ fontSize: 20, fontWeight: '700', lineHeight: 24, color: C.text }}>{title}</T>
          <T style={{ fontSize: 13, color: C.softText, lineHeight: 18, marginTop: 3 }}>
            Sin rutina hoy. Tu cuerpo se recupera mientras descansas.
          </T>
        </View>
      </View>

      <View style={{ height: 1, backgroundColor: C.line, marginVertical: 14 }} />

      <T style={{ fontSize: 14, fontWeight: '600', color: C.text, marginBottom: 10 }}>¿Cómo te sientes hoy?</T>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {levels.map((lvl) => {
          const selected = checkin === lvl.id;
          return (
            <Press
              key={lvl.id}
              onPress={() => onCheckin(selected ? null : lvl.id)}
              style={{
                flex: 1,
                height: 44,
                borderRadius: 16,
                backgroundColor: selected ? C.accentDim : C.card2,
                borderWidth: 1,
                borderColor: selected ? C.accent : C.line,
                alignItems: 'center',
                justifyContent: 'center',
              }}
              accessibilityLabel={`Me siento ${lvl.label}`}
              accessibilityState={{ selected }}
            >
              <T style={{ fontSize: 14, fontWeight: '700', color: selected ? C.accent : C.softText }}>{lvl.label}</T>
            </Press>
          );
        })}
      </View>
      <T mute style={{ fontSize: 12, color: C.mute, marginTop: 10 }}>Atlas lo tendrá presente.</T>
    </Card>
  );
}

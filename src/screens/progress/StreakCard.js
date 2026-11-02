import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C } from '../../theme';
import { Card, T } from '../../ui';
import { streakInfo } from '../../recommend';

export default function StreakCard({ data }) {
  const info = streakInfo(data);
  const current = info.current;
  const best = info.best;

  return (
    <Card style={{ padding: 18, marginTop: 12 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1 }}>
          <T mute style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.12 * 13 }}>Racha actual</T>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 4, gap: 8 }}>
            <T style={{ fontSize: 64, fontWeight: '800', color: current > 0 ? C.accent : C.dimNum, lineHeight: 70 }}>{current}</T>
            <T style={{ fontSize: 16, color: C.softText, fontWeight: '600' }}>días</T>
          </View>
        </View>
        <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: C.accentDim, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="flame-outline" size={28} color={C.accent} />
        </View>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, gap: 6 }}>
        {(info.week || []).map((w, i) => {
          const isTrained = w.state === 'trained';
          const isToday = w.state === 'today';
          const bg = isTrained ? C.accent : isToday ? C.accentDim : 'transparent';
          const fg = isTrained ? C.accentText : isToday ? C.accent : C.muteText;
          const border = isToday ? C.accent : !isTrained ? C.borderDashed : 'transparent';
          return (
            <View
              key={i}
              style={{
                width: 34,
                height: 34,
                borderRadius: 12,
                backgroundColor: bg,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: !isTrained ? 1 : 0,
                borderColor: border,
              }}
            >
              <T style={{ fontSize: 12, fontWeight: '700', color: fg }}>{w.day}</T>
            </View>
          );
        })}
      </View>

      <T mute style={{ fontSize: 13, lineHeight: 18, marginTop: 14 }}>
        Los días de descanso no cortan la racha. Solo cuenta si faltaste a un día de entreno.
      </T>

      <View style={{ borderTopWidth: 1, borderTopColor: C.line, marginTop: 14, paddingTop: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <T mute style={{ fontSize: 13 }}>Mejor racha</T>
        <T style={{ fontSize: 15, fontWeight: '700', color: C.text }}>{best} días</T>
      </View>
    </Card>
  );
}

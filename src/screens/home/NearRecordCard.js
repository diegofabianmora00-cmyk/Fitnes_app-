import React from 'react';
import { View } from 'react-native';
import { C } from '../../theme';
import { Card, T } from '../../ui';
import { toU } from '../../store';

export default function NearRecordCard({ recordInfo, unit }) {
  if (!recordInfo) return null;

  const { name, prKg, prReps, recentKg, gapKg, ratio } = recordInfo;
  const unitLabel = unit || 'kg';
  const prDisplay = prKg > 0 ? `${toU(prKg, unitLabel)} ${unitLabel} × ${prReps}` : `${prReps} reps`;
  const gapDisplay = `${toU(gapKg, unitLabel)} ${unitLabel}`;
  const pct = Math.min(100, Math.max(0, Math.round(ratio * 100)));

  return (
    <Card style={{ marginTop: 14, padding: 16 }}>
      <T mute style={{ fontSize: 12, fontWeight: '600', letterSpacing: 1.4, marginBottom: 8, textTransform: 'uppercase' }}>
        CERCA DE UN RÉCORD
      </T>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <View style={{ flex: 1, marginRight: 12 }}>
          <T style={{ fontSize: 16, fontWeight: '700', color: C.text }}>{name}</T>
          <T mute style={{ fontSize: 12, marginTop: 2 }}>Récord: {prDisplay}</T>
        </View>
        <View style={{ backgroundColor: C.accentDim, borderRadius: 12, paddingVertical: 6, paddingHorizontal: 10 }}>
          <T style={{ fontSize: 13, fontWeight: '700', color: C.accent }}>Faltan {gapDisplay}</T>
        </View>
      </View>

      <View style={{ height: 8, borderRadius: 4, backgroundColor: C.track, overflow: 'hidden' }}>
        <View style={{ height: '100%', width: `${pct}%`, backgroundColor: C.accent, borderRadius: 4 }} />
      </View>
    </Card>
  );
}

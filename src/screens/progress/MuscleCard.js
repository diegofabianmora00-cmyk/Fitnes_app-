import React from 'react';
import { View } from 'react-native';
import { C } from '../../theme';
import { Card, T } from '../../ui';
import { muscleShare, periodRange } from '../../recommend';

export default function MuscleCard({ data, rango }) {
  const share = muscleShare(data, rango);

  if (share.length === 0) return null;

  return (
    <Card style={{ padding: 18, marginTop: 12 }}>
      <T mute style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.12 * 13, marginBottom: 14 }}>Músculos trabajados</T>
      <View style={{ gap: 14 }}>
        {share.map((item, idx) => (
          <View key={idx}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <T style={{ fontSize: 13, color: C.softText, fontWeight: '600' }}>{item.group}</T>
              <T mute style={{ fontSize: 13 }}>{item.pct}%</T>
            </View>
            <View style={{ height: 8, borderRadius: 4, backgroundColor: C.segmentOff }}>
              <View style={{ height: 8, borderRadius: 4, width: `${item.pct}%`, backgroundColor: C.accent }} />
            </View>
          </View>
        ))}
      </View>
    </Card>
  );
}

import React from 'react';
import { View } from 'react-native';
import { C } from '../../theme';
import { Card, T } from '../../ui';
import { personalRecords } from '../../recommend';
import { toU } from '../../store';

const fmtDate = (ms) => {
  if (!ms) return '—';
  return new Date(ms).toLocaleDateString('es-DO', { day: 'numeric', month: 'short', year: 'numeric' });
};

export default function PrCard({ data }) {
  const prsObj = personalRecords(data);
  const prsList = Object.values(prsObj).sort((a, b) => (b.date || 0) - (a.date || 0)).slice(0, 3);
  const unit = data.unit || 'kg';

  if (prsList.length === 0) return null;

  return (
    <Card style={{ padding: 18, marginTop: 12 }}>
      <T mute style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.12 * 13, marginBottom: 14 }}>Récords personales</T>
      <View style={{ gap: 14 }}>
        {prsList.map((pr, idx) => {
          const weightStr = pr.weightKg > 0 ? `${toU(pr.weightKg, unit)} ${unit}` : 'peso corporal';
          const text = pr.weightKg > 0 ? `${weightStr} × ${pr.reps}` : `${pr.reps} reps`;
          return (
            <View key={`${pr.exId}-${idx}`} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <T style={{ fontSize: 15, fontWeight: '700' }}>{pr.name || 'Ejercicio'}</T>
                <T mute style={{ fontSize: 12, marginTop: 2 }}>{fmtDate(pr.date)}</T>
              </View>
              <T style={{ fontSize: 16, fontWeight: '700', color: C.accent }}>{text}</T>
            </View>
          );
        })}
      </View>
    </Card>
  );
}

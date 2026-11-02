import React from 'react';
import { View } from 'react-native';
import { H, T } from '../../ui';

export default function DayHeader({ title = 'Hoy toca descansar' }) {
  const now = new Date();
  const date = now.toLocaleDateString('es-DO', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <View style={{ marginBottom: 4 }}>
      <T mute style={{ textTransform: 'capitalize', fontSize: 14, fontWeight: '500' }}>{date}</T>
      <H style={{ marginTop: 2, fontSize: 30, fontWeight: '800', letterSpacing: -0.6, lineHeight: 33 }}>{title}</H>
    </View>
  );
}

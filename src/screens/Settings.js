import React, { useState } from 'react';
import { Alert, ScrollView, Share, View } from 'react-native';
import { C } from '../theme';
import { Btn, Card, FadeIn, H, Press, T } from '../ui';
import { toU, useStore } from '../store';
import { GOALS, LEVELS, REST_STYLES, labelOf } from '../recommend';
import ProfileSetup from './ProfileSetup';

export default function Settings() {
  const { data, update } = useStore();
  const [edit, setEdit] = useState(false);
  const p = data.profile || {};
  const reset = () => Alert.alert('Borrar todo', 'Se eliminarán rutinas e historial.', [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Borrar', style: 'destructive', onPress: () => update((d) => ({ ...d, routines: [], workouts: [] })) },
  ]);
  return (
    <ScrollView contentContainerStyle={{ padding: 22 }}>
      <FadeIn><H>Ajustes</H></FadeIn>
      <FadeIn delay={80}>
        <Card style={{ marginTop: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <T mute>Mi perfil</T>
            <Press onPress={() => setEdit(true)}><T style={{ color: C.accent, fontWeight: '600' }}>Editar</T></Press>
          </View>
          <T style={{ fontSize: 20, fontWeight: '700', marginTop: 8 }}>
            {labelOf(GOALS, p.goal)} · {labelOf(LEVELS, p.level)}
          </T>
          <T mute style={{ marginTop: 4 }}>
            {p.weightKg ? `${toU(p.weightKg, data.unit)} ${data.unit}` : 'Sin peso'} · {p.daysPerWeek || '—'} días/semana · descanso {labelOf(REST_STYLES, p.restStyle).toLowerCase()}
          </T>
        </Card>
      </FadeIn>
      <FadeIn delay={160}>
        <Card style={{ marginTop: 14 }}>
          <T mute style={{ marginBottom: 12 }}>Unidad de peso</T>
          <View style={{ flexDirection: 'row', backgroundColor: C.card2, borderRadius: 14, padding: 4 }}>
            {['kg', 'lb'].map((u) => (
              <Press key={u} onPress={() => update((d) => ({ ...d, unit: u }))} style={{ flex: 1, paddingVertical: 10, borderRadius: 11, alignItems: 'center', backgroundColor: data.unit === u ? C.accent : 'transparent' }}>
                <T style={{ fontWeight: '700', color: data.unit === u ? '#06120D' : C.mute }}>{u}</T>
              </Press>
            ))}
          </View>
        </Card>
      </FadeIn>
      <FadeIn delay={240}>
        <Btn kind="ghost" label="Exportar datos" onPress={() => Share.share({ message: JSON.stringify(data, null, 2) })} style={{ marginTop: 14 }} />
        <Btn kind="ghost" label="Borrar todos los datos" onPress={reset} style={{ marginTop: 10 }} />
      </FadeIn>
      {edit && <ProfileSetup mode="edit" onDone={() => setEdit(false)} />}
    </ScrollView>
  );
}

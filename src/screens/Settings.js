import React from 'react';
import { Alert, ScrollView, Share, View } from 'react-native';
import { C } from '../theme';
import { Btn, Card, FadeIn, H, Press, T } from '../ui';
import { useStore } from '../store';

export default function Settings() {
  const { data, update } = useStore();
  const reset = () => Alert.alert('Borrar todo', 'Se eliminarán rutinas e historial.', [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Borrar', style: 'destructive', onPress: () => update((d) => ({ ...d, routines: [], workouts: [] })) },
  ]);
  return (
    <ScrollView contentContainerStyle={{ padding: 22 }}>
      <FadeIn><H>Ajustes</H></FadeIn>
      <FadeIn delay={80}>
        <Card style={{ marginTop: 16 }}>
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
      <FadeIn delay={160}>
        <Btn kind="ghost" label="Exportar datos" onPress={() => Share.share({ message: JSON.stringify(data, null, 2) })} style={{ marginTop: 14 }} />
        <Btn kind="ghost" label="Borrar todos los datos" onPress={reset} style={{ marginTop: 10 }} />
      </FadeIn>
    </ScrollView>
  );
}

import React, { useState } from 'react';
import { Alert, ScrollView, Share, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { C } from '../theme';
import { Btn, Card, FadeIn, H, Press, T } from '../ui';
import { KEYS, migrate, seed, toU, useStore } from '../store';
import { DEV_SEEDS } from '../devSeeds';
import { GOALS, LEVELS, REST_STYLES, labelOf } from '../recommend';
import { COACH_TONES } from '../coachMemory';
import ProfileSetup from './ProfileSetup';

export default function Settings() {
  const { data, update } = useStore();
  const [edit, setEdit] = useState(false);
  const p = data.profile || {};
  const reset = () => Alert.alert('Borrar todo', 'Se eliminarán rutinas e historial.', [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Borrar', style: 'destructive', onPress: () => update((d) => ({ ...d, routines: [], workouts: [] })) },
  ]);
  const simulateCorrupt = async () => {
    try {
      await AsyncStorage.setItem(KEYS.data, '{ "routines": [ datos dañados ');
      Alert.alert('Datos dañados simulados', 'Cierra y vuelve a abrir la app para probar la recuperación desde la copia válida.');
    } catch (e) {
      Alert.alert('No se pudo simular', 'Inténtalo de nuevo.');
    }
  };
  return (
    <ScrollView style={{ width: '100%' }} contentContainerStyle={{ padding: 22 }}>
      <FadeIn><H>Ajustes</H></FadeIn>
      <FadeIn delay={80}>
        <Card style={{ marginTop: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <T mute>Mi perfil</T>
            <Press onPress={() => setEdit(true)} hitSlop={12}><T style={{ color: C.accent, fontWeight: '600' }}>Editar</T></Press>
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
              <Press key={u} onPress={() => update((d) => ({ ...d, unit: u }))} hitSlop={6} style={{ flex: 1, minHeight: 44, justifyContent: 'center', paddingVertical: 10, borderRadius: 11, alignItems: 'center', backgroundColor: data.unit === u ? C.accent : 'transparent' }}>
                <T style={{ fontWeight: '700', color: data.unit === u ? '#06120D' : C.mute }}>{u}</T>
              </Press>
            ))}
          </View>
        </Card>
      </FadeIn>
      <FadeIn delay={200}>
        <Card style={{ marginTop: 14 }}>
          <T mute style={{ marginBottom: 12 }}>Tono de Atlas</T>
          <View style={{ gap: 8 }}>
            {COACH_TONES.map((t) => {
              const on = (p.tone || 'tranquilo') === t.id;
              return (
                <Press
                  key={t.id}
                  onPress={() => update((d) => ({ ...d, profile: { ...d.profile, tone: t.id } }))}
                  style={{
                    padding: 12, borderRadius: 14,
                    backgroundColor: on ? C.accentDim : C.card2,
                    borderWidth: 1, borderColor: on ? C.accent : C.line,
                  }}
                >
                  <T style={{ fontWeight: '700', color: on ? C.accent : C.text }}>{t.label}</T>
                  <T mute style={{ fontSize: 12, marginTop: 2 }}>Ej: "{t.example}"</T>
                </Press>
              );
            })}
          </View>
        </Card>
      </FadeIn>
      <FadeIn delay={240}>
        <Btn kind="ghost" label="Exportar datos" onPress={() => Share.share({ message: JSON.stringify(data, null, 2) })} style={{ marginTop: 14 }} />
        <Btn kind="ghost" label="Borrar todos los datos" onPress={reset} style={{ marginTop: 10 }} />
        {__DEV__ && <Btn kind="ghost" label="Simular datos dañados (solo desarrollo)" onPress={simulateCorrupt} style={{ marginTop: 10 }} />}
        {__DEV__ && (
          <Btn
            kind="ghost"
            label="⚡ Reiniciar app desde cero (Provisional dev)"
            onPress={() => {
              Alert.alert(
                'Reiniciar desde cero',
                'Se borrarán todos tus datos y perfil, iniciando la app como por primera vez.',
                [
                  { text: 'Cancelar', style: 'cancel' },
                  {
                    text: 'Reiniciar',
                    style: 'destructive',
                    onPress: async () => {
                      try {
                        await AsyncStorage.clear();
                        update(() => migrate(seed));
                        Alert.alert('Reiniciado', 'La app se ha reiniciado desde cero.');
                      } catch (e) {
                        Alert.alert('Error', 'No se pudo reiniciar.');
                      }
                    }
                  }
                ]
              );
            }}
            style={{ marginTop: 10, borderColor: C.warn }}
          />
        )}
      {__DEV__ && (
        <FadeIn delay={320}>
          <Card style={{ marginTop: 14 }}>
            <T style={{ fontSize: 12, fontWeight: '600', color: C.mute, letterSpacing: 1.2, marginBottom: 6 }}>PRUEBAS</T>
            <T style={{ fontSize: 16, fontWeight: '700' }}>Historial de prueba</T>
            <T mute style={{ fontSize: 13, marginTop: 4, marginBottom: 12 }}>Escenarios de historial para probar el motor (solo desarrollo).</T>
            <Btn kind="ghost" label="Cargar historial de prueba" onPress={() => {
              const buttons = DEV_SEEDS.map((s) => ({
                text: s.label,
                onPress: async () => {
                  try {
                    await AsyncStorage.setItem(KEYS.seedBackup, JSON.stringify(data));
                    update(() => migrate(s.data));
                    Alert.alert('Pruebas', `Caso cargado: ${s.label}`);
                  } catch (e) {
                    Alert.alert('Error', 'No se pudo cargar el caso de prueba.');
                  }
                }
              }));
              buttons.push({ text: 'Cancelar', style: 'cancel' });
              Alert.alert('Pruebas', 'Elige un caso de historial', buttons);
            }} style={{ marginTop: 4 }} />
            <Btn kind="ghost" label="Volver a mis datos" onPress={async () => {
              try {
                const text = await AsyncStorage.getItem(KEYS.seedBackup);
                if (!text) {
                  Alert.alert('Pruebas', 'No hay datos guardados en pruebas-copia.');
                  return;
                }
                const raw = JSON.parse(text);
                const merged = migrate(raw);
                update(() => merged);
                Alert.alert('Pruebas', 'Se restauraron tus datos anteriores.');
              } catch (e) {
                Alert.alert('Error', 'No se pudieron restaurar tus datos.');
              }
            }} style={{ marginTop: 10 }} />
          </Card>
        </FadeIn>
      )}
      </FadeIn>
      {edit && <ProfileSetup mode="edit" onDone={() => setEdit(false)} />}
    </ScrollView>
  );
}

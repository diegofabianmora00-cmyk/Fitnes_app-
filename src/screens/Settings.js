import React, { useState } from 'react';
import { Alert, Modal, ScrollView, Share, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { C } from '../theme';
import { Btn, Card, FadeIn, Field, H, Press, T } from '../ui';
import { KEYS, migrate, seed, toU, useStore } from '../store';
import { DEV_SEEDS } from '../devSeeds';
import { GOALS, LEVELS, REST_STYLES, RULES, JOINT_FOCUSES, labelOf } from '../recommend';
import { COACH_TONES } from '../coachMemory';
import ProfileSetup from './ProfileSetup';
import CustomExerciseModal from '../CustomExerciseModal';
import RuleInfo from '../RuleInfo';

export default function Settings() {
  const { data, update } = useStore();
  const [edit, setEdit] = useState(false);
  const [showCreateEx, setShowCreateEx] = useState(false);
  const [showManageEx, setShowManageEx] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');
  const [showRules, setShowRules] = useState(false);

  const p = data.profile || {};
  const customExercises = data.customExercises || [];

  const resetWorkoutsOnly = () => Alert.alert(
    'Borrar historial',
    'Se eliminará todo tu historial de entrenamientos y récords, manteniendo tus rutinas y perfil.',
    [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Borrar historial', style: 'destructive', onPress: () => update((d) => ({ ...d, workouts: [] })) },
    ]
  );

  const resetAll = () => Alert.alert(
    'Borrar todo',
    'Se eliminarán rutinas, perfil e historial por completo.',
    [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Borrar todo', style: 'destructive', onPress: () => update((d) => ({ ...d, routines: [], workouts: [], profile: { ...seed.profile } })) },
    ]
  );

  const handleImport = () => {
    if (!importText.trim()) {
      Alert.alert('Error', 'Pega un código JSON válido.');
      return;
    }
    try {
      const parsed = JSON.parse(importText);
      const migrated = migrate(parsed);
      update(() => migrated);
      setShowImport(false);
      setImportText('');
      Alert.alert('Restaurado', 'Tus datos se han importado y restaurado correctamente.');
    } catch (e) {
      Alert.alert('Error de formato', 'El texto ingresado no es un JSON válido.');
    }
  };

  const simulateCorrupt = async () => {
    try {
      await AsyncStorage.setItem(KEYS.data, '{ "routines": [ datos dañados ');
      Alert.alert('Datos dañados simulados', 'Cierra y vuelve a abrir la app para probar la recuperación desde la copia válida.');
    } catch (e) {
      Alert.alert('No se pudo simular', 'Inténtalo de nuevo.');
    }
  };

  return (
    <ScrollView style={{ width: '100%' }} contentContainerStyle={{ padding: 22, paddingBottom: 60 }}>
      <FadeIn><H>Ajustes</H></FadeIn>

      {/* 1. Apariencia y Tema */}
      <FadeIn delay={60}>
        <Card style={{ marginTop: 16 }}>
          <T style={{ fontSize: 12, fontWeight: '600', color: C.mute, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 10 }}>
            Apariencia y Tema
          </T>
          <T mute style={{ fontSize: 13, marginBottom: 12 }}>Elige entre el modo oscuro clásico o el modo claro.</T>
          <View style={{ flexDirection: 'row', backgroundColor: C.card2, borderRadius: 14, padding: 4 }}>
            {[
              { id: 'dark', label: '🌙 Oscuro' },
              { id: 'light', label: '☀️ Claro' },
            ].map((m) => {
              const on = (data.themeMode || 'dark') === m.id;
              return (
                <Press
                  key={m.id}
                  onPress={() => update((d) => ({ ...d, themeMode: m.id }))}
                  style={{
                    flex: 1, minHeight: 44, justifyContent: 'center', paddingVertical: 10,
                    borderRadius: 11, alignItems: 'center', backgroundColor: on ? C.accent : 'transparent',
                  }}
                >
                  <T style={{ fontWeight: '700', color: on ? C.accentText : C.mute }}>{m.label}</T>
                </Press>
              );
            })}
          </View>
        </Card>
      </FadeIn>

      {/* Unidad de peso */}
      <FadeIn delay={100}>
        <Card style={{ marginTop: 14 }}>
          <T style={{ fontSize: 12, fontWeight: '600', color: C.mute, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 10 }}>
            Unidad de Peso
          </T>
          <View style={{ flexDirection: 'row', backgroundColor: C.card2, borderRadius: 14, padding: 4 }}>
            {['kg', 'lb'].map((u) => (
              <Press
                key={u}
                onPress={() => update((d) => ({ ...d, unit: u }))}
                style={{
                  flex: 1, minHeight: 44, justifyContent: 'center', paddingVertical: 10,
                  borderRadius: 11, alignItems: 'center', backgroundColor: data.unit === u ? C.accent : 'transparent',
                }}
              >
                <T style={{ fontWeight: '700', color: data.unit === u ? C.accentText : C.mute }}>{u.toUpperCase()}</T>
              </Press>
            ))}
          </View>
        </Card>
      </FadeIn>

      {/* 2. Perfil y Entrenador */}
      <FadeIn delay={140}>
        <Card style={{ marginTop: 14 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <T style={{ fontSize: 12, fontWeight: '600', color: C.mute, textTransform: 'uppercase', letterSpacing: 1.2 }}>Mi Perfil y Entrenador</T>
            <Press onPress={() => setEdit(true)} hitSlop={12}><T style={{ color: C.accent, fontWeight: '600' }}>Editar perfil</T></Press>
          </View>
          <T style={{ fontSize: 18, fontWeight: '700', marginTop: 4 }}>
            {labelOf(GOALS, p.goal)} · {labelOf(LEVELS, p.level)}
          </T>
          <T mute style={{ fontSize: 13, marginTop: 4 }}>
            {p.weightKg ? `${toU(p.weightKg, data.unit)} ${data.unit}` : 'Sin peso'} · {p.daysPerWeek || '—'} días/semana · {p.sex || 'Atleta'}
          </T>
        </Card>
      </FadeIn>

      {/* Tono de Atlas */}
      <FadeIn delay={180}>
        <Card style={{ marginTop: 14 }}>
          <T style={{ fontSize: 12, fontWeight: '600', color: C.mute, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 10 }}>
            Personalidad de Atlas
          </T>
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

      {/* 3. Estilo de Descanso */}
      <FadeIn delay={220}>
        <Card style={{ marginTop: 14 }}>
          <T style={{ fontSize: 12, fontWeight: '600', color: C.mute, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 10 }}>
            Estilo de Descanso Predeterminado
          </T>
          <T mute style={{ fontSize: 13, marginBottom: 12 }}>Define cuánto descansas entre series de compuestos y aislamiento.</T>
          <View style={{ gap: 8 }}>
            {REST_STYLES.map((rs) => {
              const on = (p.restStyle || 'equilibrado') === rs.id;
              return (
                <Press
                  key={rs.id}
                  onPress={() => update((d) => ({ ...d, profile: { ...d.profile, restStyle: rs.id } }))}
                  style={{
                    padding: 12, borderRadius: 14,
                    backgroundColor: on ? C.accentDim : C.card2,
                    borderWidth: 1, borderColor: on ? C.accent : C.line,
                    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                  }}
                >
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <T style={{ fontWeight: '700', color: on ? C.accent : C.text }}>{rs.label}</T>
                    <T mute style={{ fontSize: 12, marginTop: 2 }}>{rs.desc}</T>
                  </View>
                  {on && <Ionicons name="checkmark-circle" size={20} color={C.accent} />}
                </Press>
              );
            })}
          </View>
        </Card>
      </FadeIn>

      {/* Salud y Enfoque Articular */}
      <FadeIn delay={240}>
        <Card style={{ marginTop: 14 }}>
          <T style={{ fontSize: 12, fontWeight: '600', color: C.mute, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 10 }}>
            Salud y Enfoque Articular
          </T>
          <T mute style={{ fontSize: 13, marginBottom: 12 }}>Atlas adapta las alertas de prevención y cuidado según tus limitaciones.</T>
          <View style={{ gap: 8 }}>
            {JOINT_FOCUSES.map((jf) => {
              const on = (p.jointFocus || 'ninguna') === jf.id;
              return (
                <Press
                  key={jf.id}
                  onPress={() => update((d) => ({ ...d, profile: { ...d.profile, jointFocus: jf.id } }))}
                  style={{
                    padding: 12, borderRadius: 14,
                    backgroundColor: on ? C.accentDim : C.card2,
                    borderWidth: 1, borderColor: on ? C.accent : C.line,
                    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                  }}
                >
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <T style={{ fontWeight: '700', color: on ? C.accent : C.text }}>{jf.label}</T>
                    <T mute style={{ fontSize: 12, marginTop: 2 }}>{jf.desc}</T>
                  </View>
                  {on && <Ionicons name="checkmark-circle" size={20} color={C.accent} />}
                </Press>
              );
            })}
          </View>
        </Card>
      </FadeIn>

      {/* 4. Ejercicios Personalizados */}
      <FadeIn delay={260}>
        <Card style={{ marginTop: 14 }}>
          <T style={{ fontSize: 12, fontWeight: '600', color: C.mute, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 6 }}>
            Ejercicios Personalizados
          </T>
          <T style={{ fontSize: 16, fontWeight: '700' }}>
            {customExercises.length} {customExercises.length === 1 ? 'ejercicio creado' : 'ejercicios creados'}
          </T>
          <T mute style={{ fontSize: 13, marginTop: 4, marginBottom: 14 }}>
            Crea tus propios ejercicios con equipo, grupo muscular y tipo específico.
          </T>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Btn
              label="+ Crear ejercicio"
              onPress={() => setShowCreateEx(true)}
              style={{ flex: 1, minHeight: 46, borderRadius: 14 }}
            />
            {customExercises.length > 0 && (
              <Btn
                kind="ghost"
                label="Gestionar"
                onPress={() => setShowManageEx(true)}
                style={{ minHeight: 46, borderRadius: 14, paddingHorizontal: 16 }}
              />
            )}
          </View>
        </Card>
      </FadeIn>

      {/* 5. Datos y Respaldo */}
      <FadeIn delay={300}>
        <Card style={{ marginTop: 14 }}>
          <T style={{ fontSize: 12, fontWeight: '600', color: C.mute, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 10 }}>
            Datos y Respaldo
          </T>
          <View style={{ gap: 10 }}>
            <Btn
              kind="ghost"
              label="📥 Exportar copia de seguridad (JSON)"
              onPress={() => Share.share({ message: JSON.stringify(data, null, 2) })}
            />
            <Btn
              kind="ghost"
              label="📤 Importar / Restaurar datos (JSON)"
              onPress={() => setShowImport(true)}
            />
            <Btn
              kind="ghost"
              label="Borrar historial de entrenamientos"
              onPress={resetWorkoutsOnly}
              style={{ borderColor: C.line }}
            />
            <Btn
              kind="ghost"
              label="Borrar todos los datos"
              onPress={resetAll}
              style={{ borderColor: C.danger }}
            />
          </View>
        </Card>
      </FadeIn>

      {/* 6. Información y Ciencia */}
      <FadeIn delay={340}>
        <Card style={{ marginTop: 14 }}>
          <T style={{ fontSize: 12, fontWeight: '600', color: C.mute, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 6 }}>
            Información y Ciencia
          </T>
          <T style={{ fontSize: 16, fontWeight: '700' }}>Fitness Coach v4.0</T>
          <T mute style={{ fontSize: 13, marginTop: 4, marginBottom: 12 }}>
            Expo SDK 58 · Motor basado en evidencia científica y RIR.
          </T>
          <Btn
            kind="ghost"
            label="🧬 Ver reglas y fuentes científicas"
            onPress={() => setShowRules(true)}
          />
        </Card>
      </FadeIn>

      {/* 7. Zona de Desarrollador */}
      {__DEV__ && (
        <FadeIn delay={380}>
          <Card style={{ marginTop: 14, borderColor: C.warn }}>
            <T style={{ fontSize: 12, fontWeight: '600', color: C.warn, letterSpacing: 1.2, marginBottom: 6 }}>ZONA DE DESARROLLADOR</T>
            <T style={{ fontSize: 16, fontWeight: '700' }}>Herramientas de prueba</T>
            <T mute style={{ fontSize: 13, marginTop: 4, marginBottom: 12 }}>Funciones exclusivas para pruebas y simulación.</T>
            
            <View style={{ gap: 8 }}>
              <Btn kind="ghost" label="Simular datos dañados" onPress={simulateCorrupt} />
              
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
              }} />

              <Btn kind="ghost" label="Volver a mis datos anteriores" onPress={async () => {
                try {
                  const text = await AsyncStorage.getItem(KEYS.seedBackup);
                  if (!text) {
                    Alert.alert('Pruebas', 'No hay datos guardados en respaldo.');
                    return;
                  }
                  const raw = JSON.parse(text);
                  const merged = migrate(raw);
                  update(() => merged);
                  Alert.alert('Pruebas', 'Se restauraron tus datos anteriores.');
                } catch (e) {
                  Alert.alert('Error', 'No se pudieron restaurar tus datos.');
                }
              }} />

              <Btn
                kind="ghost"
                label="⚡ Reiniciar app desde cero"
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
                style={{ borderColor: C.warn }}
              />
            </View>
          </Card>
        </FadeIn>
      )}

      {edit && <ProfileSetup mode="edit" onDone={() => setEdit(false)} />}
      <CustomExerciseModal visible={showCreateEx} onClose={() => setShowCreateEx(false)} />

      {/* Modal: Gestionar ejercicios personalizados */}
      <Modal visible={showManageEx} transparent animationType="slide" onRequestClose={() => setShowManageEx(false)}>
        <View style={{ flex: 1, backgroundColor: '#00000099', justifyContent: 'flex-end' }}>
          <View style={{ maxHeight: '85%', backgroundColor: C.bg, borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingTop: 16, paddingBottom: 24, paddingHorizontal: 22 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <T style={{ fontSize: 20, fontWeight: '700' }}>Ejercicios personalizados</T>
              <Press onPress={() => setShowManageEx(false)} style={{ width: 40, height: 40, borderRadius: 14, backgroundColor: C.card2, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="close" size={22} color={C.text} />
              </Press>
            </View>
            <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
              {!customExercises.length ? (
                <Card><T mute>No has creado ningún ejercicio personalizado.</T></Card>
              ) : (
                customExercises.map((ce) => (
                  <Card key={ce.id} style={{ marginBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flex: 1, paddingRight: 10 }}>
                      <T style={{ fontSize: 16, fontWeight: '700' }}>{ce.name}</T>
                      <T mute style={{ fontSize: 12, marginTop: 2 }}>{ce.group} · {ce.equipment} · {ce.type}</T>
                    </View>
                    <Press
                      onPress={() => {
                        Alert.alert(
                          'Eliminar ejercicio',
                          `¿Deseas eliminar "${ce.name}"?`,
                          [
                            { text: 'Cancelar', style: 'cancel' },
                            {
                              text: 'Eliminar',
                              style: 'destructive',
                              onPress: () => {
                                update((d) => ({
                                  ...d,
                                  customExercises: (d.customExercises || []).filter((x) => x.id !== ce.id),
                                }));
                              },
                            },
                          ]
                        );
                      }}
                      style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: C.card2, alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Ionicons name="trash-outline" size={18} color={C.danger} />
                    </Press>
                  </Card>
                ))
              )}
            </ScrollView>
            <Btn label="+ Crear nuevo ejercicio" onPress={() => { setShowManageEx(false); setShowCreateEx(true); }} />
          </View>
        </View>
      </Modal>

      {/* Modal: Importar datos */}
      <Modal visible={showImport} transparent animationType="slide" onRequestClose={() => setShowImport(false)}>
        <View style={{ flex: 1, backgroundColor: '#00000099', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: C.bg, borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingTop: 16, paddingBottom: 24, paddingHorizontal: 22 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <T style={{ fontSize: 20, fontWeight: '700' }}>Importar datos</T>
              <Press onPress={() => setShowImport(false)} style={{ width: 40, height: 40, borderRadius: 14, backgroundColor: C.card2, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="close" size={22} color={C.text} />
              </Press>
            </View>
            <T mute style={{ fontSize: 13, marginBottom: 12 }}>Pega aquí el código JSON de tu copia de seguridad para restaurar tus datos.</T>
            <Field
              value={importText}
              onChangeText={setImportText}
              placeholder="Pega el JSON aquí..."
              multiline
              style={{ height: 140, borderRadius: 14, backgroundColor: C.field, borderWidth: 1, borderColor: C.line, fontSize: 14, padding: 12, textAlignVertical: 'top' }}
            />
            <View style={{ marginTop: 16 }}>
              <Btn label="Restaurar datos" onPress={handleImport} />
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de reglas y fuentes */}
      <RuleInfo visible={showRules} rules={Object.values(RULES)} onClose={() => setShowRules(false)} title="Ciencia y Reglas de Fitness Coach" />
    </ScrollView>
  );
}

import React, { useState } from 'react';
import { Modal, ScrollView, Share, View } from 'react-native';
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
import { Dialog } from '../Dialog';
import { GYM_DEFAULT } from '../load';

export default function Settings() {
  const { data, update } = useStore();
  const [edit, setEdit] = useState(false);
  const [showCreateEx, setShowCreateEx] = useState(false);
  const [showManageEx, setShowManageEx] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');
  const [showRules, setShowRules] = useState(false);
  const [showEditWorkout, setShowEditWorkout] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState(null);

  const p = data.profile || {};
  const customExercises = data.customExercises || [];

  const resetWorkoutsOnly = () => Dialog.alert(
    'Borrar historial',
    'Se eliminará todo tu historial de entrenamientos y récords, manteniendo tus rutinas y perfil.',
    [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Borrar historial', style: 'destructive', onPress: () => update((d) => ({ ...d, workouts: [] })) },
    ]
  );

  const resetAll = () => Dialog.alert(
    'Borrar todo',
    'Se eliminarán rutinas, perfil e historial por completo.',
    [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Borrar todo', style: 'destructive', onPress: () => update((d) => ({ ...d, routines: [], workouts: [], profile: { ...seed.profile } })) },
    ]
  );

  const handleImport = () => {
    if (!importText.trim()) {
      Dialog.alert('Error', 'Pega un código JSON válido.');
      return;
    }
    try {
      const parsed = JSON.parse(importText);
      const migrated = migrate(parsed);
      update(() => migrated);
      setShowImport(false);
      setImportText('');
      Dialog.alert('Restaurado', 'Tus datos se han importado y restaurado correctamente.');
    } catch (e) {
      Dialog.alert('Error de formato', 'El texto ingresado no es un JSON válido.');
    }
  };

  const simulateCorrupt = async () => {
    try {
      await AsyncStorage.setItem(KEYS.data, '{ "routines": [ datos dañados ');
      Dialog.alert('Datos dañados simulados', 'Cierra y vuelve a abrir la app para probar la recuperación desde la copia válida.');
    } catch (e) {
      Dialog.alert('No se pudo simular', 'Inténtalo de nuevo.');
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
              { id: 'dark', label: 'Oscuro', icon: 'moon' },
              { id: 'light', label: 'Claro', icon: 'sunny' },
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
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name={m.icon} size={16} color={on ? C.accentText : C.mute} />
                    <T style={{ fontWeight: '700', color: on ? C.accentText : C.mute }}>{m.label}</T>
                  </View>
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

      {/* Mi gimnasio */}
      <FadeIn delay={120}>
        <Card style={{ marginTop: 14 }}>
          <T style={{ fontSize: 12, fontWeight: '600', color: C.mute, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 10 }}>
            Mi gimnasio y equipo
          </T>
          <T mute style={{ fontSize: 13, marginBottom: 12 }}>Configura barras disponibles, discos, escalones de mancuernas y máquinas.</T>
          
          <View style={{ gap: 12 }}>
            <View style={{ backgroundColor: C.card2, borderRadius: 14, padding: 12 }}>
              <T style={{ fontSize: 14, fontWeight: '700', marginBottom: 8 }}>Barras disponibles</T>
              {(data.gym?.bars || GYM_DEFAULT.bars).map((bar, idx) => (
                <View key={bar.id || idx} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <Field
                    value={bar.name}
                    onChangeText={(txt) => {
                      const bars = [...(data.gym?.bars || GYM_DEFAULT.bars)];
                      bars[idx].name = txt;
                      update(d => ({ ...d, gym: { ...(d.gym || GYM_DEFAULT), bars } }));
                    }}
                    style={{ flex: 2, height: 40, fontSize: 13, backgroundColor: C.field }}
                  />
                  <Field
                    value={String(bar.weightKg)}
                    onChangeText={(txt) => {
                      const w = parseFloat(txt) || 0;
                      const bars = [...(data.gym?.bars || GYM_DEFAULT.bars)];
                      bars[idx].weightKg = w;
                      update(d => ({ ...d, gym: { ...(d.gym || GYM_DEFAULT), bars } }));
                    }}
                    keyboardType="numeric"
                    style={{ flex: 1, height: 40, fontSize: 13, backgroundColor: C.field }}
                    placeholder="kg"
                  />
                  <T mute style={{ fontSize: 12 }}>kg</T>
                </View>
              ))}
            </View>

            <View style={{ backgroundColor: C.card2, borderRadius: 14, padding: 12 }}>
              <T style={{ fontSize: 14, fontWeight: '700', marginBottom: 6 }}>Discos disponibles ({data.unit || 'kg'})</T>
              <T mute style={{ fontSize: 12, marginBottom: 8 }}>Discos estándar considerados para los cálculos.</T>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {((data.unit || 'kg') === 'lb' ? (data.gym?.platesLb || GYM_DEFAULT.platesLb) : (data.gym?.platesKg || GYM_DEFAULT.platesKg)).map((plate, pIdx) => (
                  <View key={pIdx} style={{ backgroundColor: C.accentDim, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: C.accent }}>
                    <T style={{ fontSize: 13, fontWeight: '700', color: C.accent }}>{plate} {data.unit || 'kg'}</T>
                  </View>
                ))}
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1, backgroundColor: C.card2, borderRadius: 14, padding: 12 }}>
                <T style={{ fontSize: 13, fontWeight: '700', marginBottom: 4 }}>Escalón mancuernas</T>
                <Field
                  value={String(data.gym?.dumbbellStep || 1)}
                  onChangeText={(txt) => {
                    const step = parseFloat(txt) || 1;
                    update(d => ({ ...d, gym: { ...(d.gym || GYM_DEFAULT), dumbbellStep: step } }));
                  }}
                  keyboardType="numeric"
                  style={{ height: 40, fontSize: 14, backgroundColor: C.field }}
                />
              </View>
              <View style={{ flex: 1, backgroundColor: C.card2, borderRadius: 14, padding: 12 }}>
                <T style={{ fontSize: 13, fontWeight: '700', marginBottom: 4 }}>Escalón selector (stack)</T>
                <Field
                  value={String(data.gym?.stackStep || 5)}
                  onChangeText={(txt) => {
                    const step = parseFloat(txt) || 5;
                    update(d => ({ ...d, gym: { ...(d.gym || GYM_DEFAULT), stackStep: step } }));
                  }}
                  keyboardType="numeric"
                  style={{ height: 40, fontSize: 14, backgroundColor: C.field }}
                />
              </View>
            </View>

            <Btn
              kind="ghost"
              label="Restaurar valores por defecto"
              onPress={() => update(d => ({ ...d, gym: { ...GYM_DEFAULT } }))}
              style={{ borderColor: C.line }}
            />
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
              icon="add"
              label="Crear ejercicio"
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
              icon="share-outline"
              label="Exportar copia de seguridad (JSON)"
              onPress={() => Share.share({ message: JSON.stringify(data, null, 2) })}
            />
            <Btn
              kind="ghost"
              icon="cloud-download-outline"
              label="Importar / Restaurar datos (JSON)"
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
            icon="flask-outline"
            label="Ver reglas y fuentes científicas"
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
              
              <Btn
                kind="ghost"
                icon="create-outline"
                label="Corregir / editar sesión de ejercicio"
                onPress={() => {
                  if (!data.workouts || data.workouts.length === 0) {
                    Dialog.alert('Sin historial', 'No hay sesiones registradas en el historial para editar.');
                    return;
                  }
                  setShowEditWorkout(true);
                }}
              />
              
              <Btn kind="ghost" label="Cargar historial de prueba" onPress={() => {
                const buttons = DEV_SEEDS.map((s) => ({
                  text: s.label,
                  onPress: async () => {
                    try {
                      await AsyncStorage.setItem(KEYS.seedBackup, JSON.stringify(data));
                      update(() => migrate(s.data));
                      Dialog.alert('Pruebas', `Caso cargado: ${s.label}`);
                    } catch (e) {
                      Dialog.alert('Error', 'No se pudo cargar el caso de prueba.');
                    }
                  }
                }));
                buttons.push({ text: 'Cancelar', style: 'cancel' });
                Dialog.alert('Pruebas', 'Elige un caso de historial', buttons);
              }} />

              <Btn kind="ghost" label="Volver a mis datos anteriores" onPress={async () => {
                try {
                  const text = await AsyncStorage.getItem(KEYS.seedBackup);
                  if (!text) {
                    Dialog.alert('Pruebas', 'No hay datos guardados en respaldo.');
                    return;
                  }
                  const raw = JSON.parse(text);
                  const merged = migrate(raw);
                  update(() => merged);
                  Dialog.alert('Pruebas', 'Se restauraron tus datos anteriores.');
                } catch (e) {
                  Dialog.alert('Error', 'No se pudieron restaurar tus datos.');
                }
              }} />

              <Btn
                kind="ghost"
                icon="warning-outline"
                label="Reiniciar app desde cero"
                onPress={() => {
                  Dialog.alert(
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
                            Dialog.alert('Reiniciado', 'La app se ha reiniciado desde cero.');
                          } catch (e) {
                            Dialog.alert('Error', 'No se pudo reiniciar.');
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
                        Dialog.alert(
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

      {/* Modal: Editar sesión de ejercicio */}
      <Modal visible={showEditWorkout} transparent animationType="slide" onRequestClose={() => { setShowEditWorkout(false); setEditingWorkout(null); }}>
        <View style={{ flex: 1, backgroundColor: '#00000099', justifyContent: 'flex-end' }}>
          <View style={{ maxHeight: '90%', backgroundColor: C.bg, borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingTop: 16, paddingBottom: 24, paddingHorizontal: 22 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <T style={{ fontSize: 20, fontWeight: '700' }}>
                {editingWorkout ? 'Editar Sesión' : 'Seleccionar Sesión a Editar'}
              </T>
              <Press onPress={() => { setShowEditWorkout(false); setEditingWorkout(null); }} style={{ width: 40, height: 40, borderRadius: 14, backgroundColor: C.card2, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="close" size={22} color={C.text} />
              </Press>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
              {!editingWorkout ? (
                !(data.workouts || []).length ? (
                  <Card><T mute>No hay sesiones registradas.</T></Card>
                ) : (
                  (data.workouts || []).map((w) => (
                    <Card key={w.id} style={{ marginBottom: 12 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <T style={{ fontSize: 16, fontWeight: '700' }}>{w.routineName || 'Entrenamiento'}</T>
                        <T mute style={{ fontSize: 12 }}>{new Date(w.date || Date.now()).toLocaleDateString()}</T>
                      </View>
                      <T mute style={{ fontSize: 13, marginBottom: 10 }}>
                        {w.exercises ? w.exercises.reduce((acc, ex) => acc + (ex.sets || []).length, 0) : 0} series · Puntuación: {w.score?.score || '—'}
                      </T>
                      <Btn
                        kind="ghost"
                        label="Seleccionar para editar"
                        onPress={() => setEditingWorkout(JSON.parse(JSON.stringify(w)))}
                        style={{ minHeight: 40 }}
                      />
                    </Card>
                  ))
                )
              ) : (
                <View>
                  <T style={{ fontSize: 14, fontWeight: '700', marginBottom: 6 }}>Comentario de la sesión</T>
                  <Field
                    value={editingWorkout.comment || ''}
                    onChangeText={(txt) => setEditingWorkout({ ...editingWorkout, comment: txt })}
                    placeholder="Notas o comentario..."
                    style={{ backgroundColor: C.field, borderRadius: 12, padding: 10, marginBottom: 16, color: C.text }}
                  />

                  <T style={{ fontSize: 16, fontWeight: '700', marginBottom: 10 }}>Ejercicios y Series</T>
                  {(editingWorkout.exercises || []).map((ex, exIdx) => (
                    <Card key={ex.exId || exIdx} style={{ marginBottom: 12 }}>
                      <T style={{ fontSize: 15, fontWeight: '700', marginBottom: 8, color: C.accent }}>{ex.name}</T>
                      {(ex.sets || []).map((s, sIdx) => (
                        <View key={sIdx} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                          <T mute style={{ width: 44, fontSize: 12 }}>Serie {sIdx + 1}</T>
                          <View style={{ flex: 1 }}>
                            <T mute style={{ fontSize: 10, marginBottom: 2 }}>Peso ({data.unit})</T>
                            <Field
                              value={String(s.w ?? '')}
                              onChangeText={(val) => {
                                const nextExs = [...editingWorkout.exercises];
                                nextExs[exIdx].sets[sIdx].w = val;
                                setEditingWorkout({ ...editingWorkout, exercises: nextExs });
                              }}
                              keyboardType="numeric"
                              style={{ backgroundColor: C.field, borderRadius: 10, padding: 6, fontSize: 14, color: C.text }}
                            />
                          </View>
                          <View style={{ flex: 1 }}>
                            <T mute style={{ fontSize: 10, marginBottom: 2 }}>Reps</T>
                            <Field
                              value={String(s.r ?? '')}
                              onChangeText={(val) => {
                                const nextExs = [...editingWorkout.exercises];
                                nextExs[exIdx].sets[sIdx].r = val;
                                setEditingWorkout({ ...editingWorkout, exercises: nextExs });
                              }}
                              keyboardType="numeric"
                              style={{ backgroundColor: C.field, borderRadius: 10, padding: 6, fontSize: 14, color: C.text }}
                            />
                          </View>
                        </View>
                      ))}
                    </Card>
                  ))}

                  <View style={{ gap: 10, marginTop: 10 }}>
                    <Btn
                      label="Guardar cambios"
                      onPress={() => {
                        const updatedWorkouts = (data.workouts || []).map((w) => w.id === editingWorkout.id ? editingWorkout : w);
                        update((d) => migrate({ ...d, workouts: updatedWorkouts }));
                        setShowEditWorkout(false);
                        setEditingWorkout(null);
                        Dialog.alert('Actualizado', 'La sesión de ejercicio se ha corregido y los récords se han recalculado.');
                      }}
                    />
                    <Btn
                      kind="ghost"
                      label="Eliminar esta sesión"
                      onPress={() => {
                        Dialog.alert(
                          'Eliminar sesión',
                          '¿Estás seguro de eliminar esta sesión del historial?',
                          [
                            { text: 'Cancelar', style: 'cancel' },
                            {
                              text: 'Eliminar',
                              style: 'destructive',
                              onPress: () => {
                                const updatedWorkouts = (data.workouts || []).filter((w) => w.id !== editingWorkout.id);
                                update((d) => migrate({ ...d, workouts: updatedWorkouts }));
                                setShowEditWorkout(false);
                                setEditingWorkout(null);
                                Dialog.alert('Eliminado', 'La sesión fue eliminada del historial.');
                              }
                            }
                          ]
                        );
                      }}
                      style={{ borderColor: C.danger }}
                    />
                    <Btn
                      kind="ghost"
                      label="Volver a la lista"
                      onPress={() => setEditingWorkout(null)}
                    />
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

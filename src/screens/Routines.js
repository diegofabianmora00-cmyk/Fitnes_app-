import React, { useState, useMemo } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C } from '../theme';
import { Btn, Card, FadeIn, Field, H, Press, T } from '../ui';
import { uid, useStore, routinesForDay } from '../store';
import { GROUPS, filterExercises } from '../exercises';
import { GOALS } from '../recommend';
import Coach from '../Coach';

const DAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const DAY_NAMES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const DAY_ABBR = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];

const formatRest = (sec) => {
  const s = Number(sec) || 120;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}:${String(rem).padStart(2, '0')}`;
};

function Editor({ routine, onClose }) {
  const { update } = useStore();
  const [step, setStep] = useState('datos'); // 'datos' | 'ejercicios' | 'config'
  const [r, setR] = useState({
    id: routine.id || uid(),
    name: routine.name || '',
    goal: routine.goal || 'hipertrofia',
    days: routine.days || [],
    defaults: routine.defaults || { sets: 3, reps: 10, restSec: 120 },
    exercises: (routine.exercises || []).map(e => ({
      ...e,
      mode: e.mode || 'default',
      rir: e.rir !== undefined ? e.rir : 2,
    })),
  });
  const [activeGroup, setActiveGroup] = useState('Todos');
  const [configIdx, setConfigIdx] = useState(null);

  const updateField = (k, v) => setR(prev => ({ ...prev, [k]: v }));
  const updateDefaults = (k, v) => setR(prev => ({ ...prev, defaults: { ...prev.defaults, [k]: v } }));

  const toggleDay = (d) => {
    setR(prev => {
      const days = prev.days.includes(d) ? prev.days.filter(x => x !== d) : [...prev.days, d].sort();
      return { ...prev, days };
    });
  };

  const isSelectedExercise = (exId) => r.exercises.some(e => e.id === exId);

  const toggleExercise = (item) => {
    setR(prev => {
      const exists = prev.exercises.find(e => e.id === item.id);
      if (exists) {
        return { ...prev, exercises: prev.exercises.filter(e => e.id !== item.id) };
      } else {
        const newEx = {
          id: item.id,
          name: item.name,
          group: item.group,
          equipment: item.equipment,
          sets: prev.defaults.sets,
          reps: prev.defaults.reps,
          mode: 'default',
          rir: 2,
        };
        return { ...prev, exercises: [...prev.exercises, newEx] };
      }
    });
  };

  const saveRoutine = () => {
    const finalR = {
      ...r,
      name: r.name.trim() || 'Rutina sin nombre',
    };
    update(d => ({
      ...d,
      routines: d.routines.some(x => x.id === finalR.id)
        ? d.routines.map(x => (x.id === finalR.id ? finalR : x))
        : [...d.routines, finalR]
    }));
    onClose();
  };

  const groupExercises = useMemo(() => filterExercises('', activeGroup), [activeGroup]);
  const totalEstSec = r.exercises.reduce((acc, ex) => {
    const sets = ex.mode === 'manual' ? ex.sets : r.defaults.sets;
    return acc + sets * r.defaults.restSec;
  }, 0);
  const estMin = Math.max(1, Math.round(totalEstSec / 60));

  return (
    <Modal animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: C.bg }}>
        
        {/* STEP 1: DATOS */}
        {step === 'datos' && (
          <ScrollView contentContainerStyle={{ padding: 22, paddingTop: 56, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
            {/* Header Card */}
            <Card style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flex: 1, marginRight: 12 }}>
                  <H style={{ fontSize: 20, fontWeight: '700' }}>Nueva rutina</H>
                  <T mute style={{ fontSize: 14, marginTop: 2 }}>Paso 1 de 2 · Datos</T>
                </View>
                {/* Dots */}
                <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center', marginTop: 4 }}>
                  <View style={{ width: 22, height: 6, borderRadius: 3, backgroundColor: C.accent }} />
                  <View style={{ width: 22, height: 6, borderRadius: 3, backgroundColor: C.track }} />
                </View>
              </View>
            </Card>

            {/* 1. Nombre */}
            <Card style={{ marginBottom: 16 }}>
              <T style={{ fontSize: 12, fontWeight: '600', color: C.mute, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Nombre</T>
              <Field
                value={r.name}
                onChangeText={(v) => updateField('name', v)}
                placeholder="Nombre de la rutina"
                style={{ height: 48, borderRadius: 14, backgroundColor: C.field, borderWidth: 1, borderColor: C.line, fontSize: 16, fontWeight: '600' }}
              />
            </Card>

            {/* 2. Objetivo */}
            <Card style={{ marginBottom: 16 }}>
              <T style={{ fontSize: 12, fontWeight: '600', color: C.mute, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Objetivo</T>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {GOALS.map(g => {
                  const on = r.goal === g.id;
                  return (
                    <Press
                      key={g.id}
                      onPress={() => updateField('goal', g.id)}
                      style={{
                        paddingHorizontal: 16, paddingVertical: 12, borderRadius: 16,
                        backgroundColor: on ? C.accent : C.card2,
                        borderWidth: 1, borderColor: on ? C.accent : C.line,
                      }}
                    >
                      <T style={{ fontSize: 14, fontWeight: '600', color: on ? C.accentText : C.text }}>{g.label}</T>
                    </Press>
                  );
                })}
              </View>
            </Card>

            {/* 3. ¿Qué días te toca? */}
            <Card style={{ marginBottom: 16 }}>
              <T style={{ fontSize: 12, fontWeight: '600', color: C.mute, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>¿Qué días te toca?</T>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 4 }}>
                {DAYS.map((dName, idx) => {
                  const on = r.days.includes(idx);
                  return (
                    <Press
                      key={dName}
                      onPress={() => toggleDay(idx)}
                      style={{
                        flex: 1, height: 44, borderRadius: 14,
                        backgroundColor: on ? C.accent : C.card2,
                        borderWidth: 1, borderColor: on ? C.accent : C.line,
                        alignItems: 'center', justifyContent: 'center',
                      }}
                      accessibilityLabel={`Día ${dName}`}
                    >
                      <T style={{ fontSize: 14, fontWeight: '700', color: on ? C.accentText : C.text }}>{dName}</T>
                    </Press>
                  );
                })}
              </View>
              <T mute style={{ fontSize: 13, marginTop: 12 }}>Se repite cada semana. Puedes elegir varios.</T>
            </Card>

            {/* 4. Por defecto */}
            <Card style={{ marginBottom: 24 }}>
              <T style={{ fontSize: 12, fontWeight: '600', color: C.mute, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Por defecto</T>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                {/* Series */}
                <Press
                  onPress={() => {
                    Alert.alert('Series por defecto', 'Elige número de series', [
                      { text: '3', onPress: () => updateDefaults('sets', 3) },
                      { text: '4', onPress: () => updateDefaults('sets', 4) },
                      { text: '5', onPress: () => updateDefaults('sets', 5) },
                      { text: 'Cancelar', style: 'cancel' }
                    ]);
                  }}
                  style={{ flex: 1, height: 64, borderRadius: 14, backgroundColor: C.card2, borderWidth: 1, borderColor: C.line, alignItems: 'center', justifyContent: 'center' }}
                >
                  <T style={{ fontSize: 18, fontWeight: '700' }}>{r.defaults.sets}</T>
                  <T mute style={{ fontSize: 12, marginTop: 2 }}>series</T>
                </Press>
                {/* Repeticiones */}
                <Press
                  onPress={() => {
                    Alert.alert('Repeticiones por defecto', 'Elige número de repeticiones', [
                      { text: '8', onPress: () => updateDefaults('reps', 8) },
                      { text: '10', onPress: () => updateDefaults('reps', 10) },
                      { text: '12', onPress: () => updateDefaults('reps', 12) },
                      { text: 'Cancelar', style: 'cancel' }
                    ]);
                  }}
                  style={{ flex: 1, height: 64, borderRadius: 14, backgroundColor: C.card2, borderWidth: 1, borderColor: C.line, alignItems: 'center', justifyContent: 'center' }}
                >
                  <T style={{ fontSize: 18, fontWeight: '700' }}>{r.defaults.reps}</T>
                  <T mute style={{ fontSize: 12, marginTop: 2 }}>repeticiones</T>
                </Press>
                {/* Descanso */}
                <Press
                  onPress={() => {
                    Alert.alert('Descanso por defecto', 'Elige tiempo de descanso', [
                      { text: '60s (1:00)', onPress: () => updateDefaults('restSec', 60) },
                      { text: '90s (1:30)', onPress: () => updateDefaults('restSec', 90) },
                      { text: '120s (2:00)', onPress: () => updateDefaults('restSec', 120) },
                      { text: '180s (3:00)', onPress: () => updateDefaults('restSec', 180) },
                      { text: 'Cancelar', style: 'cancel' }
                    ]);
                  }}
                  style={{ flex: 1, height: 64, borderRadius: 14, backgroundColor: C.card2, borderWidth: 1, borderColor: C.line, alignItems: 'center', justifyContent: 'center' }}
                >
                  <T style={{ fontSize: 18, fontWeight: '700' }}>{formatRest(r.defaults.restSec)}</T>
                  <T mute style={{ fontSize: 12, marginTop: 2 }}>descanso</T>
                </Press>
              </View>
            </Card>

            {/* Bottom Nav */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 8 }}>
              <Press
                onPress={onClose}
                style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: C.card2, borderWidth: 1, borderColor: C.line, alignItems: 'center', justifyContent: 'center' }}
                accessibilityLabel="Volver"
              >
                <T style={{ fontSize: 20, fontWeight: '700' }}>←</T>
              </Press>
              <Btn
                disabled={!r.name.trim() || r.days.length === 0}
                label="Siguiente →"
                onPress={() => setStep('ejercicios')}
                style={{ flex: 1, minHeight: 56, borderRadius: 24 }}
              />
            </View>
          </ScrollView>
        )}

        {/* STEP 2: EJERCICIOS */}
        {step === 'ejercicios' && (
          <View style={{ flex: 1, paddingTop: 56 }}>
            {/* Header Card */}
            <View style={{ paddingHorizontal: 22, marginBottom: 12 }}>
              <Card>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1, marginRight: 12 }}>
                    <H style={{ fontSize: 20, fontWeight: '700' }}>Elige ejercicios</H>
                    <T mute numberOfLines={1} style={{ fontSize: 14, marginTop: 2 }}>
                      Paso 2 de 2 · {r.days.length > 0 ? DAY_NAMES[r.days[0]] : 'Día'} · {r.name}
                    </T>
                  </View>
                  {/* Dots */}
                  <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center', marginTop: 4 }}>
                    <View style={{ width: 22, height: 6, borderRadius: 3, backgroundColor: C.track }} />
                    <View style={{ width: 22, height: 6, borderRadius: 3, backgroundColor: C.accent }} />
                  </View>
                </View>
              </Card>

              {/* Muscle Group Horizontal Chips */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }} contentContainerStyle={{ gap: 8 }}>
                {GROUPS.map(g => {
                  const on = activeGroup === g;
                  return (
                    <Press
                      key={g}
                      onPress={() => setActiveGroup(g)}
                      style={{
                        height: 44, borderRadius: 16, paddingHorizontal: 16,
                        backgroundColor: on ? C.accent : C.card2,
                        borderWidth: 1, borderColor: on ? C.accent : C.line,
                        alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <T style={{ fontSize: 14, fontWeight: '600', color: on ? C.accentText : C.text }}>{g}</T>
                    </Press>
                  );
                })}
              </ScrollView>
            </View>

            {/* Section label */}
            <View style={{ paddingHorizontal: 22, marginTop: 6, marginBottom: 6 }}>
              <T mute style={{ fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1.2 }}>
                {activeGroup} · {groupExercises.length} ejercicios
              </T>
            </View>

            {/* Scrollable Exercises List */}
            <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
              {groupExercises.map(item => {
                const sel = isSelectedExercise(item.id);
                const exObj = r.exercises.find(e => e.id === item.id);
                const sCount = sel && exObj ? (exObj.mode === 'manual' ? exObj.sets : r.defaults.sets) : r.defaults.sets;
                const rCount = sel && exObj ? (exObj.mode === 'manual' ? (exObj.reps || r.defaults.reps) : r.defaults.reps) : r.defaults.reps;

                return (
                  <Press
                    key={item.id}
                    onPress={() => {
                      if (sel) {
                        const idx = r.exercises.findIndex(e => e.id === item.id);
                        if (idx !== -1) {
                          setConfigIdx(idx);
                          setStep('config');
                        }
                      } else {
                        toggleExercise(item);
                      }
                    }}
                    style={{
                      flexDirection: 'row', alignItems: 'center', backgroundColor: C.card,
                      borderWidth: 1, borderColor: sel ? C.accent : C.line,
                      borderRadius: 16, paddingVertical: 12, paddingHorizontal: 16, marginBottom: 8,
                    }}
                  >
                    <View style={{ flex: 1, marginRight: 12 }}>
                      <T style={{ fontSize: 16, fontWeight: '700' }}>{item.name}</T>
                      <T mute style={{ fontSize: 13, marginTop: 3 }}>{item.equipment} · {sCount} × {rCount}</T>
                    </View>
                    <Press
                      onPress={() => toggleExercise(item)}
                      style={{
                        width: 44, height: 44, borderRadius: 14,
                        backgroundColor: sel ? C.accent : C.card2,
                        borderWidth: 1, borderColor: sel ? C.accent : C.line,
                        alignItems: 'center', justifyContent: 'center',
                      }}
                      accessibilityLabel={sel ? "Quitar ejercicio" : "Añadir ejercicio"}
                    >
                      <T style={{ fontSize: 16, fontWeight: '700', color: sel ? C.accentText : C.mute }}>{sel ? '✓' : '+'}</T>
                    </Press>
                  </Press>
                );
              })}
              {groupExercises.length === 0 && (
                <T mute style={{ textAlign: 'center', marginTop: 30 }}>No hay ejercicios en este grupo.</T>
              )}
            </ScrollView>

            {/* Bottom Fixed Block */}
            <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: C.bg, padding: 22, borderTopWidth: 1, borderColor: C.line }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <T style={{ fontSize: 15, fontWeight: '700' }}>{r.exercises.length} ejercicios</T>
                <T mute style={{ fontSize: 13 }}>~{estMin} min</T>
              </View>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <Press
                  onPress={() => setStep('datos')}
                  style={{ width: 56, height: 56, borderRadius: 24, backgroundColor: C.card2, borderWidth: 1, borderColor: C.line, alignItems: 'center', justifyContent: 'center' }}
                  accessibilityLabel="Volver a datos"
                >
                  <T style={{ fontSize: 20, fontWeight: '700' }}>←</T>
                </Press>
                <Btn
                  label="Guardar rutina"
                  onPress={saveRoutine}
                  style={{ flex: 1, minHeight: 56, borderRadius: 24 }}
                />
              </View>
            </View>
          </View>
        )}

        {/* STEP 3: CONFIGURAR EJERCICIO (SCREEN 4) */}
        {step === 'config' && configIdx !== null && r.exercises[configIdx] && (() => {
          const ex = r.exercises[configIdx];
          const isManual = ex.mode === 'manual';
          const setsVal = isManual ? ex.sets : r.defaults.sets;
          const rirVal = isManual ? ex.rir : 2;

          const getEffortLabel = (rir) => {
            if (rir === 0) return 'Al fallo';
            if (rir === 1) return 'A 1 rep del fallo';
            if (rir === 2) return 'A 2 reps del fallo';
            if (rir === 3) return 'A 3 reps del fallo';
            return 'Lejos (4+ reps)';
          };

          return (
            <ScrollView contentContainerStyle={{ padding: 22, paddingTop: 56, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
              {/* Header Card */}
              <Card style={{ marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1, marginRight: 12 }}>
                    <H style={{ fontSize: 20, fontWeight: '700' }}>Configurar ejercicio</H>
                    <T mute numberOfLines={1} style={{ fontSize: 14, marginTop: 2 }}>{ex.name}</T>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center', marginTop: 4 }}>
                    <View style={{ width: 22, height: 6, borderRadius: 3, backgroundColor: C.track }} />
                    <View style={{ width: 22, height: 6, borderRadius: 3, backgroundColor: C.accent }} />
                  </View>
                </View>
              </Card>

              {/* Mode Selector */}
              <View style={{ backgroundColor: C.card, borderWidth: 1, borderColor: C.line, borderRadius: 18, padding: 4, flexDirection: 'row', marginBottom: 8 }}>
                <Press
                  onPress={() => {
                    setR(prev => {
                      const exes = [...prev.exercises];
                      exes[configIdx] = { ...exes[configIdx], mode: 'default' };
                      return { ...prev, exercises: exes };
                    });
                  }}
                  style={{
                    flex: 1, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
                    backgroundColor: !isManual ? C.accent : 'transparent',
                  }}
                >
                  <T style={{ fontSize: 14, fontWeight: '600', color: !isManual ? C.accentText : C.text }}>Por defecto</T>
                </Press>
                <Press
                  onPress={() => {
                    setR(prev => {
                      const exes = [...prev.exercises];
                      exes[configIdx] = { ...exes[configIdx], mode: 'manual', sets: ex.sets || prev.defaults.sets, rir: ex.rir !== undefined ? ex.rir : 2 };
                      return { ...prev, exercises: exes };
                    });
                  }}
                  style={{
                    flex: 1, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
                    backgroundColor: isManual ? C.accent : 'transparent',
                  }}
                >
                  <T style={{ fontSize: 14, fontWeight: '600', color: isManual ? C.accentText : C.text }}>Manual</T>
                </Press>
              </View>

              <T mute style={{ fontSize: 13, marginHorizontal: 4, marginBottom: 16 }}>
                {!isManual ? 'Se usan las series y el RIR por defecto de la rutina.' : 'Ajusta las series y el RIR solo para este ejercicio.'}
              </T>

              {/* Series Card */}
              <Card style={{ marginBottom: 16, opacity: isManual ? 1 : 0.38 }}>
                <T style={{ fontSize: 16, fontWeight: '700' }}>Series</T>
                <T mute style={{ fontSize: 13, marginTop: 2, marginBottom: 16 }}>Cuántas series harás de este ejercicio</T>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Press
                    disabled={!isManual}
                    onPress={() => {
                      if (!isManual) return;
                      setR(prev => {
                        const exes = [...prev.exercises];
                        const cur = exes[configIdx].sets;
                        if (cur > 1) exes[configIdx] = { ...exes[configIdx], sets: cur - 1 };
                        return { ...prev, exercises: exes };
                      });
                    }}
                    style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: C.card2, alignItems: 'center', justifyContent: 'center' }}
                    accessibilityLabel="Disminuir series"
                  >
                    <T style={{ fontSize: 24, fontWeight: '700' }}>−</T>
                  </Press>
                  <T style={{ fontSize: 40, fontWeight: '800' }}>{String(setsVal).padStart(2, '0')}</T>
                  <Press
                    disabled={!isManual}
                    onPress={() => {
                      if (!isManual) return;
                      setR(prev => {
                        const exes = [...prev.exercises];
                        const cur = exes[configIdx].sets;
                        if (cur < 10) exes[configIdx] = { ...exes[configIdx], sets: cur + 1 };
                        return { ...prev, exercises: exes };
                      });
                    }}
                    style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: C.card2, alignItems: 'center', justifyContent: 'center' }}
                    accessibilityLabel="Aumentar series"
                  >
                    <T style={{ fontSize: 24, fontWeight: '700' }}>+</T>
                  </Press>
                </View>
              </Card>

              {/* RIR Card */}
              <Card style={{ marginBottom: 16, opacity: isManual ? 1 : 0.38 }}>
                <T style={{ fontSize: 16, fontWeight: '700' }}>RIR</T>
                <T mute style={{ fontSize: 13, marginTop: 2, marginBottom: 16 }}>Repeticiones que te dejas en reserva</T>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Press
                    disabled={!isManual}
                    onPress={() => {
                      if (!isManual) return;
                      setR(prev => {
                        const exes = [...prev.exercises];
                        const cur = exes[configIdx].rir;
                        if (cur > 0) exes[configIdx] = { ...exes[configIdx], rir: cur - 1 };
                        return { ...prev, exercises: exes };
                      });
                    }}
                    style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: C.card2, alignItems: 'center', justifyContent: 'center' }}
                    accessibilityLabel="Disminuir RIR"
                  >
                    <T style={{ fontSize: 24, fontWeight: '700' }}>−</T>
                  </Press>
                  <T style={{ fontSize: 40, fontWeight: '800' }}>{String(rirVal).padStart(2, '0')}</T>
                  <Press
                    disabled={!isManual}
                    onPress={() => {
                      if (!isManual) return;
                      setR(prev => {
                        const exes = [...prev.exercises];
                        const cur = exes[configIdx].rir;
                        if (cur < 4) exes[configIdx] = { ...exes[configIdx], rir: cur + 1 };
                        return { ...prev, exercises: exes };
                      });
                    }}
                    style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: C.card2, alignItems: 'center', justifyContent: 'center' }}
                    accessibilityLabel="Aumentar RIR"
                  >
                    <T style={{ fontSize: 24, fontWeight: '700' }}>+</T>
                  </Press>
                </View>
              </Card>

              {/* Effort Card */}
              <Card style={{ marginBottom: 24, opacity: isManual ? 1 : 0.38 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <T style={{ fontSize: 15, fontWeight: '700' }}>{getEffortLabel(rirVal)}</T>
                  <T mute style={{ fontSize: 13 }}>RIR {String(rirVal).padStart(2, '0')}</T>
                </View>
                {/* 5 segments: order left to right: RIR 4+, 3, 2, 1, 0 */}
                <View style={{ flexDirection: 'row', gap: 6, marginBottom: 8 }}>
                  {[4, 3, 2, 1, 0].map(val => {
                    const active = rirVal === val;
                    return (
                      <View
                        key={val}
                        style={{
                          flex: 1, height: 8, borderRadius: 4,
                          backgroundColor: active ? C.accent : C.track,
                        }}
                      />
                    );
                  })}
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <T mute style={{ fontSize: 12 }}>Lejos</T>
                  <T mute style={{ fontSize: 12 }}>Al fallo</T>
                </View>
              </Card>

              {/* Bottom Nav */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                <Press
                  onPress={() => setStep('ejercicios')}
                  style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: C.card2, borderWidth: 1, borderColor: C.line, alignItems: 'center', justifyContent: 'center' }}
                  accessibilityLabel="Volver"
                >
                  <T style={{ fontSize: 20, fontWeight: '700' }}>←</T>
                </Press>
                <Btn
                  label="Añadir a la rutina"
                  onPress={() => {
                    setConfigIdx(null);
                    setStep('ejercicios');
                  }}
                  style={{ flex: 1, minHeight: 56, borderRadius: 24 }}
                />
              </View>
            </ScrollView>
          );
        })()}

      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function Routines({ start }) {
  const { data, update } = useStore();
  const [editingRoutine, setEditingRoutine] = useState(null);

  const activeDaysCount = [0,1,2,3,4,5,6].filter(d => routinesForDay(data, d).length > 0).length;
  const totalRoutines = data.routines.length;

  const del = (r) => Alert.alert('Eliminar rutina', `¿Eliminar "${r.name}"?`, [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Eliminar', style: 'destructive', onPress: () => update((d) => ({ ...d, routines: d.routines.filter((x) => x.id !== r.id) })) },
  ]);

  return (
    <ScrollView style={{ width: '100%' }} contentContainerStyle={{ padding: 22, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
      <FadeIn>
        {/* Header Card */}
        <Card style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <T style={{ fontSize: 20, fontWeight: '700' }}>Mis rutinas</T>
              <T mute style={{ fontSize: 14, marginTop: 2 }}>
                {totalRoutines > 0 ? `${activeDaysCount} días con rutina · ${totalRoutines} ${totalRoutines === 1 ? 'rutina' : 'rutinas'}` : 'Sin rutinas configuradas'}
              </T>
            </View>
            {/* Dots */}
            <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
              {totalRoutines > 0 ? (
                data.routines.map((_, i) => (
                  <View key={i} style={{ width: 22, height: 6, borderRadius: 3, backgroundColor: i === 0 ? C.accent : C.track }} />
                ))
              ) : (
                <View style={{ width: 22, height: 6, borderRadius: 3, backgroundColor: C.track }} />
              )}
            </View>
          </View>
        </Card>

        {/* 7-day strip (L M X J V S D) */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 4, marginBottom: 16 }}>
          {DAYS.map((dName, idx) => {
            const hasRoutines = routinesForDay(data, idx).length > 0;
            return (
              <View
                key={dName}
                style={{
                  flex: 1, height: 44, borderRadius: 14,
                  backgroundColor: hasRoutines ? C.accent : C.card2,
                  borderWidth: 1, borderColor: hasRoutines ? C.accent : C.line,
                  alignItems: 'center', justifyContent: 'center',
                }}
              >
                <T style={{ fontSize: 14, fontWeight: '700', color: hasRoutines ? C.accentText : C.mute }}>{dName}</T>
              </View>
            );
          })}
        </View>

        {/* Section Label */}
        <T mute style={{ fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1.2, marginTop: 6, marginBottom: 10 }}>
          Tu semana
        </T>

        {/* Week schedule (Monday to Sunday, index 0 to 6) */}
        {totalRoutines > 0 ? (
          [0, 1, 2, 3, 4, 5, 6].map(dIdx => {
            const dayRouts = routinesForDay(data, dIdx);
            if (dayRouts.length > 0) {
              return dayRouts.map((r) => {
                const estSec = r.exercises.reduce((acc, ex) => acc + (Number(ex.sets) || r.defaults?.sets || 3) * (r.defaults?.restSec || 120), 0);
                const estMin = Math.max(1, Math.round(estSec / 60));

                return (
                  <Card key={`${r.id}-${dIdx}`} style={{ marginBottom: 12, paddingVertical: 14, paddingHorizontal: 18 }}>
                    <Press
                      onPress={() => setEditingRoutine(r)}
                      style={{ flexDirection: 'row', alignItems: 'center' }}
                    >
                      {/* Day Abbr Box */}
                      <View style={{ width: 52, height: 44, borderRadius: 14, backgroundColor: C.accentDim, alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                        <T style={{ fontSize: 13, fontWeight: '800', color: C.accent }}>{DAY_ABBR[dIdx]}</T>
                      </View>
                      {/* Center Info */}
                      <View style={{ flex: 1, marginRight: 10 }}>
                        <T style={{ fontSize: 16, fontWeight: '700' }}>{r.name}</T>
                        <T mute style={{ fontSize: 13, marginTop: 2 }}>{r.exercises.length} ejercicios · ~{estMin} min</T>
                      </View>
                      {/* Right Chevron & delete */}
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <Press onPress={() => del(r)} style={{ padding: 6 }}>
                          <Ionicons name="trash-outline" size={18} color={C.danger} />
                        </Press>
                        <T mute style={{ fontSize: 18, fontWeight: '600' }}>›</T>
                      </View>
                    </Press>
                  </Card>
                );
              });
            } else {
              return (
                <View key={`rest-${dIdx}`} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'transparent', borderRadius: 22, borderWidth: 1, borderColor: C.line, paddingVertical: 12, paddingHorizontal: 18, marginBottom: 12 }}>
                  <View style={{ width: 52, height: 44, borderRadius: 14, backgroundColor: C.card2, alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                    <T style={{ fontSize: 13, fontWeight: '800', color: C.restText }}>{DAY_ABBR[dIdx]}</T>
                  </View>
                  <View style={{ flex: 1 }}>
                    <T mute style={{ fontSize: 15, fontWeight: '600' }}>Descanso</T>
                  </View>
                </View>
              );
            }
          })
        ) : (
          <View style={{ alignItems: 'center', marginVertical: 20 }}>
            <Coach mood="neutral" size="sm" />
            <T mute style={{ textAlign: 'center', marginTop: 12, marginBottom: 16 }}>
              Aún no tienes rutinas. Crea tu primera rutina para empezar a entrenar.
            </T>
          </View>
        )}

        {/* New Routine Button */}
        <Btn
          kind="ghost"
          label="+ Nueva rutina"
          onPress={() => setEditingRoutine({ id: uid(), name: '', goal: 'hipertrofia', days: [0], defaults: { sets: 3, reps: 10, restSec: 120 }, exercises: [] })}
          style={{ marginTop: 8, minHeight: 56, borderRadius: 24, backgroundColor: C.card2, borderWidth: 1, borderColor: C.line }}
        />

        {editingRoutine && <Editor routine={editingRoutine} onClose={() => setEditingRoutine(null)} />}
      </FadeIn>
    </ScrollView>
  );
}

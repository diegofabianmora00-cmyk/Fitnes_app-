import React, { useState, useMemo } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C } from '../theme';
import { Btn, Card, FadeIn, Field, H, Press, T } from '../ui';
import { uid, useStore, routinesForDay } from '../store';
import { GROUPS, filterExercises } from '../exercises';
import { GOALS } from '../recommend';
import Coach from '../Coach';
import CustomExerciseModal from '../CustomExerciseModal';

const DAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const DAY_NAMES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const DAY_ABBR = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];
const TODAY_IDX = (new Date().getDay() + 6) % 7;
const goalLabel = (id) => (GOALS.find((g) => g.id === id) || GOALS[1]).label;

const formatRest = (sec) => {
  const s = Number(sec) || 120;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}:${String(rem).padStart(2, '0')}`;
};

function Stepper({ value, onChange, min = 1, max = 99, disabled, display }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <Press
        disabled={disabled}
        onPress={() => onChange(Math.max(min, value - 1))}
        style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: C.card2, borderWidth: 1, borderColor: C.line, alignItems: 'center', justifyContent: 'center' }}
        accessibilityLabel="Disminuir"
      >
        <T style={{ fontSize: 22, fontWeight: '700', color: disabled ? C.mute : C.text }}>−</T>
      </Press>
      <T style={{ fontSize: 34, fontWeight: '800', color: disabled ? C.mute : C.text }}>{display ? display(value) : String(value).padStart(2, '0')}</T>
      <Press
        disabled={disabled}
        onPress={() => onChange(Math.min(max, value + 1))}
        style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: C.card2, borderWidth: 1, borderColor: C.line, alignItems: 'center', justifyContent: 'center' }}
        accessibilityLabel="Aumentar"
      >
        <T style={{ fontSize: 22, fontWeight: '700', color: disabled ? C.mute : C.text }}>+</T>
      </Press>
    </View>
  );
}

function Editor({ routine, onClose }) {
  const { update, data } = useStore();
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
  const [query, setQuery] = useState('');
  const [customModal, setCustomModal] = useState(false);
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

  const addAndOpen = (item) => {
    const idx = r.exercises.length;
    toggleExercise(item);
    setConfigIdx(idx);
    setStep('config');
  };

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

  const groupExercises = useMemo(
    () => filterExercises(query, activeGroup, data.customExercises || []),
    [query, activeGroup, data.customExercises],
  );
  const isEditing = data.routines.some(x => x.id === routine.id);
  const totalEstSec = r.exercises.reduce((acc, ex) => {
    const manual = ex.mode === 'manual';
    const sets = manual ? (Number(ex.sets) || r.defaults.sets) : r.defaults.sets;
    const rest = manual ? (Number(ex.restSec) || r.defaults.restSec) : r.defaults.restSec;
    return acc + sets * rest;
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
                  <H style={{ fontSize: 20, fontWeight: '700' }}>{isEditing ? 'Editar rutina' : 'Nueva rutina'}</H>
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
          <View style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={{ padding: 22, paddingTop: 56, paddingBottom: 140 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              {/* Header Card */}
              <Card style={{ marginBottom: 12 }}>
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

              {/* Selected Exercises / Order Management */}
              {r.exercises.length > 0 && (
                <Card style={{ marginBottom: 12, paddingVertical: 12, paddingHorizontal: 16 }}>
                  <T style={{ fontSize: 12, fontWeight: '600', color: C.mute, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
                    Orden de ejercicios ({r.exercises.length})
                  </T>
                  {r.exercises.map((ex, exIdx) => (
                    <View key={`${ex.id}-${exIdx}`} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: exIdx < r.exercises.length - 1 ? 1 : 0, borderColor: C.line }}>
                      <T style={{ fontSize: 13, fontWeight: '700', color: C.mute, width: 24 }}>{exIdx + 1}.</T>
                      <T numberOfLines={1} style={{ fontSize: 14, fontWeight: '700', flex: 1, marginRight: 8 }}>{ex.name}</T>
                      
                      {/* Reorder Buttons */}
                      <View style={{ flexDirection: 'row', gap: 4, marginRight: 8 }}>
                        <Press
                          disabled={exIdx === 0}
                          onPress={() => {
                            const list = [...r.exercises];
                            const temp = list[exIdx];
                            list[exIdx] = list[exIdx - 1];
                            list[exIdx - 1] = temp;
                            updateField('exercises', list);
                          }}
                          style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: exIdx === 0 ? C.card2 : C.card, borderWidth: 1, borderColor: C.line, alignItems: 'center', justifyContent: 'center', opacity: exIdx === 0 ? 0.4 : 1 }}
                          accessibilityLabel="Mover arriba"
                        >
                          <T style={{ fontSize: 14, fontWeight: '700' }}>↑</T>
                        </Press>
                        <Press
                          disabled={exIdx === r.exercises.length - 1}
                          onPress={() => {
                            const list = [...r.exercises];
                            const temp = list[exIdx];
                            list[exIdx] = list[exIdx + 1];
                            list[exIdx + 1] = temp;
                            updateField('exercises', list);
                          }}
                          style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: exIdx === r.exercises.length - 1 ? C.card2 : C.card, borderWidth: 1, borderColor: C.line, alignItems: 'center', justifyContent: 'center', opacity: exIdx === r.exercises.length - 1 ? 0.4 : 1 }}
                          accessibilityLabel="Mover abajo"
                        >
                          <T style={{ fontSize: 14, fontWeight: '700' }}>↓</T>
                        </Press>
                      </View>

                      {/* Configure / Remove */}
                      <Press
                        onPress={() => {
                          setConfigIdx(exIdx);
                          setStep('config');
                        }}
                        style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: C.card, borderWidth: 1, borderColor: C.line, alignItems: 'center', justifyContent: 'center', marginRight: 4 }}
                        accessibilityLabel="Configurar ejercicio"
                      >
                        <Ionicons name="settings-outline" size={14} color={C.text} />
                      </Press>
                      <Press
                        onPress={() => toggleExercise(ex)}
                        style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: C.card, borderWidth: 1, borderColor: C.danger, alignItems: 'center', justifyContent: 'center' }}
                        accessibilityLabel="Quitar ejercicio"
                      >
                        <Ionicons name="close" size={14} color={C.danger} />
                      </Press>
                    </View>
                  ))}
                </Card>
              )}

              {/* Search */}
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: C.card2, borderRadius: 14, paddingHorizontal: 12, marginBottom: 12, borderWidth: 1, borderColor: C.line }}>
                <Ionicons name="search" size={18} color={C.mute} />
                <Field
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Buscar ejercicio"
                  returnKeyType="search"
                  style={{ flex: 1, backgroundColor: 'transparent', paddingHorizontal: 8, paddingVertical: 12 }}
                />
                {query ? (
                  <Press onPress={() => setQuery('')} style={{ padding: 4 }}>
                    <Ionicons name="close-circle" size={18} color={C.mute} />
                  </Press>
                ) : null}
              </View>

              {/* Muscle Group Horizontal Chips */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }} contentContainerStyle={{ gap: 8 }}>
                {GROUPS.map(g => {
                  const on = activeGroup === g;
                  return (
                    <Press
                      key={g}
                      onPress={() => setActiveGroup(g)}
                      style={{
                        height: 40, borderRadius: 14, paddingHorizontal: 16,
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

              {/* Create custom exercise */}
              <Press
                onPress={() => setCustomModal(true)}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16, paddingVertical: 12, borderRadius: 14, backgroundColor: C.accentDim, borderWidth: 1, borderColor: C.accent }}
              >
                <Ionicons name="add-circle" size={20} color={C.accent} />
                <T style={{ fontSize: 14, fontWeight: '700', color: C.accent }}>Crear ejercicio personalizado</T>
              </Press>

              {/* Section label */}
              <T mute style={{ fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8 }}>
                {activeGroup} · {groupExercises.length} ejercicios
              </T>

              {/* Exercises Catalog List */}
              {groupExercises.map(item => {
                const sel = isSelectedExercise(item.id);
                const exObj = r.exercises.find(e => e.id === item.id);
                const sCount = sel && exObj ? (exObj.mode === 'manual' ? exObj.sets : r.defaults.sets) : r.defaults.sets;
                const rCount = sel && exObj ? (exObj.mode === 'manual' ? (exObj.reps || r.defaults.reps) : r.defaults.reps) : r.defaults.reps;
                const restCount = sel && exObj && exObj.mode === 'manual' ? (exObj.restSec || r.defaults.restSec) : r.defaults.restSec;

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
                        addAndOpen(item);
                      }
                    }}
                    style={{
                      flexDirection: 'row', alignItems: 'center', backgroundColor: C.card,
                      borderWidth: 1, borderColor: sel ? C.accent : C.line,
                      borderRadius: 16, paddingVertical: 12, paddingHorizontal: 16, marginBottom: 8,
                    }}
                  >
                    <View style={{ flex: 1, marginRight: 12 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <T numberOfLines={1} style={{ fontSize: 16, fontWeight: '700', flexShrink: 1 }}>{item.name}</T>
                        {item.custom && (
                          <View style={{ paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6, backgroundColor: C.accentDim }}>
                            <T style={{ fontSize: 9, fontWeight: '700', color: C.accent }}>PROPIO</T>
                          </View>
                        )}
                      </View>
                      <T mute style={{ fontSize: 13, marginTop: 3 }}>{item.equipment} · {sCount} × {rCount} · {formatRest(restCount)}</T>
                    </View>
                    <Press
                      onPress={() => {
                        if (sel) toggleExercise(item);
                        else addAndOpen(item);
                      }}
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
                <T style={{ fontSize: 15, fontWeight: '700' }}>
                  {r.exercises.length} {r.exercises.length === 1 ? 'ejercicio' : 'ejercicios'}
                </T>
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
                  disabled={r.exercises.length === 0}
                  label={r.exercises.length === 0 ? 'Añade al menos 1 ejercicio' : 'Guardar rutina'}
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
          const repsVal = isManual ? (ex.reps || r.defaults.reps) : r.defaults.reps;
          const restVal = isManual ? (ex.restSec || r.defaults.restSec) : r.defaults.restSec;
          const rirVal = isManual ? (ex.rir !== undefined ? ex.rir : 2) : 2;

          const patchEx = (patch) => setR(prev => {
            const exes = [...prev.exercises];
            exes[configIdx] = { ...exes[configIdx], ...patch };
            return { ...prev, exercises: exes };
          });

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
                    <H style={{ fontSize: 20, fontWeight: '700' }}>Ajustes del ejercicio</H>
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
                  onPress={() => patchEx({ mode: 'default' })}
                  style={{
                    flex: 1, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
                    backgroundColor: !isManual ? C.accent : 'transparent',
                  }}
                >
                  <T style={{ fontSize: 14, fontWeight: '600', color: !isManual ? C.accentText : C.text }}>Por defecto</T>
                </Press>
                <Press
                  onPress={() => patchEx({ mode: 'manual', sets: setsVal, reps: repsVal, restSec: restVal, rir: rirVal })}
                  style={{
                    flex: 1, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
                    backgroundColor: isManual ? C.accent : 'transparent',
                  }}
                >
                  <T style={{ fontSize: 14, fontWeight: '600', color: isManual ? C.accentText : C.text }}>Personalizado</T>
                </Press>
              </View>

              <T mute style={{ fontSize: 13, marginHorizontal: 4, marginBottom: 16 }}>
                {!isManual
                  ? `Usa los valores de la rutina: ${r.defaults.sets} series × ${r.defaults.reps} reps · ${formatRest(r.defaults.restSec)} · RIR 2. Toca "Personalizado" para cambiarlos solo en este ejercicio.`
                  : 'Ajusta series, repeticiones, descanso y RIR solo para este ejercicio.'}
              </T>

              {/* Series */}
              <Card style={{ marginBottom: 12, opacity: isManual ? 1 : 0.5 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
                  <T style={{ fontSize: 16, fontWeight: '700' }}>Series</T>
                  <T mute style={{ fontSize: 12 }}>1 a 10</T>
                </View>
                <Stepper
                  value={Number(setsVal) || 3}
                  min={1}
                  max={10}
                  disabled={!isManual}
                  onChange={(v) => patchEx({ sets: v })}
                />
              </Card>

              {/* Repeticiones */}
              <Card style={{ marginBottom: 12, opacity: isManual ? 1 : 0.5 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
                  <T style={{ fontSize: 16, fontWeight: '700' }}>Repeticiones</T>
                  <T mute style={{ fontSize: 12 }}>objetivo por serie</T>
                </View>
                <Stepper
                  value={Number(repsVal) || 10}
                  min={1}
                  max={50}
                  disabled={!isManual}
                  onChange={(v) => patchEx({ reps: v })}
                />
              </Card>

              {/* Descanso */}
              <Card style={{ marginBottom: 12, opacity: isManual ? 1 : 0.5 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
                  <T style={{ fontSize: 16, fontWeight: '700' }}>Descanso</T>
                  <T mute style={{ fontSize: 12 }}>entre series</T>
                </View>
                <Stepper
                  value={Number(restVal) || 120}
                  min={15}
                  max={600}
                  disabled={!isManual}
                  display={formatRest}
                  onChange={(v) => patchEx({ restSec: Math.max(15, Math.round(v / 15) * 15) })}
                />
                <T mute style={{ fontSize: 12, marginTop: 8 }}>Pasos de 15 s. El cronómetro del entreno usará este tiempo.</T>
              </Card>

              {/* RIR */}
              <Card style={{ marginBottom: 24, opacity: isManual ? 1 : 0.5 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
                  <T style={{ fontSize: 16, fontWeight: '700' }}>RIR</T>
                  <T mute style={{ fontSize: 12 }}>{getEffortLabel(rirVal)}</T>
                </View>
                <Stepper
                  value={Number(rirVal) || 0}
                  min={0}
                  max={4}
                  disabled={!isManual}
                  onChange={(v) => patchEx({ rir: v })}
                />
                <View style={{ flexDirection: 'row', gap: 6, marginTop: 12 }}>
                  {[4, 3, 2, 1, 0].map(val => (
                    <View
                      key={val}
                      style={{ flex: 1, height: 8, borderRadius: 4, backgroundColor: rirVal === val ? C.accent : C.track }}
                    />
                  ))}
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
                  <T mute style={{ fontSize: 11 }}>Lejos del fallo</T>
                  <T mute style={{ fontSize: 11 }}>Al fallo</T>
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
                  label="Listo"
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

        <CustomExerciseModal
          visible={customModal}
          onClose={() => setCustomModal(false)}
          onCreated={(newEx) => {
            const idx = r.exercises.length;
            setR(prev => ({
              ...prev,
              exercises: [
                ...prev.exercises,
                {
                  id: newEx.id,
                  name: newEx.name,
                  group: newEx.group,
                  equipment: newEx.equipment,
                  sets: prev.defaults.sets,
                  reps: prev.defaults.reps,
                  mode: 'default',
                  rir: 2,
                },
              ],
            }));
            setConfigIdx(idx);
            setStep('config');
          }}
        />

      </KeyboardAvoidingView>
    </Modal>
  );
}

function RoutineDetail({ routine, onClose, onEdit, onDelete }) {
  const estSec = routine.exercises.reduce((acc, ex) => {
    const manual = ex.mode === 'manual';
    const sets = manual ? (Number(ex.sets) || routine.defaults?.sets || 3) : (routine.defaults?.sets || 3);
    const rest = manual ? (Number(ex.restSec) || routine.defaults?.restSec || 120) : (routine.defaults?.restSec || 120);
    return acc + sets * rest;
  }, 0);
  const estMin = Math.max(1, Math.round(estSec / 60));

  const daysStr = routine.days && routine.days.length > 0
    ? routine.days.map(d => DAY_NAMES[d]).join(', ')
    : 'Ningún día asignado';

  return (
    <Modal animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        <ScrollView contentContainerStyle={{ padding: 22, paddingTop: 56, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          {/* Header Card */}
          <Card style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <View style={{ flex: 1, marginRight: 12 }}>
                <H style={{ fontSize: 22, fontWeight: '800' }}>{routine.name}</H>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 8 }}>
                  <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: C.accentDim, borderWidth: 1, borderColor: C.accent }}>
                    <T style={{ fontSize: 11, fontWeight: '700', color: C.accent }}>{goalLabel(routine.goal)}</T>
                  </View>
                  <T mute style={{ fontSize: 13 }}>~{estMin} min · {routine.exercises.length} {routine.exercises.length === 1 ? 'ejercicio' : 'ejercicios'}</T>
                </View>
              </View>
              <Press
                onPress={onClose}
                style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: C.card2, borderWidth: 1, borderColor: C.line, alignItems: 'center', justifyContent: 'center' }}
                accessibilityLabel="Cerrar"
              >
                <T style={{ fontSize: 16, fontWeight: '700' }}>✕</T>
              </Press>
            </View>

            <View style={{ marginTop: 8, paddingTop: 12, borderTopWidth: 1, borderColor: C.line }}>
              <T mute style={{ fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Días asignados</T>
              <T style={{ fontSize: 14, fontWeight: '600' }}>{daysStr}</T>
            </View>

            <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderColor: C.line }}>
              <T mute style={{ fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Valores por defecto</T>
              <T style={{ fontSize: 14, fontWeight: '600' }}>
                {routine.defaults?.sets || 3} series × {routine.defaults?.reps || 10} reps · {formatRest(routine.defaults?.restSec || 120)} descanso · RIR 2
              </T>
            </View>
          </Card>

          {/* Section Title */}
          <T mute style={{ fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 10 }}>
            Ejercicios de la rutina ({routine.exercises.length})
          </T>

          {/* Exercises List */}
          {routine.exercises.map((ex, idx) => {
            const isManual = ex.mode === 'manual';
            const sets = isManual ? ex.sets : (routine.defaults?.sets || 3);
            const reps = isManual ? (ex.reps || routine.defaults?.reps || 10) : (routine.defaults?.reps || 10);
            const rest = isManual ? (ex.restSec || routine.defaults?.restSec || 120) : (routine.defaults?.restSec || 120);
            const rir = isManual ? (ex.rir !== undefined ? ex.rir : 2) : 2;

            const rirText = rir === 0 ? 'Al fallo' : `RIR ${rir}`;

            return (
              <Card key={`${ex.id}-${idx}`} style={{ marginBottom: 10, paddingVertical: 12, paddingHorizontal: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: C.card2, alignItems: 'center', justifyContent: 'center', marginRight: 10, marginTop: 2 }}>
                    <T style={{ fontSize: 12, fontWeight: '700', color: C.mute }}>{idx + 1}</T>
                  </View>
                  <View style={{ flex: 1, marginRight: 10 }}>
                    <T style={{ fontSize: 16, fontWeight: '700' }}>{ex.name}</T>
                    <T mute style={{ fontSize: 13, marginTop: 2 }}>
                      {ex.equipment || 'Equipamiento'} · {sets} series × {reps} reps
                    </T>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
                      <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, backgroundColor: C.card2, borderWidth: 1, borderColor: C.line }}>
                        <T mute style={{ fontSize: 11, fontWeight: '600' }}>⏱ {formatRest(rest)}</T>
                      </View>
                      <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, backgroundColor: C.card2, borderWidth: 1, borderColor: C.line }}>
                        <T mute style={{ fontSize: 11, fontWeight: '600' }}>🎯 {rirText}</T>
                      </View>
                      {isManual && (
                        <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, backgroundColor: C.accentDim }}>
                          <T style={{ fontSize: 10, fontWeight: '700', color: C.accent }}>CUSTOM</T>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              </Card>
            );
          })}

          {routine.exercises.length === 0 && (
            <Card style={{ padding: 24, alignItems: 'center' }}>
              <T mute style={{ textAlign: 'center' }}>Esta rutina no tiene ejercicios.</T>
            </Card>
          )}

          {/* Action Buttons */}
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
            <Btn
              kind="ghost"
              label="Eliminar"
              onPress={() => {
                onClose();
                onDelete(routine);
              }}
              style={{ flex: 1, minHeight: 52, borderRadius: 20, backgroundColor: C.card2, borderWidth: 1, borderColor: C.line }}
            />
            <Btn
              label="EDITAR"
              onPress={() => {
                onClose();
                onEdit(routine);
              }}
              style={{ flex: 2, minHeight: 52, borderRadius: 20 }}
            />
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

export default function Routines({ start }) {
  const { data, update } = useStore();
  const [selectedRoutine, setSelectedRoutine] = useState(null);
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
            const isToday = idx === TODAY_IDX;
            return (
              <View
                key={dName}
                style={{
                  flex: 1, height: 44, borderRadius: 14,
                  backgroundColor: hasRoutines ? C.accent : C.card2,
                  borderWidth: isToday ? 2 : 1,
                  borderColor: isToday ? C.text : (hasRoutines ? C.accent : C.line),
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
                const estSec = r.exercises.reduce((acc, ex) => {
                  const manual = ex.mode === 'manual';
                  const sets = manual ? (Number(ex.sets) || r.defaults?.sets || 3) : (r.defaults?.sets || 3);
                  const rest = manual ? (Number(ex.restSec) || r.defaults?.restSec || 120) : (r.defaults?.restSec || 120);
                  return acc + sets * rest;
                }, 0);
                const estMin = Math.max(1, Math.round(estSec / 60));

                return (
                  <Card key={`${r.id}-${dIdx}`} style={{ marginBottom: 12, paddingVertical: 14, paddingHorizontal: 18 }}>
                    <Press
                      onPress={() => setSelectedRoutine(r)}
                      style={{ flexDirection: 'row', alignItems: 'center' }}
                    >
                      {/* Day Abbr Box */}
                      <View style={{ width: 52, height: 44, borderRadius: 14, backgroundColor: dIdx === TODAY_IDX ? C.accent : C.accentDim, alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                        <T style={{ fontSize: 13, fontWeight: '800', color: dIdx === TODAY_IDX ? C.accentText : C.accent }}>{DAY_ABBR[dIdx]}</T>
                      </View>
                      {/* Center Info */}
                      <View style={{ flex: 1, marginRight: 10 }}>
                        <T numberOfLines={1} style={{ fontSize: 16, fontWeight: '700' }}>{r.name}</T>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3, gap: 8 }}>
                          <T mute style={{ fontSize: 13 }}>{r.exercises.length} ejercicios · ~{estMin} min</T>
                          <View style={{ paddingHorizontal: 7, paddingVertical: 2, borderRadius: 7, backgroundColor: C.card2, borderWidth: 1, borderColor: C.line }}>
                            <T mute style={{ fontSize: 10, fontWeight: '600' }}>{goalLabel(r.goal)}</T>
                          </View>
                        </View>
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

        {selectedRoutine && (
          <RoutineDetail
            routine={selectedRoutine}
            onClose={() => setSelectedRoutine(null)}
            onEdit={(r) => setEditingRoutine(r)}
            onDelete={del}
          />
        )}
        {editingRoutine && <Editor routine={editingRoutine} onClose={() => setEditingRoutine(null)} />}
      </FadeIn>
    </ScrollView>
  );
}

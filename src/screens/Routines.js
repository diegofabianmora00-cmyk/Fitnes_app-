import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C } from '../theme';
import { Btn, Card, FadeIn, Field, H, Press, T } from '../ui';
import { uid, useStore } from '../store';
import ExercisePicker from '../ExercisePicker';

function Editor({ routine, onClose }) {
  const { update } = useStore();
  const [name, setName] = useState(routine.name);
  const [ex, setEx] = useState(routine.exercises.map((e) => ({ ...e, sets: String(e.sets), reps: String(e.reps) })));
  const [picking, setPicking] = useState(null);
  const set = (i, k, v) => setEx((a) => a.map((e, j) => (j === i ? { ...e, [k]: v } : e)));

  const choose = (item) => {
    if (picking === 'new') {
      setEx((a) => [...a, { id: item.id, name: item.name, group: item.group, equipment: item.equipment, sets: '3', reps: '10' }]);
    } else {
      setEx((a) => a.map((e, j) => (j === picking ? { ...e, id: item.id, name: item.name, group: item.group, equipment: item.equipment } : e)));
    }
  };

  const save = () => {
    const exercises = ex.filter((e) => e.name && e.name.trim()).map((e) => ({
      id: e.id, name: e.name.trim(), group: e.group, equipment: e.equipment,
      sets: parseInt(e.sets) || 3, reps: parseInt(e.reps) || 10,
    }));
    const r = { id: routine.id, name: name.trim() || 'Rutina', exercises };
    update((d) => ({ ...d, routines: d.routines.some((x) => x.id === r.id) ? d.routines.map((x) => (x.id === r.id ? r : x)) : [...d.routines, r] }));
    onClose();
  };

  return (
    <Modal animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: C.bg }}>
        <ScrollView contentContainerStyle={{ padding: 22, paddingTop: 50, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
          <H style={{ fontSize: 26 }}>Rutina</H>
          <Field value={name} onChangeText={setName} placeholder="Nombre (ej. Pierna)" style={{ marginTop: 14 }} />
          <T mute style={{ marginTop: 22, marginBottom: 8 }}>Ejercicios · series × repeticiones</T>
          {ex.map((e, i) => (
            <View key={`${e.id}-${i}`} style={{ flexDirection: 'row', gap: 8, marginBottom: 8, alignItems: 'center' }}>
              <Press onPress={() => setPicking(i)} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: C.card2, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12 }}>
                <T numberOfLines={1} style={{ flex: 1, color: e.name ? C.text : C.mute, fontSize: 14 }}>{e.name || 'Elegir ejercicio'}</T>
                <Ionicons name="chevron-down" size={16} color={C.mute} />
              </Press>
              <Field value={e.sets} onChangeText={(v) => set(i, 'sets', v)} keyboardType="number-pad" style={{ width: 48, textAlign: 'center' }} />
              <T mute>×</T>
              <Field value={e.reps} onChangeText={(v) => set(i, 'reps', v)} keyboardType="number-pad" style={{ width: 48, textAlign: 'center' }} />
              <Press onPress={() => setEx((a) => a.filter((_, j) => j !== i))}><Ionicons name="close-circle" size={24} color={C.mute} /></Press>
            </View>
          ))}
          <Btn kind="ghost" label="+ Añadir ejercicio" onPress={() => setPicking('new')} style={{ marginTop: 6 }} />
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 28 }}>
            <Btn kind="ghost" label="Cancelar" onPress={onClose} style={{ flex: 1 }} />
            <Btn label="Guardar" onPress={save} style={{ flex: 1 }} />
          </View>
        </ScrollView>
        <ExercisePicker
          visible={picking !== null}
          onClose={() => setPicking(null)}
          onSelect={choose}
          selectedId={typeof picking === 'number' ? ex[picking] && ex[picking].id : null}
        />
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function Routines({ start }) {
  const { data, update } = useStore();
  const [editing, setEditing] = useState(null);
  const del = (r) => Alert.alert('Eliminar rutina', `¿Eliminar "${r.name}"?`, [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Eliminar', style: 'destructive', onPress: () => update((d) => ({ ...d, routines: d.routines.filter((x) => x.id !== r.id) })) },
  ]);

  return (
    <ScrollView style={{ width: '100%' }} contentContainerStyle={{ padding: 22, paddingBottom: 30 }} showsVerticalScrollIndicator={false}>
      <FadeIn><H>Rutinas</H></FadeIn>
      {data.routines.map((r, i) => (
        <FadeIn key={r.id} delay={80 + i * 70}>
          <Card style={{ marginTop: 14 }}>
            <T style={{ fontSize: 20, fontWeight: '700' }}>{r.name}</T>
            <View style={{ marginTop: 8, gap: 4 }}>
              {r.exercises.map((e, i) => <T key={`${e.id}-${i}`} mute>{e.name} · {e.sets}×{e.reps}</T>)}
            </View>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
              <Btn label="Entrenar" onPress={() => start(r)} style={{ flex: 1, paddingVertical: 12 }} />
              <Btn kind="ghost" label="Editar" onPress={() => setEditing(r)} style={{ paddingVertical: 12 }} />
              <Press onPress={() => del(r)} style={{ backgroundColor: C.card2, borderRadius: 16, paddingHorizontal: 14, justifyContent: 'center' }}>
                <Ionicons name="trash-outline" size={20} color={C.danger} />
              </Press>
            </View>
          </Card>
        </FadeIn>
      ))}
      <Btn kind="ghost" label="+ Nueva rutina" onPress={() => setEditing({ id: uid(), name: '', exercises: [] })} style={{ marginTop: 16 }} />
      {editing && <Editor routine={editing} onClose={() => setEditing(null)} />}
    </ScrollView>
  );
}

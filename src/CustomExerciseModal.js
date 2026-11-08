import React, { useState } from 'react';
import { Modal, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C } from './theme';
import { Btn, Card, Field, Press, T } from './ui';
import { GROUPS } from './exercises';
import { useStore, uid } from './store';

const LOAD_TYPE_OPTIONS = [
  { id: 'barbell', label: 'Barra con discos', example: '60 kg = barra 20 + 2 × 20' },
  { id: 'dumbbell', label: 'Mancuerna (por mano)', example: '20 kg = mancuerna 20' },
  { id: 'stack', label: 'Máquina de selector', example: '50 kg = placa 50' },
  { id: 'plates', label: 'Máquina de discos', example: '100 kg = carro 40 + 2 × 30' },
  { id: 'bodyweight', label: 'Peso corporal', example: '80 kg = corporal + 10 kg lastre' },
  { id: 'plain', label: 'Número simple', example: '50 kg directo' },
];

const EQUIPMENT_OPTIONS = ['Barra', 'Mancuernas', 'Máquina', 'Polea', 'Peso corporal', 'Otro'];
const TYPE_OPTIONS = [
  { id: 'compuesto', label: 'Compuesto (varias articulaciones)' },
  { id: 'aislamiento', label: 'Aislamiento (una articulación)' },
];

export default function CustomExerciseModal({ visible, onClose, onCreated }) {
  const { update } = useStore();
  const [name, setName] = useState('');
  const [group, setGroup] = useState('Pecho');
  const [equipment, setEquipment] = useState('Mancuernas');
  const [loadType, setLoadType] = useState('barbell');
  const [type, setType] = useState('aislamiento');
  const [muscles, setMuscles] = useState('');

  const save = () => {
    if (!name.trim()) return;
    const cleanGroup = group || 'Pecho';
    const bodyweight = equipment === 'Peso corporal';
    const newEx = {
      id: `custom-${uid()}`,
      name: name.trim(),
      group: cleanGroup,
      equipment: equipment || 'Mancuernas',
      loadType: loadType || 'barbell',
      type: type || 'aislamiento',
      muscles: muscles.trim() ? muscles.split(',').map(s => s.trim()).filter(Boolean) : [cleanGroup],
      met: bodyweight ? 3.0 : 3.5,
      metCode: bodyweight ? '02056' : '02054',
      source: 'Ejercicio personalizado creado por el usuario.',
      custom: true,
    };
    update(d => ({
      ...d,
      customExercises: [...(d.customExercises || []), newEx],
    }));
    if (onCreated) onCreated(newEx);
    setName('');
    setMuscles('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: C.bg, paddingTop: 50 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, paddingBottom: 16 }}>
          <T style={{ fontSize: 20, fontWeight: '700' }}>Nuevo ejercicio</T>
          <Press onPress={onClose} style={{ width: 40, height: 40, borderRadius: 14, backgroundColor: C.card2, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="close" size={22} color={C.text} />
          </Press>
        </View>

        <ScrollView contentContainerStyle={{ padding: 22, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
          {/* Nombre (Obligatorio) */}
          <Card style={{ marginBottom: 16 }}>
            <T style={{ fontSize: 12, fontWeight: '600', color: C.mute, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
              Nombre del ejercicio *
            </T>
            <Field
              value={name}
              onChangeText={setName}
              placeholder="Ej. Curl en banco inclinado"
              style={{ height: 48, borderRadius: 14, backgroundColor: C.field, borderWidth: 1, borderColor: C.line, fontSize: 16, fontWeight: '600' }}
            />
          </Card>

          {/* Grupo muscular (Obligatorio) */}
          <Card style={{ marginBottom: 16 }}>
            <T style={{ fontSize: 12, fontWeight: '600', color: C.mute, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
              Grupo muscular principal *
            </T>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {GROUPS.filter(g => g !== 'Todos').map(g => {
                const on = group === g;
                return (
                  <Press
                    key={g}
                    onPress={() => setGroup(g)}
                    style={{ paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, backgroundColor: on ? C.accent : C.card2, borderWidth: 1, borderColor: on ? C.accent : C.line }}
                  >
                    <T style={{ fontSize: 14, fontWeight: '600', color: on ? C.accentText : C.text }}>{g}</T>
                  </Press>
                );
              })}
            </ScrollView>
          </Card>

          {/* Equipo (Obligatorio) */}
          <Card style={{ marginBottom: 16 }}>
            <T style={{ fontSize: 12, fontWeight: '600', color: C.mute, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
              Equipo / Material *
            </T>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {EQUIPMENT_OPTIONS.map(eq => {
                const on = equipment === eq;
                return (
                  <Press
                    key={eq}
                    onPress={() => setEquipment(eq)}
                    style={{ paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, backgroundColor: on ? C.accent : C.card2, borderWidth: 1, borderColor: on ? C.accent : C.line }}
                  >
                    <T style={{ fontSize: 14, fontWeight: '600', color: on ? C.accentText : C.text }}>{eq}</T>
                  </Press>
                );
              })}
            </View>
          </Card>

          {/* Tipo de carga */}
          <Card style={{ marginBottom: 16 }}>
            <T style={{ fontSize: 12, fontWeight: '600', color: C.mute, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
              Tipo de carga *
            </T>
            <View style={{ gap: 8 }}>
              {LOAD_TYPE_OPTIONS.map(lt => {
                const on = loadType === lt.id;
                return (
                  <Press
                    key={lt.id}
                    onPress={() => setLoadType(lt.id)}
                    style={{ paddingHorizontal: 14, paddingVertical: 12, borderRadius: 14, backgroundColor: on ? C.accentDim : C.card2, borderWidth: 1, borderColor: on ? C.accent : C.line, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
                  >
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <T style={{ fontSize: 15, fontWeight: '600', color: on ? C.accent : C.text }}>{lt.label}</T>
                      <T mute style={{ fontSize: 12, marginTop: 2 }}>Ej: {lt.example}</T>
                    </View>
                    {on && <Ionicons name="checkmark-circle" size={22} color={C.accent} />}
                  </Press>
                );
              })}
            </View>
          </Card>

          {/* Tipo (Opcional) */}
          <Card style={{ marginBottom: 16 }}>
            <T style={{ fontSize: 12, fontWeight: '600', color: C.mute, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
              Tipo de ejercicio (Opcional)
            </T>
            <View style={{ gap: 8 }}>
              {TYPE_OPTIONS.map(t => {
                const on = type === t.id;
                return (
                  <Press
                    key={t.id}
                    onPress={() => setType(t.id)}
                    style={{ paddingHorizontal: 14, paddingVertical: 12, borderRadius: 14, backgroundColor: on ? C.accentDim : C.card2, borderWidth: 1, borderColor: on ? C.accent : C.line, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
                  >
                    <T style={{ fontSize: 14, fontWeight: '600', color: on ? C.accent : C.text }}>{t.label}</T>
                    {on && <Ionicons name="checkmark-circle" size={20} color={C.accent} />}
                  </Press>
                );
              })}
            </View>
          </Card>

          {/* Músculos secundarios (Opcional) */}
          <Card style={{ marginBottom: 24 }}>
            <T style={{ fontSize: 12, fontWeight: '600', color: C.mute, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
              Músculos secundarios o específicos (Opcional)
            </T>
            <Field
              value={muscles}
              onChangeText={setMuscles}
              placeholder="Ej. Bíceps braquial, Braquial (separados por coma)"
              style={{ height: 48, borderRadius: 14, backgroundColor: C.field, borderWidth: 1, borderColor: C.line, fontSize: 15 }}
            />
            <T mute style={{ fontSize: 12, marginTop: 6 }}>Si se deja vacío, se usará el grupo principal.</T>
          </Card>

          <Btn
            disabled={!name.trim()}
            label="Guardar ejercicio"
            onPress={save}
            style={{ minHeight: 56, borderRadius: 24 }}
          />
        </ScrollView>
      </View>
    </Modal>
  );
}

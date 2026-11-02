import React, { useMemo, useState } from 'react';
import { FlatList, Modal, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { C } from './theme';
import { Field, Press, T } from './ui';
import { COMPENDIUM, GROUPS, filterExercises } from './exercises';
import { useStore } from './store';
import CustomExerciseModal from './CustomExerciseModal';

export default function ExercisePicker({ visible, onClose, onSelect, selectedId, allowAll = false, onSelectAll }) {
  const ins = useSafeAreaInsets();
  const { data } = useStore();
  const [q, setQ] = useState('');
  const [group, setGroup] = useState('Todos');
  const [customModalVisible, setCustomModalVisible] = useState(false);
  const list = useMemo(
    () => filterExercises(q, group, data.customExercises || []),
    [q, group, data.customExercises],
  );

  const pick = (item) => {
    onSelect(item);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: C.bg, paddingTop: ins.top }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 12 }}>
          <T style={{ fontSize: 20, fontWeight: '700' }}>Elegir ejercicio</T>
          <Press onPress={onClose} style={{ width: 40, height: 40, borderRadius: 14, backgroundColor: C.card2, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="close" size={22} color={C.text} />
          </Press>
        </View>

        <View style={{ paddingHorizontal: 18 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: C.card2, borderRadius: 12, paddingHorizontal: 10 }}>
            <Ionicons name="search" size={18} color={C.mute} />
            <Field
              value={q}
              onChangeText={setQ}
              placeholder="Buscar ejercicio"
              returnKeyType="search"
              style={{ flex: 1, backgroundColor: 'transparent', paddingHorizontal: 8 }}
            />
            {q ? (
              <Press onPress={() => setQ('')} style={{ padding: 4 }}>
                <Ionicons name="close-circle" size={18} color={C.mute} />
              </Press>
            ) : null}
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }} contentContainerStyle={{ gap: 8, paddingRight: 10 }}>
            {GROUPS.map((g) => {
              const on = g === group;
              return (
                <Press
                  key={g}
                  onPress={() => setGroup(g)}
                  style={{ paddingHorizontal: 13, paddingVertical: 7, borderRadius: 13, backgroundColor: on ? C.accentDim : C.card2, borderWidth: 1, borderColor: on ? C.accent : C.line }}
                >
                  <T style={{ fontSize: 13, color: on ? C.accent : C.mute }}>{g}</T>
                </Press>
              );
            })}
          </ScrollView>
        </View>

        <FlatList
          data={list}
          keyExtractor={(e) => e.id}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: 18, paddingBottom: Math.max(ins.bottom, 18) + 10 }}
          ListHeaderComponent={
            <View>
              <Press
                onPress={() => setCustomModalVisible(true)}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: C.accentDim, borderWidth: 1, borderColor: C.accent, borderRadius: 16, padding: 14, marginBottom: 12, gap: 8 }}
              >
                <Ionicons name="add-circle" size={20} color={C.accent} />
                <T style={{ fontSize: 16, fontWeight: '700', color: C.accent }}>Crear ejercicio personalizado</T>
              </Press>
              {allowAll && (
                <Press
                  onPress={() => { if (onSelectAll) onSelectAll(); else onSelect(null); onClose(); }}
                  style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderWidth: 1, borderColor: !selectedId ? C.accent : C.line, borderRadius: 16, padding: 14, marginBottom: 12 }}
                >
                  <View style={{ flex: 1, marginRight: 10 }}>
                    <T style={{ fontSize: 16, fontWeight: '600' }}>Todos los ejercicios</T>
                    <T mute style={{ fontSize: 12, marginTop: 3 }}>Ver progreso general</T>
                  </View>
                  {!selectedId && <Ionicons name="checkmark-circle" size={22} color={C.accent} />}
                </Press>
              )}
              <T mute style={{ fontSize: 12, marginBottom: 10 }}>{list.length} ejercicios</T>
            </View>
          }
          ListEmptyComponent={<T mute style={{ marginTop: 24, textAlign: 'center' }}>Sin resultados.</T>}
          ListFooterComponent={<T mute style={{ fontSize: 11, lineHeight: 16, marginTop: 10 }}>MET: {COMPENDIUM}</T>}
          renderItem={({ item }) => {
            const on = item.id === selectedId;
            return (
              <Press
                onPress={() => pick(item)}
                style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderWidth: 1, borderColor: on ? C.accent : C.line, borderRadius: 16, padding: 14, marginBottom: 8 }}
              >
                <View style={{ flex: 1, marginRight: 10 }}>
                  <T style={{ fontSize: 16, fontWeight: '600' }}>{item.name}</T>
                  <T mute style={{ fontSize: 12, marginTop: 3 }}>{item.group} · {item.equipment} · {item.met} MET ({item.metCode}) · {item.type}</T>
                  <T mute style={{ fontSize: 11, marginTop: 2 }}>{item.muscles.join(', ')}</T>
                </View>
                {on && <Ionicons name="checkmark-circle" size={22} color={C.accent} />}
              </Press>
            );
          }}
        />
        <CustomExerciseModal
          visible={customModalVisible}
          onClose={() => setCustomModalVisible(false)}
          onCreated={(newItem) => pick(newItem)}
        />
      </View>
    </Modal>
  );
}

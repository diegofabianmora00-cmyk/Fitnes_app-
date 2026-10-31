import React, { useEffect, useRef, useState } from 'react';
import { Alert, Animated, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C } from '../theme';
import { Btn, Card, Field, Press, T } from '../ui';
import { advice, fromU, lastSets, toU, uid, useStore } from '../store';

const REST = 90; // segundos de descanso

export default function Workout({ routine, onClose }) {
  const { data, update } = useStore();
  const ins = useSafeAreaInsets();
  const u = data.unit;
  const y = useRef(new Animated.Value(900)).current;
  useEffect(() => { Animated.spring(y, { toValue: 0, friction: 9, tension: 50, useNativeDriver: true }).start(); }, []);
  const close = () => Animated.timing(y, { toValue: 900, duration: 240, useNativeDriver: true }).start(onClose);

  const [log, setLog] = useState(() => routine.exercises.map((ex) => {
    const prev = lastSets(data, ex.id);
    return { ex, hint: advice(data, ex), sets: Array.from({ length: ex.sets }, (_, i) => ({
      w: prev[i] ? String(toU(prev[i].w, u)) : '', r: prev[i] ? String(prev[i].r) : '', done: false })) };
  }));

  const [end, setEnd] = useState(0);
  const [left, setLeft] = useState(0);
  useEffect(() => {
    if (!end) return;
    const t = setInterval(() => {
      const l = Math.ceil((end - Date.now()) / 1000);
      if (l <= 0) { setEnd(0); setLeft(0); } else setLeft(l);
    }, 250);
    return () => clearInterval(t);
  }, [end]);

  const upd = (i, j, p) => setLog((a) => a.map((b, x) => (x !== i ? b : { ...b, sets: b.sets.map((s, k) => (k !== j ? s : { ...s, ...p })) })));
  const tick = (i, j) => {
    if (!log[i].sets[j].done) { setEnd(Date.now() + REST * 1000); setLeft(REST); }
    upd(i, j, { done: !log[i].sets[j].done });
  };

  const finish = () => {
    const exercises = log.map((b) => ({
      exId: b.ex.id, name: b.ex.name, target: b.ex.reps,
      sets: b.sets.filter((s) => s.done && parseInt(s.r) > 0).map((s) => ({ w: fromU(parseFloat(s.w) || 0, u), r: parseInt(s.r) })),
    })).filter((e) => e.sets.length);
    if (!exercises.length) { Alert.alert('Sin series', 'Marca al menos una serie como hecha.'); return; }
    update((d) => ({ ...d, workouts: [{ id: uid(), date: Date.now(), routineId: routine.id, routineName: routine.name, exercises }, ...d.workouts] }));
    close();
  };

  const mm = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  const hintText = (h) => (!h ? null : h.type === 'up' ? `Sugerencia: prueba ${toU(h.next, u)} ${u}` : h.type === 'stall' ? 'Posible estancamiento' : 'Intenta una repetición más');

  return (
    <Animated.View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: C.bg, paddingTop: ins.top, transform: [{ translateY: y }] }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 18 }}>
        <Press onPress={close}><Ionicons name="chevron-down" size={28} color={C.text} /></Press>
        <T style={{ fontSize: 18, fontWeight: '700' }}>{routine.name}</T>
        <Btn label="Terminar" onPress={finish} style={{ paddingVertical: 9, paddingHorizontal: 16, borderRadius: 14 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 18, paddingTop: 4, paddingBottom: 140 }} keyboardShouldPersistTaps="handled">
        {log.map((b, i) => (
          <Card key={b.ex.id} style={{ marginBottom: 14 }}>
            <T style={{ fontSize: 18, fontWeight: '700' }}>{b.ex.name}</T>
            <T mute style={{ marginTop: 2, marginBottom: 10 }}>Objetivo {b.ex.sets}×{b.ex.reps}{hintText(b.hint) ? ` · ${hintText(b.hint)}` : ''}</T>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 6 }}>
              <T mute style={{ width: 24, fontSize: 12 }}>#</T>
              <T mute style={{ flex: 1, fontSize: 12, textAlign: 'center' }}>{u.toUpperCase()}</T>
              <T mute style={{ flex: 1, fontSize: 12, textAlign: 'center' }}>REPS</T>
              <View style={{ width: 44 }} />
            </View>
            {b.sets.map((s, j) => (
              <View key={j} style={{ flexDirection: 'row', gap: 8, marginBottom: 8, alignItems: 'center', opacity: s.done ? 0.55 : 1 }}>
                <T mute style={{ width: 24 }}>{j + 1}</T>
                <Field value={s.w} onChangeText={(v) => upd(i, j, { w: v })} keyboardType="decimal-pad" placeholder="0" style={{ flex: 1, textAlign: 'center' }} />
                <Field value={s.r} onChangeText={(v) => upd(i, j, { r: v })} keyboardType="number-pad" placeholder="0" style={{ flex: 1, textAlign: 'center' }} />
                <Press onPress={() => tick(i, j)} style={{ width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: s.done ? C.accent : C.card2 }}>
                  <Ionicons name="checkmark" size={22} color={s.done ? '#06120D' : C.mute} />
                </Press>
              </View>
            ))}
          </Card>
        ))}
      </ScrollView>

      {left > 0 && (
        <View style={{ position: 'absolute', left: 14, right: 14, bottom: Math.max(ins.bottom, 14) }}>
          <Card style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: C.card2 }}>
            <View>
              <T mute style={{ fontSize: 12 }}>DESCANSO</T>
              <T style={{ fontSize: 28, fontWeight: '700', fontVariant: ['tabular-nums'] }}>{mm(left)}</T>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Btn kind="ghost" label="+15 s" onPress={() => setEnd((e) => e + 15000)} style={{ paddingVertical: 10, backgroundColor: C.line }} />
              <Btn label="Saltar" onPress={() => { setEnd(0); setLeft(0); }} style={{ paddingVertical: 10 }} />
            </View>
          </Card>
        </View>
      )}
    </Animated.View>
  );
}

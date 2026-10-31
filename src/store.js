import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'fitnesscoach:v1';
export const uid = () => Math.random().toString(36).slice(2, 9);
export const KG = 2.20462;
export const toU = (kg, u) => Math.round((u === 'kg' ? kg : kg * KG) * 10) / 10; // se guarda en kg
export const fromU = (v, u) => (u === 'kg' ? v : v / KG);

const seed = {
  unit: 'kg',
  routines: [{ id: 'r1', name: 'Empuje', exercises: [
    { id: 'e1', name: 'Press de banca', sets: 3, reps: 8 },
    { id: 'e2', name: 'Press militar', sets: 3, reps: 10 },
    { id: 'e3', name: 'Fondos', sets: 3, reps: 12 },
  ] }],
  workouts: [], // el más reciente primero
};

const Ctx = createContext();
export const useStore = () => useContext(Ctx);

export function StoreProvider({ children }) {
  const ref = useRef(seed);
  const [data, setData] = useState(seed);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((v) => { if (v) { const d = JSON.parse(v); ref.current = d; setData(d); } })
      .catch(() => {}).finally(() => setReady(true));
  }, []);
  const update = (fn) => {
    const n = fn(ref.current);
    ref.current = n; setData(n);
    AsyncStorage.setItem(KEY, JSON.stringify(n)).catch(() => {});
  };
  return <Ctx.Provider value={{ data, update, ready }}>{children}</Ctx.Provider>;
}

export function lastSets(data, exId) {
  for (const w of data.workouts) {
    const e = w.exercises.find((x) => x.exId === exId);
    if (e) return e.sets;
  }
  return [];
}

// Reglas simples de progresión (sin IA)
export function advice(data, ex) {
  const h = data.workouts.map((w) => w.exercises.find((e) => e.exId === ex.id)).filter((e) => e && e.sets.length);
  if (!h.length) return null;
  const top = (e) => Math.max(...e.sets.map((s) => s.w));
  const tot = (e) => e.sets.reduce((a, s) => a + s.r, 0);
  const w = top(h[0]);
  const inc = data.unit === 'kg' ? 2.5 : 5 / KG;
  if (h[0].sets.every((s) => s.r >= ex.reps)) return { type: 'up', next: w + inc };
  if (h.length >= 3 && h.slice(0, 3).every((e) => top(e) === w) && tot(h[0]) <= tot(h[2])) return { type: 'stall' };
  return { type: 'reps' };
}

// Mensaje del entrenador según el historial
export function coachMessage(data) {
  const u = data.unit, ws = data.workouts;
  if (!ws.length) return { mood: 'happy', text: 'Hola, soy Atlas. Registra tu primer entrenamiento y empiezo a seguir tu progreso.' };
  const days = Math.floor((Date.now() - ws[0].date) / 864e5);
  if (days >= 7) return { mood: 'neutral', text: `Hace ${days} días que no entrenas. Retomemos con calma: una sesión ligera es suficiente.` };
  const all = data.routines.flatMap((r) => r.exercises);
  const list = ws[0].exercises.map((e) => all.find((x) => x.id === e.exId)).filter(Boolean)
    .map((ex) => ({ ex, a: advice(data, ex) })).filter((x) => x.a);
  const stall = list.find((x) => x.a.type === 'stall');
  if (stall) return { mood: 'alert', text: `Llevas tres entrenamientos sin mejorar en ${stall.ex.name}. Quizás convenga revisar tu recuperación.` };
  const up = list.find((x) => x.a.type === 'up');
  if (up) return { mood: 'happy', text: `Completaste todas las series de ${up.ex.name}. Creo que puedes intentar ${toU(up.a.next, u)} ${u}.` };
  const rp = list.find((x) => x.a.type === 'reps');
  if (rp) return { mood: 'neutral', text: `En ${rp.ex.name}, intenta conseguir una repetición más con el mismo peso.` };
  return { mood: 'neutral', text: 'Buen trabajo. Sigue así.' };
}

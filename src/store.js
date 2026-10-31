import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { exerciseById } from './exercises';

const KEY = 'fitnesscoach:v1';
export const uid = () => Math.random().toString(36).slice(2, 9);
export const KG = 2.20462;
export const toU = (kg, u) => Math.round((u === 'kg' ? kg : kg * KG) * 10) / 10;
export const fromU = (v, u) => (u === 'kg' ? v : v / KG);

export const PROFILE_DEFAULT = {
  completed: false,
  goal: 'hipertrofia',
  ambition: 'progresar',
  level: 'principiante',
  daysPerWeek: 3,
  weightKg: 75,
  heightCm: 175,
  age: 30,
  sex: 'hombre',
  restStyle: 'equilibrado',
  updatedAt: null,
};

const LEGACY = { e1: 'press-banca', e2: 'press-militar', e3: 'fondos' };

const seed = {
  schemaVersion: 2,
  unit: 'kg',
  profile: { ...PROFILE_DEFAULT },
  routines: [{ id: 'r1', name: 'Empuje', exercises: [
    { id: 'press-banca', name: 'Press de banca', group: 'Pecho', equipment: 'Barra', sets: 3, reps: 8 },
    { id: 'press-militar', name: 'Press militar', group: 'Hombros', equipment: 'Barra', sets: 3, reps: 10 },
    { id: 'fondos', name: 'Fondos en paralelas', group: 'Pecho', equipment: 'Peso corporal', sets: 3, reps: 12 },
  ] }],
  workouts: [],
};

const normalizeExercise = (e) => {
  const id = LEGACY[e.id] || e.id;
  const db = exerciseById(id);
  return {
    ...e,
    id,
    name: e.name || (db && db.name) || id,
    group: e.group || (db && db.group) || '',
    equipment: e.equipment || (db && db.equipment) || '',
  };
};

const normalizeWorkoutExercise = (e) => {
  const exId = LEGACY[e.exId] || e.exId;
  const db = exerciseById(exId);
  return {
    ...e,
    exId,
    name: e.name || (db && db.name) || exId,
    targetReps: e.targetReps ?? e.target ?? 0,
    targetSets: e.targetSets ?? (e.sets || []).length,
    sets: (e.sets || []).map((s) => ({ ...s })),
  };
};

export const migrate = (raw) => {
  const base = { ...seed, ...raw, profile: { ...PROFILE_DEFAULT, ...(raw.profile || {}) } };
  const routines = (base.routines || []).map((r) => ({
    ...r,
    exercises: (r.exercises || []).map(normalizeExercise),
  }));
  const workouts = (base.workouts || [])
    .map((w) => ({
      ...w,
      exercises: (w.exercises || []).map(normalizeWorkoutExercise),
    }))
    .sort((a, b) => (b.date || 0) - (a.date || 0));
  return { ...base, schemaVersion: 2, routines, workouts };
};

const Ctx = createContext();
export const useStore = () => useContext(Ctx);

export function StoreProvider({ children }) {
  const ref = useRef(seed);
  const [data, setData] = useState(seed);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((v) => {
        if (!v) return;
        const raw = JSON.parse(v);
        const merged = migrate(raw);
        ref.current = merged;
        setData(merged);
        if (raw.schemaVersion !== 2) AsyncStorage.setItem(KEY, JSON.stringify(merged)).catch(() => {});
      })
      .catch(() => {}).finally(() => setReady(true));
  }, []);
  const update = (fn) => {
    const n = fn(ref.current);
    const next = { ...n, schemaVersion: 2 };
    ref.current = next;
    setData(next);
    AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
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

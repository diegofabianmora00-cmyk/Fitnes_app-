export const KEYS = {
  data: 'fitnesscoach:v1',
  copy: 'fitnesscoach:v1:copia',
  corrupt: 'fitnesscoach:v1:corrupto',
  backup: 'fitnesscoach:v1:backup',
  draft: 'fitnesscoach:v1:draft',
  seedBackup: 'fitnesscoach:v1:pruebas-copia',
};
const KEY = KEYS.data;
const BACKUP_KEY = KEYS.backup;
const COPY_KEY = KEYS.copy;
const CORRUPT_KEY = KEYS.corrupt;
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { exerciseById } from './exercises';

export const uid = () => Math.random().toString(36).slice(2, 9);
export const KG = 2.20462;
export const toU = (kg, u) => {
  if (kg == null) return kg;
  const val = u === 'kg' ? kg : kg * KG;
  return Math.round(val * 10) / 10;
};
export const fromU = (v, u) => {
  if (v == null || isNaN(v)) return 0;
  const n = Math.round(Number(v) * 10) / 10;
  return u === 'lb' ? n / KG : n;
};

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
  tone: 'tranquilo',
  updatedAt: null,
};

const LEGACY = { e1: 'press-banca', e2: 'press-militar', e3: 'fondos' };

const seed = {
  schemaVersion: 2,
  unit: 'kg',
  profile: { ...PROFILE_DEFAULT },
  coachMemory: [],
  routines: [{
    id: 'r1',
    name: 'Empuje',
    goal: 'hipertrofia',
    days: [0, 3],
    defaults: { sets: 3, reps: 10, restSec: 120 },
    exercises: [
      { id: 'press-banca', name: 'Press de banca', group: 'Pecho', equipment: 'Barra', sets: 3, reps: 8, mode: 'default' },
      { id: 'press-militar', name: 'Press militar', group: 'Hombros', equipment: 'Barra', sets: 3, reps: 10, mode: 'default' },
      { id: 'fondos', name: 'Fondos en paralelas', group: 'Pecho', equipment: 'Peso corporal', sets: 3, reps: 12, mode: 'default' },
    ]
  }],
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

const normalizeRoutine = (r) => {
  const exercises = (r.exercises || []).map((e) => {
    const norm = normalizeExercise(e);
    return {
      ...norm,
      sets: Number(e.sets) || 3,
      reps: Number(e.reps) || 10,
      mode: e.mode || 'default',
      rir: e.rir !== undefined ? Number(e.rir) : 2,
    };
  });
  return {
    ...r,
    goal: r.goal || 'hipertrofia',
    days: Array.isArray(r.days) ? r.days : [],
    defaults: r.defaults || { sets: 3, reps: 10, restSec: 120 },
    exercises,
  };
};

export function routinesForDay(data, dayIndex) {
  if (!data || !data.routines) return [];
  return data.routines.filter((r) => Array.isArray(r.days) && r.days.includes(dayIndex));
}

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
  const base = {
    ...seed,
    ...raw,
    profile: { ...PROFILE_DEFAULT, tone: raw.profile?.tone || 'tranquilo', ...(raw.profile || {}) },
    coachMemory: Array.isArray(raw.coachMemory) ? raw.coachMemory : (Array.isArray(raw.profile?.coachMemory) ? raw.profile.coachMemory : []),
  };
  const routines = (base.routines || []).map(normalizeRoutine);
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

const validRaw = (raw) => !!raw && typeof raw === 'object' && !Array.isArray(raw);
const saveCopy = (obj) => AsyncStorage.setItem(COPY_KEY, JSON.stringify(obj)).catch(() => {});

export function StoreProvider({ children }) {
  const ref = useRef(seed);
  const [data, setData] = useState(seed);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let alive = true;
    const apply = (merged) => {
      ref.current = merged;
      if (alive) setData(merged);
    };
    const restoreFromCopies = async () => {
      for (const key of [COPY_KEY, BACKUP_KEY]) {
        let text = null;
        try { text = await AsyncStorage.getItem(key); } catch (e) { text = null; }
        if (!text) continue;
        let candidate = null;
        try { candidate = JSON.parse(text); } catch (e) { candidate = null; }
        if (!validRaw(candidate)) continue;
        try { return migrate(candidate); } catch (e) {}
      }
      return null;
    };
    const handleCorrupt = async (originalText) => {
      let backedUp = false;
      try { await AsyncStorage.setItem(CORRUPT_KEY, originalText); backedUp = true; } catch (e) {}
      const restored = await restoreFromCopies();
      if (restored) {
        apply(restored);
        saveCopy(restored);
        if (backedUp) AsyncStorage.setItem(KEY, JSON.stringify(restored)).catch(() => {});
        Alert.alert(
          'Datos reparados',
          backedUp
            ? 'Tus datos guardados estaban dañados. Guardamos una copia del archivo original en el respaldo y restauramos la última copia válida.'
            : 'Tus datos guardados estaban dañados. Restauramos la última copia válida, pero no se pudo guardar el texto original.'
        );
      } else {
        Alert.alert(
          'Datos dañados',
          backedUp
            ? 'No pudimos leer tus datos y no había una copia válida. Guardamos el texto original en el respaldo para no perderlo. Se muestra la rutina inicial.'
            : 'No pudimos leer tus datos, no había una copia válida y no se pudo guardar el texto original. Se muestra la rutina inicial.'
        );
      }
    };
    AsyncStorage.getItem(KEY)
      .then(async (v) => {
        if (!v) {
          const restored = await restoreFromCopies();
          if (restored) {
            apply(restored);
            AsyncStorage.setItem(KEY, JSON.stringify(restored)).catch(() => {});
            saveCopy(restored);
          }
          return;
        }
        let raw = null;
        let failed = false;
        try { raw = JSON.parse(v); } catch (e) { failed = true; }
        if (failed || !validRaw(raw)) {
          await handleCorrupt(v);
          return;
        }
        let merged;
        try { merged = migrate(raw); } catch (e) { merged = null; }
        if (!merged) {
          await handleCorrupt(v);
          return;
        }
        apply(merged);
        saveCopy(merged);
        if (raw.schemaVersion !== 2) AsyncStorage.setItem(KEY, JSON.stringify(merged)).catch(() => {});
      })
      .catch(() => {}).finally(() => { if (alive) setReady(true); });
    return () => { alive = false; };
  }, []);
  const update = (fn) => {
    const n = fn(ref.current);
    const next = { ...n, schemaVersion: 2 };
    ref.current = next;
    setData(next);
    const text = JSON.stringify(next);
    AsyncStorage.setItem(KEY, text).catch(() => {});
    AsyncStorage.setItem(COPY_KEY, text).catch(() => {});
  };
  return <Ctx.Provider value={{ data, update, ready }}>{children}</Ctx.Provider>;
}

export function lastSets(data, exId) {
  for (const w of data.workouts) {
    const e = w.exercises.find((x) => x.exId === exId);
    if (!e) continue;
    const sets = (e.sets || []).filter((s) => !s.unconfirmed);
    if (sets.length) return sets;
  }
  return [];
}

// Volumen semanal por músculo (lógica pura, sin React). Criterio de la app.
// Calcula series efectivas por músculo/grupo en una ventana semanal y clasifica bajo/óptimo/alto.

import { exerciseById } from './exercises';
import { VOLUME, APP_HEURISTIC } from './config';

const DAY = 86400000;

const weekStartMs = (nowMs = Date.now()) => {
  const d = new Date(nowMs);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); // lunes
  return d.getTime();
};

export function classifyVolumeSets(setsCount = 0) {
  const n = Number(setsCount) || 0;
  if (n <= VOLUME.lowMax) {
    return { level: 'bajo', reasonCode: 'volume_low', why: 'Pocas series esta semana para este músculo.' };
  }
  if (n <= VOLUME.optimalMax) {
    return { level: 'óptimo', reasonCode: 'volume_optimal', why: 'Buen número de series esta semana para este músculo.' };
  }
  return { level: 'alto', reasonCode: 'volume_high', why: 'Muchas series esta semana; cuida la recuperación.' };
}

// Devuelve series efectivas por músculo en los últimos 7 días (o semana actual desde lunes).
// opts: { now, mode: 'rolling7' | 'week' }
export function weeklyMuscleVolume(data = {}, opts = {}) {
  const now = Number(opts.now) || Date.now();
  const mode = opts.mode || 'rolling7';
  const from = mode === 'week' ? weekStartMs(now) : now - 7 * DAY;
  const workouts = (data.workouts || []).filter((w) => {
    const t = Number(w.date) || 0;
    return t >= from && t <= now;
  });

  const byMuscle = {};
  for (const w of workouts) {
    for (const e of w.exercises || []) {
      const db = exerciseById(e.exId);
      const group = e.group || (db && db.group) || 'Otros';
      const muscles = (db && Array.isArray(db.muscles) && db.muscles.length) ? db.muscles : [group];
      const sets = (e.sets || []).filter((s) => s && !s.unconfirmed && Number(s.r) > 0).length;
      if (!(sets > 0)) continue;
      // Cuenta series efectivas por grupo principal y por músculos implicados (criterio de la app).
      byMuscle[group] = (byMuscle[group] || 0) + sets;
      for (const m of muscles) {
        const key = m || group;
        if (key === group) continue;
        // músculos secundarios: media serie equivalente para no inflar (heurística app)
        byMuscle[key] = (byMuscle[key] || 0) + sets * 0.5;
      }
    }
  }

  const entries = Object.entries(byMuscle).map(([muscle, raw]) => {
    const sets = Math.round(raw * 10) / 10;
    const cls = classifyVolumeSets(sets);
    return { muscle, sets, ...cls };
  }).sort((a, b) => b.sets - a.sets);

  return {
    from,
    to: now,
    mode,
    heuristic: APP_HEURISTIC,
    muscles: entries,
  };
}

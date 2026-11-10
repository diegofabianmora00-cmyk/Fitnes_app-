// Motor puro de autoregulación en vivo (sin React).
// Decide la siguiente serie y la próxima sesión a partir de lo que acaba de hacer el usuario.

import { GYM_DEFAULT, defaultLoadType, nearestLoadable } from './load';

const KG_PER_LB = 2.20462;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const round1 = (v) => Math.round((Number(v) || 0) * 10) / 10;
const round2 = (v) => Math.round((Number(v) || 0) * 100) / 100;

const unitOf = (data = {}, gym = {}) => data.unit || gym.unit || 'kg';
const toUnit = (kg, unit) => (unit === 'lb' ? (Number(kg) || 0) * KG_PER_LB : Number(kg) || 0);
const fromUnit = (value, unit) => (unit === 'lb' ? (Number(value) || 0) / KG_PER_LB : Number(value) || 0);

const asRir = (value, fallback = 2) => {
  if (Array.isArray(value)) {
    const nums = value.map(Number).filter(Number.isFinite);
    return nums.length ? nums[nums.length - 1] : fallback;
  }
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

export function repRangeFor(profile = {}) {
  const goal = profile.goal || 'hipertrofia';
  const level = profile.level || 'principiante';
  if (goal === 'fuerza') return level === 'principiante' ? { min: 8, max: 12 } : { min: 3, max: 6 };
  if (goal === 'resistencia') return { min: 15, max: 20 };
  return level === 'principiante' ? { min: 8, max: 12 } : { min: 6, max: 12 };
}

export function restFor(profile = {}, type = 'compuesto') {
  const goal = profile.goal || 'hipertrofia';
  const level = profile.level || 'principiante';
  const style = profile.restStyle || 'equilibrado';
  const compound = type === 'compuesto';
  let base;
  let lo;
  let hi;
  if (goal === 'fuerza') {
    base = compound ? (level === 'principiante' ? 180 : 240) : 120;
    lo = compound ? 180 : 90;
    hi = compound ? 300 : 180;
  } else if (goal === 'resistencia') {
    base = compound ? 75 : 60;
    lo = 45;
    hi = 90;
  } else {
    base = compound ? 120 : 90;
    lo = 60;
    hi = 180;
  }
  const adj = style === 'corto' ? -30 : style === 'largo' ? 30 : 0;
  return clamp(base + adj, lo, hi);
}

export function rirTargetFor(profile = {}, setIndex = 0, totalSets = 3, type = 'compuesto') {
  const goal = profile.goal || 'hipertrofia';
  let lo = 1;
  let hi = 3;
  let target = 2;
  if (goal === 'fuerza') {
    lo = 1;
    hi = 2;
    target = 2;
  } else if (goal === 'resistencia') {
    lo = 1;
    hi = 3;
    target = 2;
  }
  const i = Math.max(0, Number(setIndex) || 0);
  const n = Math.max(1, Number(totalSets) || 1);
  if (n >= 3 && i >= Math.ceil(n / 2)) target = Math.min(hi, target + 1);
  if (type === 'aislamiento' && target > hi) target = hi;
  return { lo, hi, target };
}

export function e1rmKg(w, reps, rir) {
  const weight = Number(w) || 0;
  const r = Number(reps) || 0;
  const rawRir = Number(rir);
  const rr = Number.isFinite(rawRir) && rawRir >= 0 ? rawRir : 0;
  if (!(weight > 0) || !(r > 0) || r + rr > 15) return null;
  return round2(weight * (1 + (r + rr) / 30));
}

export function repsAtLoadKg(w, e1rm, rir) {
  const weight = Number(w) || 0;
  const e = Number(e1rm) || 0;
  const rawRir = Number(rir);
  const rr = Number.isFinite(rawRir) && rawRir >= 0 ? rawRir : 0;
  if (!(weight > 0) || !(e > 0)) return 0;
  return Math.max(0, Math.round(30 * (e / weight - 1) - rr));
}

export function targetLoadKg(e1rm, repsObjetivo, rirObjetivo) {
  const e = Number(e1rm) || 0;
  const reps = Number(repsObjetivo) || 0;
  const rawRir = Number(rirObjetivo);
  const rir = Number.isFinite(rawRir) && rawRir >= 0 ? rawRir : 0;
  if (!(e > 0) || !(reps > 0) || reps + rir > 15) return 0;
  return round2(e / (1 + (reps + rir) / 30));
}

export function readiness(firstSetE1rm, refE1rm) {
  const first = Number(firstSetE1rm) || 0;
  const ref = Number(refE1rm) || 0;
  if (!(first > 0) || !(ref > 0)) return 'normal';
  const ratio = first / ref;
  if (ratio < 0.9) return 'low';
  if (ratio > 1.05) return 'high';
  return 'normal';
}

function setsFromHistory(history, exId) {
  if (!Array.isArray(history) || !history.length) return [];
  const first = history[0] || {};
  if (Array.isArray(first.sets)) return history.map((h) => h.sets || []).filter((s) => s.length);
  if (Array.isArray(first.exercises)) {
    const out = [];
    for (const w of history) {
      const e = (w.exercises || []).find((x) => x.exId === exId);
      if (e) out.push(e.sets || []);
    }
    return out.filter((s) => s.length);
  }
  if (first.r !== undefined || first.w !== undefined) return [history];
  return [];
}

export function fatigueDrop(history = [], ex = {}, restSec = 120) {
  const sessions = setsFromHistory(history, ex && ex.id);
  const drops = [];
  for (const sets of sessions) {
    const done = (sets || []).filter((s) => s && !s.unconfirmed && Number(s.r) > 0);
    for (let i = 1; i < done.length; i++) {
      const d = Number(done[i - 1].r) - Number(done[i].r);
      if (Number.isFinite(d) && d > 0) drops.push(d);
    }
  }
  let base;
  if (drops.length) base = drops.reduce((a, b) => a + b, 0) / drops.length;
  else base = ex && ex.type === 'aislamiento' ? 0.5 : 1;
  const rest = Number(restSec) || 0;
  if (rest > 0 && rest < 90) base += 0.5;
  else if (rest >= 180) base -= 0.25;
  return Math.max(0, round1(base));
}

function sessionHistory(data = {}, exId) {
  const out = [];
  const workouts = [...(data.workouts || [])].sort((a, b) => (b.date || 0) - (a.date || 0));
  for (const w of workouts) {
    const e = (w.exercises || []).find((x) => x.exId === exId);
    if (!e) continue;
    const sets = (e.sets || []).filter((s) => Number(s.r) > 0 && !s.unconfirmed);
    if (!sets.length) continue;
    out.push({ date: w.date || 0, target: Number(e.targetReps ?? e.target) || 0, sets });
  }
  return out;
}

function bestRecentE1rm(history, limit = 5) {
  let best = 0;
  for (const session of history.slice(0, limit)) {
    for (const set of session.sets || []) {
      const e = e1rmKg(set.w, set.r, set.rir);
      if (e && e > best) best = e;
    }
  }
  return best;
}

function planFrom(startPlan = {}, guide = {}, fallbackRir = 2) {
  const src = { ...(startPlan || {}), ...(guide || {}) };
  return {
    weightKg: round2(src.weightKg ?? src.w ?? 0),
    reps: Number(src.reps ?? src.targetReps ?? 0) || 0,
    rir: asRir(src.rir ?? src.targetRir, fallbackRir),
    restSec: Number(src.restSec ?? src.restTarget ?? 0) || 0,
    repMin: Number(src.repMin ?? src.min ?? 0) || 0,
    repMax: Number(src.repMax ?? src.max ?? 0) || 0,
    loadType: src.loadType || '',
  };
}

function platesFor(gym, unit) {
  if (unit === 'lb') return gym.platesLb || [45, 35, 25, 10, 5, 2.5];
  return gym.platesKg || [25, 20, 15, 10, 5, 2.5, 1.25];
}

export function loadStepFor(loadType, gym = GYM_DEFAULT, unit) {
  const u = unit || gym.unit || 'kg';
  if (loadType === 'dumbbell') return Number(gym.dumbbellStep) || (u === 'lb' ? 5 : 1);
  if (loadType === 'stack') return Number(gym.stackStep) || (u === 'lb' ? 10 : 5);
  if (loadType === 'barbell' || loadType === 'plates') {
    const plates = platesFor(gym, u);
    return 2 * Math.min(...plates);
  }
  if (loadType === 'bodyweight') return 0;
  return u === 'lb' ? 5 : 2.5;
}

export function roundLoadKg(loadType, kg, gym = GYM_DEFAULT, unit) {
  const u = unit || gym.unit || 'kg';
  const value = Number(kg) || 0;
  if (!(value > 0)) return 0;
  const display = toUnit(value, u);
  const rounded = nearestLoadable(loadType, display, { ...gym, unit: u });
  return round2(fromUnit(rounded, u));
}

export function shiftLoadKg(loadType, kg, direction, gym = GYM_DEFAULT, unit) {
  const u = unit || gym.unit || 'kg';
  const value = Number(kg) || 0;
  const step = loadStepFor(loadType, gym, u);
  if (!(step > 0)) return round2(value);
  const target = Math.max(0, toUnit(value, u) + (direction < 0 ? -step : step));
  const rounded = nearestLoadable(loadType, target, { ...gym, unit: u });
  return round2(fromUnit(rounded, u));
}

const fmtKg = (kg, unit) => `${round1(toUnit(kg, unit))} ${unit}`;

function restAdjustment(actualRest, targetRest, { easy = false, hard = false, apply = true } = {}) {
  const target = Math.max(0, Math.round(Number(targetRest) || 0));
  const actual = Number(actualRest);
  if (!apply || !(target > 0) || !Number.isFinite(actual) || actual <= 0) {
    return { restSec: target, kind: 'ok', note: null, lockWeight: false };
  }
  const ratio = actual / target;
  if (ratio < 0.8) {
    const add = hard ? 60 : 30;
    return {
      restSec: target + add,
      kind: 'short',
      note: `Descansaste ${Math.round(actual)} s de ${target} s; subo el siguiente descanso a ${target + add} s.`,
      lockWeight: false,
    };
  }
  if (ratio > 1.3) {
    const restSec = easy ? Math.max(30, target - 15) : target;
    return {
      restSec,
      kind: 'long',
      note: `Descansaste ${Math.round(actual)} s de ${target} s; no cambio el peso${easy ? ' y recorto 15 s' : ''}.`,
      lockWeight: true,
    };
  }
  return { restSec: target, kind: 'ok', note: null, lockWeight: false };
}

export function nextSetPlan({
  data = {},
  ex = {},
  sets = [],
  setIndex = 0,
  totalSets = 0,
  startPlan = {},
  restTarget,
  gym,
} = {}) {
  const profile = data.profile || {};
  const g = { ...GYM_DEFAULT, ...(data.gym || {}), ...(gym || {}) };
  const unit = unitOf(data, g);
  const type = ex.type || 'compuesto';
  const loadType = ex.loadType || (ex.equipment ? defaultLoadType(ex.equipment, ex.id) : 'barbell');
  const range = repRangeFor(profile);
  const total = Math.max(1, Number(totalSets) || Number(ex.sets) || sets.length || 1);
  const idx = Math.max(0, Number(setIndex) || 0);
  const nextIndex = idx + 1;
  const nextTarget = rirTargetFor(profile, nextIndex, total, type);
  const currentTarget = rirTargetFor(profile, idx, total, type);
  const last = sets[idx] || null;
  const guide = (last && last.guide) || {};
  const plan = planFrom(startPlan, guide, currentTarget.target);
  const targetReps = plan.reps || Math.max(1, Number(ex.reps) || range.min);
  const repMin = plan.repMin || range.min;
  const repMax = plan.repMax || range.max;
  const restGoal = Math.max(0, Math.round(Number(restTarget ?? plan.restSec) || restFor(profile, type)));

  if (idx >= total - 1) {
    return {
      done: true,
      action: 'summary',
      setNumber: null,
      weightKg: null,
      reps: null,
      rir: null,
      restSec: restGoal,
      reason: 'Última serie del ejercicio: guardo el resumen para la próxima sesión.',
      readiness: 'normal',
      restNote: null,
      volumeNote: null,
      summary: nextSessionPlan({ data, ex, sessionSets: sets }),
      guide: null,
    };
  }

  if (!last) {
    return {
      done: false,
      action: 'maintain',
      setNumber: nextIndex + 1,
      weightKg: plan.weightKg,
      reps: targetReps,
      rir: nextTarget.target,
      restSec: restGoal,
      reason: 'Aún no hay serie registrada; mantengo el plan inicial.',
      readiness: 'normal',
      restNote: null,
      volumeNote: null,
      guide: { weightKg: plan.weightKg, reps: targetReps, rir: nextTarget.target, restSec: restGoal },
    };
  }

  const lastW = Number(last.w) || 0;
  const lastR = Number(last.r) || 0;
  const rawRir = last.rir;
  const lastRirRaw = Number(rawRir);
  const hasRir = rawRir !== null && rawRir !== undefined && rawRir !== '' && Number.isFinite(lastRirRaw);
  const unconfirmed = !!last.unconfirmed;
  const failure = (hasRir && lastRirRaw <= 0) || !!last.failure;
  const bodyweight = loadType === 'bodyweight';
  const easy = hasRir && lastRirRaw >= currentTarget.hi;
  const hard = failure || (hasRir && lastRirRaw <= currentTarget.lo - 1) || lastR < repMin;
  const restInfo = restAdjustment(last.restBeforeSec, restGoal, { easy, hard, apply: idx > 0 });
  const history = sessionHistory(data, ex.id);
  const refE1 = bestRecentE1rm(history);
  const lastE1 = e1rmKg(lastW, lastR, hasRir ? lastRirRaw : 0);
  const ready = idx === 0 && lastE1 && refE1 ? readiness(lastE1, refE1) : 'normal';

  const baseOut = (extra) => {
    const weightKg = round2(extra.weightKg ?? plan.weightKg);
    const reps = Math.max(1, Math.round(extra.reps ?? targetReps));
    const rir = clamp(Math.round(extra.rir ?? nextTarget.target), 0, 10);
    const restSec = Math.max(0, Math.round(extra.restSec ?? restInfo.restSec));
    return {
      done: false,
      action: extra.action || 'maintain',
      setNumber: nextIndex + 1,
      weightKg,
      reps,
      rir,
      restSec,
      reason: extra.reason || '',
      readiness: extra.readiness || ready,
      restNote: extra.restNote ?? restInfo.note,
      volumeNote: extra.volumeNote || null,
      guide: { weightKg, reps, rir, restSec },
    };
  };

  if (bodyweight) {
    const baseWeight = lastW > 0 ? lastW : plan.weightKg || 0;
    let reps = targetReps;
    let reason = `Sin peso externo: mantengo ${reps} reps y busco buena técnica.`;
    if (hasRir && lastRirRaw <= currentTarget.lo - 1) {
      reps = Math.max(1, Math.min(targetReps, lastR));
      reason = `Sin peso externo y RIR ${lastRirRaw}: mantengo ${reps} reps y sumo descanso.`;
    } else if (hasRir && lastRirRaw >= currentTarget.hi && lastR >= targetReps) {
      reps = Math.min(repMax, Math.max(targetReps + 1, lastR + 1));
      reason = `Sin peso externo: subo a ${reps} reps porque te sobró margen (RIR ${lastRirRaw}).`;
    }
    return baseOut({ action: 'bodyweight', weightKg: baseWeight, reps, reason });
  }

  if (unconfirmed || !hasRir) {
    return baseOut({
      action: 'maintain',
      weightKg: lastW || plan.weightKg,
      reps: targetReps,
      reason: unconfirmed
        ? 'Serie sin confirmar: no cambio el peso; solo ajusto reps y descanso.'
        : 'Sin RIR no puedo juzgar el esfuerzo: no cambio el peso; solo ajusto reps y descanso.',
    });
  }

  if (restInfo.lockWeight) {
    return baseOut({
      action: 'maintain',
      weightKg: lastW || plan.weightKg,
      reps: targetReps,
      reason: restInfo.note || 'Descanso largo: mantengo el peso.',
    });
  }

  const current = lastW || plan.weightKg;
  const upKg = shiftLoadKg(loadType, current, 1, g, unit);
  const downKg = shiftLoadKg(loadType, current, -1, g, unit);

  if (failure) {
    const volumeNote =
      idx === 0 && refE1 > 0 && lastE1 && lastE1 < refE1 * 0.9
        ? 'La primera serie quedó muy por debajo de tu rendimiento reciente; valora hacer una serie menos hoy.'
        : null;
    return baseOut({
      action: 'down',
      weightKg: downKg,
      reps: targetReps,
      rir: Math.min(nextTarget.hi, nextTarget.target + 1),
      restSec: restGoal + 60,
      reason: `Bajé a ${fmtKg(downKg, unit)} porque la serie ${idx + 1} quedó a RIR 0 (fallo).`,
      volumeNote,
    });
  }

  if (idx === 0 && ready === 'low') {
    return baseOut({
      action: 'maintain',
      weightKg: current,
      reps: targetReps,
      rir: Math.min(nextTarget.hi, nextTarget.target + 1),
      reason: `Día flojo: la primera serie rindió ${Math.round((lastE1 / refE1) * 100)}% de tu mejor reciente; mantengo el peso y subo el RIR objetivo.`,
      volumeNote: 'Si sigues por debajo de lo normal, valora una serie menos hoy.',
    });
  }

  if (idx === 0 && ready === 'high' && lastRirRaw >= currentTarget.hi) {
    return baseOut({
      action: 'up',
      weightKg: upKg,
      reps: targetReps,
      rir: nextTarget.target,
      reason: `Día fuerte: la primera serie rindió ${Math.round((lastE1 / refE1) * 100)}% de tu mejor reciente y sobró margen; subo un paso.`,
    });
  }

  if (lastRirRaw <= currentTarget.lo - 1 || lastR < repMin) {
    return baseOut({
      action: 'down',
      weightKg: downKg,
      reps: targetReps,
      rir: Math.min(nextTarget.hi, nextTarget.target + 1),
      restSec: restGoal + (lastRirRaw <= 0 ? 60 : 30),
      reason:
        lastR < repMin
          ? `Bajé a ${fmtKg(downKg, unit)} porque la serie ${idx + 1} hizo ${lastR} reps, por debajo del mínimo ${repMin}.`
          : `Bajé a ${fmtKg(downKg, unit)} porque la serie ${idx + 1} quedó a RIR ${lastRirRaw}, por debajo del rango ${currentTarget.lo}-${currentTarget.hi}.`,
    });
  }

  if (lastRirRaw >= currentTarget.hi + 1 && lastR >= targetReps) {
    return baseOut({
      action: 'up',
      weightKg: upKg,
      reps: targetReps,
      rir: nextTarget.target,
      reason: `Subí a ${fmtKg(upKg, unit)} porque la serie ${idx + 1} quedó a RIR ${lastRirRaw} con ${lastR} reps.`,
    });
  }

  if (lastR >= repMax && lastRirRaw >= currentTarget.target) {
    return baseOut({
      action: 'up',
      weightKg: upKg,
      reps: targetReps,
      rir: nextTarget.target,
      reason: `Subí a ${fmtKg(upKg, unit)} porque llegaste al tope del rango (${repMax} reps) con RIR ${lastRirRaw}.`,
    });
  }

  if (lastR > targetReps && lastRirRaw >= currentTarget.lo && lastRirRaw <= currentTarget.hi) {
    const reps = Math.min(repMax, targetReps + 1);
    return baseOut({
      action: 'maintain',
      weightKg: current,
      reps,
      reason: `Mantengo ${fmtKg(current, unit)} y subo el objetivo a ${reps} reps porque hiciste ${lastR} con RIR ${lastRirRaw}.`,
    });
  }

  return baseOut({
    action: 'maintain',
    weightKg: current,
    reps: targetReps,
    reason: `Mantengo ${fmtKg(current, unit)}: la serie ${idx + 1} quedó dentro del objetivo (RIR ${lastRirRaw}, ${lastR} reps).`,
  });
}

export function nextSessionPlan({ data = {}, ex = {}, sessionSets = [] } = {}) {
  const profile = data.profile || {};
  const g = { ...GYM_DEFAULT, ...(data.gym || {}) };
  const unit = unitOf(data, g);
  const type = ex.type || 'compuesto';
  const loadType = ex.loadType || (ex.equipment ? defaultLoadType(ex.equipment, ex.id) : 'barbell');
  const range = repRangeFor(profile);
  const targetReps = Math.max(1, Number(ex.reps) || range.min);
  const target = rirTargetFor(profile, 0, Number(ex.sets) || 3, type);
  const confirmed = (sessionSets || []).filter((s) => s && !s.unconfirmed && Number(s.r) > 0);

  if (!confirmed.length) {
    return {
      action: 'start',
      weightKg: null,
      reps: targetReps,
      rir: target.target,
      restSec: restFor(profile, type),
      reason: 'Sin series confirmadas: la próxima sesión empieza con el mismo plan.',
      title: 'Sin datos',
    };
  }

  const topW = Math.max(0, ...confirmed.map((s) => Number(s.w) || 0));
  const rirs = confirmed
    .filter((s) => s.rir !== null && s.rir !== undefined && s.rir !== '')
    .map((s) => Number(s.rir))
    .filter(Number.isFinite);
  const avgRir = rirs.length ? rirs.reduce((a, b) => a + b, 0) / rirs.length : null;
  const bestE1 = Math.max(0, ...confirmed.map((s) => e1rmKg(s.w, s.r, s.rir) || 0));
  const allMet = confirmed.every((s) => Number(s.r) >= targetReps);
  const bodyweight = loadType === 'bodyweight';
  const failure = rirs.some((r) => r <= 0) || confirmed.some((s) => s.failure);
  const hard = failure || (avgRir !== null && avgRir <= target.lo - 1) || confirmed.some((s) => Number(s.r) < range.min);
  const easy = avgRir !== null && avgRir >= target.hi && allMet;

  if (bodyweight) {
    const minReps = Math.min(...confirmed.map((s) => Number(s.r) || 0));
    const maxReps = Math.max(...confirmed.map((s) => Number(s.r) || 0));
    let reps = targetReps;
    let action = 'maintain';
    let reason = `Sin peso externo: la próxima sesión busca ${reps} reps con buena técnica.`;
    if (hard) {
      reps = Math.max(1, minReps);
      reason = `Sin peso externo: la próxima sesión mantiene ${reps} reps y prioriza recuperarte.`;
    } else if (easy || (allMet && maxReps >= range.max)) {
      reps = Math.min(range.max + 2, maxReps + 1);
      action = 'up';
      reason = `Sin peso externo: la próxima sesión sube a ${reps} reps.`;
    }
    return {
      action,
      weightKg: topW > 0 ? topW : 0,
      reps,
      rir: target.target,
      restSec: restFor(profile, type),
      reason,
      title: action === 'up' ? 'Suma una repetición' : 'Mantén las repeticiones',
      bestE1rm: round2(bestE1),
    };
  }

  const upKg = shiftLoadKg(loadType, topW, 1, g, unit);
  const downKg = shiftLoadKg(loadType, topW, -1, g, unit);

  if (hard) {
    return {
      action: 'down',
      weightKg: downKg,
      reps: targetReps,
      rir: Math.min(target.hi, target.target + 1),
      restSec: restFor(profile, type),
      reason: `La próxima sesión baja a ${fmtKg(downKg, unit)}: hubo fallo o reps por debajo del objetivo.`,
      title: 'Baja un paso',
      bestE1rm: round2(bestE1),
    };
  }

  if (easy) {
    return {
      action: 'up',
      weightKg: upKg,
      reps: targetReps,
      rir: target.target,
      restSec: restFor(profile, type),
      reason: `La próxima sesión sube a ${fmtKg(upKg, unit)}: sobró margen (RIR medio ${round1(avgRir)}).`,
      title: 'Sube el peso',
      bestE1rm: round2(bestE1),
    };
  }

  return {
    action: 'maintain',
    weightKg: topW,
    reps: targetReps,
    rir: target.target,
    restSec: restFor(profile, type),
    reason: `La próxima sesión mantiene ${fmtKg(topW, unit)} y busca ${targetReps} reps con RIR ${target.target}.`,
    title: 'Mantén el peso',
    bestE1rm: round2(bestE1),
  };
}

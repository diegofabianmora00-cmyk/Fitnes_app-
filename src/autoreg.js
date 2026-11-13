// Motor puro de autoregulación en vivo (sin React).
// Decide la siguiente serie y la próxima sesión a partir de lo que acaba de hacer el usuario.
// Cada decisión devuelve reasonCode y una frase corta (why/reason). Criterio de la app salvo fuentes indicadas.

import { GYM_DEFAULT, defaultLoadType, nearestLoadable } from './load';
import { analyzeRir } from './rir';
import { READINESS, REST, FATIGUE, HYSTERESIS, FIRST_TIME, APP_HEURISTIC } from './config';

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
  if (!(r > 0)) return null;
  if (!(weight > 0)) {
    // Peso corporal/sin carga: no hay e1RM en kg; devuelve null sin fallar.
    return null;
  }
  const rawRir = Number(rir);
  const rr = Number.isFinite(rawRir) && rawRir >= 0 ? rawRir : 0;
  if (r + rr > 15) return null;
  return round2(weight * (1 + (r + rr) / 30));
}

// Para ejercicios sin carga: métrica de rendimiento basada en reps (equivalente relativo).
export function bodyweightPerformance(reps, rir) {
  const r = Number(reps) || 0;
  if (!(r > 0)) return null;
  const rawRir = Number(rir);
  const rr = Number.isFinite(rawRir) && rawRir >= 0 ? rawRir : 0;
  return round2(r + rr);
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
  if (ratio < READINESS.lowRatio) return 'low';
  if (ratio > READINESS.highRatio) return 'high';
  return 'normal';
}

// Histéresis/tendencia: confirma estado con N de las últimas M observaciones.
export function readinessFromSeries(perfValues = [], refValue = 0) {
  const ref = Number(refValue) || 0;
  const vals = (perfValues || []).map(Number).filter((v) => v > 0);
  if (!(ref > 0) || !vals.length) return 'normal';
  const recent = vals.slice(0, READINESS.window);
  const states = recent.map((v) => (v / ref < READINESS.lowRatio ? 'low' : v / ref > READINESS.highRatio ? 'high' : 'normal'));
  const count = (s) => states.filter((x) => x === s).length;
  if (states.length >= 2) {
    if (count('low') >= READINESS.confirmPoints) return 'low';
    if (count('high') >= READINESS.confirmPoints) return 'high';
  }
  return states[0] || 'normal';
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

function bestRecentPerformance(history, limit = 5) {
  let bestE1 = 0;
  let bestBw = 0;
  for (const session of history.slice(0, limit)) {
    for (const set of session.sets || []) {
      const e = e1rmKg(set.w, set.r, set.rir);
      if (e && e > bestE1) bestE1 = e;
      const bw = bodyweightPerformance(set.r, set.rir);
      if (bw && bw > bestBw) bestBw = bw;
    }
  }
  return { bestE1rm: bestE1, bestBw };
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
    return { restSec: target, kind: 'ok', note: null, lockWeight: false, reasonCode: 'rest_ok' };
  }
  const ratio = actual / target;
  if (ratio < REST.shortRatio) {
    const add = hard ? REST.addSecShortHard : REST.addSecShort;
    return {
      restSec: target + add,
      kind: 'short',
      note: `Descansaste ${Math.round(actual)} s de ${target} s; subo el siguiente descanso a ${target + add} s.`,
      lockWeight: false,
      reasonCode: 'rest_short',
    };
  }
  if (ratio > REST.longRatio) {
    const restSec = easy ? Math.max(30, target - REST.cutSecLongEasy) : target;
    return {
      restSec,
      kind: 'long',
      note: `Descansaste ${Math.round(actual)} s de ${target} s; no cambio el peso${easy ? ' y recorto 15 s' : ''}.`,
      lockWeight: true,
      reasonCode: 'rest_long',
    };
  }
  return { restSec: target, kind: 'ok', note: null, lockWeight: false, reasonCode: 'rest_ok' };
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
  const prev = idx > 0 ? sets[idx - 1] : null;
  const guide = (last && last.guide) || {};
  const plan = planFrom(startPlan, guide, currentTarget.target);
  const targetReps = plan.reps || Math.max(1, Number(ex.reps) || range.min);
  const repMin = plan.repMin || range.min;
  const repMax = plan.repMax || range.max;
  const restGoal = Math.max(0, Math.round(Number(restTarget ?? plan.restSec) || restFor(profile, type)));

  if (idx >= total - 1) {
    const summary = nextSessionPlan({ data, ex, sessionSets: sets });
    return {
      done: true,
      action: 'summary',
      reasonCode: 'set_last_summary',
      setNumber: null,
      weightKg: null,
      reps: null,
      rir: null,
      restSec: restGoal,
      reason: 'Última serie del ejercicio: guardo el resumen para la próxima sesión.',
      why: 'Terminaste las series; el resumen ayuda a planear la próxima sesión.',
      readiness: 'normal',
      restNote: null,
      volumeNote: null,
      summary,
      guide: null,
    };
  }

  if (!last) {
    const startWhy = (plan.weightKg || 0) > 0
      ? 'Sigo el plan inicial para empezar la serie.'
      : `Empieza con un peso con el que te queden ${FIRST_TIME.rirMin}-${FIRST_TIME.rirMax} repeticiones en reserva (RIR ${FIRST_TIME.rirMin}-${FIRST_TIME.rirMax}). Ejemplo: si apuntas a ${targetReps} reps, elige una carga que podrías levantar ${targetReps + 2} o ${targetReps + 3} veces.`;
    return {
      done: false,
      action: 'maintain',
      reasonCode: (plan.weightKg || 0) > 0 ? 'set_start_plan' : 'set_first_time',
      setNumber: nextIndex + 1,
      weightKg: plan.weightKg,
      reps: targetReps,
      rir: nextTarget.target,
      restSec: restGoal,
      reason: startWhy,
      why: startWhy,
      readiness: 'normal',
      restNote: null,
      volumeNote: null,
      guide: { weightKg: plan.weightKg, reps: targetReps, rir: nextTarget.target, restSec: restGoal },
    };
  }

  const lastW = Number(last.w) || 0;
  const lastR = Number(last.r) || 0;
  const rawRir = last.rir;
  const hasRir = rawRir !== null && rawRir !== undefined && rawRir !== '' && Number.isFinite(Number(rawRir));
  const unconfirmed = !!last.unconfirmed;
  const failure = (hasRir && Number(rawRir) <= 0) || !!last.failure;
  const bodyweight = loadType === 'bodyweight' || (!(lastW > 0) && loadType !== 'barbell' && loadType !== 'dumbbell' && loadType !== 'stack' && loadType !== 'plates');
  const rirInfo = analyzeRir({ set: last, prevSet: prev, targetReps, profile });
  const effRir = rirInfo.effectiveRir;
  const easy = hasRir && effRir >= currentTarget.hi;
  const hard = failure || effRir <= currentTarget.lo - 1 || lastR < repMin;
  const restInfo = restAdjustment(last.restBeforeSec, restGoal, { easy, hard, apply: idx > 0 });
  const history = sessionHistory(data, ex.id);
  const refPerf = bestRecentPerformance(history);
  const lastE1 = e1rmKg(lastW, lastR, effRir);
  const lastBw = bodyweightPerformance(lastR, effRir);
  const perfNow = bodyweight ? lastBw : lastE1;
  const perfRef = bodyweight ? refPerf.bestBw : refPerf.bestE1rm;
  const ready = idx === 0 && perfNow && perfRef ? readiness(perfNow, perfRef) : 'normal';

  const baseOut = (extra) => {
    const weightKg = round2(extra.weightKg ?? plan.weightKg);
    const reps = Math.max(1, Math.round(extra.reps ?? targetReps));
    const rir = clamp(Math.round(extra.rir ?? nextTarget.target), 0, 10);
    const restSec = Math.max(0, Math.round(extra.restSec ?? restInfo.restSec));
    const why = extra.why || extra.reason || '';
    return {
      done: false,
      action: extra.action || 'maintain',
      reasonCode: extra.reasonCode || 'set_maintain',
      setNumber: nextIndex + 1,
      weightKg,
      reps,
      rir,
      restSec,
      reason: extra.reason || why,
      why,
      readiness: extra.readiness || ready,
      restNote: extra.restNote ?? restInfo.note,
      volumeNote: extra.volumeNote || null,
      confidence: extra.confidence || rirInfo.confidence,
      guide: { weightKg, reps, rir, restSec },
    };
  };

  if (bodyweight) {
    const baseWeight = lastW > 0 ? lastW : plan.weightKg || 0;
    let reps = targetReps;
    let reason = `Sin peso externo: mantengo ${reps} repeticiones y cuido la técnica.`;
    let reasonCode = 'bw_maintain';
    let action = 'bodyweight';
    if (effRir <= currentTarget.lo - 1) {
      const baseReps = lastR > 0 ? lastR : targetReps;
      reps = Math.max(1, Math.min(targetReps, baseReps) - 1);
      reason = `Sin peso externo: baja a ${reps} repeticiones o usa una variante más fácil para recuperar margen.`;
      reasonCode = 'bw_easier';
    } else if (effRir >= currentTarget.hi && lastR >= targetReps) {
      reps = Math.max(targetReps + 1, lastR + 1);
      reason = `Sin peso externo: sube a ${reps} repeticiones o prueba una variante más difícil (más lento o más rango).`;
      reasonCode = 'bw_harder';
    }
    return baseOut({ action, reasonCode, weightKg: baseWeight, reps, reason, why: reason });
  }

  if (unconfirmed || !hasRir) {
    const why = unconfirmed
      ? 'Serie sin confirmar: no cambio el peso y mantengo el objetivo.'
      : 'Sin RIR reportado: no cambio el peso y uso las repeticiones como guía.';
    return baseOut({
      action: 'maintain',
      reasonCode: unconfirmed ? 'set_unconfirmed' : 'set_missing_rir',
      weightKg: lastW || plan.weightKg,
      reps: targetReps,
      reason: why,
      why,
      confidence: rirInfo.confidence,
    });
  }

  if (restInfo.lockWeight) {
    return baseOut({
      action: 'maintain',
      reasonCode: 'rest_long_lock',
      weightKg: lastW || plan.weightKg,
      reps: targetReps,
      reason: restInfo.note || 'Descanso largo: mantengo el peso.',
      why: 'Descansaste más de lo previsto; mantener el peso evita confundir el cansancio con el peso.',
    });
  }

  const current = lastW || plan.weightKg;
  const upKg = shiftLoadKg(loadType, current, 1, g, unit);
  const downKg = shiftLoadKg(loadType, current, -1, g, unit);

  if (failure) {
    const volumeNote = idx === 0 && perfRef > 0 && perfNow && perfNow < perfRef * READINESS.lowRatio
      ? 'La primera serie rindió menos de lo habitual; valora hacer una serie menos hoy.'
      : null;
    const why = `La serie quedó muy exigente (RIR efectivo ${effRir}). Bajar un paso ayuda a completar las repeticiones con buena técnica.`;
    return baseOut({
      action: 'down',
      reasonCode: 'set_failure_down',
      weightKg: downKg,
      reps: targetReps,
      rir: Math.min(nextTarget.hi, nextTarget.target + 1),
      restSec: restGoal + 60,
      reason: `Bajé a ${fmtKg(downKg, unit)} porque la serie ${idx + 1} llegó al fallo (RIR 0).`,
      why,
      volumeNote,
      confidence: rirInfo.confidence,
    });
  }

  if (idx === 0 && ready === 'low') {
    const pct = perfRef > 0 ? Math.round((perfNow / perfRef) * 100) : 0;
    const why = `La primera serie rindió ${pct}% de tu mejor reciente; mantener el peso protege la sesión.`;
    return baseOut({
      action: 'maintain',
      reasonCode: 'readiness_low',
      weightKg: current,
      reps: targetReps,
      rir: Math.min(nextTarget.hi, nextTarget.target + 1),
      reason: `Día flojo: mantengo el peso y subo el RIR objetivo.`,
      why,
      volumeNote: 'Si sigues por debajo de lo normal, valora una serie menos hoy.',
    });
  }

  if (idx === 0 && ready === 'high' && effRir >= currentTarget.hi) {
    const pct = perfRef > 0 ? Math.round((perfNow / perfRef) * 100) : 0;
    const why = `La primera serie rindió ${pct}% de tu mejor reciente con margen; subir un paso aprovecha el buen día.`;
    return baseOut({
      action: 'up',
      reasonCode: 'readiness_high_up',
      weightKg: upKg,
      reps: targetReps,
      rir: nextTarget.target,
      reason: `Día fuerte: subo un paso.`,
      why,
    });
  }

  if (effRir <= currentTarget.lo - 1 || lastR < repMin) {
    const why = lastR < repMin
      ? `Hiciste ${lastR} repeticiones, por debajo del mínimo ${repMin}; bajar un paso ayuda a cumplir el rango.`
      : `La serie quedó con poco margen (RIR efectivo ${effRir}); bajar un paso facilita las siguientes.`;
    return baseOut({
      action: 'down',
      reasonCode: lastR < repMin ? 'reps_below_min' : 'rir_below_target',
      weightKg: downKg,
      reps: targetReps,
      rir: Math.min(nextTarget.hi, nextTarget.target + 1),
      restSec: restGoal + 30,
      reason: why,
      why,
      confidence: rirInfo.confidence,
    });
  }

  if (effRir >= currentTarget.hi + 1 && lastR >= targetReps) {
    const why = `Te sobró margen (RIR efectivo ${effRir}) con ${lastR} repeticiones; subir un paso mantiene el reto.`;
    return baseOut({
      action: 'up',
      reasonCode: 'rir_above_target_up',
      weightKg: upKg,
      reps: targetReps,
      rir: nextTarget.target,
      reason: `Subí a ${fmtKg(upKg, unit)} porque sobró margen.`,
      why,
      confidence: rirInfo.confidence,
    });
  }

  if (lastR >= repMax && effRir >= currentTarget.target) {
    const why = `Llegaste al tope del rango (${repMax} reps) con margen; subir un paso es el siguiente avance.`;
    return baseOut({
      action: 'up',
      reasonCode: 'reps_at_top_up',
      weightKg: upKg,
      reps: targetReps,
      rir: nextTarget.target,
      reason: `Subí a ${fmtKg(upKg, unit)} porque llegaste al tope del rango.`,
      why,
    });
  }

  if (lastR > targetReps && effRir >= currentTarget.lo && effRir <= currentTarget.hi) {
    const reps = Math.min(repMax, targetReps + 1);
    const why = `Hiciste ${lastR} repeticiones dentro del esfuerzo objetivo; sumar una repetición es un progreso seguro.`;
    return baseOut({
      action: 'maintain',
      reasonCode: 'reps_progress',
      weightKg: current,
      reps,
      reason: `Mantengo ${fmtKg(current, unit)} y subo el objetivo a ${reps} repeticiones.`,
      why,
      confidence: rirInfo.confidence,
    });
  }

  const why = `La serie quedó dentro del objetivo (RIR efectivo ${effRir}, ${lastR} repeticiones).`;
  return baseOut({
    action: 'maintain',
    reasonCode: 'set_on_target',
    weightKg: current,
    reps: targetReps,
    reason: `Mantengo ${fmtKg(current, unit)}: estás dentro del objetivo.`,
    why,
    confidence: rirInfo.confidence,
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
      reasonCode: 'session_first_time',
      weightKg: null,
      reps: targetReps,
      rir: target.target,
      restSec: restFor(profile, type),
      reason: `Sin series confirmadas. Elige un peso con el que te queden ${FIRST_TIME.rirMin}-${FIRST_TIME.rirMax} repeticiones en reserva (RIR ${FIRST_TIME.rirMin}-${FIRST_TIME.rirMax}). Ejemplo: si apuntas a ${targetReps} repeticiones, usa una carga que podrías levantar ${targetReps + 2} o ${targetReps + 3} veces.`,
      why: 'Con RIR 2-3 aprendes el peso correcto sin llegar al fallo.',
      title: 'Primera vez',
    };
  }

  const topW = Math.max(0, ...confirmed.map((s) => Number(s.w) || 0));
  const rirInfos = confirmed.map((s, i) => analyzeRir({ set: s, prevSet: i > 0 ? confirmed[i - 1] : null, targetReps, profile }));
  const effRirs = rirInfos.map((x) => x.effectiveRir).filter(Number.isFinite);
  const avgRir = effRirs.length ? effRirs.reduce((a, b) => a + b, 0) / effRirs.length : null;
  const lowConf = rirInfos.some((x) => x.confidence === 'baja');
  const bestE1 = Math.max(0, ...confirmed.map((s) => e1rmKg(s.w, s.r, s.rir) || 0));
  const bestBw = Math.max(0, ...confirmed.map((s) => bodyweightPerformance(s.r, s.rir) || 0));
  const allMet = confirmed.every((s) => Number(s.r) >= targetReps);
  const bodyweight = loadType === 'bodyweight' || (!(topW > 0) && loadType !== 'barbell' && loadType !== 'dumbbell' && loadType !== 'stack' && loadType !== 'plates');
  const failure = effRirs.some((r) => r <= 0) || confirmed.some((s) => s.failure);
  const hard = failure || (avgRir !== null && avgRir <= target.lo - 1) || confirmed.some((s) => Number(s.r) < range.min);
  const easy = avgRir !== null && avgRir >= target.hi && allMet;

  if (bodyweight) {
    const minReps = Math.min(...confirmed.map((s) => Number(s.r) || 0));
    const maxReps = Math.max(...confirmed.map((s) => Number(s.r) || 0));
    let reps = targetReps;
    let action = 'maintain';
    let reasonCode = 'bw_session_maintain';
    let reason = `Sin peso externo: la próxima sesión busca ${reps} repeticiones con buena técnica.`;
    let why = 'Avanzar de forma gradual ayuda a mejorar sin perder técnica.';
    if (hard) {
      reps = Math.max(1, minReps);
      action = 'maintain';
      reasonCode = 'bw_session_easier';
      reason = `Sin peso externo: la próxima sesión usa ${reps} repeticiones o una variante más fácil.`;
      why = 'Bajar las repeticiones o hacer una variante más fácil te ayuda a recuperar.';
    } else if (easy || (allMet && maxReps >= range.max)) {
      reps = Math.max(maxReps + 1, targetReps + 1);
      action = 'up';
      reasonCode = 'bw_session_harder';
      reason = `Sin peso externo: la próxima sesión sube a ${reps} repeticiones o prueba una variante más difícil.`;
      why = 'Te sobró margen; más repeticiones o una variante más difícil mantienen el progreso.';
    }
    return {
      action,
      reasonCode,
      weightKg: topW > 0 ? topW : 0,
      reps,
      rir: target.target,
      restSec: restFor(profile, type),
      reason,
      why,
      title: action === 'up' ? 'Suma repeticiones' : 'Mantén las repeticiones',
      bestE1rm: round2(bestE1),
      bestPerformance: round2(bestBw),
      confidence: lowConf ? 'baja' : 'media',
      heuristic: APP_HEURISTIC,
    };
  }

  const upKg = shiftLoadKg(loadType, topW, 1, g, unit);
  const downKg = shiftLoadKg(loadType, topW, -1, g, unit);

  if (hard) {
    return {
      action: 'down',
      reasonCode: 'session_down',
      weightKg: downKg,
      reps: targetReps,
      rir: Math.min(target.hi, target.target + 1),
      restSec: restFor(profile, type),
      reason: `La próxima sesión baja a ${fmtKg(downKg, unit)} para recuperar el rango.`,
      why: 'Hubo poco margen o pocas repeticiones; bajar un paso ayuda a volver al objetivo.',
      title: 'Baja un paso',
      bestE1rm: round2(bestE1),
      confidence: lowConf ? 'baja' : 'media',
    };
  }

  if (easy) {
    return {
      action: 'up',
      reasonCode: 'session_up',
      weightKg: upKg,
      reps: targetReps,
      rir: target.target,
      restSec: restFor(profile, type),
      reason: `La próxima sesión sube a ${fmtKg(upKg, unit)}.`,
      why: 'Sobró margen en las series; subir un paso mantiene el progreso.',
      title: 'Sube el peso',
      bestE1rm: round2(bestE1),
      confidence: lowConf ? 'baja' : 'media',
    };
  }

  return {
    action: 'maintain',
    reasonCode: 'session_maintain',
    weightKg: topW,
    reps: targetReps,
    rir: target.target,
    restSec: restFor(profile, type),
    reason: `La próxima sesión mantiene ${fmtKg(topW, unit)} y busca ${targetReps} repeticiones con RIR ${target.target}.`,
    why: 'Estás cerca del objetivo; mantener consolida la técnica y el rendimiento.',
    title: 'Mantén el peso',
    bestE1rm: round2(bestE1),
    confidence: lowConf ? 'baja' : 'media',
  };
}

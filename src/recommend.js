import { exerciseById } from './exercises';
import { calculateFacts, getCoachMessage } from './coachMemory';

const KG = 2.20462;
const LOAD_STEP = { kg: 2.5, lb: 5 };
const LOAD_MIN = { kg: 1.25, lb: 2.5 };
const toDisplay = (kg, unit) => Math.round((unit === 'kg' ? kg : kg * KG) * 10) / 10;
const mm = (s) => `${Math.floor(s / 60)}:${String(Math.abs(s) % 60).padStart(2, '0')}`;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const sameKg = (a, b) => Math.abs((Number(a) || 0) - (Number(b) || 0)) <= 0.01;

export const loadStepFor = (unit) => LOAD_STEP[unit] || LOAD_STEP.kg;
export const loadMinFor = (unit) => LOAD_MIN[unit] || LOAD_MIN.kg;
export const loadFromKg = (kg, unit) => (unit === 'lb' ? (Number(kg) || 0) * KG : Number(kg) || 0);
export const kgFromLoad = (value, unit) => (unit === 'lb' ? (Number(value) || 0) / KG : Number(value) || 0);
export const roundLoad = (value, unit = 'kg') => {
  const v = Number(value) || 0;
  if (!(v > 0)) return 0;
  const step = loadStepFor(unit);
  const min = loadMinFor(unit);
  if (v <= min) return min;
  return Math.max(min, Math.round(v / step) * step);
};
export const addLoadStep = (value, unit = 'kg') => {
  const v = roundLoad(value, unit);
  const step = loadStepFor(unit);
  return v <= loadMinFor(unit) ? step : v + step;
};
export const subLoadStep = (value, unit = 'kg') => {
  const v = roundLoad(value, unit);
  if (v <= 0) return 0;
  return v <= loadStepFor(unit) ? loadMinFor(unit) : v - loadStepFor(unit);
};

export const SOURCES = {
  acsm2009:
    'American College of Sports Medicine. Progression Models in Resistance Training for Healthy Adults. ' +
    'Med Sci Sports Exerc. 2009;41(3):687-708.',
  grgic2017:
    'Grgic J, Lazinica B, Mikulic P, Krieger JW, Schoenfeld BJ. The effects of short versus long inter-set ' +
    'rest intervals in resistance training on measures of muscle hypertrophy: a systematic review. ' +
    'Eur J Sport Sci. 2017. doi:10.1080/17461391.2017.1340524.',
  nsca: 'NSCA. Essentials of Strength Training and Conditioning (4th ed.). Regla 2-for-2.',
  zourdos2016:
    'Zourdos MC, Jo E, Khamoui AV, et al. Novel Resistance Training-Specific RPE Scale Measuring ' +
    'Repetitions in Reserve. J Strength Cond Res. 2016;30(1):267-275.',
  schoenfeld2017volume:
    'Schoenfeld BJ, Ogborn D, Krieger JW. Dose-response relationship between weekly resistance training ' +
    'volume and increases in muscle mass: a systematic review and meta-analysis. J Sports Sci. 2017;35(11):1073-1082.',
  schoenfeld2017load:
    'Schoenfeld BJ, Grgic J, Ogborn D, Krieger JW. Strength and hypertrophy adaptations between low- vs. ' +
    'high-load resistance training: a systematic review and meta-analysis. J Strength Cond Res. 2017;31(12):3508-3523.',
  refalo2023:
    'Refalo MC, Helms ER, Trexler ET, Hamilton DL, Fyfe JJ. Influence of resistance training proximity-to-failure ' +
    'on skeletal muscle hypertrophy: a systematic review with meta-analysis. Sports Med. 2023;53(3):649-665.',
  app: 'Criterio de Fitness Coach. No es una recomendación clínica.',
};

export const GOALS = [
  { id: 'fuerza', label: 'Fuerza', icon: 'barbell-outline', desc: 'Levantar más peso en menos repeticiones.' },
  { id: 'hipertrofia', label: 'Hipertrofia', icon: 'body-outline', desc: 'Ganar tamaño y tono muscular.' },
  { id: 'resistencia', label: 'Resistencia', icon: 'heart-outline', desc: 'Aguantar más repeticiones y recuperarte antes.' },
];

export const AMBITIONS = [
  { id: 'mantener', label: 'Mantener', icon: 'remove-circle-outline', desc: 'Subir el peso solo cuando sea muy claro.' },
  { id: 'progresar', label: 'Progresar', icon: 'trending-up-outline', desc: 'Subir tras 2 sesiones cumpliendo el objetivo.' },
  { id: 'maximizar', label: 'Maximizar', icon: 'rocket-outline', desc: 'Subir en cuanto cumplas el objetivo.' },
];

export const LEVELS = [
  { id: 'principiante', label: 'Principiante', icon: 'leaf-outline', desc: 'Menos de 6 meses entrenando con pesas.' },
  { id: 'intermedio', label: 'Intermedio', icon: 'flash-outline', desc: 'Alrededor de 6 meses o más constante.' },
  { id: 'avanzado', label: 'Avanzado', icon: 'flame-outline', desc: 'Años entrenando y progresando.' },
];

export const REST_STYLES = [
  { id: 'corto', label: 'Corto', icon: 'speedometer-outline', desc: 'Sesiones más rápidas (−30 s).' },
  { id: 'equilibrado', label: 'Equilibrado', icon: 'time-outline', desc: 'El descanso recomendado.' },
  { id: 'largo', label: 'Largo', icon: 'hourglass-outline', desc: 'Más recuperación (+30 s).' },
];

export const SEXES = [
  { id: 'hombre', label: 'Hombre' },
  { id: 'mujer', label: 'Mujer' },
  { id: 'otro', label: 'Otro' },
  { id: 'prefiero_no_decir', label: 'Prefiero no decir' },
];

export const labelOf = (list, id) => (list.find((x) => x.id === id) || list[0]).label;

export const RULES = {
  reps: {
    id: 'reps',
    title: 'Rango de repeticiones',
    detail:
      'El ACSM recomienda 8-12 RM para principiantes, 6-12 para hipertrofia y 1-6 para fuerza en ' +
      'intermedios/avanzados; para resistencia, más de 15. La app usa 3-6 como zona conservadora de fuerza.',
    source: SOURCES.acsm2009,
    kind: 'science',
  },
  rest: {
    id: 'rest',
    title: 'Descanso entre series',
    detail:
      'El ACSM recomienda 3-5 min entre series de fuerza pesada, 1-2 min en hipertrofia y menos de 90 s ' +
      'para resistencia; la app usa 45-90 s. Grgic 2017 encontró que descansos de más de 60 s pueden ' +
      'favorecer la hipertrofia.',
    source: `${SOURCES.acsm2009} ${SOURCES.grgic2017}`,
    kind: 'science',
  },
  progression: {
    id: 'progression',
    title: 'Progresión: repeticiones antes que peso',
    detail:
      'El ACSM indica subir 2-10% cuando puedes hacer 1-2 repeticiones más de las objetivo. La regla ' +
      '2-for-2 del NSCA pide 2 sesiones consecutivas cumplidas antes de subir. La app ajusta ese número a tu ambición.',
    source: `${SOURCES.acsm2009} ${SOURCES.nsca}`,
    kind: 'science',
  },
  load: {
    id: 'load',
    title: 'Cuánto subir el peso',
    detail:
      'El ACSM recomienda aumentos de 2-10%. La app sube 2,5 kg o 5 lb según tu unidad, ' +
      'redondeando al disco o mancuerna disponible (mínimo 1,25 kg o 2,5 lb).',
    source: SOURCES.acsm2009,
    kind: 'science',
  },
  stall: {
    id: 'stall',
    title: 'Estancamiento',
    detail:
      'Criterio de la app basado en el ACSM: si llevas 3 sesiones con el mismo peso sin mejorar repeticiones, ' +
      'o 14 días sin cumplir el objetivo, mantener y revisar recuperación es más seguro que subir a ciegas. ' +
      'Si persiste, considera una semana más ligera.',
    source: SOURCES.acsm2009,
    kind: 'app',
  },
  start: {
    id: 'start',
    title: 'Primer peso',
    detail:
      'Sin historial no inventamos un peso. Elige uno que te permita completar el rango objetivo dejando ' +
      '2-3 repeticiones en reserva (RIR 2-3). La app aprende de esa primera sesión y desde ahí recomienda números.',
    source: SOURCES.zourdos2016,
    kind: 'science',
  },
  preference: {
    id: 'preference',
    title: 'Tu preferencia de descanso',
    detail:
      'Tu preferencia ajusta ±30 s dentro de los rangos con respaldo. La app no baja de 3 min en fuerza ' +
      'compuesta ni de 60 s en hipertrofia.',
    source: `${SOURCES.acsm2009} ${SOURCES.grgic2017}`,
    kind: 'app',
  },
  frequency: {
    id: 'frequency',
    title: 'Frecuencia semanal',
    detail:
      'El ACSM recomienda 2-3 días por semana para principiantes, 3-4 para intermedios y 4-5 para avanzados. ' +
      'La constancia importa más que un entrenamiento perfecto.',
    source: SOURCES.acsm2009,
    kind: 'science',
  },
  rir: {
    id: 'rir',
    title: 'Repeticiones en reserva (RIR)',
    detail:
      'RIR son las repeticiones que te quedaban al terminar la serie. RIR 0 es fallo; 1 significa que podrías ' +
      'hacer una más; 2, dos más. Zourdos 2016 validó la escala RPE/RIR.',
    source: SOURCES.zourdos2016,
    kind: 'science',
  },
  restFeedback: {
    id: 'restFeedback',
    title: 'Lectura del descanso real',
    detail:
      'La app compara tu descanso real con el recomendado. Si te desvías más del 20% (mínimo 20 s), Atlas ' +
      'te lo dice sin cambiar tu plan automáticamente.',
    source: `${SOURCES.acsm2009} ${SOURCES.grgic2017}`,
    kind: 'app',
  },
  pr: {
    id: 'pr',
    title: 'Récords personales',
    detail:
      'Récord de peso: la serie más pesada con al menos 1 repetición. Récord de repeticiones: más ' +
      'repeticiones que tu mejor marca a ese mismo peso, aunque no sea el peso máximo. En peso corporal, ' +
      'más repeticiones. Criterio de la app.',
    source: SOURCES.app,
    kind: 'app',
  },
  score: {
    id: 'score',
    title: 'Puntaje de sesión',
    detail:
      'Puntaje = 40% plan cumplido (series y repeticiones) + 20% carga + 25% esfuerzo (RIR) + 10% descanso + ' +
      '5% progreso. El plan y el esfuerzo pesan más porque la dosis de entrenamiento y acercarse al fallo son ' +
      'los factores con más respaldo; el PR pesa poco porque una sola sesión no define el progreso. Si falta un ' +
      'dato, se reparte el peso entre los bloques disponibles. Los pesos exactos son criterio de la app.',
    source: `${SOURCES.app} ${SOURCES.schoenfeld2017volume} ${SOURCES.refalo2023} ${SOURCES.schoenfeld2017load} ${SOURCES.grgic2017} ${SOURCES.zourdos2016}`,
    kind: 'app',
  },
  bodyweight: {
    id: 'bodyweight',
    title: 'Ejercicios con peso corporal',
    detail:
      'Sin peso externo, la progresión se hace sumando repeticiones o lastre, manteniendo buena técnica. ' +
      'Criterio de la app.',
    source: SOURCES.app,
    kind: 'app',
  },
  timeHabitual: {
    id: 'timeHabitual',
    title: 'Tiempo habitual por serie',
    detail:
      'Criterio de la app: una serie típica dura entre 25 y 45 segundos. Es una referencia, no una regla clínica.',
    source: SOURCES.app,
    kind: 'app',
  },
  lowConfidence: {
    id: 'lowConfidence',
    title: 'Confianza inicial baja',
    detail:
      'Con pocos datos (menos de 2 sesiones), la app mantiene una progresión muy conservadora (máximo un paso de disco) y aún tengo pocos datos sobre ti.',
    source: SOURCES.app,
    kind: 'app',
  },
  routineEstimate: {
    id: 'routineEstimate',
    title: 'Estimado de duración',
    detail: 'Criterio de la app: promedio de duración de tus últimas sesiones de esta rutina.',
    source: SOURCES.app,
    kind: 'app',
  },
  nearRecord: {
    id: 'nearRecord',
    title: 'Cerca de un récord',
    detail: 'Criterio de la app: detecta cuando tu mejor peso reciente (últimos 14 días) está entre el 90% y el 100% (sin alcanzarlo) de tu récord personal.',
    source: SOURCES.app,
    kind: 'app',
  },
};

export const CONFIDENCE_NEEDED = 4;

export function confidence(historial = [], ejercicioId) {
  let workouts = [];
  if (historial && !Array.isArray(historial) && Array.isArray(historial.workouts)) {
    workouts = historial.workouts;
  } else if (Array.isArray(historial)) {
    workouts = historial;
  }

  let sessionsCount = 0;
  if (ejercicioId) {
    if (workouts.length > 0 && workouts[0] && workouts[0].exercises) {
      const history = sessionHistory({ workouts }, ejercicioId);
      sessionsCount = history.length;
    } else if (workouts.length > 0 && workouts[0] && workouts[0].sets) {
      sessionsCount = workouts.filter((s) => (s.sets || []).filter((st) => Number(st.r) > 0 && !st.unconfirmed).length > 0).length;
    } else if (historial && historial.workouts) {
      const history = sessionHistory(historial, ejercicioId);
      sessionsCount = history.length;
    }
  }

  const necesarias = CONFIDENCE_NEEDED;
  let nivel = 'baja';
  if (sessionsCount >= 4) {
    nivel = 'alta';
  } else if (sessionsCount >= 2) {
    nivel = 'media';
  } else {
    nivel = 'baja';
  }

  return {
    sesiones: sessionsCount,
    necesarias,
    nivel,
  };
}

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

export function frequencyAdvice(profile = {}) {
  const level = profile.level || 'principiante';
  const table = { principiante: [2, 3], intermedio: [3, 4], avanzado: [4, 5] };
  const [min, max] = table[level] || table.principiante;
  const days = Number(profile.daysPerWeek) || min;
  return { min, max, days, ok: days >= min && days <= max, rule: RULES.frequency };
}

const needFor = (profile) =>
  profile.ambition === 'maximizar' ? 1 : profile.ambition === 'mantener' ? 3 : 2;

const topWeight = (s) => Math.max(0, ...(s.sets || []).filter((x) => !x.unconfirmed).map((x) => Number(x.w) || 0));
const totalReps = (s) => (s.sets || []).filter((x) => !x.unconfirmed).reduce((a, x) => a + (Number(x.r) || 0), 0);

function sessionInfo(s, fallbackTarget = 8) {
  const target = Number(s.target) || fallbackTarget;
  const sets = (s.sets || []).filter((x) => !x.unconfirmed);
  const reps = sets.map((x) => Number(x.r) || 0);
  const met = target > 0 && reps.length > 0 && reps.every((r) => r >= target);
  const over = target > 0 && reps.length > 0 && reps.every((r) => r >= target + 2);
  const failed = sets.some((x) => x.failure);
  const rirs = sets
    .map((x) => x.rir)
    .filter((v) => v !== null && v !== undefined && v !== '')
    .map(Number)
    .filter((n) => Number.isFinite(n));
  const margin = met && !failed && (rirs.length === 0 || rirs.every((r) => r >= 1));
  return {
    target,
    met,
    over,
    margin,
    strong: over && margin,
    total: reps.reduce((a, b) => a + b, 0),
    best: reps.length ? Math.max(...reps) : 0,
  };
}

function sessionHistory(data, exId) {
  const out = [];
  for (const w of [...(data.workouts || [])].sort((a, b) => (b.date || 0) - (a.date || 0))) {
    const e = (w.exercises || []).find((x) => x.exId === exId);
    if (!e) continue;
    const sets = (e.sets || []).filter((s) => Number(s.r) > 0 && !s.unconfirmed);
    if (!sets.length) continue;
    out.push({ date: w.date || 0, workoutId: w.id, target: Number(e.targetReps ?? e.target) || 0, sets });
  }
  return out;
}

function detectStall(history, top, fallbackTarget) {
  const last3 = history.slice(0, 3);
  if (last3.length === 3 && last3.every((s) => sameKg(topWeight(s), top))) {
    const newest = sessionInfo(last3[0], fallbackTarget);
    const oldest = sessionInfo(last3[2], fallbackTarget);
    if (newest.best <= oldest.best && newest.total <= oldest.total && !(newest.met && newest.margin)) {
      const days = Math.max(1, Math.round(((last3[0].date || 0) - (last3[2].date || 0)) / 864e5));
      return { stall: true, days, reason: '3 sesiones' };
    }
  }
  let count = 0;
  for (const s of history) {
    if (sameKg(topWeight(s), top)) count++;
    else break;
  }
  if (count >= 2) {
    const days = Math.round(((history[0].date || 0) - (history[count - 1].date || 0)) / 864e5);
    const anyGood = history.slice(0, count).some((s) => {
      const i = sessionInfo(s, fallbackTarget);
      return i.met && i.margin;
    });
    if (days >= 14 && !anyGood) return { stall: true, days, reason: '14 días' };
  }
  return { stall: false, days: 0, reason: '' };
}

function restFeedbackFromSets(sets, targetSec) {
  const rests = (sets || [])
    .filter((s) => s && !s.unconfirmed && s.restBeforeSec !== null && s.restBeforeSec !== undefined)
    .map((s) => Number(s.restBeforeSec))
    .filter((n) => Number.isFinite(n) && n >= 0);
  if (!rests.length) return null;
  const actual = Math.round(rests.reduce((a, b) => a + b, 0) / rests.length);
  const dev = actual - targetSec;
  const threshold = Math.max(20, Math.round(targetSec * 0.2));
  const kind = dev < -threshold ? 'short' : dev > threshold ? 'long' : 'ok';
  return { actual, target: targetSec, dev, threshold, kind };
}

function restInsightText(kind, actual, target, missed, name) {
  const diff = Math.abs(Math.round(actual - target));
  if (kind === 'short') {
    return missed
      ? `En ${name} descansaste ${diff} s menos de lo previsto y no completaste las reps. Prueba +30 s.`
      : `En ${name} descansaste ${diff} s menos de lo previsto y aun así cumpliste. Si te funciona, puedes ajustar tu preferencia a Corto.`;
  }
  if (kind === 'long') {
    return missed
      ? `En ${name} descansaste ${diff} s más de lo previsto y no completaste las reps; revisa sueño, comida y técnica.`
      : `En ${name} descansaste ${diff} s más de lo previsto. No es malo, pero alarga la sesión; si te gusta, ajusta tu preferencia a Largo.`;
  }
  return '';
}

const uniqRules = (list) => [...new Map((list || []).filter(Boolean).map((r) => [r.id, r])).values()];

export function restFeedback(data = {}, ex = {}) {
  const profile = data.profile || {};
  const db = exerciseById(ex.id);
  const type = ex.type || (db && db.type) || 'compuesto';
  const history = sessionHistory(data, ex.id);
  if (!history.length) return null;
  const last = history[0];
  const targetSec = restFor(profile, type);
  const info = restFeedbackFromSets(last.sets, targetSec);
  if (!info) return null;
  const si = sessionInfo(last, Number(ex.reps) || 8);
  const missed = !(si.met && si.margin);
  return {
    ...info,
    missed,
    text: info.kind === 'ok' ? '' : restInsightText(info.kind, info.actual, targetSec, missed, ex.name || (db && db.name) || 'este ejercicio'),
    rule: RULES.restFeedback,
  };
}

export function recommendFor(data = {}, ex = {}) {
  const profile = { ...(data.profile || {}) };
  const db = exerciseById(ex.id);
  const type = ex.type || (db && db.type) || 'compuesto';
  const group = ex.group || (db && db.group) || '';
  const baseTarget = Math.max(1, Number(ex.reps) || 8);
  const range = repRangeFor(profile);
  const customRest = Number(ex.restSec);
  const restSec = customRest > 0 ? Math.round(customRest) : restFor(profile, type);
  const unit = data.unit || 'kg';
  const name = ex.name || (db && db.name) || 'Ejercicio';
  const history = sessionHistory(data, ex.id);
  const need = needFor(profile);
  const goalLabel = labelOf(GOALS, profile.goal);
  const levelLabel = labelOf(LEVELS, profile.level);
  const targetOut = baseTarget < range.min || baseTarget > range.max;
  const warning = targetOut
    ? `Tu rutina pide ${baseTarget} reps, fuera del rango ${range.min}-${range.max}. Atlas respeta tu objetivo; ajusta la rutina si quieres seguir la recomendación.`
    : null;
  const repRule = {
    ...RULES.reps,
    detail: `Para ${goalLabel.toLowerCase()} y nivel ${levelLabel.toLowerCase()}, el rango recomendado es ${range.min}-${range.max} reps. ${RULES.reps.detail}`,
  };
  const restRule = {
    ...RULES.rest,
    detail: `Para ${type} y tu objetivo, descansa ${mm(restSec)}. ${RULES.rest.detail}`,
  };
  const conf = confidence(data, ex.id);
  const isLowConfidence = conf.nivel === 'baja' && history.length === 1;

  const finalize = (res) => {
    const out = {
      ...res,
      sessions: conf.sesiones,
      confidence: conf.nivel,
    };
    if (isLowConfidence) {
      const textHasData = out.text.includes('aún tengo pocos datos') || out.text.includes('poca información') || out.text.includes('pocos datos');
      const updatedText = textHasData ? out.text : `En ${name}, aún tengo pocos datos (1 sesión). ${out.text}`;
      const rules = uniqRules([...(out.rules || []), RULES.lowConfidence]);
      out.text = updatedText;
      out.rules = rules;
      if (out.primaryRule?.id === 'start' || !out.primaryRule) {
        out.primaryRule = RULES.lowConfidence;
      }
    }
    return out;
  };

  const base = {
    id: ex.id,
    exerciseName: name,
    type,
    group,
    target: baseTarget,
    targetReps: baseTarget,
    unit,
    repMin: range.min,
    repMax: range.max,
    restSec,
    rir: profile.goal === 'fuerza' ? [1, 2] : [1, 3],
    need,
    streak: 0,
    stallDays: 0,
    action: 'start',
    weightKg: null,
    title: 'Primera vez',
    text: '',
    rules: [repRule, restRule],
    primaryRule: RULES.start,
    sessions: conf.sesiones,
    confidence: conf.nivel,
    trend: 'flat',
    warning,
    restInsight: null,
  };

  if (!history.length) {
    return finalize({
      ...base,
      text: `Elige un peso con el que completes ${range.min}-${range.max} repeticiones dejando 2 en reserva. Descansa ${mm(restSec)}.`,
      rules: [repRule, restRule, RULES.start],
      primaryRule: RULES.start,
    });
  }

  const last = history[0];
  const top = topWeight(last);
  const info = sessionInfo(last, baseTarget);
  const weightText = (kg) => `${toDisplay(kg, unit)} ${unit}`;
  const topLoad = roundLoad(loadFromKg(top, unit), unit);
  const topKg = kgFromLoad(topLoad, unit);
  const stepLoad = loadStepFor(unit);

  if (history.length >= 2) {
    const prev = sessionInfo(history[1], baseTarget);
    base.trend = info.total > prev.total ? 'up' : info.total < prev.total ? 'down' : 'flat';
  }

  const insight = restFeedbackFromSets(last.sets, restSec);
  if (insight && insight.kind !== 'ok') {
    base.restInsight = {
      ...insight,
      missed: !(info.met && info.margin),
      text: restInsightText(insight.kind, insight.actual, restSec, !(info.met && info.margin), name),
    };
  }

  if (top <= 0) {
    if (info.met && info.best >= range.max) {
      return finalize({
        ...base,
        action: 'maintain',
        weightKg: 0,
        targetReps: info.best,
        streak: 0,
        title: 'Añade lastre',
        text: `En ${name} ya haces ${info.best} reps, el tope del rango. Mantén y añade un poco de lastre cuando puedas.`,
        rules: [repRule, RULES.bodyweight],
        primaryRule: RULES.bodyweight,
      });
    }
    const nextTarget = info.met
      ? Math.min(Math.max(baseTarget + 1, info.best + 1), range.max)
      : baseTarget;
    return finalize({
      ...base,
      action: 'maintain',
      weightKg: 0,
      targetReps: nextTarget,
      streak: 0,
      title: info.met ? 'Suma una repetición' : 'Completa el objetivo',
      text: info.met
        ? `En ${name} no hay peso externo. Suma una repetición y busca ${nextTarget}.`
        : `En ${name} no hay peso externo. Busca completar ${nextTarget} reps con buena técnica.`,
      rules: [repRule, RULES.bodyweight],
      primaryRule: RULES.bodyweight,
    });
  }

  let streak = 0;
  for (const s of history) {
    const i = sessionInfo(s, baseTarget);
    if (sameKg(topWeight(s), top) && i.met && i.margin) streak++;
    else break;
  }

  const stall = detectStall(history, top, baseTarget);

  if (info.strong || (info.met && info.margin && streak >= need)) {
    const pct = topLoad > 0 ? stepLoad / topLoad : 0;
    if (pct > 0.1 && baseTarget < range.max) {
      const nextTarget = Math.min(baseTarget + 1, range.max);
      return finalize({
        ...base,
        action: 'maintain',
        weightKg: topKg,
        targetReps: nextTarget,
        streak,
        title: 'Suma una repetición',
        text: `En ${name}, mantén ${weightText(topKg)} y busca ${nextTarget} reps. El siguiente salto de peso sería más del 10%; primero exprime el rango.`,
        rules: [repRule, restRule, RULES.progression, RULES.load],
        primaryRule: RULES.progression,
      });
    }
    const nextLoad = addLoadStep(topLoad, unit);
    const next = kgFromLoad(nextLoad, unit);
    return finalize({
      ...base,
      action: 'up',
      weightKg: next,
      streak,
      title: 'Sube el peso',
      text: info.strong
        ? `En ${name}, sube a ${weightText(next)}. Superaste el objetivo por 2 o más repeticiones.`
        : `En ${name}, sube a ${weightText(next)}. Llevas ${streak} sesión${streak === 1 ? '' : 'es'} cumpliendo el objetivo.`,
      rules: [repRule, restRule, RULES.progression, RULES.load],
      primaryRule: RULES.progression,
    });
  }

  if (stall.stall) {
    return finalize({
      ...base,
      action: 'stall',
      weightKg: topKg,
      streak,
      stallDays: stall.days,
      title: 'Revisa el estancamiento',
      text: `Llevas ${stall.reason} con ${name} en ${weightText(topKg)} sin mejorar. Mantén el peso y revisa sueño, comida y técnica.`,
      rules: [repRule, restRule, RULES.stall],
      primaryRule: RULES.stall,
    });
  }

  if (info.met && !info.margin) {
    return finalize({
      ...base,
      action: 'maintain',
      weightKg: topKg,
      streak,
      title: 'Mantén y gana margen',
      text: `En ${name}, mantén ${weightText(topKg)}. Llegaste al objetivo, pero al fallo o sin margen; busca 1 repetición en reserva antes de subir.`,
      rules: [repRule, RULES.progression, RULES.rir],
      primaryRule: RULES.rir,
    });
  }

  if (info.met && info.margin) {
    return finalize({
      ...base,
      action: 'maintain',
      weightKg: topKg,
      streak,
      title: 'Vas bien: mantén',
      text: `En ${name}, mantén ${weightText(topKg)} una sesión más. Llevas ${streak} de ${need} sesiones para subir.`,
      rules: [repRule, RULES.progression],
      primaryRule: RULES.progression,
    });
  }

  return finalize({
    ...base,
    action: 'maintain',
    weightKg: topKg,
    streak,
    title: 'Mantén el peso',
    text: `En ${name}, mantén ${weightText(topKg)} y busca una repetición más por serie.`,
    rules: [repRule, RULES.progression],
    primaryRule: RULES.progression,
  });
}

export function personalRecords(data = {}, exId) {
  const prs = {};
  for (const w of data.workouts || []) {
    for (const e of w.exercises || []) {
      if (!e.exId) continue;
      for (const s of e.sets || []) {
        const r = Number(s.r) || 0;
        const kg = Number(s.w) || 0;
        if (r <= 0 || s.unconfirmed) continue;
        const cand = { exId: e.exId, name: e.name, weightKg: kg, reps: r, date: w.date || 0, workoutId: w.id };
        const cur = prs[e.exId];
        if (!cur || kg > cur.weightKg + 0.01 || (sameKg(kg, cur.weightKg) && r > cur.reps)) prs[e.exId] = cand;
      }
    }
  }
  return exId ? prs[exId] || null : prs;
}

export function newRecords(data = {}, workout = {}) {
  const prs = personalRecords(data);
  const bestAt = {};
  for (const w of data.workouts || []) {
    for (const e of w.exercises || []) {
      if (!e.exId) continue;
      for (const s of e.sets || []) {
        const r = Number(s.r) || 0;
        const kg = Number(s.w) || 0;
        if (r <= 0 || s.unconfirmed) continue;
        const list = bestAt[e.exId] || (bestAt[e.exId] = []);
        const best = list.find((x) => sameKg(x.kg, kg));
        if (!best) list.push({ kg, reps: r });
        else if (r > best.reps) best.reps = r;
      }
    }
  }
  const out = [];
  (workout.exercises || []).forEach((e, exIndex) => {
    const h = prs[e.exId];
    if (!h) return;
    let weightBest = null;
    let repsBest = null;
    (e.sets || []).forEach((s, setIndex) => {
      const r = Number(s.r) || 0;
      const kg = Number(s.w) || 0;
      if (r <= 0 || s.unconfirmed) return;
      if (kg > h.weightKg + 0.01) {
        const cand = { exId: e.exId, name: e.name || h.name, kind: 'weight', weightKg: kg, reps: r, exIndex, setIndex };
        if (!weightBest || kg > weightBest.weightKg + 0.01 || (sameKg(kg, weightBest.weightKg) && r > weightBest.reps)) weightBest = cand;
        return;
      }
      const prev = (bestAt[e.exId] || []).find((x) => sameKg(x.kg, kg));
      if (prev && r > prev.reps) {
        const cand = { exId: e.exId, name: e.name || h.name, kind: 'reps', weightKg: kg, reps: r, exIndex, setIndex };
        if (!repsBest || r > repsBest.reps || (r === repsBest.reps && kg > repsBest.weightKg + 0.01)) repsBest = cand;
      }
    });
    if (weightBest) out.push(weightBest);
    if (repsBest) out.push(repsBest);
  });
  return out;
}

const SCORE_WEIGHTS_DEFAULT = {
  plan: 40,
  load: 20,
  effort: 25,
  rest: 10,
  progress: 5,
};

const SCORE_WEIGHTS_BEGINNER = {
  plan: 45,
  load: 20,
  effort: 15,
  rest: 15,
  progress: 5,
};

const getScoreWeights = (profile) =>
  profile && profile.level === 'principiante' ? SCORE_WEIGHTS_BEGINNER : SCORE_WEIGHTS_DEFAULT;

const SCORE_LABELS = {
  plan: 'Plan cumplido',
  load: 'Carga',
  effort: 'Esfuerzo (RIR)',
  rest: 'Descanso',
  progress: 'Progress',
};

const scoreGrade = (score) =>
  score >= 90 ? 'Excelente' : score >= 75 ? 'Bien' : score >= 60 ? 'Aceptable' : 'Margen de mejora';

const scoreSets = (sets) => (sets || []).filter((s) => Number(s.r) > 0 && !s.unconfirmed);

const setRir = (s) => {
  if (!s) return null;
  if (s.rir !== null && s.rir !== undefined && s.rir !== '') {
    const n = Number(s.rir);
    if (Number.isFinite(n)) return n;
  }
  return s.failure ? 0 : null;
};

const e1rmKg = (w, r) => {
  const kg = Number(w) || 0;
  const reps = Number(r) || 0;
  return kg > 0 && reps > 0 ? kg * (1 + reps / 30) : 0;
};

const bestSetMetric = (sets) => {
  const valid = scoreSets(sets);
  if (!valid.length) return { value: 0, kind: 'none' };
  const loaded = valid.filter((s) => (Number(s.w) || 0) > 0);
  if (loaded.length) {
    return { value: Math.max(...loaded.map((s) => e1rmKg(s.w, s.r))), kind: 'e1rm' };
  }
  return { value: Math.max(...valid.map((s) => Number(s.r) || 0)), kind: 'reps' };
};

const bestBefore = (data, workout, exId, kind) => {
  const when = Number(workout.date) || 0;
  let best = 0;
  for (const w of data.workouts || []) {
    if (w.id === workout.id) continue;
    if ((Number(w.date) || 0) >= when) continue;
    for (const e of w.exercises || []) {
      if (e.exId !== exId) continue;
      const m = bestSetMetric(e.sets);
      if (m.kind === kind && m.value > best) best = m.value;
    }
  }
  return best;
};

function scoreExerciseParts(data, planItem, performed, workout, includeProgress, weights) {
  const p = planItem || {};
  const e = performed || {};
  const sets = scoreSets(e.sets);
  const targetSets = Math.max(1, Number(p.targetSets ?? e.targetSets) || Number(e.targetSets) || sets.length || 1);
  const targetReps = Number(p.targetReps ?? e.targetReps) || Number(e.targetReps) || 0;
  const targetRest = Number(p.targetRestSec ?? e.targetRestSec) || Number(e.targetRestSec) || 0;
  const rawRir = p.targetRir ?? e.targetRir;
  const targetRir = rawRir !== null && rawRir !== undefined && rawRir !== '' && Number.isFinite(Number(rawRir))
    ? Number(rawRir)
    : 2;
  const recWeight = Number(p.recWeightKg ?? e.recWeightKg) || Number(e.recWeightKg) || 0;
  const adjusted = workout && workout.adjusted;
  const parts = {};

  const repsVals = [];
  for (let i = 0; i < targetSets; i++) {
    const s = sets[i];
    if (!s) {
      repsVals.push(0);
      continue;
    }
    const r = Number(s.r) || 0;
    repsVals.push(targetReps > 0 ? Math.min(1, r / targetReps) : r > 0 ? 1 : 0);
  }
  const repsPct = repsVals.reduce((a, b) => a + b, 0) / targetSets;
  parts.plan = { value: clamp(repsPct, 0, 1), weight: weights.plan };

  if (!adjusted && recWeight > 0 && sets.length) {
    const avgWeight = sets.reduce((a, s) => a + (Number(s.w) || 0), 0) / sets.length;
    parts.load = { value: clamp(avgWeight / recWeight, 0, 1), weight: weights.load };
  }

  const rirs = sets.map(setRir).filter((v) => v !== null);
  if (rirs.length) {
    const vals = rirs.map((rir) => {
      const dev = Math.abs(rir - targetRir);
      if (dev <= 1) return 1;
      if (dev === 2) return 0.75;
      return 0.3;
    });
    parts.effort = { value: vals.reduce((a, b) => a + b, 0) / vals.length, weight: weights.effort };
  }

  if (targetRest > 0) {
    const rests = sets
      .map((s) => Number(s.restBeforeSec))
      .filter((n) => Number.isFinite(n) && n > 0);
    if (rests.length) {
      const tolerance = Math.max(25, Math.round(targetRest * 0.25));
      const vals = rests.map((actual) => {
        const dev = actual - targetRest;
        if (Math.abs(dev) <= tolerance) return 1;
        if (dev > 0) {
          // Rested more than target: milder penalty
          const excess = dev - tolerance;
          return Math.max(0.7, 1 - excess / (2 * targetRest));
        } else {
          // Rested less than target: standard penalty
          const deficit = Math.abs(dev) - tolerance;
          return Math.max(0, 1 - deficit / Math.max(1, targetRest));
        }
      });
      parts.rest = { value: vals.reduce((a, b) => a + b, 0) / vals.length, weight: weights.rest };
    }
  }

  if (includeProgress && workout && e.exId) {
    const current = bestSetMetric(e.sets);
    if (current.value > 0) {
      const previous = bestBefore(data, workout, e.exId, current.kind);
      if (previous > 0) {
        const ratio = current.value / previous;
        let value = 0.15;
        if (ratio >= 1.02) value = 1;
        else if (ratio >= 0.99) value = 0.85;
        else if (ratio >= 0.95) value = 0.65;
        else if (ratio >= 0.9) value = 0.4;
        const hasPr = (workout.prs || []).some((pr) => pr.exId === e.exId) || sets.some((s) => s.pr);
        parts.progress = { value: hasPr ? 1 : value, weight: weights.progress };
      }
    }
  }

  return { parts, targetSets, targetReps, targetRest, sets };
}

function combineParts(parts = {}, weights) {
  const entries = Object.entries(parts).filter(([, part]) => part && part.weight > 0);
  const totalWeight = entries.reduce((a, [, part]) => a + part.weight, 0);
  if (!totalWeight) return { score: 0, components: [] };
  const components = entries.map(([key, part]) => ({
    key,
    label: SCORE_LABELS[key] || key,
    value: clamp(part.value, 0, 1),
    weight: part.weight,
  }));
  const score = Math.round((entries.reduce((a, [, part]) => a + clamp(part.value, 0, 1) * part.weight, 0) / totalWeight) * 100);
  return { score, components };
}

export function sessionReview(data = {}, workout = {}) {
  const profile = data.profile || {};
  const weights = getScoreWeights(profile);

  if (workout.adjusted && workout.adjusted.reason === 'dolor') {
    return {
      score: null,
      grade: 'Sesión protegida',
      supportMessage: 'Escuchaste a tu cuerpo y paraste por dolor. Hoy lo importante es descansar.',
      components: [],
      v: 4,
      adjusted: workout.adjusted,
      restNotes: [],
      missed: [],
      durationSec: Number(workout.durationSec) || 0,
    };
  }

  const performed = workout.exercises || [];
  const totalValidSets = performed.flatMap((e) => scoreSets(e.sets)).length;
  if (totalValidSets === 0) {
    return {
      score: null,
      grade: 'Datos insuficientes',
      supportMessage: 'No hay series confirmadas suficientes para calcular puntaje en esta sesión.',
      components: [],
      v: 4,
      adjusted: workout.adjusted || null,
      restNotes: [],
      missed: [],
      durationSec: Number(workout.durationSec) || 0,
    };
  }

  const hasPlan = Array.isArray(workout.plan) && workout.plan.length > 0;
  const isPocoTiempo = workout.adjusted && workout.adjusted.reason === 'poco tiempo';
  const plan = isPocoTiempo && performed.length < (workout.plan || []).length
    ? workout.plan.slice(0, performed.length)
    : (hasPlan ? workout.plan : performed);
  const restNotes = [];
  const missed = [];
  const acc = {};

  const addPart = (key, part, exerciseWeight) => {
    if (!part) return;
    const bucket = acc[key] || (acc[key] = { sum: 0, weight: 0 });
    bucket.sum += part.value * part.weight * exerciseWeight;
    bucket.weight += part.weight * exerciseWeight;
  };

  plan.forEach((p, index) => {
    const at = performed[index];
    const e = at && at.exId === p.exId ? at : performed.find((x) => x.exId === p.exId) || {};
    const item = scoreExerciseParts(data, p, e, workout, true, weights);
    const exerciseWeight = Math.max(1, item.targetSets);
    Object.entries(item.parts).forEach(([key, part]) => addPart(key, part, exerciseWeight));

    if (!item.sets.length) {
      missed.push({ exId: p.exId || e.exId, name: p.name || e.name || 'Ejercicio' });
      return;
    }

    const db = exerciseById(p.exId || e.exId);
    const type = p.type || e.type || (db && db.type) || 'compuesto';
    const targetRest = item.targetRest || restFor(profile, type);
    const ri = restFeedbackFromSets(item.sets, targetRest);
    if (ri && ri.kind !== 'ok') {
      const didNotReach = item.sets.some((s) => (Number(s.r) || 0) < item.targetReps);
      restNotes.push({
        exId: p.exId || e.exId,
        name: p.name || e.name,
        ...ri,
        text: restInsightText(ri.kind, ri.actual, targetRest, didNotReach, p.name || e.name || 'este ejercicio'),
      });
    }
  });

  const parts = {};
  Object.entries(acc).forEach(([key, bucket]) => {
    if (bucket.weight > 0) parts[key] = { value: bucket.sum / bucket.weight, weight: weights[key] };
  });
  const combined = combineParts(parts, weights);
  return {
    score: combined.score,
    grade: scoreGrade(combined.score),
    components: combined.components,
    restNotes,
    durationSec: Number(workout.durationSec) || 0,
    v: 4,
    partial: !hasPlan,
    missed,
    adjusted: workout.adjusted || null,
  };
}

export function exerciseReview(data = {}, e = {}) {
  const profile = data.profile || {};
  const weights = getScoreWeights(profile);
  const item = scoreExerciseParts(data, e, e, null, false, weights);
  const combined = combineParts(item.parts, weights);
  return { score: combined.score, grade: scoreGrade(combined.score), components: combined.components, v: 4 };
}

export function rescoreWorkouts(data = {}) {
  const workouts = (data.workouts || []).map((w) => {
    if (w.score && Number(w.score.v) === 4) return w;
    return { ...w, score: sessionReview(data, w) };
  });
  return { ...data, workouts };
}

export function movingAverage4w(data = {}, now = Date.now()) {
  const workouts = data.workouts || [];
  const last28Workouts = workouts.filter((w) => (w.date || 0) > 0 && now - w.date <= 28 * 864e5 && w.score && Number.isFinite(w.score.score));
  if (!last28Workouts.length) return null;
  const sum = last28Workouts.reduce((a, w) => a + w.score.score, 0);
  return Math.round(sum / last28Workouts.length);
}

export function routineScores(data = {}, now = Date.now()) {
  const workouts = data.workouts || [];
  const routines = data.routines || [];
  const groups = new Map();

  for (const w of workouts) {
    const key = w.routineId || w.routineName || 'libre';
    if (!groups.has(key)) {
      groups.set(key, { key, name: w.routineName || 'Entreno libre', workouts: [] });
    }
    groups.get(key).workouts.push(w);
  }

  const result = [];
  for (const group of groups.values()) {
    const list = [...group.workouts].sort((a, b) => (b.date || 0) - (a.date || 0));
    const scores = list.map((w) => Number(w.score && w.score.score)).filter((n) => Number.isFinite(n) && n > 0);
    if (!scores.length) continue;

    const avg = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;
    const recent = scores.slice(0, 3);
    const previous = scores.slice(3, 6);
    const routine = routines.find((r) => r.id === group.key);
    const dayTarget = routine && Array.isArray(routine.days) ? routine.days.length : 0;
    const last28 = list.filter((w) => (w.date || 0) > 0 && now - w.date <= 28 * 864e5).length;
    const consistency = dayTarget ? Math.min(100, Math.round((last28 / (4 * dayTarget)) * 100)) : null;

    result.push({
      routineId: group.key,
      name: routine ? routine.name : group.name,
      sessions: scores.length,
      avgScore: Math.round(avg(scores)),
      lastScore: scores[0],
      bestScore: Math.max(...scores),
      trend: previous.length ? Math.round(avg(recent) - avg(previous)) : null,
      consistency,
      lastDate: list[0].date || 0,
    });
  }

  return result.sort((a, b) => b.avgScore - a.avgScore || b.sessions - a.sessions);
}

export function weekSummary(data = {}) {
  const ws = data.workouts || [];
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  const startMs = start.getTime();
  const recent = ws.filter((w) => (w.date || 0) >= startMs);
  const target = Number(data.profile && data.profile.daysPerWeek) || frequencyAdvice(data.profile || {}).days;
  let up = 0;
  let stall = 0;
  const last = [...ws].sort((a, b) => (b.date || 0) - (a.date || 0))[0];
  if (last) {
    const routineEx = (data.routines || []).flatMap((r) => r.exercises || []);
    const exs = (last.exercises || []).map((e) => {
      const r = routineEx.find((x) => x.id === e.exId);
      return r
        ? { ...r, reps: e.targetReps ?? e.target ?? r.reps }
        : { id: e.exId, name: e.name, reps: e.targetReps ?? e.target ?? 8, group: '', type: 'compuesto' };
    });
    const recs = exs.map((ex) => recommendFor(data, ex));
    up = recs.filter((r) => r.action === 'up').length;
    stall = recs.filter((r) => r.action === 'stall').length;
  }
  return {
    sessions: recent.length,
    target,
    ok: recent.length >= target,
    prs: recent.reduce((a, w) => a + ((w.prs || []).length), 0),
    up,
    stall,
  };
}

export function coachMessage(data = {}) {
  try {
    const facts = calculateFacts(data);
    const tone = data.profile?.tone || 'tranquilo';
    const recent = data.coachMemory || [];
    const ctx = facts.daysSinceLast >= 3 ? 'regreso_ausencia' : 'inicio';
    const res = getCoachMessage(ctx, facts, tone, recent);
    const mood = facts.daysSinceLast >= 3 ? 'alert' : (facts.improvedExercises?.length ? 'happy' : 'neutral');
    return {
      mood,
      text: res.texto,
      rule: null,
      rules: [],
      id: res.id,
    };
  } catch (e) {
    const ws = [...(data.workouts || [])].sort((a, b) => (b.date || 0) - (a.date || 0));
    const unit = data.unit || 'kg';
    if (!ws.length) {
      return {
        mood: 'happy',
        text: 'Hola, soy Atlas. Completaste tu perfil: registra tu primer entrenamiento y empiezo a seguir tu progreso.',
        rule: null,
        rules: [],
      };
    }
    const days = Math.floor((Date.now() - (ws[0].date || 0)) / 864e5);
    if (days >= 7) {
      return {
        mood: 'neutral',
        text: `Hace ${days} días que no entrenas. Retomemos con calma: una sesión ligera es suficiente.`,
        rule: RULES.frequency,
        rules: [RULES.frequency],
      };
    }

    const pr = (ws[0].prs || [])[0];
    if (pr && Date.now() - (ws[0].date || 0) < 3 * 864e5) {
      const mark = pr.weightKg > 0 ? `${toDisplay(pr.weightKg, unit)} ${unit} × ${pr.reps}` : `${pr.reps} reps`;
      return {
        mood: 'happy',
        text: `¡Nuevo récord en ${pr.name}: ${mark}! Ya quedó guardado.`,
        rule: RULES.pr,
        rules: [RULES.pr],
      };
    }

    const routineEx = (data.routines || []).flatMap((r) => r.exercises || []);
    const exs = (ws[0].exercises || []).map((e) => {
      const r = routineEx.find((x) => x.id === e.exId);
      return r
        ? { ...r, reps: e.targetReps ?? e.target ?? r.reps }
        : { id: e.exId, name: e.name, reps: e.targetReps ?? e.target ?? 8, group: '', type: 'compuesto' };
    });
    const recs = exs.map((ex) => recommendFor(data, ex));
    const stall = recs.find((r) => r.action === 'stall');
    if (stall) return { mood: 'alert', text: stall.text, rule: stall.primaryRule, rules: uniqRules(stall.rules) };
    const up = recs.find((r) => r.action === 'up');
    if (up) return { mood: 'happy', text: up.text, rule: up.primaryRule, rules: uniqRules(up.rules) };
    const insight = recs.find((r) => r.restInsight);
    if (insight) {
      return {
        mood: 'neutral',
        text: insight.restInsight.text,
        rule: RULES.restFeedback,
        rules: uniqRules([RULES.restFeedback, ...insight.rules]),
      };
    }
    const week = weekSummary(data);
    if (!week.ok) {
      return {
        mood: 'neutral',
        text: `Esta semana llevas ${week.sessions} de ${week.target} entrenos. La constancia manda.`,
        rule: RULES.frequency,
        rules: [RULES.frequency],
      };
    }
    const keep = recs.find((r) => r.action === 'maintain');
    if (keep) return { mood: 'neutral', text: keep.text, rule: keep.primaryRule, rules: uniqRules(keep.rules) };
    return { mood: 'happy', text: 'Buen trabajo. Sigue así.', rule: null, rules: [] };
  }
}

export function streakInfo(data = {}, hoyMs = Date.now()) {
  const workouts = data.workouts || [];
  const routines = data.routines || [];
  const assignedDays = new Set();
  routines.forEach((r) => {
    (r.days || []).forEach((d) => {
      if (typeof d === 'number' && d >= 0 && d <= 6) assignedDays.add(d);
    });
  });

  const hasAssigned = assignedDays.size > 0;
  const todayDate = new Date(hoyMs);
  todayDate.setHours(0, 0, 0, 0);
  const todayStartMs = todayDate.getTime();

  const workoutDays = new Set();
  const adjustedDays = new Set();
  workouts.forEach((w) => {
    if (!w.date) return;
    const d = new Date(w.date);
    d.setHours(0, 0, 0, 0);
    workoutDays.add(d.getTime());
    if (w.adjusted) adjustedDays.add(d.getTime());
  });

  const dayOfWeek = (todayDate.getDay() + 6) % 7;
  const mondayMs = todayStartMs - dayOfWeek * 86400000;
  const weekDays = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
  const week = [];

  for (let i = 0; i < 7; i++) {
    const dMs = mondayMs + i * 86400000;
    const isToday = dMs === todayStartMs;
    const hasWorkout = workoutDays.has(dMs) || adjustedDays.has(dMs);
    const isAssigned = assignedDays.has(i);

    let state = 'rest';
    if (hasWorkout) {
      state = 'trained';
    } else if (isToday) {
      state = 'today';
    } else {
      state = 'rest';
    }
    week.push({ day: weekDays[i], state, dateMs: dMs, isToday, hasWorkout });
  }

  let current = 0;
  let best = 0;
  const combinedWDays = new Set([...workoutDays, ...adjustedDays]);
  const sortedWDays = Array.from(combinedWDays).sort((a, b) => a - b);

  if (hasAssigned) {
    if (sortedWDays.length > 0) {
      let active = 0;
      let maxA = 0;
      const startMs = sortedWDays[0];
      for (let m = startMs; m <= todayStartMs; m += 86400000) {
        const dObj = new Date(m);
        const dayIdx = (dObj.getDay() + 6) % 7;
        const isSched = assignedDays.has(dayIdx);
        const hasW = combinedWDays.has(m);

        if (isSched) {
          if (hasW) {
            active++;
            if (active > maxA) maxA = active;
          } else {
            if (m !== todayStartMs) {
              active = 0;
            }
          }
        }
      }
      current = active;
      best = maxA;
    }
  } else {
    if (sortedWDays.length > 0) {
      let cur = 1;
      let maxS = 1;
      for (let i = 1; i < sortedWDays.length; i++) {
        const diffDays = Math.round((sortedWDays[i] - sortedWDays[i - 1]) / 86400000);
        if (diffDays <= 2) {
          cur++;
        } else {
          cur = 1;
        }
        if (cur > maxS) maxS = cur;
      }
      const lastW = sortedWDays[sortedWDays.length - 1];
      const daysSinceLast = Math.round((todayStartMs - lastW) / 86400000);
      if (daysSinceLast > 2 && todayStartMs !== lastW) {
        current = 0;
      } else {
        current = cur;
      }
      best = Math.max(maxS, current);
    }
  }

  return { current: Math.max(0, current), best: Math.max(best, current), week };
}

export function periodRange(opcion = '30 días', hoyMs = Date.now(), desde = null, hasta = null) {
  const end = hoyMs;
  let start = end;
  let prevStart = null;
  let prevEnd = null;

  if (opcion === '7 días' || opcion === '7d' || opcion === 7) {
    const dur = 7 * 86400000;
    start = end - dur;
    prevStart = start - dur;
    prevEnd = start;
  } else if (opcion === '30 días' || opcion === '30d' || opcion === 30) {
    const dur = 30 * 86400000;
    start = end - dur;
    prevStart = start - dur;
    prevEnd = start;
  } else if (opcion === '90 días' || opcion === '90d' || opcion === 90) {
    const dur = 90 * 86400000;
    start = end - dur;
    prevStart = start - dur;
    prevEnd = start;
  } else if (opcion === 'Todo' || opcion === 'all') {
    start = 0;
    prevStart = null;
    prevEnd = null;
  } else if (opcion === 'Personalizado' || opcion === 'custom') {
    start = desde ? new Date(desde).getTime() : end - 30 * 86400000;
    const endMs = hasta ? new Date(hasta).getTime() : end;
    const dur = Math.max(86400000, endMs - start);
    prevStart = start - dur;
    prevEnd = start;
  } else {
    const dur = 30 * 86400000;
    start = end - dur;
    prevStart = start - dur;
    prevEnd = start;
  }

  return { start, end, prevStart, prevEnd, label: opcion };
}

export function periodStats(data = {}, rango = {}, exId = null) {
  const workouts = data.workouts || [];
  const routines = data.routines || [];

  const filterWorkouts = (sMs, eMs) => {
    if (sMs === 0) return workouts;
    return workouts.filter((w) => {
      const d = w.date || 0;
      return d >= sMs && d <= eMs;
    });
  };

  const ws = filterWorkouts(rango.start, rango.end);
  const prevWs = rango.prevStart !== null ? filterWorkouts(rango.prevStart, rango.prevEnd) : [];

  const sessionsCount = ws.length;
  const prevSessionsCount = prevWs.length;

  const recordsCount = ws.reduce((a, w) => a + (w.prs || []).length, 0);
  const prevRecordsCount = prevWs.reduce((a, w) => a + (w.prs || []).length, 0);

  const timeSec = ws.reduce((a, w) => a + (Number(w.durationSec) || 0), 0);
  const prevTimeSec = prevWs.reduce((a, w) => a + (Number(w.durationSec) || 0), 0);

  const assignedDaysCount = routines.reduce((acc, r) => acc + (r.days || []).length, 0);
  let consistency = '—';
  let prevConsistency = '—';

  if (assignedDaysCount > 0 && rango.start > 0) {
    const totalDays = Math.max(1, Math.round((rango.end - rango.start) / 86400000));
    const weeks = totalDays / 7;
    const expected = Math.round(weeks * assignedDaysCount);
    consistency = expected > 0 ? `${Math.min(100, Math.round((sessionsCount / expected) * 100))}%` : '—';
    if (rango.prevStart !== null) {
      prevConsistency = expected > 0 ? `${Math.min(100, Math.round((prevSessionsCount / expected) * 100))}%` : '—';
    }
  }

  const avgScore = sessionsCount ? Math.round(ws.reduce((a, w) => a + (w.score?.score || 0), 0) / sessionsCount) : 0;
  const prevAvgScore = prevSessionsCount ? Math.round(prevWs.reduce((a, w) => a + (w.score?.score || 0), 0) / prevSessionsCount) : 0;
  const diffScore = avgScore - prevAvgScore;

  return {
    sessions: sessionsCount,
    prevSessions: prevSessionsCount,
    sessionsDiff: sessionsCount - prevSessionsCount,
    records: recordsCount,
    prevRecords: prevRecordsCount,
    recordsDiff: recordsCount - prevRecordsCount,
    timeSec,
    prevTimeSec,
    consistency,
    prevConsistency,
    avgScore,
    prevAvgScore,
    diffScore,
  };
}

export function progressSeries(data = {}, rango = {}, metrica = 'Puntaje', exId = null) {
  const workouts = [...(data.workouts || [])].sort((a, b) => (a.date || 0) - (b.date || 0));
  const filtered = workouts.filter((w) => {
    const d = w.date || 0;
    if (rango.start > 0 && (d < rango.start || d > rango.end)) return false;
    if (exId) {
      return (w.exercises || []).some((e) => e.exId === exId);
    }
    return true;
  });

  return filtered.map((w) => {
    const d = w.date || Date.now();
    let val = 0;
    if (metrica === 'Puntaje' || metrica === 'score') {
      val = w.score?.score || 0;
    } else {
      const exercises = exId ? (w.exercises || []).filter((e) => e.exId === exId) : (w.exercises || []);
      const validSets = exercises.flatMap((e) => (e.sets || []).filter((s) => !s.unconfirmed && Number(s.r) > 0));

      if (metrica === 'Peso' || metrica === 'weight') {
        val = validSets.length ? Math.max(...validSets.map((s) => Number(s.w) || 0)) : 0;
      } else if (metrica === 'Volumen' || metrica === 'volume') {
        val = validSets.reduce((acc, s) => acc + (Number(s.w) || 0) * (Number(s.r) || 0), 0);
      } else if (metrica === 'e1RM' || metrica === 'e1rm') {
        const e1rms = validSets.map((s) => {
          const w = Number(s.w) || 0;
          const r = Number(s.r) || 0;
          if (w <= 0 || r <= 0) return 0;
          return w * (1 + r / 30);
        });
        val = e1rms.length ? Math.max(...e1rms) : 0;
      }
    }
    return { date: d, value: Math.round(val * 10) / 10 };
  });
}

export function muscleShare(data = {}, rango = {}) {
  const workouts = data.workouts || [];
  const filtered = workouts.filter((w) => {
    const d = w.date || 0;
    if (rango.start > 0 && (d < rango.start || d > rango.end)) return false;
    return true;
  });

  const groupCounts = {};
  let totalSets = 0;

  filtered.forEach((w) => {
    (w.exercises || []).forEach((e) => {
      const db = exerciseById(e.exId);
      const group = e.group || (db && db.group) || 'Otros';
      const sets = (e.sets || []).filter((s) => !s.unconfirmed && Number(s.r) > 0).length;
      if (sets > 0) {
        groupCounts[group] = (groupCounts[group] || 0) + sets;
        totalSets += sets;
      }
    });
  });

  const list = Object.entries(groupCounts).map(([group, count]) => ({
    group,
    count,
    pct: totalSets > 0 ? Math.round((count / totalSets) * 100) : 0,
  })).sort((a, b) => b.count - a.count);

  return list.slice(0, 3);
}

export function sessionProgress(data = {}, workout = {}) {
  const workouts = [...(data.workouts || [])].sort((a, b) => (b.date || 0) - (a.date || 0));
  const idx = workouts.findIndex((w) => w.id === workout.id);
  let prev = null;
  if (idx !== -1 && idx < workouts.length - 1) {
    prev = workouts.slice(idx + 1).find((w) => w.routineId === workout.routineId) || workouts[idx + 1];
  }
  if (!prev || !prev.score || !workout.score) return null;
  return workout.score.score - prev.score.score;
}

export function nextRoutineDay(data = {}, hoy = Date.now()) {
  const routines = data.routines || [];
  if (!routines.length) return null;
  const now = new Date(hoy);
  now.setHours(0, 0, 0, 0);
  const todayDayIdx = (now.getDay() + 6) % 7; // 0 = Lunes

  for (let i = 1; i <= 7; i++) {
    const targetDayIdx = (todayDayIdx + i) % 7;
    const targetDate = new Date(now.getTime() + i * 86400000);
    const matchingRoutine = routines.find((r) => Array.isArray(r.days) && r.days.includes(targetDayIdx));
    if (matchingRoutine) {
      return { routine: matchingRoutine, date: targetDate, daysAway: i };
    }
  }
  return null;
}

export function routineEstimate(data = {}, routine = {}) {
  const exercisesCount = (routine.exercises || []).length;
  const workouts = (data.workouts || []).filter((w) => w.routineId === routine.id && Number(w.durationSec) > 0);
  workouts.sort((a, b) => (b.date || 0) - (a.date || 0));
  const recent = workouts.slice(0, 3);
  if (!recent.length) {
    return { exercises: exercisesCount, minutes: null };
  }
  const avgSec = recent.reduce((acc, w) => acc + Number(w.durationSec), 0) / recent.length;
  const minutes = Math.max(1, Math.round(avgSec / 60));
  return { exercises: exercisesCount, minutes };
}

export function nextWeightHint(data = {}, routine = {}) {
  const exercises = routine.exercises || [];
  if (!exercises.length) return 'Atlas ya preparó tus pesos para la sesión.';
  const firstEx = exercises[0];
  const rec = recommendFor(data, firstEx);
  const unit = data.unit || 'kg';
  const name = firstEx.name || 'ejercicio';

  if (rec.action === 'up' && rec.weightKg > 0) {
    const weightStr = `${toDisplay(rec.weightKg, unit)} ${unit}`;
    return `Atlas ya preparó tus pesos. En ${name} te toca subir a ${weightStr}.`;
  } else if (rec.action === 'maintain' && rec.weightKg > 0) {
    const weightStr = `${toDisplay(rec.weightKg, unit)} ${unit}`;
    return `Atlas ya preparó tus pesos. En ${name} mantén ${weightStr}.`;
  } else if (rec.action === 'stall' && rec.weightKg > 0) {
    const weightStr = `${toDisplay(rec.weightKg, unit)} ${unit}`;
    return `Atlas ya preparó tus pesos. En ${name} mantén ${weightStr}.`;
  } else {
    return `Atlas ya preparó tus pesos. En ${name} elige un peso con el que completes el rango dejando 2-3 reps en reserva.`;
  }
}

export function nearRecord(data = {}, hoy = Date.now()) {
  const prs = personalRecords(data);
  const workouts = data.workouts || [];
  const fourteenDaysAgo = hoy - 14 * 86400000;

  let bestCandidate = null;

  Object.entries(prs).forEach(([exId, pr]) => {
    const prKg = Number(pr.weightKg) || 0;
    if (!(prKg > 0)) return;

    let recentMaxKg = 0;
    workouts.forEach((w) => {
      if ((w.date || 0) < fourteenDaysAgo || (w.date || 0) > hoy) return;
      (w.exercises || []).forEach((e) => {
        if (e.exId !== exId) return;
        (e.sets || []).forEach((s) => {
          if (s.unconfirmed) return;
          const kg = Number(s.w) || 0;
          const r = Number(s.r) || 0;
          if (r > 0 && kg > recentMaxKg) {
            recentMaxKg = kg;
          }
        });
      });
    });

    if (recentMaxKg > 0 && recentMaxKg < prKg) {
      const ratio = recentMaxKg / prKg;
      if (ratio >= 0.90 && ratio < 1.0) {
        const gapKg = prKg - recentMaxKg;
        if (!bestCandidate || ratio > bestCandidate.ratio) {
          bestCandidate = {
            exId,
            name: pr.name,
            prKg,
            prReps: pr.reps,
            recentKg: recentMaxKg,
            gapKg,
            ratio,
          };
        }
      }
    }
  });

  return bestCandidate;
}

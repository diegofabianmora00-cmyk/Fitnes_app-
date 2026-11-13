// Motor puro de monitoreo de sesión en tiempo real (sin React ni UI).
// Evalúa el estado de la sesión frente al plan, perfil e historial y devuelve una única alerta prioritaria.
// Cada alerta incluye reasonCode y una frase corta "why" (por qué).
// Si la alerta cambia peso o repeticiones, incluye action.next con la sugerencia concreta.

import { repRangeFor, e1rmKg } from './autoreg';
import { analyzeRir } from './rir';
import { FATIGUE, PAUSE, REST, APP_HEURISTIC } from './config';

const KG_PER_LB = 2.20462;
const round2 = (v) => Math.round((Number(v) || 0) * 100) / 100;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

const unitOf = (state = {}) => state.unit || 'kg';
const toDisplay = (kg, unit) => (unit === 'lb' ? (Number(kg) || 0) * KG_PER_LB : Number(kg) || 0);
const fmtLoad = (kg, unit) => `${Math.round(toDisplay(kg, unit) * 10) / 10} ${unit}`;

// Carga objetivo desde rendimiento real usando e1RM con RIR efectivo (criterio de la app).
function loadForTarget(set, targetReps, targetRir, profile) {
  const w = Number(set.w) || 0;
  const reps = Number(set.r) || 0;
  if (!(reps > 0) || !(targetReps > 0)) return 0;
  if (w <= 0) return 0; // peso corporal: se maneja aparte
  const rirInfo = analyzeRir({ set, targetReps, profile });
  // Si la serie queda 2+ reps por debajo del objetivo, el RIR reportado no es fiable:
  // se ignora y se calcula la carga solo con las repeticiones hechas.
  const rir = reps <= targetReps - 2 ? 0 : rirInfo.effectiveRir;
  if (reps + rir > 15) return 0;
  const e = w * (1 + (reps + rir) / 30);
  return round2(e / (1 + (targetReps + targetRir) / 30));
}

// Subida de carga cuando sobran repeticiones (criterio de la app, robusto en series largas).
function loadIncrease(set, targetReps) {
  const w = Number(set.w) || 0;
  const reps = Number(set.r) || 0;
  const extra = reps - targetReps;
  if (!(w > 0) || extra <= 0) return 0;
  const pct = clamp(extra * FATIGUE.loadUpPctPerRep, FATIGUE.loadUpMinPct, FATIGUE.loadUpMaxPct);
  return round2(w * (1 + pct));
}

function isBodyweightExercise(currentEx = {}, planItem = {}, loadType) {
  const lt = loadType || currentEx.loadType || planItem.loadType || '';
  if (lt === 'bodyweight') return true;
  if (lt === 'barbell' || lt === 'dumbbell' || lt === 'stack' || lt === 'plates') return false;
  const recW = Number((currentEx.recWeightKg ?? planItem.recWeightKg) || 0);
  const sets = currentEx.sets || [];
  const liftedWeight = sets.some((s) => s && Number(s.w) > 0);
  return recW === 0 && !liftedWeight;
}

export function evaluateSession(sessionState = {}, plan = [], profile = {}, history = []) {
  const {
    currentExerciseIndex = 0,
    currentSetIndex = 0,
    exercisesPerformed = [],
    adjusted = null,
    pain = false,
    daysSinceLastSession = 0,
    availableTimeMin = null,
    alertHistory = [],
    setsSinceLastAlert = 99,
    unit = 'kg',
  } = sessionState;

  const u = unitOf({ unit });
  const prof = profile || {};
  const range = repRangeFor(prof);
  const defaultReps = (() => {
    const goal = prof.goal;
    const level = prof.level;
    if (goal === 'fuerza') return level === 'principiante' ? 8 : 5;
    if (goal === 'resistencia') return 15;
    return level === 'principiante' ? 10 : 8;
  })();

  if (pain || (adjusted && adjusted.reason === 'dolor')) {
    return {
      code: 'pain_stop',
      reasonCode: 'pain_stop',
      severity: 'high',
      message: 'Dolor detectado: detengamos el ejercicio.',
      why: 'El dolor no se entrena; cuida la zona y para el ejercicio.',
      action: {
        label: 'Proteger sesión',
        next: null,
        apply: (state) => ({ ...state, painStop: true }),
      },
    };
  }

  const planItem = plan[currentExerciseIndex] || {};
  const currentEx = exercisesPerformed[currentExerciseIndex] || {};
  const sets = currentEx.sets || [];
  const validSets = sets.filter((s) => s && !s.unconfirmed && Number(s.r) > 0);
  const targetReps = Number(currentEx.targetReps || currentEx.reps || planItem.reps) || defaultReps;
  const lastSet = validSets[validSets.length - 1] || null;
  const prevSet = validSets.length >= 2 ? validSets[validSets.length - 2] : null;
  const lastW = lastSet ? Number(lastSet.w) || 0 : 0;
  const targetRir = 2;
  const bodyweight = isBodyweightExercise(currentEx, planItem, planItem.loadType || currentEx.loadType);

  // Enfriamiento entre alertas distintas (histéresis temporal: al menos 2 series)
  const canAlert = setsSinceLastAlert >= 2;

  // 2. Carga demasiado pesada o dificultad alta (usa RIR efectivo cruzado con reps)
  if (lastSet && !alertHistory.includes('load_too_heavy') && canAlert) {
    const repsDone = Number(lastSet.r) || 0;
    const rirInfo = analyzeRir({ set: lastSet, prevSet, targetReps, profile: prof });
    const failed = rirInfo.effectiveRir === 0 || !!lastSet.failure || Number(lastSet.rir) === 0;
    const short = repsDone <= targetReps - 2;
    if (failed || short) {
      if (bodyweight) {
        const easierReps = Math.max(1, Math.min(targetReps, repsDone || targetReps) - 1);
        return {
          code: 'load_too_heavy',
          reasonCode: 'bw_too_hard',
          severity: 'high',
          message: 'Está muy difícil: hagamos menos repeticiones o una variante más fácil.',
          why: 'Sin peso externo, bajar las reps o usar una variante más fácil te ayuda a completar la serie.',
          confidence: rirInfo.confidence,
          action: {
            label: `${easierReps} reps (más fácil)`,
            next: { weightKg: lastW, reps: easierReps, rir: targetRir, variant: 'easier' },
          },
        };
      }
      const byModel = loadForTarget(lastSet, targetReps, targetRir, prof);
      const maxAllowed = round2(lastW * (1 - FATIGUE.loadDownMinPct));
      let weightKg = byModel > 0 ? Math.min(byModel, maxAllowed) : maxAllowed;
      weightKg = Math.max(round2(lastW * (1 - FATIGUE.loadDownMaxPct)), weightKg);
      return {
        code: 'load_too_heavy',
        reasonCode: 'load_too_heavy',
        severity: 'high',
        message: 'Ese peso es demasiado: bajemos y busquemos las repeticiones.',
        why: rirInfo.why,
        confidence: rirInfo.confidence,
        action: {
          label: `${fmtLoad(weightKg, u)} · ${targetReps} reps`,
          next: { weightKg, reps: targetReps, rir: targetRir },
        },
      };
    }
  }

  // 3. Retorno tras pausa
  if (daysSinceLastSession >= PAUSE.days && !alertHistory.includes('return_pause') && canAlert) {
    const base = Number(planItem.recWeightKg || lastW || 0);
    if (!bodyweight && base > 0) {
      const weightKg = round2(base * (1 - PAUSE.loadReduction));
      return {
        code: 'return_pause',
        reasonCode: 'return_after_pause',
        severity: 'medium',
        message: 'Vuelves tras una pausa: bajamos un poco la carga.',
        why: 'Tras varios días sin entrenar, empezar más suave cuida tu recuperación.',
        action: {
          label: `${fmtLoad(weightKg, u)} · ${targetReps} reps`,
          next: { weightKg, reps: targetReps, rir: targetRir },
        },
      };
    }
    return {
      code: 'return_pause',
      reasonCode: 'return_after_pause_bw',
      severity: 'medium',
      message: 'Vuelves tras una pausa: empieza suave y cuida la técnica.',
      why: 'Tras varios días sin entrenar, empezar con menos repeticiones ayuda a retomar.',
      action: { label: 'Empezar suave', next: bodyweight ? { weightKg: lastW, reps: Math.max(1, targetReps - 2), rir: targetRir } : null },
    };
  }

  // 4. Poco tiempo disponible
  if ((adjusted && adjusted.reason === 'poco tiempo') || (availableTimeMin && availableTimeMin < 30)) {
    if (!alertHistory.includes('low_time') && canAlert) {
      return {
        code: 'low_time',
        reasonCode: 'low_time',
        severity: 'medium',
        message: 'Poco tiempo: prioriza los ejercicios principales.',
        why: 'Con menos tiempo, los ejercicios principales dan más resultado.',
        action: {
          label: 'Comprimir sesión',
          next: null,
          apply: (state) => ({ ...state, trimAccessories: true }),
        },
      };
    }
  }

  // 5. Carga/esfuerzo demasiado ligero (histéresis: confirmar con 2 series cuando hay datos)
  if (lastSet && !alertHistory.includes('load_too_light') && canAlert) {
    const repsDone = Number(lastSet.r) || 0;
    const overTarget = repsDone - targetReps;
    const rirInfos = validSets.slice(-3).map((s, i, arr) => analyzeRir({ set: s, prevSet: i > 0 ? arr[i - 1] : null, targetReps, profile: prof }));
    const highRirCount = rirInfos.filter((x) => x.effectiveRir >= 3).length;
    const allHighRir = validSets.length >= 2 && highRirCount >= 2; // histéresis: 2 de últimas
    const tooMany = overTarget >= FATIGUE.lightExtraReps || repsDone > (range.max || Infinity);
    if (tooMany || allHighRir) {
      if (bodyweight) {
        const harderReps = Math.max(targetReps + 1, repsDone + 1);
        return {
          code: 'load_too_light',
          reasonCode: 'bw_too_easy',
          severity: 'low',
          message: 'Te sobran repeticiones: sube las reps o prueba una variante más difícil.',
          why: 'Sin peso externo, progresar con más repeticiones o una variante más difícil mantiene el reto.',
          confidence: rirInfos[rirInfos.length - 1]?.confidence || 'media',
          action: {
            label: `${harderReps} reps (más reto)`,
            next: { weightKg: lastW, reps: harderReps, rir: targetRir, variant: 'harder' },
          },
        };
      }
      const byModel = loadForTarget(lastSet, targetReps, targetRir, prof);
      const byHeuristic = loadIncrease(lastSet, targetReps);
      let up = byModel > lastW ? byModel : byHeuristic;
      if (!(up > lastW)) up = round2(lastW * 1.05);
      return {
        code: 'load_too_light',
        reasonCode: 'load_too_light',
        severity: 'low',
        message: 'Te sobraron repeticiones: subamos un poco el peso.',
        why: 'Superaste el objetivo con margen; un poco más de carga mantiene el estímulo.',
        confidence: rirInfos[rirInfos.length - 1]?.confidence || 'media',
        action: {
          label: `${fmtLoad(up, u)} · ${targetReps} reps`,
          next: { weightKg: up, reps: targetReps, rir: targetRir },
        },
      };
    }
  }

  // 6. Caída abrupta de repeticiones entre series (tendencia 2-3 series)
  if (validSets.length >= 2 && !alertHistory.includes('heavy_drop') && canAlert) {
    const recent = validSets.slice(-3).map((s) => Number(s.r) || 0);
    const firstRep = recent[0] || 0;
    const lastRep = recent[recent.length - 1] || 0;
    const drops = recent.slice(1).map((r, i) => (recent[i] > 0 ? (recent[i] - r) / recent[i] : 0));
    const trendDrop = firstRep > 0 ? (firstRep - lastRep) / firstRep : 0;
    const consistentDrop = drops.filter((d) => d >= FATIGUE.repDropRatio * 0.6).length >= Math.min(2, drops.length);
    if (firstRep > 0 && trendDrop >= FATIGUE.repDropRatio && (drops.length === 1 || consistentDrop)) {
      if (bodyweight) {
        const easierReps = Math.max(1, lastRep - 1);
        return {
          code: 'heavy_drop',
          reasonCode: 'fatigue_drop_bw',
          severity: 'high',
          message: 'Cansancio alto: baja las repeticiones y descansa un poco más.',
          why: 'Las repeticiones bajaron mucho entre series; conviene aflojar para mantener la técnica.',
          action: {
            label: `${easierReps} reps`,
            next: { weightKg: lastW, reps: easierReps, rir: targetRir },
          },
        };
      }
      const weightKg = round2(lastW * 0.925);
      return {
        code: 'heavy_drop',
        reasonCode: 'fatigue_rep_drop',
        severity: 'high',
        message: 'Cansancio alto: bajemos un poco el peso.',
        why: 'Las repeticiones bajaron mucho entre series; bajar un poco ayuda a mantener la técnica.',
        action: {
          label: lastW > 0 ? `${fmtLoad(weightKg, u)}` : 'Bajar carga',
          next: lastW > 0 ? { weightKg, reps: targetReps, rir: targetRir } : null,
        },
      };
    }
  }

  // 7. Descansos cortos con caída de rendimiento (tendencia en últimas series)
  if (validSets.length >= 2 && !alertHistory.includes('rest_adjust') && canAlert) {
    const recent = validSets.slice(-3);
    const shortRests = recent.filter((s) => {
      const rest = Number(s.restBeforeSec);
      const target = Number(s.guide && s.guide.restSec) || 0;
      if (!(rest > 0)) return false;
      if (target > 0) return rest / target < REST.shortRatio; // histéresis relativa
      return rest < 45;
    });
    const lowRepsCount = recent.filter((s) => Number(s.r) < targetReps - 2).length;
    if (shortRests.length >= 2 && lowRepsCount >= 1) {
      return {
        code: 'rest_adjust',
        reasonCode: 'rest_too_short',
        severity: 'medium',
        message: 'Descansos muy cortos: suma 30 segundos.',
        why: 'Con poco descanso rinde menos la siguiente serie.',
        action: {
          label: 'Aumentar descanso',
          next: null,
          apply: (state) => ({ ...state, addRestSec: REST.addSecShort }),
        },
      };
    }
  }

  return null;
}

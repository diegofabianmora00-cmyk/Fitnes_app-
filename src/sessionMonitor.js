// Motor puro de monitoreo de sesión en tiempo real (sin React ni UI).
// Evalúa el estado de la sesión frente al plan, perfil e historial y devuelve una única alerta prioritaria.
// Cuando la alerta cambia peso o repeticiones, incluye `action.next` con la sugerencia concreta
// para que la UI la aplique con un toque.
//
// Respaldo de las reglas (ver RULES/SOURCES en recommend.js):
// - Reducción de carga tras un fallo o serie muy por debajo del objetivo: ACSM 2009 recomienda
//   bajar 5-10%. Cuando la serie queda muy corta (2+ reps por debajo), el RIR reportado es poco
//   fiable (Zourdos 2016; Ormsbee 2019), así que damos más peso a las reps hechas: estimamos el
//   e1RM con un RIR efectivo conservador y recalculamos la carga para el rango objetivo (Epley).
//   Eso produce bajadas mayores (15-25%) cuando el peso fue claramente excesivo.
// - Subida de carga cuando sobran repeticiones: si superas el tope del rango o haces muchas reps
//   de más, el peso fue ligero y conviene subir. Con series largas (>12 reps) el modelo de e1RM
//   deja de ser fiable, así que usamos un criterio de la app (% por repetición extra).

import { repRangeFor } from './autoreg';

const KG_PER_LB = 2.20462;
const round2 = (v) => Math.round((Number(v) || 0) * 100) / 100;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

const unitOf = (state = {}) => state.unit || 'kg';
const toDisplay = (kg, unit) => (unit === 'lb' ? (Number(kg) || 0) * KG_PER_LB : Number(kg) || 0);
const fmtLoad = (kg, unit) => `${Math.round(toDisplay(kg, unit) * 10) / 10} ${unit}`;

// RIR efectivo: si la serie se quedó muy corta, no nos creemos un RIR alto.
function effectiveRir(set, targetReps) {
  const raw = set.rir;
  const reported = raw !== null && raw !== undefined && Number.isFinite(Number(raw)) ? clamp(Number(raw), 0, 5) : 2;
  const reps = Number(set.r) || 0;
  if (targetReps > 0 && reps > 0) {
    const shortfall = targetReps - reps;
    if (shortfall >= 2) return Math.min(reported, 0);
    if (shortfall === 1) return Math.min(reported, 1);
  }
  return reported;
}

// Carga que permite alcanzar targetReps con targetRir, a partir del rendimiento de la serie.
function loadForTarget(set, targetReps, targetRir) {
  const w = Number(set.w) || 0;
  const reps = Number(set.r) || 0;
  const rir = effectiveRir(set, targetReps);
  if (!(w > 0) || !(reps > 0) || !(targetReps > 0)) return 0;
  if (reps + rir > 15) return 0; // fuera del rango fiable del modelo
  const e1rm = w * (1 + (reps + rir) / 30);
  return round2(e1rm / (1 + (targetReps + targetRir) / 30));
}

// Subida de carga cuando sobran repeticiones (criterio de la app para series largas).
function loadIncrease(set, targetReps) {
  const w = Number(set.w) || 0;
  const reps = Number(set.r) || 0;
  const extra = reps - targetReps;
  if (!(w > 0) || extra <= 0) return 0;
  const pct = clamp(extra * 0.03, 0.05, 0.25); // 3% por rep extra, entre 5% y 25%
  return round2(w * (1 + pct));
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
    alertHistory = [], // códigos de alertas ya mostradas en esta sesión
    setsSinceLastAlert = 99, // series completadas desde la última alerta
    unit = 'kg',
  } = sessionState;

  const u = unitOf({ unit });
  const range = repRangeFor(profile || {});
  const defaultReps = (() => {
    const goal = profile && profile.goal;
    const level = profile && profile.level;
    if (goal === 'fuerza') return level === 'principiante' ? 8 : 5;
    if (goal === 'resistencia') return 15;
    return level === 'principiante' ? 10 : 8;
  })();

  // 1. Prioridad máxima: Dolor
  if (pain || (adjusted && adjusted.reason === 'dolor')) {
    return {
      code: 'pain_stop',
      severity: 'high',
      message: 'Dolor detectado: detengamos el ejercicio.',
      why: 'El dolor no se entrena; proteger la articulación es lo primero.',
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
  const lastW = lastSet ? Number(lastSet.w) || 0 : 0;
  // RIR objetivo del plan (no el reportado, que es ruidoso tras una serie corta).
  const targetRir = 2;

  // Enfriamiento entre alertas distintas (al menos 2 series)
  const canAlert = setsSinceLastAlert >= 2;

  // 2. Carga demasiado pesada: fallo o muy pocas repeticiones frente al objetivo.
  if (lastSet && !alertHistory.includes('load_too_heavy') && canAlert) {
    const repsDone = Number(lastSet.r) || 0;
    const rirDone = lastSet.rir !== null && lastSet.rir !== undefined ? Number(lastSet.rir) : null;
    const failed = rirDone === 0 || !!lastSet.failure;
    const short = repsDone <= targetReps - 2;
    if (failed || short) {
      const byModel = loadForTarget(lastSet, targetReps, targetRir);
      const maxAllowed = round2(lastW * 0.9); // al menos 10% menos (ACSM)
      let weightKg = byModel > 0 ? Math.min(byModel, maxAllowed) : maxAllowed;
      weightKg = Math.max(round2(lastW * 0.5), weightKg); // suelo prudente
      return {
        code: 'load_too_heavy',
        severity: 'high',
        message: 'Ese peso es demasiado: bajemos y busquemos reps.',
        why: 'Con poco peso completas el rango; el RIR alto tras pocas reps no es fiable.',
        action: {
          label: `${fmtLoad(weightKg, u)} · ${targetReps} reps`,
          next: { weightKg, reps: targetReps, rir: targetRir },
        },
      };
    }
  }

  // 3. Retorno tras 14+ días sin entrenar
  if (daysSinceLastSession >= 14 && !alertHistory.includes('return_pause') && canAlert) {
    const base = Number(planItem.recWeightKg || lastW || 0);
    const weightKg = base > 0 ? round2(base * 0.9) : null;
    return {
      code: 'return_pause',
      severity: 'medium',
      message: 'Vuelves tras una pausa: bajamos un 10%.',
      why: 'Tras dos semanas sin entrenar, una carga reducida cuida tendones y articulaciones.',
      action: {
        label: weightKg ? `${fmtLoad(weightKg, u)} · ${targetReps} reps` : 'Carga reducida',
        next: weightKg ? { weightKg, reps: targetReps, rir: targetRir } : null,
      },
    };
  }

  // 4. Poco tiempo disponible
  if ((adjusted && adjusted.reason === 'poco tiempo') || (availableTimeMin && availableTimeMin < 30)) {
    if (!alertHistory.includes('low_time') && canAlert) {
      return {
        code: 'low_time',
        severity: 'medium',
        message: 'Poco tiempo: prioriza compuestos y acorta accesorios.',
        why: 'Los movimientos principales dan más estímulo por minuto invertido.',
        action: {
          label: 'Comprimir sesión',
          next: null,
          apply: (state) => ({ ...state, trimAccessories: true }),
        },
      };
    }
  }

  // 5. Peso demasiado ligero: sobran muchas repeticiones o el RIR es alto en todas las series.
  if (lastSet && lastW > 0 && !alertHistory.includes('load_too_light') && canAlert) {
    const repsDone = Number(lastSet.r) || 0;
    const overTarget = repsDone - targetReps;
    const allHighRir = validSets.length >= 2 && validSets.every((s) => {
      const r = s.rir !== null && s.rir !== undefined ? Number(s.rir) : null;
      return r === null ? false : r >= 3;
    });
    const tooMany = overTarget >= 3 || repsDone > (range.max || Infinity);
    if (tooMany || allHighRir) {
      const byModel = loadForTarget(lastSet, targetReps, targetRir);
      const byHeuristic = loadIncrease(lastSet, targetReps);
      let up = byModel > lastW ? byModel : byHeuristic;
      if (!(up > lastW)) up = round2(lastW * 1.05);
      return {
        code: 'load_too_light',
        severity: 'low',
        message: 'Te sobraron reps: subamos el peso la próxima serie.',
        why: 'Si superas el rango con margen, más carga mantiene el estímulo.',
        action: {
          label: `${fmtLoad(up, u)} · ${targetReps} reps`,
          next: { weightKg: up, reps: targetReps, rir: targetRir },
        },
      };
    }
  }

  // 6. Caída abrupta de repeticiones entre series (fatiga)
  if (validSets.length >= 2 && !alertHistory.includes('heavy_drop') && canAlert) {
    const firstRep = Number(validSets[0].r) || 0;
    const lastRep = Number(lastSet.r) || 0;
    if (firstRep > 0 && (firstRep - lastRep) / firstRep >= 0.25) {
      const weightKg = round2(lastW * 0.925);
      return {
        code: 'heavy_drop',
        severity: 'high',
        message: 'Fatiga alta: bajemos un poco el peso.',
        why: 'Perdiste más de una cuarta parte de reps entre series; baja y recupera técnica.',
        action: {
          label: lastW > 0 ? `${fmtLoad(weightKg, u)}` : 'Bajar carga',
          next: lastW > 0 ? { weightKg, reps: targetReps, rir: targetRir } : null,
        },
      };
    }
  }

  // 7. Descansos cortos que hunden el rendimiento
  if (validSets.length >= 2 && !alertHistory.includes('rest_adjust') && canAlert) {
    const shortRests = validSets.filter((s) => Number(s.restBeforeSec) > 0 && Number(s.restBeforeSec) < 45);
    const lowReps = Number(lastSet.r) < targetReps - 2;
    if (shortRests.length >= 2 && lowReps) {
      return {
        code: 'rest_adjust',
        severity: 'medium',
        message: 'Descansos muy cortos: suma 30 s.',
        why: 'Con poco descanso rindes menos en la siguiente serie.',
        action: {
          label: 'Aumentar descanso',
          next: null,
          apply: (state) => ({ ...state, addRestSec: 30 }),
        },
      };
    }
  }

  return null;
}

// Análisis puro de RIR ruidoso (sin React). Criterio de la app.
// Cruza el RIR reportado con la caída de repeticiones entre series para estimar un RIR efectivo
// y un nivel de confianza. En principiantes se da más peso a la caída de reps que al RIR reportado.

import { RIR } from './config';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export function isBeginner(profile = {}) {
  return (profile && profile.level) === 'principiante';
}

// Devuelve la caída de reps observada respecto a la serie anterior (o al objetivo si no hay anterior).
export function repDrop(lastSet = {}, prevSet = null, targetReps = 0) {
  const lastR = Number(lastSet && (lastSet.r ?? lastSet.reps)) || 0;
  const prevR = prevSet ? (Number(prevSet.r ?? prevSet.reps) || 0) : (Number(targetReps) || 0);
  if (!(prevR > 0) || !(lastR >= 0)) return 0;
  return Math.max(0, prevR - lastR);
}

// Analiza una serie y devuelve RIR efectivo, confianza y reasonCode.
// inputs: { set, prevSet?, targetReps, profile }
// set: { r/reps, rir, failure }
export function analyzeRir({ set = {}, prevSet = null, targetReps = 0, profile = {} } = {}) {
  const reps = Number(set.r ?? set.reps) || 0;
  const raw = set.rir;
  const reported = raw !== null && raw !== undefined && raw !== '' && Number.isFinite(Number(raw))
    ? clamp(Number(raw), 0, 5)
    : (set.failure ? 0 : 2);
  const target = Number(targetReps) || 0;
  const shortfall = target > 0 ? (target - reps) : 0;
  const drop = repDrop(set, prevSet, target);
  const beginner = isBeginner(profile);
  const repsWeight = beginner ? RIR.beginnerWeightOnReps : RIR.advancedWeightOnReps;
  const rirWeight = 1 - repsWeight;

  // RIR implícito por rendimiento: a más caída/defecto respecto al objetivo, menor margen real.
  let impliedByReps = reported;
  if (target > 0) {
    if (shortfall >= RIR.noiseShortfall2) impliedByReps = 0;
    else if (shortfall === RIR.noiseShortfall1) impliedByReps = Math.min(reported, 1);
    else if (drop >= 2) impliedByReps = Math.min(reported, 1);
    else if (reps >= target && drop <= 0) impliedByReps = Math.max(reported, 1);
  } else if (drop >= 2) {
    impliedByReps = Math.min(reported, 1);
  }

  const discrepancy = Math.abs(reported - impliedByReps);
  // Si no coinciden, prioriza la señal de reps (más en principiantes).
  const effective = discrepancy >= 1
    ? clamp(Math.round(reported * rirWeight + impliedByReps * repsWeight), 0, 5)
    : clamp(Math.round((reported + impliedByReps) / 2), 0, 5);

  // Confianza: alta si reportado y reps coinciden; baja si discrepan o faltan datos.
  let confidence = 'media';
  let reasonCode = 'rir_ok';
  if (raw === null || raw === undefined || raw === '') {
    confidence = 'baja';
    reasonCode = 'rir_missing';
  } else if (discrepancy === 0) {
    confidence = 'alta';
    reasonCode = 'rir_consistent';
  } else if (discrepancy >= 2) {
    confidence = 'baja';
    reasonCode = 'rir_noisy_high_discrepancy';
  } else {
    confidence = 'media';
    reasonCode = 'rir_noisy_adjusted';
  }

  if (shortfall >= RIR.noiseShortfall2) {
    reasonCode = 'rir_reps_shortfall';
    confidence = discrepancy >= 1 ? 'baja' : confidence;
  }

  const why = reasonCode === 'rir_ok' || reasonCode === 'rir_consistent'
    ? 'El esfuerzo reportado coincide con las repeticiones.'
    : reasonCode === 'rir_missing'
      ? 'Sin RIR reportado; uso las repeticiones como guía.'
      : reasonCode === 'rir_reps_shortfall'
        ? 'Hiciste menos repeticiones de las previstas; me guío más por las reps que por el RIR.'
        : 'El RIR y las repeticiones no coinciden; me guío más por las repeticiones.';

  return {
    reportedRir: reported,
    effectiveRir: effective,
    confidence,
    reasonCode,
    why,
    usedRepsSignal: discrepancy >= 1 || reasonCode === 'rir_reps_shortfall',
    discrepancy,
    shortfall,
    repDrop: drop,
  };
}

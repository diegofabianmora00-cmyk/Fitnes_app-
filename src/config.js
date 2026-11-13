// Umbrales y constantes del motor (criterio de la app, heurísticas propias salvo que se indique fuente).
// Centralizados para evitar oscilaciones y mantener consistencia entre motores.

export const APP_HEURISTIC = 'criterio de la app';

// Rendimiento / readiness (e1RM): Greig 2020/Helms 2018 motivan la autorregulación;
// los cortes porcentuales son criterio de la app.
export const READINESS = {
  lowRatio: 0.9,        // <90% del mejor reciente => día flojo
  highRatio: 1.05,      // >105% => día fuerte
  // histéresis: se confirma con 2 de 3 series/sesiones cuando hay datos suficientes
  confirmPoints: 2,
  window: 3,
};

// Descanso real vs objetivo (ACSM 2009 / Grgic 2017 dan rangos; tolerancia y cortes son criterio de la app).
export const REST = {
  shortRatio: 0.8,      // <80% del objetivo
  longRatio: 1.3,       // >130% del objetivo
  feedbackToleranceRatio: 0.2, // ±20% para lectura informativa
  feedbackMinToleranceSec: 20,
  scoreToleranceRatio: 0.25,
  scoreMinToleranceSec: 25,
  addSecShort: 30,
  addSecShortHard: 60,
  cutSecLongEasy: 15,
};

// Fatiga intra-sesión y caídas (criterio de la app).
export const FATIGUE = {
  repDropRatio: 0.25,      // caída >=25% de reps entre series
  lightExtraReps: 3,       // 3+ reps sobre objetivo => carga ligera
  loadDownMinPct: 0.1,     // bajar al menos 10% tras fallo/carga pesada (ACSM 2009)
  loadDownMaxPct: 0.25,    // tope prudente 25%
  loadUpPctPerRep: 0.03,   // 3% por rep extra (criterio de la app, series largas)
  loadUpMinPct: 0.05,
  loadUpMaxPct: 0.25,
};

// RIR (Zourdos 2016 valida la escala RIR/RPE; cruces y confianza son criterio de la app).
export const RIR = {
  noiseShortfall2: 2,      // 2+ reps por debajo => RIR efectivo muy bajo
  noiseShortfall1: 1,
  beginnerWeightOnReps: 0.7, // principiantes: más peso a la caída de reps
  advancedWeightOnReps: 0.55,
  confidenceHighMin: 3,    // puntos de datos (series) para confianza alta en la señal
  confidenceMedMin: 2,
};

// Estancamiento (ACSM 2009/NSCA inspiran; umbrales y tendencia e1RM son criterio de la app).
export const STALL = {
  sameWeightSessions: 3,
  minDays: 14,
  recentSessions: 3,
  e1rmSlopeFlat: 0.002,    // pendiente relativa ~plana/mejorable (regresión simple)
  historyWindow: 5,
};

// Deload / fatiga acumulada (Mann 2010/Greig 2020 inspiran; reglas concretas son criterio de la app).
export const DELOAD = {
  dropRatioSession: 0.05,  // caída e1RM >5% entre sesiones
  consecutiveDrops: 2,     // 2 sesiones seguidas con caída
  lowReadinessSessions: 2, // readiness bajo repetido
  multiExerciseStall: 2,   // estancamiento en varios ejercicios
  volumeReduction: 0.4,    // reducir volumen ~40% en semana de descarga
  loadReduction: 0.1,      // o reducir carga ~10%
  resumeWeeks: 1,          // volver al ciclo normal tras 1 semana de descarga
};

// Volumen semanal por músculo, series efectivas (Schoenfeld 2017 volumen da rangos orientativos;
// clasificación concreto bajo/óptimo/alto es criterio de la app).
export const VOLUME = {
  lowMax: 9,       // <=9 series/semana por músculo
  optimalMax: 20,  // 10-20 óptimo general
  // >20 alto (ajustar por nivel podría hacerse en UI; aquí clasificación base)
};

// Primera vez sin historial (criterio de la app).
export const FIRST_TIME = {
  rirMin: 2,
  rirMax: 3,
};

// Pausa/retorno (criterio de la app).
export const PAUSE = {
  days: 14,
  loadReduction: 0.1,
};

// Confianza del historial (criterio de la app).
export const CONFIDENCE = {
  needed: 4,
};

// Progreso de sesión (score v5 existente; pesos son criterio de la app, ver RULES.score).
export const SCORE_V5 = {
  version: 5,
};

// Histéresis: cuántas observaciones recientes deben coincidir antes de cambiar de estado.
export const HYSTERESIS = {
  minConfirm: 2,
  window: 3,
};

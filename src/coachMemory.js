export function calculateFacts(data = {}, now = Date.now()) {
  const workouts = [...(data.workouts || [])].sort((a, b) => (b.date || 0) - (a.date || 0));

  const validWorkouts = workouts.filter((w) => {
    const exs = w.exercises || [];
    return exs.some((e) => (e.sets || []).some((s) => !s.unconfirmed && Number(s.r) > 0));
  });

  const lastWorkout = validWorkouts[0] || null;
  const daysSinceLast = lastWorkout ? Math.max(0, Math.floor((now - lastWorkout.date) / 864e5)) : null;

  const nowDate = new Date(now);
  const currentYear = nowDate.getFullYear();
  const currentMonth = nowDate.getMonth();
  const monthWorkouts = validWorkouts.filter((w) => {
    const d = new Date(w.date || 0);
    return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
  }).length;

  let streak = 0;
  if (validWorkouts.length > 0) {
    const getMonday = (ts) => {
      const d = new Date(ts);
      const day = d.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() + diff);
      return d.getTime();
    };

    const weekSets = new Set();
    validWorkouts.forEach((w) => {
      weekSets.add(getMonday(w.date));
    });

    const currentMonday = getMonday(now);
    let checkMonday = currentMonday;
    if (!weekSets.has(checkMonday)) {
      checkMonday -= 7 * 86400000;
    }

    while (weekSets.has(checkMonday)) {
      streak++;
      checkMonday -= 7 * 86400000;
    }
  }

  const exerciseHistory = {};
  validWorkouts.forEach((w) => {
    (w.exercises || []).forEach((e) => {
      if (!e.exId) return;
      const confirmedSets = (e.sets || []).filter((s) => !s.unconfirmed && Number(s.r) > 0);
      if (!confirmedSets.length) return;
      if (!exerciseHistory[e.exId]) exerciseHistory[e.exId] = [];
      exerciseHistory[e.exId].push({
        workoutId: w.id,
        date: w.date,
        name: e.name,
        targetReps: Number(e.targetReps ?? e.target) || 8,
        sets: confirmedSets,
      });
    });
  });

  const costExercises = [];
  const improvedExercises = [];

  Object.entries(exerciseHistory).forEach(([exId, hist]) => {
    if (!hist.length) return;
    const lastSession = hist[0];
    const prevSession = hist[1] || null;

    const missedReps = lastSession.sets.some((s) => Number(s.r) < lastSession.targetReps);
    const rirZeros = lastSession.sets.filter((s) => Number(s.rir) === 0).length;
    const majorityRirZero = rirZeros >= Math.ceil(lastSession.sets.length / 2);
    let lessThanPrev = false;
    if (prevSession) {
      const lastMaxScore = Math.max(...lastSession.sets.map((s) => (Number(s.w) || 0) * (Number(s.r) || 0) || Number(s.r)));
      const prevMaxScore = Math.max(...prevSession.sets.map((s) => (Number(s.w) || 0) * (Number(s.r) || 0) || Number(s.r)));
      lessThanPrev = lastMaxScore < prevMaxScore;
    }

    if (missedReps || majorityRirZero || lessThanPrev) {
      costExercises.push({
        exId,
        name: lastSession.name,
        reason: missedReps ? 'reps' : majorityRirZero ? 'rir0' : 'menos',
      });
    }

    if (prevSession) {
      const lastMaxScore = Math.max(...lastSession.sets.map((s) => (Number(s.w) || 0) * (Number(s.r) || 0) || Number(s.r)));
      const prevMaxScore = Math.max(...prevSession.sets.map((s) => (Number(s.w) || 0) * (Number(s.r) || 0) || Number(s.r)));
      if (lastMaxScore > prevMaxScore) {
        improvedExercises.push({ exId, name: lastSession.name });
      }
    }
  });

  return {
    streak,
    daysSinceLast,
    monthWorkouts,
    costExercises,
    improvedExercises,
    hasHistory: validWorkouts.length > 0,
  };
}

const TEMPLATES = [
  // --- INICIO ---
  {
    id: 'inicio_streak',
    context: 'inicio',
    check: (f) => f.streak >= 2,
    directo: (f) => `Llevas ${f.streak} semanas seguidas.`,
    motivador: (f) => `¡${f.streak} semanas seguidas de constancia! Excelente ritmo.`,
    tranquilo: (f) => `Van ${f.streak} semanas consecutivas avanzando a tu ritmo.`,
  },
  {
    id: 'inicio_month',
    context: 'inicio',
    check: (f) => f.monthWorkouts >= 1,
    directo: (f) => `${f.monthWorkouts} entrenamientos este mes.`,
    motivador: (f) => `¡Ya sumas ${f.monthWorkouts} sesiones este mes! Gran compromiso.`,
    tranquilo: (f) => `Este mes registras ${f.monthWorkouts} sesiones completadas con calma.`,
  },
  {
    id: 'inicio_improved',
    context: 'inicio',
    check: (f) => f.improvedExercises && f.improvedExercises.length > 0,
    directo: (f) => `${f.improvedExercises[0].name} mejoró frente a la sesión anterior.`,
    motivador: (f) => `¡Hubo mejora en ${f.improvedExercises[0].name}! Sigue sumando.`,
    tranquilo: (f) => `Se nota progreso en ${f.improvedExercises[0].name} respecto a la última vez.`,
  },

  // --- ANTES_EJERCICIO ---
  {
    id: 'antes_cost',
    context: 'antes_ejercicio',
    check: (f) => f.costExercises && f.costExercises.length > 0,
    directo: (f) => `La vez pasada ${f.costExercises[0].name} costó; hoy ajustamos la intensidad.`,
    motivador: (f) => `La sesión anterior ${f.costExercises[0].name} exigió bastante; hoy es una nueva oportunidad.`,
    tranquilo: (f) => `La última vez ${f.costExercises[0].name} costó un poco; hoy vamos con calma.`,
  },
  {
    id: 'antes_improved',
    context: 'antes_ejercicio',
    check: (f) => f.improvedExercises && f.improvedExercises.length > 0,
    directo: (f) => `${f.improvedExercises[0].name} viene subiendo de nivel.`,
    motivador: (f) => `¡${f.improvedExercises[0].name} viene en racha ascendente!`,
    tranquilo: (f) => `El desempeño en ${f.improvedExercises[0].name} ha sido constante y fluido.`,
  },
  {
    id: 'antes_streak',
    context: 'antes_ejercicio',
    check: (f) => f.streak >= 1,
    directo: (f) => `Constancia de ${f.streak} semanas en marcha.`,
    motivador: (f) => `Con ${f.streak} semanas de racha, cada ejercicio cuenta.`,
    tranquilo: (f) => `Disfruta el proceso de hoy con la base de tus ${f.streak} semanas.`,
  },

  // --- TRAS_SERIE ---
  {
    id: 'tras_improved',
    context: 'tras_serie',
    check: (f) => f.improvedExercises && f.improvedExercises.length > 0,
    directo: (f) => `Serie registrada. ${f.improvedExercises[0].name} muestra avance.`,
    motivador: (f) => `¡Buena serie! Se nota el progreso en ${f.improvedExercises[0].name}.`,
    tranquilo: (f) => `Serie registrada con buena fluidez en ${f.improvedExercises[0].name}.`,
  },
  {
    id: 'tras_cost',
    context: 'tras_serie',
    check: (f) => f.costExercises && f.costExercises.length > 0,
    directo: (f) => `Serie completada tras una sesión previa exigente en ${f.costExercises[0].name}.`,
    motivador: (f) => `¡Gran esfuerzo! Superando la exigencia previa en ${f.costExercises[0].name}.`,
    tranquilo: (f) => `Paso a paso, manejando bien la exigencia en ${f.costExercises[0].name}.`,
  },
  {
    id: 'tras_streak',
    context: 'tras_serie',
    check: (f) => f.streak >= 1,
    directo: (f) => `Serie guardada. Base de ${f.streak} semanas activas.`,
    motivador: (f) => `¡Cada serie suma a tu racha de ${f.streak} semanas!`,
    tranquilo: (f) => `Una serie más dentro de tus ${f.streak} semanas de constancia.`,
  },

  // --- RESUMEN_EJERCICIO ---
  {
    id: 'resumen_improved',
    context: 'resumen_ejercicio',
    check: (f) => f.improvedExercises && f.improvedExercises.length > 0,
    directo: (f) => `Ejercicio terminado con mejora en ${f.improvedExercises[0].name}.`,
    motivador: (f) => `¡Excelente bloque! ${f.improvedExercises[0].name} superó la marca anterior.`,
    tranquilo: (f) => `Bloque finalizado con un avance perceptible en ${f.improvedExercises[0].name}.`,
  },
  {
    id: 'resumen_cost',
    context: 'resumen_ejercicio',
    check: (f) => f.costExercises && f.costExercises.length > 0,
    directo: (f) => `Bloque cerrado. ${f.costExercises[0].name} demandó esfuerzo extra.`,
    motivador: (f) => `¡Buen trabajo superando la resistencia en ${f.costExercises[0].name}!`,
    tranquilo: (f) => `Bloque completado aceptando la exigencia natural de ${f.costExercises[0].name}.`,
  },
  {
    id: 'resumen_month',
    context: 'resumen_ejercicio',
    check: (f) => f.monthWorkouts >= 1,
    directo: (f) => `Ejercicio completado. Total mensual: ${f.monthWorkouts} sesiones.`,
    motivador: (f) => `¡Sumando calidad! ${f.monthWorkouts} sesiones este mes respaldan este ejercicio.`,
    tranquilo: (f) => `Ejercicio concluido sumando al total de ${f.monthWorkouts} sesiones del mes.`,
  },

  // --- REGRESO_AUSENCIA ---
  {
    id: 'ausencia_days',
    context: 'regreso_ausencia',
    check: (f) => f.daysSinceLast >= 3,
    directo: (f) => `Han pasado ${f.daysSinceLast} días sin entrenar; retomamos sin prisa.`,
    motivador: (f) => `¡Qué bueno verte de vuelta tras ${f.daysSinceLast} días! Vamos paso a paso.`,
    tranquilo: (f) => `Tras ${f.daysSinceLast} días de pausa, retomamos con tranquilidad y sin presiones.`,
  },
  {
    id: 'ausencia_month',
    context: 'regreso_ausencia',
    check: (f) => f.daysSinceLast >= 3 && f.monthWorkouts >= 1,
    directo: (f) => `${f.daysSinceLast} días de pausa; tus ${f.monthWorkouts} sesiones del mes avalan el retorno.`,
    motivador: (f) => `¡De regreso tras ${f.daysSinceLast} días! Tienes ${f.monthWorkouts} sesiones este mes como base.`,
    tranquilo: (f) => `Después de ${f.daysSinceLast} días, retomamos suavemente manteniendo el pulso del mes (${f.monthWorkouts} sesiones).`,
  },
  {
    id: 'ausencia_general',
    context: 'regreso_ausencia',
    check: (f) => f.daysSinceLast >= 3,
    directo: (f) => `Pausa de ${f.daysSinceLast} días concluida. Inicio gradual.`,
    motivador: (f) => `¡Bienvenido de nuevo después de ${f.daysSinceLast} días! A recuperar sensaciones.`,
    tranquilo: (f) => `Con ${f.daysSinceLast} días desde la última vez, hoy nos tomamos el tiempo necesario.`,
  },
];

const NEUTRAL_MESSAGES = {
  directo: 'Listo para continuar.',
  motivador: '¡Todo listo para dar lo mejor!',
  tranquilo: 'A tu ritmo, sin prisa.',
};

export const COACH_TONES = [
  { id: 'tranquilo', label: 'Tranquilo', desc: 'A tu ritmo, sin prisa.', example: 'A tu ritmo, sin prisa.' },
  { id: 'directo', label: 'Directo', desc: 'Claro y al grano.', example: 'Listo para continuar.' },
  { id: 'motivador', label: 'Motivador', desc: 'Energía y apoyo constante.', example: '¡Todo listo para dar lo mejor!' },
];

export function getCoachMessage(contexto, hechos, tono = 'directo', idsRecientes = []) {
  const validTemplates = TEMPLATES.filter((t) => {
    if (t.context !== contexto) return false;
    try {
      return t.check(hechos);
    } catch {
      return false;
    }
  });

  if (!validTemplates.length) {
    return {
      id: 'neutral_fallback',
      texto: NEUTRAL_MESSAGES[tono] || NEUTRAL_MESSAGES.directo,
    };
  }

  const nonRecentTemplates = validTemplates.filter((t) => !idsRecientes.includes(t.id));
  const candidatePool = nonRecentTemplates.length > 0 ? nonRecentTemplates : validTemplates;

  const chosen = candidatePool[0];
  const formatter = chosen[tono] || chosen.directo;
  const texto = typeof formatter === 'function' ? formatter(hechos) : formatter;

  return {
    id: chosen.id,
    texto,
  };
}

import {
  addLoadStep,
  confidence,
  kgFromLoad,
  loadFromKg,
  loadMinFor,
  loadStepFor,
  recommendFor,
  roundLoad,
  subLoadStep,
  streakInfo,
  periodRange,
  periodStats,
  progressSeries,
  muscleShare,
  sessionProgress,
  nextRoutineDay,
  routineEstimate,
  nextWeightHint,
  nearRecord,
} from '../recommend';

const DAY = 86400000;
const NOW = 1760000000000;

const BASE_PROFILE = {
  goal: 'hipertrofia',
  level: 'intermedio',
  ambition: 'progresar',
  daysPerWeek: 3,
  weightKg: 80,
  heightCm: 180,
  age: 30,
  sex: 'hombre',
  restStyle: 'equilibrado',
  completed: true,
  updatedAt: 0,
};

const data = (workouts = [], profileOverrides = {}) => ({
  schemaVersion: 2,
  unit: 'kg',
  profile: { ...BASE_PROFILE, ...profileOverrides },
  routines: [],
  workouts,
  now: workouts.length && workouts[0].date ? workouts[0].date : NOW,
});

const makeEx = ({
  id = 'press-banca',
  name = 'Press de banca',
  group = 'Pecho',
  equipment = 'Barra',
  type = 'compuesto',
  sets = 3,
  reps = 8,
} = {}) => ({ id, name, group, equipment, type, sets, reps });

const makeSet = (w, r, rir = 2, unconfirmed = false) => ({
  w: String(w),
  r: String(r),
  rir,
  confirmed: { r: true, w: true, rir: true },
  unconfirmed,
  failure: rir === 0,
  startedAt: 0,
  endedAt: 0,
  restBeforeSec: 120,
  done: true,
});

const makeWorkout = (date, sets, exId = 'press-banca', name = 'Press de banca', recWeightKg = 60) => ({
  id: `w-${date}`,
  date,
  routineId: 'r1',
  routineName: 'Rutina',
  startedAt: date,
  endedAt: date,
  durationSec: 3600,
  exercises: [
    { exId, name, targetReps: 8, targetSets: sets.length, targetRestSec: 120, recWeightKg, sets },
  ],
});

describe('recommendFor', () => {
  describe('sin historial', () => {
    it('recomienda start (primera vez) y no inventa peso', () => {
      const res = recommendFor(data([]), makeEx());
      expect(res.action).toBe('start');
      expect(res.title).toBe('Primera vez');
      expect(res.weightKg).toBeNull();
      expect(res.primaryRule.id).toBe('start');
      expect(res.sessions).toBe(0);
      expect(res.confidence).toBe('baja');
    });

    it('para peso corporal sin historial tambien recomienda start', () => {
      const res = recommendFor(
        data([]),
        makeEx({ id: 'dominadas', name: 'Dominadas', group: 'Espalda', equipment: 'Peso corporal', reps: 12 }),
      );
      expect(res.action).toBe('start');
      expect(res.weightKg).toBeNull();
    });
  });

  describe('acciones: subir, mantener y estancamiento', () => {
    it('recomienda subir el peso cuando la ultima sesion supero el objetivo', () => {
      const res = recommendFor(
        data([
          makeWorkout(NOW, [makeSet(60, 10), makeSet(60, 10), makeSet(60, 10)]),
          makeWorkout(NOW - 3 * DAY, [makeSet(60, 8), makeSet(60, 8), makeSet(60, 8)]),
        ]),
        makeEx(),
      );
      expect(res.action).toBe('up');
      expect(res.weightKg).toBe(62.5);
    });

    it('recomienda mantener cuando vas bien', () => {
      const res = recommendFor(data([makeWorkout(NOW, [makeSet(60, 8), makeSet(60, 8), makeSet(60, 8)])]), makeEx());
      expect(res.action).toBe('maintain');
      expect(res.primaryRule.id).toBe('progression');
    });

    it('recomienda revisar el estancamiento', () => {
      const res = recommendFor(
        data([
          makeWorkout(NOW, [makeSet(60, 8, 0), makeSet(60, 8, 0), makeSet(60, 8, 0)]),
          makeWorkout(NOW - 8 * DAY, [makeSet(60, 8, 0), makeSet(60, 8, 0), makeSet(60, 8, 0)]),
          makeWorkout(NOW - 20 * DAY, [makeSet(60, 8, 0), makeSet(60, 8, 0), makeSet(60, 8, 0)]),
        ]),
        makeEx(),
      );
      expect(res.action).toBe('stall');
      expect(res.stallDays).toBe(20);
    });
  });

  describe('RIR y dificultad percibida', () => {
    it('usa el RIR para saber si hay margen', () => {
      const res = recommendFor(
        data([makeWorkout(NOW, [makeSet(60, 9, 1), makeSet(60, 9, 1), makeSet(60, 9, 1)])]),
        makeEx(),
      );
      expect(res.action).toBe('maintain');
      expect(res.primaryRule.id).toBe('progression');
    });

    it('con RIR 0 recomienda mantener y ganar margen', () => {
      const res = recommendFor(
        data([makeWorkout(NOW, [makeSet(60, 8, 0), makeSet(60, 8, 0), makeSet(60, 8, 0)])]),
        makeEx(),
      );
      expect(res.action).toBe('maintain');
      expect(res.primaryRule.id).toBe('rir');
    });

    it('la escala RIR depende del objetivo', () => {
      const resFuerza = recommendFor(data([], { goal: 'fuerza' }), makeEx({ type: 'compuesto', reps: 5, group: 'Pecho', equipment: 'Barra' }));
      expect(resFuerza.rir).toEqual([1, 2]);
      const resHipertro = recommendFor(data([]), makeEx());
      expect(resHipertro.rir).toEqual([1, 3]);
    });
  });

  describe('series sin confirmar y saltadas se ignoran', () => {
    it('ignora series sin confirmar y pasa a start', () => {
      const res = recommendFor(data([makeWorkout(NOW, [makeSet(60, 10, 2, true)])]), makeEx());
      expect(res.action).toBe('start');
      expect(res.sessions).toBe(0);
    });

    it('ignora series saltadas (r=0)', () => {
      const res = recommendFor(data([makeWorkout(NOW, [makeSet(60, 0), makeSet(60, 0)])]), makeEx());
      expect(res.action).toBe('start');
      expect(res.sessions).toBe(0);
    });

    it('ignora solo las series saltadas y usa las validas', () => {
      const res = recommendFor(data([makeWorkout(NOW, [makeSet(60, 10), makeSet(60, 0)])]), makeEx());
      expect(res.action).toBe('up');
    });
  });
});

describe('redondeo de carga', () => {
  it('redondea al disco real en kg', () => {
    expect(roundLoad(60, 'kg')).toBe(60);
    expect(roundLoad(60.4, 'kg')).toBe(60);
    expect(roundLoad(57.7, 'kg')).toBe(57.5);
    expect(addLoadStep(60, 'kg')).toBe(62.5);
    expect(subLoadStep(60, 'kg')).toBe(57.5);
  });

  it('redondea al disco real en lb', () => {
    expect(roundLoad(135, 'lb')).toBe(135);
    expect(roundLoad(132, 'lb')).toBe(130);
    expect(addLoadStep(135, 'lb')).toBe(140);
    expect(subLoadStep(135, 'lb')).toBe(130);
  });

  it('convierte entre kg y lb', () => {
    expect(loadFromKg(60, 'lb')).toBeCloseTo(60 * 2.20462, 5);
    expect(kgFromLoad(140, 'lb')).toBeCloseTo(140 / 2.20462, 5);
    expect(loadStepFor('lb')).toBe(5);
    expect(loadMinFor('lb')).toBe(2.5);
    expect(loadMinFor('kg')).toBe(1.25);
  });
});

describe('ejercicios de peso corporal', () => {
  it('con historial de peso corporal recomienda anadir lastre', () => {
    const res = recommendFor(
      data([makeWorkout(NOW, [makeSet(0, 12, 2)], 'dominadas', 'Dominadas', 0)]),
      makeEx({ id: 'dominadas', name: 'Dominadas', group: 'Espalda', equipment: 'Peso corporal', reps: 12 }),
    );
    expect(res.action).toBe('maintain');
    expect(res.weightKg).toBe(0);
  });
});

describe('confidence y comportamiento conservador', () => {
  it('calcula la confianza correctamente segun sesiones con series confirmadas', () => {
    // 0 sesiones
    const d0 = data([]);
    expect(confidence(d0, 'press-banca')).toEqual({ sesiones: 0, necesarias: 4, nivel: 'baja' });

    // 1 sesión confirmada
    const d1 = data([makeWorkout(NOW, [makeSet(60, 8)])]);
    expect(confidence(d1, 'press-banca')).toEqual({ sesiones: 1, necesarias: 4, nivel: 'baja' });

    // 2 sesiones confirmadas -> media
    const d2 = data([
      makeWorkout(NOW, [makeSet(60, 8)]),
      makeWorkout(NOW - 3 * DAY, [makeSet(60, 8)]),
    ]);
    expect(confidence(d2, 'press-banca')).toEqual({ sesiones: 2, necesarias: 4, nivel: 'media' });

    // 3 sesiones confirmadas -> media
    const d3 = data([
      makeWorkout(NOW, [makeSet(60, 8)]),
      makeWorkout(NOW - 3 * DAY, [makeSet(60, 8)]),
      makeWorkout(NOW - 6 * DAY, [makeSet(60, 8)]),
    ]);
    expect(confidence(d3, 'press-banca')).toEqual({ sesiones: 3, necesarias: 4, nivel: 'media' });

    // 4 sesiones confirmadas -> alta
    const d4 = data([
      makeWorkout(NOW, [makeSet(60, 8)]),
      makeWorkout(NOW - 3 * DAY, [makeSet(60, 8)]),
      makeWorkout(NOW - 6 * DAY, [makeSet(60, 8)]),
      makeWorkout(NOW - 9 * DAY, [makeSet(60, 8)]),
    ]);
    expect(confidence(d4, 'press-banca')).toEqual({ sesiones: 4, necesarias: 4, nivel: 'alta' });
  });

  it('no suma series sin confirmar para la confianza', () => {
    const dUnconfirmed = data([
      makeWorkout(NOW, [makeSet(60, 10, 2, true)]), // unconfirmed
      makeWorkout(NOW - 3 * DAY, [makeSet(60, 8)]), // confirmed
    ]);
    const conf = confidence(dUnconfirmed, 'press-banca');
    expect(conf.sesiones).toBe(1);
    expect(conf.nivel).toBe('baja');
  });

  it('aplica recomendacion conservadora con confianza baja (1 sesion)', () => {
    const res = recommendFor(
      data([makeWorkout(NOW, [makeSet(60, 10, 2)])]), // 1 sesion previa
      makeEx(),
    );
    expect(res.confidence).toBe('baja');
    expect(res.text.toLowerCase()).toContain('aún tengo pocos datos');
    expect(res.rules.some((r) => r.id === 'lowConfidence')).toBe(true);
  });
});

describe('nuevas funciones de progreso y rachas', () => {
  it('streakInfo calcula racha con descansos en medio y hoy sin entrenar', () => {
    // Choose a Monday: 2026-10-05
    const monday = new Date('2026-10-05T10:00:00Z').getTime();
    const wednesday = new Date('2026-10-07T10:00:00Z').getTime();
    const d = {
      ...data([
        makeWorkout(wednesday, [makeSet(60, 8)]),
        makeWorkout(monday, [makeSet(60, 8)]),
      ]),
      routines: [{ id: 'r1', days: [0, 2, 4] }], // Mon, Wed, Fri
    };
    const info = streakInfo(d, wednesday);
    expect(info.current).toBeGreaterThanOrEqual(1);
    expect(info.week.length).toBe(7);
  });

  it('streakInfo sin days usa criterio de la app', () => {
    const d = data([
      makeWorkout(NOW, [makeSet(60, 8)]),
      makeWorkout(NOW - DAY, [makeSet(60, 8)]),
    ]);
    const info = streakInfo(d, NOW);
    expect(info.current).toBeGreaterThanOrEqual(1);
  });

  it('periodRange maneja rango personalizado y datos sin unit', () => {
    const r = periodRange('Personalizado', NOW, '2026-10-01', '2026-10-10');
    expect(r.start).toBeDefined();
    expect(r.end).toBeDefined();
    const stats = periodStats({ workouts: [], unit: undefined }, r);
    expect(stats.sessions).toBe(0);
  });

  it('progressSeries, muscleShare y sessionProgress funcionan correctamente', () => {
    const w = makeWorkout(NOW, [makeSet(60, 8)]);
    w.score = { score: 85 };
    const d = data([w]);
    const series = progressSeries(d, periodRange('30 días', NOW), 'Puntaje');
    expect(series.length).toBe(1);
    const ms = muscleShare(d, periodRange('30 días', NOW));
    expect(Array.isArray(ms)).toBe(true);
    const sp = sessionProgress(d, w);
    expect(sp).toBeNull();
  });
});

describe('funciones de inicio y descanso (nextRoutineDay, routineEstimate, nextWeightHint, nearRecord)', () => {
  it('nextRoutineDay encuentra la próxima rutina cruzando el fin de semana', () => {
    // Friday (day 4), routine on Monday (day 0) next week
    const friday = new Date('2026-10-09T10:00:00Z').getTime(); // Fri
    const d = {
      ...data([]),
      routines: [{ id: 'r1', name: 'Pecho', days: [0], exercises: [makeEx()] }], // Monday = 0
    };
    const res = nextRoutineDay(d, friday);
    expect(res).not.toBeNull();
    expect(res.routine.name).toBe('Pecho');
    expect(res.daysAway).toBe(3); // Fri -> Sat (1), Sun (2), Mon (3)
  });

  it('nextRoutineDay devuelve null si no hay rutinas con days', () => {
    const d = {
      ...data([]),
      routines: [{ id: 'r1', name: 'Pecho', days: [], exercises: [] }],
    };
    expect(nextRoutineDay(d, NOW)).toBeNull();
  });

  it('routineEstimate calcula minutos con y sin sesiones previas', () => {
    const routine = { id: 'r1', exercises: [makeEx(), makeEx()] };
    const d1 = data([]);
    const est1 = routineEstimate(d1, routine);
    expect(est1.exercises).toBe(2);
    expect(est1.minutes).toBeNull();

    const w = makeWorkout(NOW, [makeSet(60, 8)]);
    w.routineId = 'r1';
    w.durationSec = 3600; // 60 min
    const d2 = data([w]);
    const est2 = routineEstimate(d2, routine);
    expect(est2.minutes).toBe(60);
  });

  it('nextWeightHint da recomendacion de subir, mantener o sin historial', () => {
    const routine = { id: 'r1', exercises: [makeEx()] };
    // Sin historial
    const hintNoHist = nextWeightHint(data([]), routine);
    expect(hintNoHist).toContain('elige un peso');

    // Con historial para subir
    const w1 = makeWorkout(NOW, [makeSet(60, 10), makeSet(60, 10), makeSet(60, 10)]);
    const w2 = makeWorkout(NOW - 3 * DAY, [makeSet(60, 8), makeSet(60, 8), makeSet(60, 8)]);
    w1.routineId = 'r1'; w2.routineId = 'r1';
    const hintUp = nextWeightHint(data([w1, w2]), routine);
    expect(hintUp).toContain('subir');
  });

  it('nearRecord detecta dentro del rango del 90%, ignora unconfirmed y maneja datos sin unit', () => {
    // Record of 100kg
    const wPr = makeWorkout(NOW - 20 * DAY, [makeSet(100, 5)]);
    // Recent lift of 95kg (95% of 100kg -> within 90-100%)
    const wRecent = makeWorkout(NOW - 2 * DAY, [makeSet(95, 5)]);
    // Unconfirmed lift of 98kg should be ignored
    const wUnconf = makeWorkout(NOW - 1 * DAY, [makeSet(98, 5, 2, true)]);

    const d = {
      ...data([wPr, wRecent, wUnconf]),
      unit: undefined, // datos viejos sin unit
    };

    const nr = nearRecord(d, NOW);
    expect(nr).not.toBeNull();
    expect(nr.prKg).toBe(100);
    expect(nr.recentKg).toBe(95);
    expect(nr.ratio).toBe(0.95);
  });

  it('nearRecord devuelve null si fuera del rango del 90%', () => {
    const wPr = makeWorkout(NOW - 20 * DAY, [makeSet(100, 5)]);
    const wRecent = makeWorkout(NOW - 2 * DAY, [makeSet(80, 5)]); // 80% (< 90%)
    const d = data([wPr, wRecent]);
    expect(nearRecord(d, NOW)).toBeNull();
  });
});

describe('nuevas reglas del motor de recomendaciones', () => {
  it('baja peso si hay fallos consecutivos o fallo en ultima sesion', () => {
    const res = recommendFor(
      data([
        makeWorkout(NOW, [makeSet(60, 6, 0), makeSet(60, 6, 0)]),
        makeWorkout(NOW - 3 * DAY, [makeSet(60, 6, 0), makeSet(60, 6, 0)]),
      ]),
      makeEx()
    );
    expect(res.action).toBe('down');
    expect(res.weightKg).toBe(57.5);
  });

  it('RIR que decide: RIR 4-5 permite subir antes, RIR 0 impide subir', () => {
    const resEasy = recommendFor(
      data([makeWorkout(NOW, [makeSet(60, 8, 4), makeSet(60, 8, 4)])]),
      makeEx()
    );
    expect(resEasy.action).toBe('up');

    const resFail = recommendFor(
      data([makeWorkout(NOW, [makeSet(60, 8, 0), makeSet(60, 8, 0)])]),
      makeEx()
    );
    expect(resFail.action).not.toBe('up');
  });

  it('regreso tras pausa: 14 dias o mas sin entrenar sugiere reducir peso', () => {
    const oldDate = NOW - 16 * DAY;
    const d = {
      ...data([makeWorkout(oldDate, [makeSet(60, 8, 2)])]),
      now: NOW,
    };
    const res = recommendFor(d, makeEx());
    expect(res.action).toBe('pause');
    expect(res.weightKg).toBe(57.5);
  });

  it('incrementos por ejercicio: aislamiento usa incremento minimo', () => {
    const exIso = makeEx({ id: 'curl', name: 'Curl de bíceps', type: 'aislamiento', equipment: 'Mancuerna' });
    const res = recommendFor(
      data([
        makeWorkout(NOW, [makeSet(20, 10, 2), makeSet(20, 10, 2)], 'curl', 'Curl de bíceps'),
        makeWorkout(NOW - 3 * DAY, [makeSet(20, 10, 2), makeSet(20, 10, 2)], 'curl', 'Curl de bíceps'),
      ]),
      exIso
    );
    expect(res.action).toBe('up');
    expect(res.weightKg).toBe(21.25);
  });

  it('chequeo de energia: cansado recomienda mantener', () => {
    const d = {
      ...data([makeWorkout(NOW, [makeSet(60, 8, 2), makeSet(60, 8, 2)])]),
      checkin: { level: 'cansado' },
    };
    const res = recommendFor(d, makeEx());
    expect(res.action).toBe('maintain');
    expect(res.primaryRule.id).toBe('energyCheck');
  });
});

describe('autoregulacion en recommendFor', () => {
  it('sin historial devuelve setPlans sin inventar peso y con RIR objetivo', () => {
    const res = recommendFor(data([]), makeEx({ sets: 4 }));
    expect(res.weightKg).toBeNull();
    expect(res.rirTarget).toEqual({ lo: 1, hi: 3, target: 2 });
    expect(res.setPlans).toHaveLength(4);
    expect(res.setPlans.every((p) => p.weightKg === null)).toBe(true);
    expect(res.setPlans[0].reps).toBe(8);
    expect(res.setPlans[0].rir).toBe(2);
    expect(res.setPlans[3].rir).toBe(3);
    expect(res.readiness).toBe('normal');
    expect(res.deload).toBeNull();
  });

  it('setPlans usa el peso recomendado y el descanso de la sesion', () => {
    const res = recommendFor(
      data([
        makeWorkout(NOW, [makeSet(60, 10), makeSet(60, 10), makeSet(60, 10)]),
        makeWorkout(NOW - 3 * DAY, [makeSet(60, 8), makeSet(60, 8), makeSet(60, 8)]),
      ]),
      makeEx(),
    );
    expect(res.action).toBe('up');
    expect(res.setPlans).toHaveLength(3);
    expect(res.setPlans.every((p) => p.weightKg === 62.5)).toBe(true);
    expect(res.setPlans.every((p) => p.reps === 8)).toBe(true);
    expect(res.setPlans.every((p) => p.restSec === res.restSec)).toBe(true);
  });

  it('peso corporal mantiene setPlans en 0', () => {
    const res = recommendFor(
      data([makeWorkout(NOW, [makeSet(0, 12, 2)], 'dominadas', 'Dominadas', 0)]),
      makeEx({ id: 'dominadas', name: 'Dominadas', group: 'Espalda', equipment: 'Peso corporal', reps: 12 }),
    );
    expect(res.setPlans.every((p) => p.weightKg === 0)).toBe(true);
  });

  it('readiness usa el check-in y el historial', () => {
    const good = data([makeWorkout(NOW, [makeSet(60, 8, 2)])]);
    expect(recommendFor(good, makeEx()).readiness).toBe('normal');
    expect(recommendFor({ ...good, checkin: { level: 'cansado' } }, makeEx()).readiness).toBe('low');
    expect(recommendFor({ ...good, checkin: { level: 'bien' } }, makeEx()).readiness).toBe('high');
    expect(recommendFor({ ...good, checkin: { level: 'normal' } }, makeEx()).readiness).toBe('normal');

    const drop = data([
      makeWorkout(NOW, [makeSet(80, 8, 2)]),
      makeWorkout(NOW - 3 * DAY, [makeSet(100, 8, 2)]),
    ]);
    expect(recommendFor(drop, makeEx()).readiness).toBe('low');
  });

  it('detecta deload tras dos sesiones seguidas con caida clara de e1RM', () => {
    const res = recommendFor(
      data([
        makeWorkout(NOW, [makeSet(88, 8, 2)]),
        makeWorkout(NOW - 3 * DAY, [makeSet(94, 8, 2)]),
        makeWorkout(NOW - 6 * DAY, [makeSet(100, 8, 2)]),
      ]),
      makeEx(),
    );
    expect(res.deload).not.toBeNull();
    expect(res.deload.active).toBe(true);
    expect(res.deload.sessions).toBe(2);
    expect(res.deload.dropPct).toBeGreaterThanOrEqual(10);
    expect(res.deload.text).toContain('descarga');
  });

  it('no marca deload con e1RM estable', () => {
    const res = recommendFor(
      data([
        makeWorkout(NOW, [makeSet(100, 8, 2)]),
        makeWorkout(NOW - 3 * DAY, [makeSet(100, 8, 2)]),
        makeWorkout(NOW - 6 * DAY, [makeSet(100, 8, 2)]),
      ]),
      makeEx(),
    );
    expect(res.deload).toBeNull();
  });
});

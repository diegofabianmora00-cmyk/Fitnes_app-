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

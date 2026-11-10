import {
  e1rmKg,
  fatigueDrop,
  loadStepFor,
  nextSessionPlan,
  nextSetPlan,
  readiness,
  repsAtLoadKg,
  rirTargetFor,
  roundLoadKg,
  shiftLoadKg,
  targetLoadKg,
} from '../autoreg';
import { GYM_DEFAULT } from '../load';

const NOW = 1760000000000;

const PROFILE = {
  goal: 'hipertrofia',
  level: 'intermedio',
  restStyle: 'equilibrado',
  ambition: 'progresar',
};

const GYM = {
  ...GYM_DEFAULT,
  unit: 'kg',
  bars: [{ id: 'olimpica', name: 'Barra olímpica (20 kg)', weightKg: 20 }],
  defaultBarId: 'olimpica',
  platesKg: [25, 20, 15, 10, 5, 2.5, 1.25],
  dumbbellStep: 1,
  stackStep: 5,
};

const data = (workouts = [], overrides = {}) => ({
  unit: 'kg',
  gym: GYM,
  profile: { ...PROFILE, ...overrides },
  workouts,
  now: NOW,
});

const ex = (overrides = {}) => ({
  id: 'press-banca',
  name: 'Press de banca',
  type: 'compuesto',
  equipment: 'Barra',
  loadType: 'barbell',
  sets: 3,
  reps: 8,
  ...overrides,
});

const set = (w, r, rir, extra = {}) => ({
  w,
  r,
  rir,
  failure: rir === 0,
  unconfirmed: false,
  restBeforeSec: 120,
  ...extra,
});

const startPlan = (overrides = {}) => ({
  weightKg: 80,
  reps: 8,
  rir: 2,
  restSec: 120,
  repMin: 6,
  repMax: 12,
  loadType: 'barbell',
  ...overrides,
});

const workout = (date, sets, exId = 'press-banca') => ({
  id: `w-${date}`,
  date,
  exercises: [{ exId, targetReps: 8, sets }],
});

const plan = (sets, extra = {}) =>
  nextSetPlan({
    data: data(),
    ex: ex(),
    sets,
    setIndex: 0,
    totalSets: 3,
    startPlan: startPlan(),
    restTarget: 120,
    ...extra,
  });

describe('autoreg: fórmulas base', () => {
  it('calcula e1RM con Epley ajustado por RIR', () => {
    expect(e1rmKg(100, 5, 2)).toBeCloseTo(123.33, 1);
    expect(e1rmKg(80, 8, 2)).toBeCloseTo(106.67, 1);
  });

  it('no usa e1RM sin peso, sin reps o con reps + RIR fuera de rango', () => {
    expect(e1rmKg(0, 8, 2)).toBeNull();
    expect(e1rmKg(80, 0, 2)).toBeNull();
    expect(e1rmKg(80, 12, 4)).toBeNull();
  });

  it('calcula reps esperadas y peso objetivo de forma inversa', () => {
    expect(repsAtLoadKg(100, 123.33, 2)).toBe(5);
    expect(targetLoadKg(123.33, 5, 2)).toBeCloseTo(100, 0);
  });

  it('redondea al equipo disponible', () => {
    expect(roundLoadKg('barbell', 63.5, GYM, 'kg')).toBe(62.5);
    expect(loadStepFor('barbell', GYM, 'kg')).toBe(2.5);
    expect(shiftLoadKg('barbell', 80, 1, GYM, 'kg')).toBe(82.5);
    expect(shiftLoadKg('barbell', 80, -1, GYM, 'kg')).toBe(77.5);
  });

  it('fija el RIR objetivo por objetivo y posición de la serie', () => {
    expect(rirTargetFor(PROFILE, 0, 3, 'compuesto')).toEqual({ lo: 1, hi: 3, target: 2 });
    expect(rirTargetFor(PROFILE, 2, 3, 'compuesto').target).toBe(3);
    expect(rirTargetFor({ goal: 'fuerza' }, 2, 3, 'compuesto')).toEqual({ lo: 1, hi: 2, target: 2 });
  });

  it('calcula la caída esperada de reps y la readiness', () => {
    expect(fatigueDrop([{ sets: [{ r: 10 }, { r: 9 }, { r: 8 }] }], ex(), 120)).toBe(1);
    expect(fatigueDrop([{ sets: [{ r: 10 }, { r: 9 }] }], ex(), 60)).toBe(1.5);
    expect(readiness(80, 100)).toBe('low');
    expect(readiness(100, 100)).toBe('normal');
    expect(readiness(110, 100)).toBe('high');
  });
});

describe('autoreg: siguiente serie', () => {
  it('baja un paso si la serie quedó demasiado pesada', () => {
    const out = plan([set(100, 4, 1)]);
    expect(out.action).toBe('down');
    expect(out.weightKg).toBe(97.5);
    expect(out.restSec).toBe(150);
    expect(out.reason).toContain('por debajo del mínimo');
  });

  it('sube un paso si la serie quedó demasiado ligera', () => {
    const out = plan([set(60, 10, 4)]);
    expect(out.action).toBe('up');
    expect(out.weightKg).toBe(62.5);
  });

  it('mantiene el peso si reps y RIR están dentro del objetivo', () => {
    const out = plan([set(80, 8, 2)]);
    expect(out.action).toBe('maintain');
    expect(out.weightKg).toBe(80);
    expect(out.reps).toBe(8);
  });

  it('aplica histéresis: no cambia peso con RIR en el borde del rango', () => {
    const out = plan([set(80, 8, 3)]);
    expect(out.action).toBe('maintain');
    expect(out.weightKg).toBe(80);
  });

  it('trata RIR 0 como fallo: baja, suma 60 s y avisa', () => {
    const out = plan([set(80, 6, 0)]);
    expect(out.action).toBe('down');
    expect(out.weightKg).toBe(77.5);
    expect(out.restSec).toBe(180);
    expect(out.reason).toContain('RIR 0');
  });

  it('no cambia el peso si falta el RIR', () => {
    const out = plan([set(80, 8, null)]);
    expect(out.action).toBe('maintain');
    expect(out.weightKg).toBe(80);
    expect(out.reason).toContain('Sin RIR');
  });

  it('no cambia el peso si la serie está sin confirmar', () => {
    const out = plan([set(80, 8, 2, { unconfirmed: true })]);
    expect(out.action).toBe('maintain');
    expect(out.weightKg).toBe(80);
    expect(out.reason).toContain('sin confirmar');
  });

  it('progresa peso corporal por reps sin inventar peso', () => {
    const out = plan([set(0, 10, 4)], {
      ex: ex({ loadType: 'bodyweight', equipment: 'Peso corporal' }),
      startPlan: startPlan({ weightKg: 0, loadType: 'bodyweight' }),
    });
    expect(out.action).toBe('bodyweight');
    expect(out.weightKg).toBe(0);
    expect(out.reps).toBe(11);
  });

  it('sin historial mantiene el plan y no inventa el primer peso', () => {
    const out = nextSetPlan({
      data: data(),
      ex: ex(),
      sets: [],
      setIndex: 0,
      totalSets: 3,
      startPlan: startPlan({ weightKg: 0 }),
      restTarget: 120,
    });
    expect(out.weightKg).toBe(0);
    expect(out.action).toBe('maintain');
  });

  it('respeta kg/lb y redondea mancuernas al salto disponible', () => {
    const lbGym = { ...GYM, unit: 'lb', dumbbellStep: 5 };
    const out = nextSetPlan({
      data: { ...data(), unit: 'lb', gym: lbGym },
      ex: ex({ loadType: 'dumbbell', equipment: 'Mancuernas' }),
      sets: [set(22.68, 10, 4)],
      setIndex: 0,
      totalSets: 3,
      startPlan: startPlan({ weightKg: 22.68, loadType: 'dumbbell' }),
      restTarget: 120,
    });
    expect(out.action).toBe('up');
    expect(out.weightKg).toBeCloseTo(24.95, 2);
  });

  it('redondea el peso al equipo real (barra y discos)', () => {
    const out = plan([set(60, 8, 4)]);
    expect(out.action).toBe('up');
    expect(out.weightKg).toBe(62.5);
  });

  it('detecta un día flojo en la primera serie y sube el RIR objetivo', () => {
    const history = [workout(NOW - 864e5, [set(100, 8, 2)])];
    const out = nextSetPlan({
      data: data(history),
      ex: ex(),
      sets: [set(80, 8, 2)],
      setIndex: 0,
      totalSets: 3,
      startPlan: startPlan(),
      restTarget: 120,
    });
    expect(out.readiness).toBe('low');
    expect(out.action).toBe('maintain');
    expect(out.weightKg).toBe(80);
    expect(out.rir).toBe(3);
    expect(out.volumeNote).toContain('serie menos');
  });

  it('detecta un día fuerte en la primera serie y sube un paso', () => {
    const history = [workout(NOW - 864e5, [set(70, 8, 2)])];
    const out = nextSetPlan({
      data: data(history),
      ex: ex(),
      sets: [set(100, 8, 3)],
      setIndex: 0,
      totalSets: 3,
      startPlan: startPlan({ weightKg: 100 }),
      restTarget: 120,
    });
    expect(out.readiness).toBe('high');
    expect(out.action).toBe('up');
    expect(out.weightKg).toBe(102.5);
  });

  it('suma 30 s si el descanso real fue corto', () => {
    const out = nextSetPlan({
      data: data(),
      ex: ex(),
      sets: [set(80, 8, 2), set(80, 8, 2, { restBeforeSec: 60 })],
      setIndex: 1,
      totalSets: 3,
      startPlan: startPlan(),
      restTarget: 120,
    });
    expect(out.restSec).toBe(150);
    expect(out.restNote).toContain('subo el siguiente descanso');
  });

  it('no cambia peso si el descanso real fue muy largo', () => {
    const out = nextSetPlan({
      data: data(),
      ex: ex(),
      sets: [set(80, 8, 2), set(80, 10, 4, { restBeforeSec: 200 })],
      setIndex: 1,
      totalSets: 3,
      startPlan: startPlan(),
      restTarget: 120,
    });
    expect(out.action).toBe('maintain');
    expect(out.weightKg).toBe(80);
    expect(out.restNote).toContain('no cambio el peso');
  });

  it('en la última serie no genera otra serie y devuelve resumen', () => {
    const out = nextSetPlan({
      data: data(),
      ex: ex(),
      sets: [set(80, 8, 2), set(80, 8, 2), set(80, 8, 2)],
      setIndex: 2,
      totalSets: 3,
      startPlan: startPlan(),
      restTarget: 120,
    });
    expect(out.done).toBe(true);
    expect(out.action).toBe('summary');
    expect(out.weightKg).toBeNull();
    expect(out.summary).toBeTruthy();
  });
});

describe('autoreg: próxima sesión', () => {
  it('sin series confirmadas no inventa peso', () => {
    const out = nextSessionPlan({ data: data(), ex: ex(), sessionSets: [] });
    expect(out.action).toBe('start');
    expect(out.weightKg).toBeNull();
  });

  it('sube el peso si sobró margen en todas las series', () => {
    const out = nextSessionPlan({
      data: data(),
      ex: ex(),
      sessionSets: [set(80, 10, 4), set(80, 9, 4)],
    });
    expect(out.action).toBe('up');
    expect(out.weightKg).toBe(82.5);
  });

  it('baja el peso tras una sesión con fallo', () => {
    const out = nextSessionPlan({
      data: data(),
      ex: ex(),
      sessionSets: [set(80, 6, 0), set(80, 5, 0)],
    });
    expect(out.action).toBe('down');
    expect(out.weightKg).toBe(77.5);
  });

  it('mantiene el peso si la sesión quedó en el objetivo', () => {
    const out = nextSessionPlan({
      data: data(),
      ex: ex(),
      sessionSets: [set(80, 8, 2), set(80, 8, 2)],
    });
    expect(out.action).toBe('maintain');
    expect(out.weightKg).toBe(80);
  });

  it('progresa peso corporal por repeticiones', () => {
    const out = nextSessionPlan({
      data: data(),
      ex: ex({ loadType: 'bodyweight', equipment: 'Peso corporal' }),
      sessionSets: [set(0, 12, 4), set(0, 12, 4)],
    });
    expect(out.action).toBe('up');
    expect(out.weightKg).toBe(0);
    expect(out.reps).toBe(13);
  });
});

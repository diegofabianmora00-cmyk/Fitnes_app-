import {
  exerciseReview,
  rescoreWorkouts,
  routineScores,
  sessionReview,
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
};

const makeSet = (w, r, rir = 2, restBeforeSec = 120, unconfirmed = false) => ({
  w,
  r,
  rir,
  failure: rir === 0,
  confirmed: { r: true, w: true, rir: true },
  unconfirmed,
  startedAt: 0,
  endedAt: 0,
  restBeforeSec,
});

const makePerformed = ({ exId = 'press-banca', name = 'Press de banca', sets = [], targetSets = 3, targetReps = 10, targetRestSec = 120, recWeightKg = 60 } = {}) => ({
  exId,
  name,
  targetSets,
  targetReps,
  targetRestSec,
  recWeightKg,
  sets,
});

const makePlan = (over = {}) => ({
  exId: 'press-banca',
  name: 'Press de banca',
  type: 'compuesto',
  targetSets: 3,
  targetReps: 10,
  targetRestSec: 120,
  targetRir: 2,
  recWeightKg: 60,
  ...over,
});

const makeWorkout = (over = {}) => ({
  id: 'w1',
  date: NOW,
  durationSec: 1800,
  routineId: 'r1',
  routineName: 'Empuje',
  prs: [],
  plan: [makePlan()],
  exercises: [makePerformed({ sets: [makeSet(60, 10), makeSet(60, 10), makeSet(60, 10)] })],
  ...over,
});

const data = (workouts = [], profile = {}) => ({
  schemaVersion: 3,
  unit: 'kg',
  profile: { ...BASE_PROFILE, ...profile },
  routines: [],
  workouts,
});

describe('puntaje de sesión v3', () => {
  it('da 100 a una sesión que cumple plan, carga, RIR y descanso', () => {
    const review = sessionReview(data(), makeWorkout());
    expect(review.score).toBe(100);
    expect(review.grade).toBe('Excelente');
    expect(review.v).toBe(5);
    expect(review.partial).toBe(false);
    expect(review.components.map((c) => c.key).sort()).toEqual(['effort', 'load', 'plan', 'rest']);
  });

  it('penaliza un ejercicio que estaba en el plan y no se hizo', () => {
    const workout = makeWorkout({
      plan: [makePlan(), makePlan({ exId: 'press-militar', name: 'Press militar' })],
      exercises: [makePerformed({ sets: [makeSet(60, 10), makeSet(60, 10), makeSet(60, 10)] })],
    });
    const review = sessionReview(data(), workout);
    const plan = review.components.find((c) => c.key === 'plan');
    expect(plan.value).toBeCloseTo(0.5, 2);
    expect(review.score).toBeLessThan(80);
    expect(review.missed).toHaveLength(1);
    expect(review.missed[0].exId).toBe('press-militar');
  });

  it('baja el plan si se hacen menos repeticiones de las previstas', () => {
    const workout = makeWorkout({
      exercises: [makePerformed({ sets: [makeSet(60, 5), makeSet(60, 5), makeSet(60, 5)] })],
    });
    const review = sessionReview(data(), workout);
    const plan = review.components.find((c) => c.key === 'plan');
    expect(plan.value).toBeCloseTo(0.5, 2);
    expect(review.score).toBeLessThan(90);
  });

  it('reparte el peso cuando faltan RIR, descanso o peso recomendado', () => {
    const workout = makeWorkout({
      plan: [makePlan({ recWeightKg: 0 })],
      exercises: [makePerformed({
        recWeightKg: 0,
        sets: [
          { w: 0, r: 10, rir: null, restBeforeSec: null, unconfirmed: false },
          { w: 0, r: 10, rir: null, restBeforeSec: null, unconfirmed: false },
          { w: 0, r: 10, rir: null, restBeforeSec: null, unconfirmed: false },
        ],
      })],
    });
    const review = sessionReview(data(), workout);
    expect(review.components).toHaveLength(1);
    expect(review.components[0].key).toBe('plan');
    expect(review.score).toBe(100);
  });

  it('puntúa datos viejos sin plan y los marca como parciales', () => {
    const workout = makeWorkout({ plan: undefined });
    const review = sessionReview(data(), workout);
    expect(review.partial).toBe(true);
    expect(review.score).toBe(100);
    expect(review.missed).toHaveLength(0);
  });

  it('ignora las series sin confirmar', () => {
    const workout = makeWorkout({
      exercises: [makePerformed({
        sets: [makeSet(60, 10), makeSet(60, 10), makeSet(60, 10, 2, 120, true)],
      })],
    });
    const review = sessionReview(data(), workout);
    const plan = review.components.find((c) => c.key === 'plan');
    expect(plan.value).toBeLessThan(1);
    expect(review.score).toBeLessThan(100);
    expect(review.score).toBeGreaterThan(0);
  });

  it('no evalúa carga en peso corporal', () => {
    const workout = makeWorkout({
      plan: [makePlan({ recWeightKg: 0, targetReps: 12 })],
      exercises: [makePerformed({
        recWeightKg: 0,
        targetReps: 12,
        sets: [makeSet(0, 12), makeSet(0, 12), makeSet(0, 12)],
      })],
    });
    const review = sessionReview(data(), workout);
    expect(review.components.some((c) => c.key === 'load')).toBe(false);
    expect(review.score).toBe(100);
  });

  it('sube el bloque de progreso con una mejora y lo baja con un retroceso', () => {
    const previous = makeWorkout({
      id: 'w0',
      date: NOW - 3 * DAY,
      plan: undefined,
      exercises: [makePerformed({ sets: [makeSet(60, 8), makeSet(60, 8), makeSet(60, 8)] })],
    });
    const better = sessionReview(data([previous]), makeWorkout());
    const worseWorkout = makeWorkout({
      exercises: [makePerformed({ sets: [makeSet(60, 6), makeSet(60, 6), makeSet(60, 6)] })],
    });
    const worse = sessionReview(data([previous]), worseWorkout);
    expect(better.components.find((c) => c.key === 'progress').value).toBe(1);
    expect(worse.components.find((c) => c.key === 'progress').value).toBeLessThan(0.5);
    expect(worse.score).toBeLessThan(better.score);
  });

  it('baja la nota si el RIR se aleja del objetivo', () => {
    const workout = makeWorkout({
      exercises: [makePerformed({ sets: [makeSet(60, 10, 5), makeSet(60, 10, 5), makeSet(60, 10, 5)] })],
    });
    const review = sessionReview(data(), workout);
    const effort = review.components.find((c) => c.key === 'effort');
    expect(effort.value).toBeCloseTo(0.3, 2);
    expect(review.score).toBeLessThan(100);
  });

  it('baja la nota si el descanso se aleja del objetivo, pero descansar de más penaliza menos', () => {
    const workout = makeWorkout({
      exercises: [makePerformed({ sets: [makeSet(60, 10, 2, 300), makeSet(60, 10, 2, 300), makeSet(60, 10, 2, 300)] })],
    });
    const review = sessionReview(data(), workout);
    const rest = review.components.find((c) => c.key === 'rest');
    expect(rest.value).toBeCloseTo(0.7, 2);
    expect(review.score).toBeLessThan(100);
  });

  it('puntúa contra el plan vivo ajustado y no penaliza seguir a Atlas', () => {
    const guide = (weightKg) => ({ weightKg, reps: 10, rir: 2, restSec: 120 });
    const workout = makeWorkout({
      exercises: [makePerformed({
        sets: [
          { ...makeSet(60, 10), guide: guide(60) },
          { ...makeSet(50, 10), guide: guide(50), adjustment: 'Bajé a 50 kg porque la serie 1 quedó a RIR 0.' },
          { ...makeSet(50, 10), guide: guide(50) },
        ],
      })],
    });
    const review = sessionReview(data(), workout);
    expect(review.score).toBe(100);
    expect(review.components.find((c) => c.key === 'load').value).toBe(1);
  });
});

describe('ejercicio y migración de puntajes v4', () => {
  it('exerciseReview usa los mismos bloques, sin progreso', () => {
    const review = exerciseReview(data(), makePerformed({
      targetRir: 2,
      sets: [makeSet(60, 10), makeSet(60, 10), makeSet(60, 10)],
    }));
    expect(review.v).toBe(5);
    expect(review.score).toBe(100);
    expect(review.components.some((c) => c.key === 'progress')).toBe(false);
  });

  it('devuelve sesión protegida si el ajuste es por dolor', () => {
    const workout = makeWorkout({ adjusted: { reason: 'dolor' } });
    const review = sessionReview(data(), workout);
    expect(review.score).toBeNull();
    expect(review.grade).toBe('Sesión protegida');
    expect(review.v).toBe(5);
  });

  it('devuelve datos insuficientes si no hay series confirmadas', () => {
    const workout = makeWorkout({
      exercises: [makePerformed({ sets: [] })],
    });
    const review = sessionReview(data(), workout);
    expect(review.score).toBeNull();
    expect(review.grade).toBe('Datos insuficientes');
    expect(review.v).toBe(5);
  });

  it('rescoreWorkouts recalcula viejos a v5 y es idempotente', () => {
    const old = makeWorkout({ score: { score: 12, v: 3 } });
    const first = rescoreWorkouts(data([old]));
    const second = rescoreWorkouts(first);
    expect(first.workouts[0].score.v).toBe(5);
    expect(first.workouts[0].score.score).toBeGreaterThan(0);
    expect(second.workouts[0].score.score).toBe(first.workouts[0].score.score);
  });
});

describe('puntaje por rutina', () => {
  it('agrupa por rutina, calcula media, última, mejor y constancia', () => {
    const d = {
      ...data([
        makeWorkout({ id: 'w2', date: NOW, score: { score: 90, v: 3 } }),
        makeWorkout({ id: 'w1', date: NOW - DAY, score: { score: 80, v: 3 } }),
      ]),
      routines: [{ id: 'r1', name: 'Empuje', days: [0, 3] }],
    };
    const list = routineScores(d, NOW);
    expect(list).toHaveLength(1);
    expect(list[0].name).toBe('Empuje');
    expect(list[0].sessions).toBe(2);
    expect(list[0].avgScore).toBe(85);
    expect(list[0].lastScore).toBe(90);
    expect(list[0].bestScore).toBe(90);
    expect(list[0].consistency).toBe(25);
    expect(list[0].trend).toBeNull();
  });
});

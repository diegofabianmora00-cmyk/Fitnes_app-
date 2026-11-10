import { calculateFacts, getCoachMessage } from '../coachMemory';

const DAY = 86400000;
const NOW = 1760000000000; // Fixed timestamp for tests

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

const makeWorkout = (date, exercises) => ({
  id: `w-${date}`,
  date,
  routineId: 'r1',
  routineName: 'Rutina',
  startedAt: date,
  endedAt: date,
  durationSec: 3600,
  exercises,
});

describe('coachMemory', () => {
  describe('calculateFacts', () => {
    it('retorna valores vacios con historial vacio', () => {
      const facts = calculateFacts({ workouts: [] }, NOW);
      expect(facts.hasHistory).toBe(false);
      expect(facts.streak).toBe(0);
      expect(facts.costExercises).toEqual([]);
      expect(facts.improvedExercises).toEqual([]);
    });

    it('calcula racha, dias desde ultimo y ejercicios con costo/mejora', () => {
      const w1 = makeWorkout(NOW - 10 * DAY, [
        { exId: 'press', name: 'Press', targetReps: 8, sets: [makeSet(50, 8), makeSet(50, 8)] },
      ]);
      const w2 = makeWorkout(NOW - 3 * DAY, [
        { exId: 'press', name: 'Press', targetReps: 8, sets: [makeSet(50, 6, 0), makeSet(50, 6, 0)] },
      ]);

      const data = { workouts: [w2, w1] };
      const facts = calculateFacts(data, NOW);

      expect(facts.hasHistory).toBe(true);
      expect(facts.daysSinceLast).toBe(3);
      expect(facts.costExercises.length).toBeGreaterThan(0);
      expect(facts.costExercises[0].exId).toBe('press');
    });

    it('usa la serie actual cuando se la pasa en vivo', () => {
      const facts = calculateFacts({ workouts: [] }, NOW, {
        name: 'Press de banca',
        targetReps: 10,
        set: { w: 60, r: 9, rir: 0 },
      });
      expect(facts.currentSet).toEqual({
        name: 'Press de banca',
        reps: 9,
        rir: 0,
        weightKg: 60,
        targetReps: 10,
        adjustment: null,
      });
      const res = getCoachMessage('tras_serie', facts, 'directo', []);
      expect(res.id).toBe('tras_serie_actual');
      expect(res.texto).toContain('9 reps');
      expect(res.texto).toContain('RIR 0');
    });
  });

  describe('getCoachMessage', () => {
    it('con historial vacio devuelve mensaje neutro', () => {
      const facts = calculateFacts({ workouts: [] }, NOW);
      const res = getCoachMessage('inicio', facts, 'directo', []);
      expect(res.id).toBe('neutral_fallback');
      expect(res.texto).toBe('Listo para continuar.');
    });

    it('cada tono produce un texto distinto para el mismo hecho', () => {
      const facts = {
        hasHistory: true,
        streak: 3,
        monthWorkouts: 4,
        costExercises: [],
        improvedExercises: [],
        daysSinceLast: 1,
      };

      const msgDirecto = getCoachMessage('inicio', facts, 'directo', []);
      const msgMotivador = getCoachMessage('inicio', facts, 'motivador', []);
      const msgTranquilo = getCoachMessage('inicio', facts, 'tranquilo', []);

      expect(msgDirecto.texto).not.toBe(msgMotivador.texto);
      expect(msgMotivador.texto).not.toBe(msgTranquilo.texto);
      expect(msgDirecto.texto).toContain('3');
    });

    it('no repite ids recientes si hay otra plantilla valida', () => {
      const facts = {
        hasHistory: true,
        streak: 3,
        monthWorkouts: 2,
        costExercises: [],
        improvedExercises: [{ exId: 'press', name: 'Press' }],
        daysSinceLast: 1,
      };

      const res1 = getCoachMessage('inicio', facts, 'directo', []);
      const res2 = getCoachMessage('inicio', facts, 'directo', [res1.id]);

      expect(res1.id).not.toBe(res2.id);
    });

    it('una plantilla con hechos ausentes nunca se usa', () => {
      const facts = {
        hasHistory: true,
        streak: 0,
        monthWorkouts: 0,
        costExercises: [],
        improvedExercises: [],
        daysSinceLast: 1,
      };

      const res = getCoachMessage('inicio', facts, 'directo', []);
      expect(res.id).toBe('neutral_fallback');
    });
  });
});

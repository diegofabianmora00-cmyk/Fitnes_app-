import { evaluateSession } from '../sessionMonitor';

const profile = { goal: 'hipertrofia', level: 'principiante' };

describe('sessionMonitor', () => {
  test('detects pain and returns high severity alert', () => {
    const state = { pain: true, setsSinceLastAlert: 5 };
    const alert = evaluateSession(state, [], profile, []);
    expect(alert).not.toBeNull();
    expect(alert.code).toBe('pain_stop');
    expect(alert.severity).toBe('high');
    expect(typeof alert.action.apply).toBe('function');
  });

  test('detects return after 14+ days with reduced next load', () => {
    const state = { daysSinceLastSession: 14, alertHistory: [], setsSinceLastAlert: 5 };
    const alert = evaluateSession(state, [{ recWeightKg: 100 }], profile, []);
    expect(alert).not.toBeNull();
    expect(alert.code).toBe('return_pause');
    expect(alert.action.next.weightKg).toBeLessThan(100);
  });

  test('heavy load with too few reps drops at least 15% and restores target reps', () => {
    const state = {
      currentExerciseIndex: 0,
      exercisesPerformed: [
        {
          targetReps: 10,
          sets: [{ w: 100, r: 3, rir: 0, unconfirmed: false }],
        },
      ],
      alertHistory: [],
      setsSinceLastAlert: 3,
    };
    const alert = evaluateSession(state, [], profile, []);
    expect(alert).not.toBeNull();
    expect(alert.code).toBe('load_too_heavy');
    expect(alert.action.next.weightKg).toBeLessThanOrEqual(85);
    expect(alert.action.next.reps).toBe(10);
  });

  test('heavy load ignores inflated RIR when reps are far below target', () => {
    const base = {
      currentExerciseIndex: 0,
      alertHistory: [],
      setsSinceLastAlert: 3,
    };
    const withHighRir = evaluateSession({
      ...base,
      exercisesPerformed: [{ targetReps: 10, sets: [{ w: 100, r: 3, rir: 4, unconfirmed: false }] }],
    }, [], profile, []);
    const withLowRir = evaluateSession({
      ...base,
      exercisesPerformed: [{ targetReps: 10, sets: [{ w: 100, r: 3, rir: 0, unconfirmed: false }] }],
    }, [], profile, []);
    expect(withHighRir.code).toBe('load_too_heavy');
    expect(withHighRir.action.next.weightKg).toBeCloseTo(withLowRir.action.next.weightKg, 1);
    expect(withHighRir.action.next.weightKg).toBeLessThanOrEqual(85);
  });

  test('detects too light with one set of many extra reps and suggests more weight', () => {
    const state = {
      currentExerciseIndex: 0,
      exercisesPerformed: [
        {
          targetReps: 10,
          sets: [{ w: 40, r: 15, rir: 1, unconfirmed: false }],
        },
      ],
      alertHistory: [],
      setsSinceLastAlert: 3,
    };
    const alert = evaluateSession(state, [], profile, []);
    expect(alert).not.toBeNull();
    expect(alert.code).toBe('load_too_light');
    expect(alert.action.next.weightKg).toBeGreaterThan(40);
  });

  test('detects very light weight from high RIR across sets', () => {
    const state = {
      currentExerciseIndex: 0,
      exercisesPerformed: [
        {
          targetReps: 10,
          sets: [
            { w: 40, r: 10, rir: 4, unconfirmed: false },
            { w: 40, r: 10, rir: 4, unconfirmed: false },
          ],
        },
      ],
      alertHistory: [],
      setsSinceLastAlert: 3,
    };
    const alert = evaluateSession(state, [], profile, []);
    expect(alert).not.toBeNull();
    expect(alert.code).toBe('load_too_light');
    expect(alert.action.next.weightKg).toBeGreaterThan(40);
  });

  test('detects heavy load drop (>25% reps drop)', () => {
    const state = {
      currentExerciseIndex: 0,
      exercisesPerformed: [
        {
          targetReps: 10,
          sets: [
            { w: 60, r: 12, rir: 2, unconfirmed: false },
            { w: 60, r: 9, rir: 2, unconfirmed: false },
          ],
        },
      ],
      alertHistory: [],
      setsSinceLastAlert: 3,
    };
    const alert = evaluateSession(state, [], profile, []);
    expect(alert).not.toBeNull();
    expect(alert.code).toBe('heavy_drop');
  });

  test('returns null when cooling down (setsSinceLastAlert < 2)', () => {
    const state = {
      daysSinceLastSession: 14,
      alertHistory: [],
      setsSinceLastAlert: 1,
    };
    const alert = evaluateSession(state, [], profile, []);
    expect(alert).toBeNull();
  });
});

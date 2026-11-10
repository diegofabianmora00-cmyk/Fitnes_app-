import {
  GYM_DEFAULT,
  defaultLoadType,
  totalFromInputs,
  plateBreakdown,
  nearestLoadable,
  volumeFactor,
} from '../load';
import { exerciseById } from '../exercises';
import { migrate } from '../store';

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
}));

describe('Load system and pure logic (src/load.js)', () => {
  test('defaultLoadType deduces correctly and handles explicit overrides (prensa, hack, hip-thrust-maquina)', () => {
    expect(defaultLoadType('Barra', 'press-banca')).toBe('barbell');
    expect(defaultLoadType('Mancuernas', 'press-banca-mancuernas')).toBe('dumbbell');
    expect(defaultLoadType('Máquina', 'peck-deck')).toBe('stack');
    expect(defaultLoadType('Polea', 'jalon-al-pecho')).toBe('stack');
    expect(defaultLoadType('Peso corporal', 'dominadas')).toBe('bodyweight');
    expect(defaultLoadType('Máquina', 'prensa')).toBe('plates');
    expect(defaultLoadType('Máquina', 'hack-squat')).toBe('plates');
    expect(defaultLoadType('Máquina', 'hip-thrust-maquina')).toBe('plates');
  });

  test('totalFromInputs calculates totals for each load type correctly', () => {
    // Barbell: bar 20 + 2 * (20 + 5) = 70
    const barbellTotal = totalFromInputs('barbell', { platesPerSide: [20, 5], barKg: 20 }, GYM_DEFAULT);
    expect(barbellTotal).toBe(70);

    // Dumbbell: one dumbbell weight
    const dumbbellTotal = totalFromInputs('dumbbell', 15, GYM_DEFAULT);
    expect(dumbbellTotal).toBe(15);

    // Stack: selector value
    const stackTotal = totalFromInputs('stack', 50, GYM_DEFAULT);
    expect(stackTotal).toBe(50);

    // Plates: plates + carriage if counted
    const platesTotal = totalFromInputs('plates', { platesPerSide: [20, 20], baseKg: 40 }, { ...GYM_DEFAULT, countCarriage: true, carriageKg: 40 });
    expect(platesTotal).toBe(120); // 40 carriage + 2 * (20 + 20) = 120

    // Bodyweight: ballast (+10) or assistance (-15)
    expect(totalFromInputs('bodyweight', 10, GYM_DEFAULT)).toBe(10);
    expect(totalFromInputs('bodyweight', -15, GYM_DEFAULT)).toBe(-15);

    // Plain: number
    expect(totalFromInputs('plain', 42, GYM_DEFAULT)).toBe(42);
  });

  test('plateBreakdown computes plates per side and actual total correctly', () => {
    const res = plateBreakdown(70, 20, [25, 20, 15, 10, 5, 2.5, 1.25]);
    expect(res.actualTotal).toBe(70);
    expect(res.perSide).toBe(25);
    expect(res.platesPerSide).toEqual([25]);

    const res2 = plateBreakdown(100, 20, [25, 20, 15, 10, 5, 2.5, 1.25]);
    expect(res2.actualTotal).toBe(100);
  });

  test('nearestLoadable rounds target to armable weight with/without small plates in kg and lb', () => {
    const nearBar = nearestLoadable('barbell', 68, GYM_DEFAULT);
    expect(typeof nearBar).toBe('number');

    const nearDb = nearestLoadable('dumbbell', 14.3, GYM_DEFAULT);
    expect(nearDb).toBe(14);

    const nearStack = nearestLoadable('stack', 53, GYM_DEFAULT);
    expect(nearStack).toBe(55);

    const gymLb = { ...GYM_DEFAULT, unit: 'lb', dumbbellStep: 5, stackStep: 10 };
    const nearLbDb = nearestLoadable('dumbbell', 22, gymLb);
    expect(nearLbDb).toBe(20);
  });

  test('volumeFactor identifies two-hand dumbbells vs unilateral', () => {
    const pressManc = exerciseById('press-banca-mancuernas');
    expect(volumeFactor(pressManc)).toBe(2);

    const remoManc = exerciseById('remo-mancuerna');
    expect(volumeFactor(remoManc)).toBe(1);

    const zancadas = exerciseById('zancadas');
    expect(volumeFactor(zancadas)).toBe(1);

    const pressBanca = exerciseById('press-banca');
    expect(volumeFactor(pressBanca)).toBe(1);
  });

  test('migration to schemaVersion 6 preserves existing w weights untouched', () => {
    const oldData = {
      schemaVersion: 4,
      workouts: [
        {
          id: 'w1',
          date: 1000,
          exercises: [
            {
              exId: 'press-banca',
              sets: [{ w: 80, r: 10, rir: 2 }],
            },
          ],
        },
      ],
    };

    const migrated = migrate(oldData);
    expect(migrated.schemaVersion).toBe(6);
    expect(migrated.gym).toBeDefined();
    expect(migrated.workouts[0].exercises[0].sets[0].w).toBe(80);
    expect(migrated.workouts[0].exercises[0].loadType).toBe('barbell');
    expect(migrated.workouts[0].exercises[0].sets[0].guide).toBeNull();
  });

  test('migration to schemaVersion 6 normalizes live guides and keeps old sets working', () => {
    const oldData = {
      schemaVersion: 5,
      workouts: [
        {
          id: 'w1',
          date: 1000,
          exercises: [
            {
              exId: 'press-banca',
              sets: [
                { w: 80, r: 10, rir: 2, guide: { weightKg: '80', reps: '10', rir: '2', restSec: '120' }, adjustment: 'Subí un paso.' },
                { w: 80, r: 8, rir: 1 },
              ],
            },
          ],
        },
      ],
    };

    const migrated = migrate(oldData);
    const sets = migrated.workouts[0].exercises[0].sets;
    expect(migrated.schemaVersion).toBe(6);
    expect(sets[0].guide).toEqual({ weightKg: 80, reps: 10, rir: 2, restSec: 120 });
    expect(sets[0].adjustment).toBe('Subí un paso.');
    expect(sets[1].guide).toBeNull();
    expect(sets[1].w).toBe(80);
  });
});

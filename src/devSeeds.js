// Seeds de historial para las pruebas de desarrollo (solo se usan con __DEV__ en Settings).

const DAY = 86400000;
const NOW = Date.now();

const mkSet = (w, r, rir = 2, restBeforeSec = 120) => ({
  w: String(w),
  r: String(r),
  rir,
  failure: rir === 0,
  startedAt: NOW,
  endedAt: NOW,
  restBeforeSec,
  confirmed: { r: true, w: true, rir: true },
  unconfirmed: false,
  done: true,
  pr: false,
  active: false,
});

const mkSets = (w, r, rir = 2, restBeforeSec = 120, n = 3) => Array.from({ length: n }, () => mkSet(w, r, rir, restBeforeSec));

const mkEx = (e) => ({
  exId: e.exId,
  name: e.name,
  group: e.group || "",
  equipment: e.equipment || "",
  type: e.type || "compuesto",
  targetReps: e.reps,
  targetSets: e.sets,
  targetRestSec: e.rest,
  recWeightKg: e.recW,
  sets: e.setList,
});

const workout = (daysAgo, exList, routineName = "Rutina") => ({
  id: "w-" + Math.round(daysAgo),
  date: NOW - daysAgo * DAY,
  startedAt: NOW - daysAgo * DAY,
  endedAt: NOW - daysAgo * DAY + 1500,
  durationSec: 1500,
  routineId: "r1",
  routineName,
  prs: [],
  score: { score: 80, grade: "Bien", components: [], restNotes: [], durationSec: 1500 },
  exercises: exList,
});

const baseProfile = (over = {}) => ({
  completed: true,
  goal: "hipertrofia",
  ambition: "progresar",
  level: "intermedio",
  daysPerWeek: 3,
  weightKg: 80,
  heightCm: 178,
  age: 30,
  sex: "hombre",
  restStyle: "equilibrado",
  updatedAt: NOW,
  ...over,
});

const pressRoutine = () => ({
  id: "r1",
  name: "Empuje",
  exercises: [{ id: "press-banca", name: "Press de banca", group: "Pecho", equipment: "Barra", sets: 3, reps: 8 }],
});

const domRoutine = () => ({
  id: "r2",
  name: "Pull",
  exercises: [{ id: "dominadas", name: "Dominadas", group: "Espalda", equipment: "Peso corporal", sets: 3, reps: 12 }],
});

export const DEV_SEEDS = [
  {
    id: "subiendo-bien",
    label: "Subiendo bien",
    data: {
      schemaVersion: 2,
      unit: "kg",
      profile: baseProfile(),
      routines: [pressRoutine()],
      workouts: [
        workout(2, [mkEx({ exId: "press-banca", name: "Press de banca", group: "Pecho", equipment: "Barra", reps: 8, sets: 3, rest: 120, recW: 60, setList: mkSets(60, 10, 2, 150) })]),
        workout(9, [mkEx({ exId: "press-banca", name: "Press de banca", group: "Pecho", equipment: "Barra", reps: 8, sets: 3, rest: 120, recW: 60, setList: mkSets(60, 8, 2, 150) })]),
      ],
    },
  },
  {
    id: "estancado",
    label: "Estancado 3 sesiones con el mismo peso",
    data: {
      schemaVersion: 2,
      unit: "kg",
      profile: baseProfile(),
      routines: [pressRoutine()],
      workouts: [
        workout(5, [mkEx({ exId: "press-banca", name: "Press de banca", group: "Pecho", equipment: "Barra", reps: 8, sets: 3, rest: 120, recW: 60, setList: mkSets(60, 8, 0, 120) })]),
        workout(12, [mkEx({ exId: "press-banca", name: "Press de banca", group: "Pecho", equipment: "Barra", reps: 8, sets: 3, rest: 120, recW: 60, setList: mkSets(60, 8, 0, 120) })]),
        workout(20, [mkEx({ exId: "press-banca", name: "Press de banca", group: "Pecho", equipment: "Barra", reps: 8, sets: 3, rest: 120, recW: 60, setList: mkSets(60, 8, 0, 120) })]),
      ],
    },
  },
  {
    id: "rir-cero",
    label: "RIR 0 repetido",
    data: {
      schemaVersion: 2,
      unit: "kg",
      profile: baseProfile(),
      routines: [pressRoutine()],
      workouts: [
        workout(2, [mkEx({ exId: "press-banca", name: "Press de banca", group: "Pecho", equipment: "Barra", reps: 8, sets: 3, rest: 120, recW: 60, setList: mkSets(60, 8, 0, 120) })]),
        workout(8, [mkEx({ exId: "press-banca", name: "Press de banca", group: "Pecho", equipment: "Barra", reps: 8, sets: 3, rest: 120, recW: 60, setList: mkSets(60, 8, 0, 120) })]),
      ],
    },
  },
  {
    id: "descansos-cortos",
    label: "Descansos muy cortos",
    data: {
      schemaVersion: 2,
      unit: "kg",
      profile: baseProfile(),
      routines: [pressRoutine()],
      workouts: [
        workout(1, [mkEx({ exId: "press-banca", name: "Press de banca", group: "Pecho", equipment: "Barra", reps: 8, sets: 3, rest: 120, recW: 60, setList: mkSets(60, 8, 2, 30) })]),
      ],
    },
  },
  {
    id: "sin-entrenar",
    label: "14 dZZDIAZas sin entrenar",
    data: {
      schemaVersion: 2,
      unit: "kg",
      profile: baseProfile(),
      routines: [pressRoutine()],
      workouts: [
        workout(16, [mkEx({ exId: "press-banca", name: "Press de banca", group: "Pecho", equipment: "Barra", reps: 8, sets: 3, rest: 120, recW: 60, setList: mkSets(60, 8, 2, 120) })]),
      ],
    },
  },
  {
    id: "perfil-lb",
    label: "Perfil en lb",
    data: {
      schemaVersion: 2,
      unit: "lb",
      profile: baseProfile({ weightKg: 80 }),
      routines: [pressRoutine()],
      workouts: [
        workout(3, [mkEx({ exId: "press-banca", name: "Press de banca", group: "Pecho", equipment: "Barra", reps: 8, sets: 3, rest: 120, recW: 60, setList: mkSets(60, 8, 2, 120) })]),
      ],
    },
  },
  {
    id: "bodyweight",
    label: "Ejercicio de peso corporal",
    data: {
      schemaVersion: 2,
      unit: "kg",
      profile: baseProfile(),
      routines: [domRoutine()],
      workouts: [
        workout(4, [mkEx({ exId: "dominadas", name: "Dominadas", group: "Espalda", equipment: "Peso corporal", reps: 12, sets: 3, rest: 90, recW: 0, setList: mkSets(0, 12, 2, 90) })]),
      ],
    },
  },
  {
    id: "sin-peso",
    label: "Perfil sin peso corporal",
    data: {
      schemaVersion: 2,
      unit: "kg",
      profile: baseProfile({ weightKg: 0 }),
      routines: [pressRoutine()],
      workouts: [],
    },
  },
];

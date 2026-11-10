// Base de datos de ejercicios básicos con pesas (paso 1).
//
// Fuente de MET/calorías:
// Herrmann SD, Willis EA, Ainsworth BE, et al. 2024 Adult Compendium of
// Physical Activities: A third update of the energy costs of human activities.
// Journal of Sport and Health Science, 2024;13(1):6-12.
// El Compendium da valores por categoría, no por ejercicio: cada ejercicio usa
// la categoría que le corresponde y la app no inventa valores.
//
// Grupo muscular y equipo: clasificación anatómica estándar (sin fuente única).

import { defaultLoadType } from './load';

export const COMPENDIUM =
  'Herrmann et al., 2024. 2024 Adult Compendium of Physical Activities. ' +
  'Journal of Sport and Health Science 13(1):6-12.';

// Categorías del Compendium usadas en la base de datos.
export const METS = {
  bodyweight: { met: 3.0, code: '02056', label: 'Ejercicio con peso corporal' },
  weights: { met: 3.5, code: '02054', label: 'Entrenamiento con pesas, varios ejercicios' },
  squatsDeads: { met: 5.0, code: '02052', label: 'Sentadillas y peso muerto' },
  vigorous: { met: 6.0, code: '02050', label: 'Esfuerzo vigoroso (reservado para la sesión)' },
};

export const GROUPS = [
  'Todos', 'Pecho', 'Espalda', 'Hombros', 'Bíceps', 'Tríceps',
  'Piernas', 'Glúteos', 'Core', 'Trapecio', 'Antebrazo',
];

const make = (id, name, group, equipment, type, muscles, metKey) => {
  const m = METS[metKey];
  return {
    id,
    name,
    group,
    equipment,
    type,
    muscles,
    loadType: defaultLoadType(equipment, id),
    met: m.met,
    metCode: m.code,
    source: `MET: ${COMPENDIUM} (código ${m.code}). Grupo y equipo: clasificación anatómica estándar.`,
  };
};

export const exercises = [
  // Pecho
  make('press-banca', 'Press de banca', 'Pecho', 'Barra', 'compuesto', ['Pectoral mayor', 'Deltoides anterior', 'Tríceps'], 'weights'),
  make('press-banca-mancuernas', 'Press de banca con mancuernas', 'Pecho', 'Mancuernas', 'compuesto', ['Pectoral mayor', 'Deltoides anterior', 'Tríceps'], 'weights'),
  make('press-inclinado', 'Press inclinado con barra', 'Pecho', 'Barra', 'compuesto', ['Pectoral superior', 'Deltoides anterior', 'Tríceps'], 'weights'),
  make('press-inclinado-mancuernas', 'Press inclinado con mancuernas', 'Pecho', 'Mancuernas', 'compuesto', ['Pectoral superior', 'Deltoides anterior', 'Tríceps'], 'weights'),
  make('fondos', 'Fondos en paralelas', 'Pecho', 'Peso corporal', 'compuesto', ['Pectoral mayor', 'Tríceps', 'Deltoides anterior'], 'bodyweight'),
  make('aperturas-mancuernas', 'Aperturas con mancuernas', 'Pecho', 'Mancuernas', 'aislamiento', ['Pectoral mayor', 'Deltoides anterior'], 'weights'),
  make('peck-deck', 'Peck deck', 'Pecho', 'Máquina', 'aislamiento', ['Pectoral mayor'], 'weights'),
  make('press-declinado', 'Press declinado con barra', 'Pecho', 'Barra', 'compuesto', ['Pectoral inferior', 'Tríceps'], 'weights'),
  make('press-declinado-mancuernas', 'Press declinado con mancuernas', 'Pecho', 'Mancuernas', 'compuesto', ['Pectoral inferior', 'Tríceps'], 'weights'),
  make('cruces-polea', 'Cruce de poleas', 'Pecho', 'Polea', 'aislamiento', ['Pectoral mayor'], 'weights'),
  make('pullover-mancuerna', 'Pullover con mancuerna', 'Pecho', 'Mancuernas', 'aislamiento', ['Pectoral mayor', 'Serrato anterior'], 'weights'),
  make('press-banca-maquina', 'Press de banca en máquina', 'Pecho', 'Máquina', 'compuesto', ['Pectoral mayor', 'Tríceps'], 'weights'),

  // Espalda
  make('dominadas', 'Dominadas', 'Espalda', 'Peso corporal', 'compuesto', ['Dorsal ancho', 'Bíceps', 'Romboides'], 'bodyweight'),
  make('jalon-al-pecho', 'Jalón al pecho', 'Espalda', 'Polea', 'compuesto', ['Dorsal ancho', 'Bíceps', 'Romboides'], 'weights'),
  make('remo-barra', 'Remo con barra', 'Espalda', 'Barra', 'compuesto', ['Dorsal ancho', 'Romboides', 'Trapecio medio', 'Bíceps'], 'weights'),
  make('remo-mancuerna', 'Remo con mancuerna', 'Espalda', 'Mancuernas', 'compuesto', ['Dorsal ancho', 'Romboides', 'Bíceps'], 'weights'),
  make('remo-sentado', 'Remo sentado en polea', 'Espalda', 'Polea', 'compuesto', ['Dorsal ancho', 'Romboides', 'Trapecio medio'], 'weights'),
  make('peso-muerto', 'Peso muerto', 'Espalda', 'Barra', 'compuesto', ['Isquiotibiales', 'Glúteos', 'Erectores espinales', 'Dorsal ancho'], 'squatsDeads'),
  make('hiperextensiones', 'Hiperextensiones', 'Espalda', 'Peso corporal', 'aislamiento', ['Erectores espinales', 'Glúteos', 'Isquiotibiales'], 'bodyweight'),
  make('jalon-tras-nuca', 'Jalón tras la nuca', 'Espalda', 'Polea', 'compuesto', ['Dorsal ancho', 'Redondo mayor', 'Bíceps'], 'weights'),
  make('remo-gironda', 'Remo Gironda (polea baja)', 'Espalda', 'Polea', 'compuesto', ['Dorsal ancho', 'Romboides', 'Trapecio medio', 'Bíceps'], 'weights'),
  make('remo-t', 'Remo con barra en T', 'Espalda', 'Barra', 'compuesto', ['Dorsal ancho', 'Romboides', 'Trapecio', 'Bíceps'], 'weights'),
  make('pulldown-brazos-rectos', 'Pulldown de brazos rectos', 'Espalda', 'Polea', 'aislamiento', ['Dorsal ancho', 'Redondo mayor'], 'weights'),
  make('remo-maquina', 'Remo sentado en máquina', 'Espalda', 'Máquina', 'compuesto', ['Dorsal ancho', 'Romboides', 'Bíceps'], 'weights'),

  // Hombros
  make('press-militar', 'Press militar', 'Hombros', 'Barra', 'compuesto', ['Deltoides anterior', 'Deltoides lateral', 'Tríceps'], 'weights'),
  make('press-mancuernas-sentado', 'Press de hombros con mancuernas', 'Hombros', 'Mancuernas', 'compuesto', ['Deltoides anterior', 'Deltoides lateral', 'Tríceps'], 'weights'),
  make('elevaciones-laterales', 'Elevaciones laterales', 'Hombros', 'Mancuernas', 'aislamiento', ['Deltoides lateral'], 'weights'),
  make('pajaro', 'Pájaro', 'Hombros', 'Mancuernas', 'aislamiento', ['Deltoides posterior', 'Romboides'], 'weights'),
  make('face-pull', 'Face pull', 'Hombros', 'Polea', 'aislamiento', ['Deltoides posterior', 'Romboides', 'Trapecio medio'], 'weights'),
  make('press-arnold', 'Press Arnold con mancuernas', 'Hombros', 'Mancuernas', 'compuesto', ['Deltoides anterior', 'Deltoides lateral', 'Tríceps'], 'weights'),
  make('elevaciones-frontales', 'Elevaciones frontales con mancuernas', 'Hombros', 'Mancuernas', 'aislamiento', ['Deltoides anterior'], 'weights'),
  make('elevaciones-laterales-polea', 'Elevaciones laterales en polea', 'Hombros', 'Polea', 'aislamiento', ['Deltoides lateral'], 'weights'),
  make('press-hombro-maquina', 'Press de hombros en máquina', 'Hombros', 'Máquina', 'compuesto', ['Deltoides', 'Tríceps'], 'weights'),

  // Bíceps
  make('curl-barra', 'Curl con barra', 'Bíceps', 'Barra', 'aislamiento', ['Bíceps braquial', 'Braquial'], 'weights'),
  make('curl-mancuernas', 'Curl con mancuernas', 'Bíceps', 'Mancuernas', 'aislamiento', ['Bíceps braquial', 'Braquial'], 'weights'),
  make('curl-martillo', 'Curl martillo', 'Bíceps', 'Mancuernas', 'aislamiento', ['Braquial', 'Braquiorradial', 'Bíceps'], 'weights'),
  make('curl-predicador', 'Curl predicador', 'Bíceps', 'Barra Z', 'aislamiento', ['Bíceps braquial'], 'weights'),
  make('curl-concentrado', 'Curl concentrado', 'Bíceps', 'Mancuernas', 'aislamiento', ['Bíceps braquial'], 'weights'),
  make('curl-banco-scott-mancuerna', 'Curl en banco Scott con mancuerna', 'Bíceps', 'Mancuernas', 'aislamiento', ['Bíceps braquial'], 'weights'),
  make('curl-inverso', 'Curl inverso con barra', 'Bíceps', 'Barra', 'aislamiento', ['Braquiorradial', 'Bíceps braquial', 'Antebrazo'], 'weights'),
  make('curl-polea-baja', 'Curl de bíceps en polea baja', 'Bíceps', 'Polea', 'aislamiento', ['Bíceps braquial'], 'weights'),

  // Tríceps
  make('press-frances', 'Press francés', 'Tríceps', 'Barra Z', 'aislamiento', ['Tríceps (cabeza larga)'], 'weights'),
  make('extension-triceps-polea', 'Extensión de tríceps en polea', 'Tríceps', 'Polea', 'aislamiento', ['Tríceps'], 'weights'),
  make('fondos-banco', 'Fondos en banco', 'Tríceps', 'Peso corporal', 'compuesto', ['Tríceps', 'Pectoral mayor', 'Deltoides anterior'], 'bodyweight'),
  make('patada-triceps', 'Patada de tríceps', 'Tríceps', 'Mancuernas', 'aislamiento', ['Tríceps'], 'weights'),
  make('extension-triceps-tras-cabeza', 'Extensión de tríceps tras cabeza', 'Tríceps', 'Mancuernas', 'aislamiento', ['Tríceps (cabeza larga)'], 'weights'),
  make('extension-triceps-cuerda', 'Extensión de tríceps con cuerda', 'Tríceps', 'Polea', 'aislamiento', ['Tríceps'], 'weights'),
  make('press-banca-cerrado', 'Press de banca con agarre cerrado', 'Tríceps', 'Barra', 'compuesto', ['Tríceps', 'Pectoral mayor'], 'weights'),
  make('extension-triceps-maquina', 'Extensión de tríceps en máquina', 'Tríceps', 'Máquina', 'aislamiento', ['Tríceps'], 'weights'),

  // Piernas
  make('sentadilla', 'Sentadilla con barra', 'Piernas', 'Barra', 'compuesto', ['Cuádriceps', 'Glúteos', 'Isquiotibiales', 'Erectores espinales'], 'squatsDeads'),
  make('sentadilla-frontal', 'Sentadilla frontal', 'Piernas', 'Barra', 'compuesto', ['Cuádriceps', 'Glúteos', 'Core'], 'squatsDeads'),
  make('prensa', 'Prensa de piernas', 'Piernas', 'Máquina', 'compuesto', ['Cuádriceps', 'Glúteos', 'Isquiotibiales'], 'weights'),
  make('zancadas', 'Zancadas', 'Piernas', 'Mancuernas', 'compuesto', ['Cuádriceps', 'Glúteos', 'Isquiotibiales'], 'weights'),
  make('peso-muerto-rumano', 'Peso muerto rumano', 'Piernas', 'Barra', 'compuesto', ['Isquiotibiales', 'Glúteos', 'Erectores espinales'], 'squatsDeads'),
  make('extension-cuadriceps', 'Extensión de cuádriceps', 'Piernas', 'Máquina', 'aislamiento', ['Cuádriceps'], 'weights'),
  make('curl-femoral', 'Curl femoral', 'Piernas', 'Máquina', 'aislamiento', ['Isquiotibiales'], 'weights'),
  make('elevacion-gemelos', 'Elevación de gemelos', 'Piernas', 'Máquina', 'aislamiento', ['Gastrocnemio', 'Sóleo'], 'weights'),
  make('sentadilla-bulgara', 'Sentadilla búlgara', 'Piernas', 'Mancuernas', 'compuesto', ['Cuádriceps', 'Glúteos', 'Isquiotibiales'], 'weights'),
  make('hack-squat', 'Sentadilla Hack', 'Piernas', 'Máquina', 'compuesto', ['Cuádriceps', 'Glúteos'], 'weights'),
  make('sentadilla-sumo', 'Sentadilla sumo', 'Piernas', 'Barra', 'compuesto', ['Cuádriceps', 'Glúteos', 'Aductores'], 'squatsDeads'),
  make('curl-femoral-sentado', 'Curl femoral sentado', 'Piernas', 'Máquina', 'aislamiento', ['Isquiotibiales'], 'weights'),
  make('sentadilla-copa', 'Sentadilla goblet (copa)', 'Piernas', 'Mancuernas', 'compuesto', ['Cuádriceps', 'Glúteos', 'Core'], 'weights'),
  make('aductores-maquina', 'Aductores en máquina', 'Piernas', 'Máquina', 'aislamiento', ['Aductores'], 'weights'),

  // Glúteos
  make('hip-thrust', 'Hip thrust', 'Glúteos', 'Barra', 'compuesto', ['Glúteos', 'Isquiotibiales'], 'weights'),
  make('patada-gluteo', 'Patada de glúteo', 'Glúteos', 'Polea', 'aislamiento', ['Glúteo mayor'], 'weights'),
  make('puente-gluteo', 'Puente de glúteo', 'Glúteos', 'Peso corporal', 'aislamiento', ['Glúteos', 'Isquiotibiales'], 'bodyweight'),
  make('hip-thrust-maquina', 'Hip thrust en máquina', 'Glúteos', 'Máquina', 'compuesto', ['Glúteos', 'Isquiotibiales'], 'weights'),
  make('abductores-maquina', 'Abductores en máquina', 'Glúteos', 'Máquina', 'aislamiento', ['Glúteo medio', 'Glúteo menor'], 'weights'),

  // Core
  make('crunch-polea', 'Crunch en polea', 'Core', 'Polea', 'aislamiento', ['Recto abdominal', 'Oblicuos'], 'weights'),
  make('plancha', 'Plancha', 'Core', 'Peso corporal', 'aislamiento', ['Recto abdominal', 'Transverso abdominal', 'Oblicuos'], 'bodyweight'),
  make('elevacion-piernas', 'Elevación de piernas', 'Core', 'Peso corporal', 'aislamiento', ['Recto abdominal', 'Iliopsoas'], 'bodyweight'),
  make('rueda-abdominal', 'Rueda abdominal (Ab wheel)', 'Core', 'Peso corporal', 'aislamiento', ['Recto abdominal', 'Transverso abdominal', 'Core'], 'bodyweight'),
  make('elevacion-piernas-colgado', 'Elevación de piernas colgado', 'Core', 'Peso corporal', 'aislamiento', ['Recto abdominal', 'Flexores de cadera'], 'bodyweight'),
  make('plancha-lateral', 'Plancha lateral', 'Core', 'Peso corporal', 'aislamiento', ['Oblicuos', 'Transverso abdominal'], 'bodyweight'),
  make('giros-rusos', 'Giros rusos con peso', 'Core', 'Mancuernas', 'aislamiento', ['Oblicuos', 'Recto abdominal'], 'weights'),

  // Trapecio y antebrazo
  make('encogimientos', 'Encogimientos de hombros', 'Trapecio', 'Mancuernas', 'aislamiento', ['Trapecio superior'], 'weights'),
  make('curl-muneca', 'Curl de muñeca', 'Antebrazo', 'Mancuernas', 'aislamiento', ['Flexores de la muñeca'], 'weights'),
  make('encogimientos-barra', 'Encogimientos con barra', 'Trapecio', 'Barra', 'aislamiento', ['Trapecio superior'], 'weights'),
  make('paseo-granjero', 'Paseo del granjero', 'Antebrazo', 'Mancuernas', 'compuesto', ['Antebrazo', 'Trapecio', 'Core', 'Agarre'], 'weights'),
];

let registeredCustomExercises = [];
export const registerCustomExercises = (list) => {
  registeredCustomExercises = list || [];
};

export const exerciseById = (id) => {
  return exercises.find((e) => e.id === id) || registeredCustomExercises.find((e) => e.id === id) || null;
};

const normalize = (s) =>
  String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

// Filtra por texto (nombre, grupo, equipo o músculos) y por grupo muscular.
export function filterExercises(query = '', group = 'Todos', extraCustom = []) {
  const all = [...exercises, ...registeredCustomExercises, ...extraCustom];
  const map = new Map();
  all.forEach(e => map.set(e.id, e));
  const unique = Array.from(map.values());

  const q = normalize(query.trim());
  return unique.filter((e) => {
    const inGroup = group === 'Todos' || e.group === group;
    if (!inGroup) return false;
    if (!q) return true;
    return normalize(`${e.name} ${e.group} ${e.equipment} ${(e.muscles || []).join(' ')}`).includes(q);
  });
}



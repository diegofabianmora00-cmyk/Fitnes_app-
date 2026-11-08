# Fitness Coach — app móvil Expo / React Native (JavaScript, sin TypeScript)

Visión: entrenador virtual que decide peso, repeticiones y descanso; el usuario solo
levanta. Atlas lee el historial, el descanso real, el RIR y los récords, avisa cuándo
subir, mantener o revisar, y celebra cada PR. Reglas con fuentes, sin inventar pesos.
El usuario no sabe programar; usa Windows y Git. Responde en español, breve.

## Stack
Expo SDK 58, React Native 0.88, JavaScript. Sin Expo Router: la navegación propia está
en App.js. Datos en AsyncStorage (clave fitnesscoach:v1). No existen ios/ ni android/:
no los crees ni los edites.

## Mapa del proyecto (ve directo al archivo, no explores)
- App.js: proveedores, barra de pestañas (TABS: home, routines, progress, settings) y
  overlay de Workout (estado `routine`).
- src/theme.js: colores (objeto C).
- src/ui.js: Press, FadeIn, Card, T (texto), H (título), Btn, Field (input).
- src/store.js: StoreProvider y useStore() → { data, update, ready }. Helpers: uid, KG,
  toU(kg,u), fromU(v,u), lastSets(data,exId) y migrate() (normaliza datos viejos, la
  rutina inicial e1/e2/e3 y recalcula puntajes viejos a v3).
- src/recommend.js: motor puro (sin React). recommendFor, RULES/SOURCES, repRangeFor,
  restFor, frequencyAdvice, restFeedback, personalRecords, newRecords, sessionReview,
  exerciseReview, rescoreWorkouts, routineScores, weekSummary y coachMessage.
- src/Coach.js: Atlas animado. COACH (apariencia) y Coach({ mood, size }):
  mood neutral | happy | alert; size 'sm' | 'lg'.
- src/load.js: sistema de tipos de carga y lógica pura de cálculo (totalFromInputs, plateBreakdown, nearestLoadable, volumeFactor, GYM_DEFAULT).
- src/exercises.js: COMPENDIUM, METS, exercises (79 con loadType), GROUPS, exerciseById,
  filterExercises, registerCustomExercises, kcalPerHour.
- src/ExercisePicker.js: selector con buscador (props: visible, onClose, onSelect, selectedId).
- src/CustomExerciseModal.js: modal para crear un ejercicio propio (nombre, grupo y
  equipo obligatorios; tipo y músculos opcionales). Guarda en data.customExercises.
- src/RuleInfo.js: modal que explica reglas y fuentes.
- src/SessionReview.js: celebración de PR y resumen/puntaje de sesión.
- src/screens/Home.js: mensaje de Atlas, reglas, siguiente rutina, semana.
- src/screens/home/DayHeader.js, AtlasMessage.js, TodayGoal.js, TomorrowCard.js, NearRecordCard.js, QuickSummary.js: componentes modulares de la interfaz de Inicio (estado día de descanso).
- src/screens/Routines.js: pestaña "Mi semana" y asistente de 2 pasos para crear/editar rutinas y configurar ejercicios.
- src/screens/ProfileSetup.js: cuestionario inicial / edición del perfil.
- src/screens/Workout.js: overlay con Iniciar/Terminar serie, descanso real, RIR,
  guardado de la sesión, PR y resumen.
- src/screens/Progress.js: estadísticas, gráfica de área SVG con filtros de métrica y ejercicio, racha, aviso de estancamiento, récords, músculos trabajados e historial paginado.
- src/screens/progress/StreakCard.js, PeriodPicker.js, ProgressChart.js, StatGrid.js, CoachCard.js, PrCard.js, MuscleCard.js, RoutineScoresCard.js, HistoryList.js, SessionDetail.js, EmptyProgress.js: componentes modulares de la interfaz de Progreso.
- src/Settings.js: kg/lb, editar perfil, exportar, borrar datos.
- src/coachMemory.js: cerebro de los mensajes de Atlas (lógica pura y plantillas).
- jest.config.js: preset 'jest-expo' para pruebas.
- src/__tests__/load.test.js: pruebas unitarias de tipos de carga, cálculos, desglose de discos, pesos armables, factor de volumen y migración (jest).
- src/__tests__/recommend.test.js: pruebas unitarias del motor puro (jest).
- src/__tests__/scoring.test.js: pruebas del puntaje de sesión v3, recalculo y puntaje por rutina (jest).
- src/__tests__/coachMemory.test.js: pruebas unitarias del cerebro de mensajes de Atlas (jest).
- docs/decisiones.md: reglas del motor (progresión, estancamiento, descanso, PR, puntaje, e1RM y racha).
- docs/sistema_recomendaciones.txt: explicación simple y exacta del sistema de recomendaciones.

## Datos (pesos siempre en kg)
Claves de AsyncStorage:
- fitnesscoach:v1: datos principales.
- fitnesscoach:v1:copia: última copia válida; se actualiza tras cada carga y guardado
  correcto. Se usa para restaurar si el principal está dañado.
- fitnesscoach:v1:corrupto: texto original ilegible, guardado antes de reparar o avisar.
- fitnesscoach:v1:backup: respaldo legado; solo se usa como segunda opción al restaurar.
- fitnesscoach:v1:draft: borrador del entreno en curso (rutina, inicio, series y posición);
  se borra al terminar o descartar.
data = { schemaVersion: 5, unit, gym: { bars, defaultBarId, platesKg, platesLb, dumbbellStep, stackStep, carriageKg, countCarriage }, checkin: { date, level },
profile: { goal, environment, ambition, level, daysPerWeek, weightKg, heightCm, age, sex,
  activityLevel, jointFocus, restStyle, tone, completed, updatedAt },
coachMemory: [string], // últimos 8 ids de mensajes mostrados por Atlas
customExercises: [{ id, name, group, equipment, type, muscles, loadType, met, metCode, source, custom }], // ejercicios creados por el usuario; se mezclan con exercises de src/exercises.js
routines: [{ id, name, goal, days: [0..6], defaults: { sets, reps, restSec }, exercises: [{ id, name, group, equipment, loadType, sets, reps, mode, rir, restSec }] }], // mode 'default' usa defaults de la rutina; 'manual' usa sets/reps/restSec/rir próprios
workouts: [{ id, date, startedAt, endedAt, durationSec, routineId, routineName, comment,
  adjusted: { reason }, // opcional: cansancio, dolor, poco tiempo, mal sueño
  prs: [{ exId, name, kind, weightKg, reps }],
  plan: [{ exId, name, group, type, loadType, targetReps, targetSets, targetRestSec, targetRir, recWeightKg }], // foto del plan al terminar; incluye ejercicios saltados
  score: { score, grade, components: [{ key, label, value, weight }], restNotes, durationSec, v: 4, partial, missed: [{ exId, name }], adjusted },
  exercises: [{ exId, name, loadType, targetReps, targetSets, targetRestSec, recWeightKg,
    sets: [{ w, r, rir, failure, startedAt, endedAt, restBeforeSec, pr,
      confirmed: { r, w, rir }, unconfirmed }] }] }] }
// sets sin `unconfirmed` son datos viejos válidos; `unconfirmed: true` los excluye de
// motor, PR y puntaje. Pesos en kg; unit ausente se lee como kg. `w` guardado se conserva intacto en la migración a schemaVersion 5.
// `schemaVersion` 5: añade `gym` y `loadType` ('barbell' | 'dumbbell' | 'stack' | 'plates' | 'bodyweight' | 'plain') a ejercicios del catálogo y personalizados.
// `score.v` 4: pesos adaptativos según nivel (principiante vs intermedio), ajuste intencional (`adjusted`), tolerancia al descanso asimétrica (exceso penaliza menos), mínimo de 1 serie confirmada. `partial` marca sesiones viejas sin plan completo.
// workouts: el más reciente primero. El id del ejercicio es el de src/exercises.js.

## Reglas
- Ve directo al archivo del mapa. Abre solo lo que la tarea toque. En archivos grandes
  usa búsquedas y rangos de líneas; no los leas completos.
- Busca cada tarea por su descripción: los números de línea pueden haber cambiado.
  Si algo ya está resuelto, dilo y no lo toques.
- Cambios mínimos; no reescribas archivos enteros sin motivo. No cambies nada que la
  tarea no pida. Si tomas una decisión que no estaba indicada, dila al final.
- No leas package-lock.json, node_modules ni dist.
- Paquetes nuevos: `npx expo install <paquete>` (nunca `npm install <paquete>`). Usa solo
  librerías incluidas en Expo Go (como react-native-svg); evita las demás con código nativo.
- Solo si vas a usar una API de Expo que no esté ya en el proyecto, consulta
  https://docs.expo.dev/versions/v58.0.0/ . En los demás casos no consultes docs.
- No ejecutes `npx expo start` ni `npm install` sin preguntar.
- Para comprobar que compila: `npx expo export --platform android 2>&1 | tail -5` y luego
  borra la carpeta dist. No hay lint ni typecheck configurados.
- Filtra siempre la salida de los comandos (`| tail -5`).
- No hagas commit ni push: el usuario prueba en el celular y lo hace él.
- Los datos ya guardados en el celular deben seguir funcionando: migra, nunca borres
  historial, y lee también los formatos antiguos (unit ausente = kg). Si añades claves de
  AsyncStorage o campos a los datos, documéntalos en la sección Datos.
- Calorías y recomendaciones: con fuente, sin inventar datos. Las heurísticas propias se
  etiquetan como "criterio de la app" y viven en RULES (recommend.js).
- El motor es puro (sin React) y debe funcionar con datos viejos, sin peso, con peso
  corporal y en kg/lb. No inventes el primer peso: sin historial se enseña a elegir con RIR 2-3.
- Animaciones solo con Animated.
- Usa los componentes de src/ui.js y los colores de src/theme.js.
- Si creas, renombras o borras un archivo, actualiza el Mapa. Al terminar un paso,
  actualiza el Estado en 1 o 2 líneas (no es un historial: eso está en git).
- Al terminar: tabla tarea | archivos modificados | estado (hecho / parcial / no hecho),
  y la lista de archivos nuevos y modificados para el commit.
- si algo que se este pidiendo es muy similar a algo que se esta pidiendo otra vez, comunicalo

## Estado
- Hecho: app base, base de ejercicios (79), perfil, motor de recomendación, entrenamiento guiado, calorías, gráficas básicas, pruebas del motor y puntaje (54), rediseño completo de la pestaña Rutinas (+buscador, ejercicios personalizados en data.customExercises, vista de detalle de rutina hecha con descanso, RIR, botón "EDITAR" y reordenamiento de ejercicios con `↑`/`↓`), rediseño completo de la pestaña Progreso (con filtros e historial agrupado por mes), rediseño completo de la pestaña Inicio, puntaje de sesión v4, rediseño completo de la pestaña Ajustes, y Prompt 1 (sistema de tipos de carga: datos, funciones puras, migración a schemaVersion 5 y pruebas unitarias completas).
- Por confirmar: ninguno (tipografía Inter en H y Btn confirmada y cargada correctamente con expo-google-fonts).
- Pendiente: ninguno (prototipo completo y pulido).

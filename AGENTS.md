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
  toU(kg,u), fromU(v,u), lastSets(data,exId) y migrate() (normaliza datos viejos y la
  rutina inicial e1/e2/e3).
- src/recommend.js: motor puro (sin React). recommendFor, RULES/SOURCES, repRangeFor,
  restFor, frequencyAdvice, restFeedback, personalRecords, newRecords, sessionReview,
  weekSummary y coachMessage.
- src/Coach.js: Atlas animado. COACH (apariencia) y Coach({ mood, size }):
  mood neutral | happy | alert; size 'sm' | 'lg'.
- src/exercises.js: COMPENDIUM, METS, exercises (43), GROUPS, exerciseById,
  filterExercises, kcalPerHour.
- src/ExercisePicker.js: selector con buscador (props: visible, onClose, onSelect, selectedId).
- src/RuleInfo.js: modal que explica reglas y fuentes.
- src/SessionReview.js: celebración de PR y resumen/puntaje de sesión.
- src/screens/Home.js: mensaje de Atlas, reglas, siguiente rutina, semana.
- src/screens/Routines.js: lista de rutinas y Editor (modal) con ExercisePicker.
- src/screens/ProfileSetup.js: cuestionario inicial / edición del perfil.
- src/screens/Workout.js: overlay con Iniciar/Terminar serie, descanso real, RIR,
  guardado de la sesión, PR y resumen.
- src/screens/Progress.js: estadísticas, gráfica de barras por ejercicio, historial.
- src/screens/Settings.js: kg/lb, editar perfil, exportar, borrar datos.
- docs/decisiones.md: reglas del motor (progresión, estancamiento, descanso, PR, puntaje).
  Léelo ANTES de tocar recommend.js o el puntaje/PR de Workout.js y SessionReview.js.
- docs/diseno-entrenamiento.md: diseño visual del flujo de entrenamiento. Léelo solo si
  vas a cambiar la interfaz de Workout.

## Datos (pesos siempre en kg; claves de AsyncStorage: fitnesscoach:v1)
data = { schemaVersion: 2, unit,
profile: { goal, ambition, level, daysPerWeek, weightKg, heightCm, age, sex,
  restStyle, completed, updatedAt },
routines: [{ id, name, exercises: [{ id, name, group, equipment, sets, reps }] }],
workouts: [{ id, date, startedAt, endedAt, durationSec, routineId, routineName,
  prs: [{ exId, name, kind, weightKg, reps }],
  score: { score, grade, components, restNotes, durationSec },
  exercises: [{ exId, name, targetReps, targetSets, targetRestSec, recWeightKg,
    sets: [{ w, r, rir, failure, startedAt, endedAt, restBeforeSec, pr }] }] }] }
// workouts: el más reciente primero. El id del ejercicio es el de src/exercises.js.

## Reglas
- Ve directo al archivo del mapa. Abre solo lo que la tarea toque. En archivos grandes
  usa búsquedas y rangos de líneas; no los leas completos.
- Cambios mínimos; no reescribas archivos enteros sin motivo.
- No leas package-lock.json, node_modules ni dist.
- Paquetes nuevos: `npx expo install <paquete>` (nunca `npm install <paquete>`). Usa solo
  librerías incluidas en Expo Go (como react-native-svg); evita las demás con código nativo.
- Solo si vas a usar una API de Expo que no esté ya en el proyecto, consulta
  https://docs.expo.dev/versions/v58.0.0/ . En los demás casos no consultes docs.
- No ejecutes `npx expo start` ni `npm install` sin preguntar.
- Para comprobar que compila: `npx expo export --platform android 2>&1 | tail -5` y luego
  borra la carpeta dist. No hay lint ni typecheck configurados.
- Filtra siempre la salida de los comandos (`| tail -5`).
- No hagas commit ni push: el usuario prueba en el celular y lo hace él. Al terminar,
  lista los archivos nuevos y modificados.
- Los datos ya guardados en el celular deben seguir funcionando: migra, nunca borres
  historial. Si añades claves de AsyncStorage o campos a los datos, documéntalos en Datos.
- Calorías y recomendaciones: con fuente, sin inventar datos. Las heurísticas propias se
  etiquetan como "criterio de la app" y viven en RULES (recommend.js).
- El motor es puro (sin React) y debe funcionar con datos viejos, sin peso, con peso
  corporal y en kg/lb. No inventes el primer peso: sin historial se enseña a elegir con RIR 2-3.
- Animaciones solo con Animated.
- Usa los componentes de src/ui.js y los colores de src/theme.js.
- Si creas, renombras o borras un archivo, actualiza el Mapa. Al terminar un paso,
  actualiza el Estado.

## Estado
- Hecho: app base; paso 1 base de ejercicios y selector; paso 2 cuestionario/perfil;
  paso 3 motor de recomendación; paso 4 entrenamiento guiado paso a paso (anillo SVG,
  steppers, descanso real, kcal por ejercicio, puntaje por ejercicio).
- Hecho: correcciones 1, 2 y 4 (crash al terminar sesión, botón atrás de Android y
  "Salir" con guardar/sseguir/descartar; resumen y PR visibles).
- En curso: resto de los 12 fallos conocidos. Críticos pendientes: borrador de entreno
  y respaldo de datos corruptos. Importantes: descanso al saltar serie, Ring fuera del
  componente, datos sin confirmar, unidades lb, fuente Inter, pestañas montadas,
  botones de 48 px.
- Siguiente: paso 5 calorías visibles, paso 6 gráficas de progreso y estancados.

# Fitness Coach — app móvil Expo / React Native (JavaScript, sin TypeScript)

Visión: entrenador virtual que decide el peso, las repeticiones y el descanso;
el usuario solo levanta. El motor de recomendación es el corazón y el
diferenciador de la app: Atlas lee el historial, el descanso real, el RIR y
los récords, avisa cuándo subir/mantener/revisar, celebra cada PR y guarda
todo. Reglas con fuentes, sin inventar pesos.
El usuario no sabe programar; usa Windows y Git. Responde en español, breve.

## Stack
Expo SDK 58, React Native 0.88, JavaScript. Sin Expo Router: la navegación
propia está en App.js. Datos en AsyncStorage (clave fitnesscoach:v1).
No existen ios/ ni android/: no los crees ni los edites.

## Mapa del proyecto (ve directo al archivo, no explores)
- App.js: proveedores, barra de pestañas (TABS: home, routines, progress,
  settings) y overlay de Workout (estado `routine`).
- src/theme.js: colores (objeto C).
- src/ui.js: Press, FadeIn, Card, T (texto), H (título), Btn, Field (input).
- src/store.js: StoreProvider y useStore() → { data, update, ready }.
  Helpers: uid, KG, toU(kg,u), fromU(v,u), lastSets(data,exId) y migrate()
  (normaliza datos viejos y la rutina inicial e1/e2/e3).
- src/recommend.js: motor puro (sin React). recommendFor, RULES/SOURCES,
  repRangeFor, restFor, frequencyAdvice, restFeedback, personalRecords,
  newRecords, sessionReview, weekSummary y coachMessage.
- src/Coach.js: entrenador animado. COACH (apariencia) y Coach({ mood, size }):
  mood neutral | happy | alert; size 'sm' | 'lg'.
- src/exercises.js: COMPENDIUM, METS, exercises (43), GROUPS, exerciseById,
  filterExercises, kcalPerHour.
- src/ExercisePicker.js: selector con buscador
  (props: visible, onClose, onSelect, selectedId).
- src/RuleInfo.js: modal reutilizable que explica reglas y fuentes.
- src/SessionReview.js: celebración de PR y resumen/puntaje de sesión.
- src/screens/Home.js: mensaje de Atlas, reglas, siguiente rutina, semana.
- src/screens/Routines.js: lista de rutinas y Editor (modal) con ExercisePicker.
- src/screens/ProfileSetup.js: cuestionario inicial/edición del perfil.
- src/screens/Workout.js: overlay con Iniciar/Terminar serie, descanso real,
  RIR, guardado de la sesión, PR y resumen.
- src/screens/Progress.js: estadísticas, gráfica de barras por ejercicio, historial.
- src/screens/Settings.js: kg/lb, editar perfil, exportar, borrar datos.

## Datos (pesos siempre en kg)
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
// Los datos viejos se migran sin borrar historial; la clave sigue siendo fitnesscoach:v1.

## Reglas
- Ve directo al archivo del mapa. Abre solo lo que la tarea toque.
- Cambios mínimos; no reescribas archivos enteros sin motivo.
- No leas package-lock.json, node_modules ni dist.
- Paquetes nuevos: `npx expo install <paquete>` (nunca `npm install <paquete>`).
  Expo Go solo incluye sus módulos nativos: evita librerías con código nativo.
- Solo si vas a usar una API de Expo que no esté ya en el proyecto, consulta
  https://docs.expo.dev/versions/v58.0.0/ . En los demás casos no consultes docs.
- No ejecutes `npx expo start` ni `npm install` sin preguntar.
- Para comprobar que compila: `npx expo export --platform android 2>&1 | tail -5`
  y luego borra la carpeta dist. No hay lint ni typecheck configurados.
- Filtra siempre la salida de los comandos (`| tail -5`).
- Al terminar, lista los archivos nuevos y modificados y pregunta
  «¿Hago commit y push?». Solo haz commit/push si el usuario responde que sí
  (nunca por iniciativa propia ni en el mismo mensaje en que presentas el trabajo).
- Calorías y recomendaciones de entrenamiento: con fuente, sin inventar datos.
  Las heurísticas propias se etiquetan como "criterio de la app" y viven en
  RULES (recommend.js), no se presentan como ciencia.
- El motor es puro (sin React) y debe seguir funcionando con datos viejos,
  sin peso, con peso corporal y en kg/lb.
- No inventar el primer peso: sin historial se enseña a elegir con RIR 2-3.
- Animaciones solo con Animated; no agregar librerías nativas.
- Usa los componentes de src/ui.js y los colores de src/theme.js.
- Si creas, renombras o borras un archivo, actualiza el Mapa del proyecto.
- Al terminar un paso, actualiza la sección Estado.

## Estado
- Hecho: app base; paso 1 base de ejercicios y selector; paso 2 cuestionario/perfil;
  paso 3 motor de recomendación; paso 4 entrenamiento guiado paso a paso
  (6 pantallas, anillo SVG, steppers, descanso real, kcal por ejercicio,
  puntaje por ejercicio).
- Siguiente: paso 5 calorías visibles, paso 6 gráficas de progreso y estancados.
- Pendiente: (ninguno adicional).

## Decisiones
- Subir peso se decide por rendimiento (repeticiones logradas, RIR y cercanía
  al fallo), no solo por tiempo. Con RIR 0 no se sube: se mantiene y se busca
  margen. La ambición define 1/2/3 sesiones cumplidas (maximizar/progresar/mantener);
  la regla 2-for-2 del NSCA respalda las 2 sesiones de "progresar".
- Estancamiento: 3 sesiones con el mismo peso sin mejorar reps, o 14 días sin
  cumplir el objetivo. Es una heurística de la app basada en el ACSM.
- Descanso real: se mide de fin de una serie a inicio de la siguiente. Si se
  desvía más del 20% (mínimo 20 s) del objetivo, Atlas lo avisa; no cambia el
  plan automáticamente.
- PR de peso = serie más pesada con al menos 1 repetición; PR de reps = más
  repeticiones que tu mejor marca a ese mismo peso, aunque no sea el peso máximo;
  en peso corporal, más repeticiones. La primera sesión establece la marca y no
  genera celebración. Un PR de peso y uno de reps pueden celebrarse en la misma sesión.
- Peso corporal: se progresa sumando repeticiones; al llegar al tope del rango,
  Atlas sugiere añadir lastre.
- Puntaje de sesión = 50% repeticiones + 30% peso frente al recomendado + 20%
  descanso; si falta un dato se reparte el peso. Es una fórmula de la app.
- Calorías = MET × peso corporal × horas (Compendium 2024). Son estimaciones.
- Migración: no borrar historial; clave fitnesscoach:v1 y schemaVersion 2.

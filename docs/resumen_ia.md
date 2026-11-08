# Especificación Técnica y Funcional Exhaustiva de Fitness Coach

Este documento constituye una auditoría y especificación técnica de extremo a extremo de la aplicación móvil **Fitness Coach** (Expo SDK 58, React Native 0.88, JavaScript). Está preparado para ser analizado por sistemas de inteligencia artificial para evaluar la integridad, robustez, algoritmos, cobertura funcional y posibles áreas de mejora o expansión de la aplicación.

---

## 1. Arquitectura General y Principios de Diseño
- **Framework**: Expo (Managed Workflow), React Native 0.88.
- **Gestión de Navegación**: Arquitectura propia basada en estados en `App.js` (sin Expo Router). Utiliza una barra de pestañas fija (`Home`, `Routines`, `Progress`, `Settings`) y un overlay dinámico para las sesiones de entrenamiento en curso (`Workout.js`).
- **Persistencia de Datos**: Almacenamiento local mediante `AsyncStorage` bajo la clave principal `fitnesscoach:v1`, con sistemas de respaldo automático (`fitnesscoach:v1:copia`), recuperación ante corrupción (`fitnesscoach:v1:corrupto`), respaldos legados (`fitnesscoach:v1:backup`) y borradores temporales (`fitnesscoach:v1:draft`).
- **Diseño Visual e Interfaz**: Sistema de diseño unificado en `src/ui.js` y paleta de colores en `src/theme.js` con soporte nativo para Modo Oscuro y Modo Claro. Tipografía oficial `Inter` cargada mediante `@expo-google-fonts/inter`.

---

## 2. Estructura de Datos en AsyncStorage (`fitnesscoach:v1`)

El esquema de datos (`schemaVersion: 4`) almacena toda la información del usuario de forma estructurada:

```js
{
  schemaVersion: 4,
  unit: 'kg', // o 'lb'
  checkin: {
    date: string,
    level: string
  },
  profile: {
    goal: string,          // ej: 'hypertrophy', 'strength', 'health'
    environment: string,   // ej: 'gym', 'home'
    ambition: string,
    level: string,         // 'beginner' | 'intermediate' | 'advanced'
    daysPerWeek: number,
    weightKg: number,
    heightCm: number,
    age: number,
    sex: string,
    activityLevel: string,
    jointFocus: [string],  // enfoque articular / lesiones a proteger (ej: 'knees', 'shoulders')
    restStyle: string,     // 'short' | 'moderate' | 'long'
    tone: string,          // tono de Atlas ('strict' | 'coach' | 'friendly')
    completed: boolean,
    updatedAt: string
  },
  coachMemory: [string], // Últimos IDs de mensajes mostrados por Atlas para evitar repetición
  customExercises: [     // Ejercicios personalizados creados por el usuario
    {
      id: string,
      name: string,
      group: string,
      equipment: string,
      type: string,
      muscles: [string],
      met: number,
      metCode: string,
      source: string,
      custom: boolean
    }
  ],
  routines: [            // Rutinas semanales configuradas
    {
      id: string,
      name: string,
      goal: string,
      days: [number],    // [0..6] (Domingo a Sábado)
      defaults: { sets: number, reps: number, restSec: number },
      exercises: [
        {
          id: string,
          name: string,
          group: string,
          equipment: string,
          sets: number,
          reps: number,
          mode: 'default' | 'manual',
          rir: number,
          restSec: number
        }
      ]
    }
  ],
  workouts: [            // Historial de entrenamientos realizados (ordenados del más reciente al más antiguo)
    {
      id: string,
      date: string,
      startedAt: string,
      endedAt: string,
      durationSec: number,
      routineId: string,
      routineName: string,
      comment: string,
      adjusted: { reason: string }, // Ej: 'fatiga', 'poco tiempo', 'mal sueño', 'dolor'
      prs: [
        { exId: string, name: string, kind: string, weightKg: number, reps: number }
      ],
      plan: [ // Foto del plan al terminar la sesión
        { exId: string, name: string, group: string, type: string, targetReps: number, targetSets: number, targetRestSec: number, targetRir: number, recWeightKg: number }
      ],
      score: {
        score: number,       // 0 a 100
        grade: string,       // 'S' | 'A' | 'B' | 'C' | 'D'
        components: [{ key: string, label: string, value: number, weight: number }],
        restNotes: string,
        durationSec: number,
        v: 4,
        partial: boolean,
        missed: [{ exId: string, name: string }],
        adjusted: object
      },
      exercises: [
        {
          exId: string,
          name: string,
          targetReps: number,
          targetSets: number,
          targetRestSec: number,
          recWeightKg: number,
          sets: [
            {
              w: number,       // Peso en kg
              r: number,       // Repeticiones realizadas
              rir: number,     // RIR (Reps in Reserve)
              failure: boolean,
              startedAt: string,
              endedAt: string,
              restBeforeSec: number,
              pr: boolean,
              confirmed: { r: number, w: number, rir: number },
              unconfirmed: boolean // Si es true, se excluye del motor y PRs
            }
          ]
        }
      ]
    }
  ]
}
```

---

## 3. Motor de Recomendaciones y Puntuación (`src/recommend.js`)

Es un módulo de lógica pura (sin dependencias de React) que gobierna la inteligencia del entrenador virtual:

1. **Recomendación de Carga (`recommendFor`)**:
   - Analiza el historial previo del ejercicio (`lastSets`), el RIR reportado y el nivel del usuario.
   - Si no hay historial, sugiere un peso conservador basado en el peso corporal o un RIR 2-3 para evitar lesiones.
   - Aplica sobrecarga progresiva automática cuando el usuario completa las repeticiones objetivo con facilidad (RIR alto).

2. **Puntuación de Sesión (Versión 4)**:
   - **Pesos adaptativos según nivel**: Ajusta las expectativas de rendimiento entre principiantes e intermedios.
   - **Ajuste intencional (`adjusted`)**: Si el usuario indicó fatiga o mal sueño, el puntaje no penaliza injustamente la baja carga.
   - **Tolerancia al descanso asimétrica**: El exceso de descanso penaliza menos que el descanso insuficiente.
   - **Requisito mínimo**: Exige al menos 1 serie confirmada para emitir una puntuación válida.

3. **Detección de Récords Personales (PRs)**:
   - Evalúa peso máximo levantado, volumen máximo y 1RM estimado (fórmula de Epley) en tiempo real durante y al finalizar cada sesión (`personalRecords`, `newRecords`).

4. **Análisis de Frecuencia y Estancamiento**:
   - `frequencyAdvice`: Revisa los días transcurridos desde el último entrenamiento de cada grupo muscular.
   - `exerciseReview`: Detecta estancamientos cuando un ejercicio no muestra progreso en peso o repeticiones durante múltiples sesiones consecutivas.

---

## 4. Pantallas y Componentes Modulares de la UI

### A. Inicio (`src/screens/Home.js`)
- **`AtlasMessage.js`**: Mensajes contextuales generados por el cerebro de Atlas (`src/coachMemory.js`) según el estado de ánimo (`neutral`, `happy`, `alert`).
- **`DayHeader.js` & `TodayGoal.js`**: Muestra la rutina del día o invita al descanso activo.
- **`TomorrowCard.js` & `NearRecordCard.js` & `QuickSummary.js`**: Previsualización de la siguiente sesión, récords cercanos a romperse y resumen rápido de la semana.

### B. Rutinas (`src/screens/Routines.js`)
- Pestaña "Mi semana": Vista general de los días de entrenamiento asignados (Lunes a Domingo).
- Asistente de 2 pasos para crear y editar rutinas personalizadas.
- Buscador y configuración detallada por ejercicio (modo por defecto de la rutina o modo manual de series, repeticiones, RIR y descanso).

### C. Progreso (`src/screens/Progress.js`)
- **`ProgressChart.js`**: Gráfica interactiva de área basada en `react-native-svg` con filtros de métrica (peso, volumen, 1RM) y selector de ejercicio.
- **`StreakCard.js`**: Conteo de racha de semanas entrenadas.
- **`StatGrid.js` & `CoachCard.js` & `PrCard.js` & `MuscleCard.js` & `RoutineScoresCard.js`**: Estadísticas globales, consejos de Atlas, listado de PRs, mapa de músculos trabajados y puntuaciones promedio por rutina.
- **`HistoryList.js` & `SessionDetail.js`**: Historial agrupado por mes con visor detallado de cada entrenamiento pasado.

### D. Entrenamiento en Curso (`src/screens/Workout.js`)
- Overlay interactivo que guía al usuario serie por serie.
- Cronómetro de descanso real automático entre series.
- Registro interactivo de peso, repeticiones y RIR.
- Celebración instantánea de PRs al romper récords (`SessionReview.js`).

### E. Ajustes (`src/screens/Settings.js`)
- Cambio de unidades (kg / lb).
- Edición de perfil, objetivos y nivel.
- Salud y enfoque articular (protección de rodillas, hombros, zona lumbar, etc.).
- Estilo de descanso preferido (corto, moderado, largo).
- Gestión de ejercicios personalizados (`src/CustomExerciseModal.js`).
- Respaldo y restauración por JSON (portabilidad de datos).
- **Zona de Desarrollador**: Simulador de datos corruptos, carga de escenarios de prueba predefinidos y **Editor / Corrector de sesiones de ejercicio en el historial**.

---

## 5. Compendio de Ejercicios y Ejercicios Personalizados
- **Compendio Base**: 79 ejercicios predefinidos (`src/exercises.js`) con categorización por grupos musculares (`GROUPS`), equipamiento, coeficientes METs para gasto calórico preciso (`kcalPerHour`) y filtrado avanzado (`ExercisePicker.js`).
- **Ejercicios Personalizados**: Almacenados en `data.customExercises`, permitiendo al usuario añadir nuevos movimientos con nombre, grupo, equipo y tipo opcional, los cuales se fusionan de manera transparente en todo el motor y los selectores de la app.

---

## 6. Pruebas y Calidad de Software
- Suite de pruebas unitarias implementada con **Jest** y `jest-expo` (`src/__tests__/recommend.test.js`, `src/__tests__/scoring.test.js`, `src/__tests__/coachMemory.test.js`).
- 58 pruebas automatizadas que cubren la lógica matemática del motor, la migración de datos, la puntuación de sesiones y la generación de mensajes de Atlas.
- Compilación verificada para producción en Android (`expo export` y EAS Build).

# Decisiones del motor y reglas de entrenamiento

Este documento detalla las reglas, heurísticas y fórmulas científicas o de criterio de la aplicación utilizadas en el motor de recomendaciones, puntaje, récords y progreso de Fitness Coach.

## 1. Progresión y Rango de Repeticiones
- **Fuente:** American College of Sports Medicine (ACSM, 2009); NSCA (Regla 2-for-2).
- **Criterio:** Se prioriza subir repeticiones antes que el peso (progresión doble). Se incrementa el peso según la ambición del usuario (maximizar, progresar, mantener) tras cumplir el objetivo durante el número requerido de sesiones.

## 2. Descanso
- **Fuente:** ACSM (2009); Grgic et al. (2017).
- **Criterio:** Descansos adaptados al tipo de ejercicio (compuesto o aislamiento) y objetivo (fuerza, hipertrofia, resistencia), ajustados por la preferencia del usuario (corti, equilibrado, largo).

## 3. Estancamiento
- **Fuente:** ACSM (2009) y criterio de la app.
- **Criterio:** Se detecta estancamiento si se llevan 3 sesiones con el mismo peso sin mejorar repeticiones, o 14 días sin cumplir el objetivo. Se recomienda mantener y revisar recuperación.

## 4. Récords Personales (PR) y e1RM
- **Criterio de la app:** Récord de peso (máxima carga levantada con al menos 1 repetición) y récord de repeticiones (mayor número de repeticiones a una carga dada).
- **e1RM (Estimación de 1 Repetición Máxima):** Se calcula utilizando la fórmula estándar de **Epley** ($1RM = w \times (1 + \frac{r}{30})$), ampliamente validada en literatura de fuerza.

## 5. Puntaje de Sesión
- **Criterio de la app:**
  - 50% Repeticiones completadas frente al objetivo.
  - 30% Peso usado frente al recomendado.
  - 20% Adherencia al tiempo de descanso real frente al recomendado.

## 6. Racha y Criterio para Rutinas sin Días Asignados
- **Criterio de la app:** 
  - Si una rutina tiene días asignados (`routine.days`), la racha cuenta los días de entrenamiento consecutivos omitiendo los días de descanso sin rutina (no suman ni cortan).
  - Si una rutina no tiene días asignados (rutinas antiguas o libres), se permite hasta 1 día sin sesión entre dos sesiones para mantener la racha activa ("criterio de la app").

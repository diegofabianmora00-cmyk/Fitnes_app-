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

## 5. Puntaje de Sesión (v4)
- **Criterio de la app, apoyado en evidencia sobre dosis, esfuerzo y carga:**
  - **Pesos (Intermedios/Avanzados):** 40% Plan cumplido, 20% Carga (tope en 100%), 25% Esfuerzo (RIR), 10% Descanso, 5% Progreso.
  - **Pesos (Principiantes):** 45% Plan cumplido, 20% Carga, 15% Esfuerzo (RIR), 15% Descanso, 5% Progreso.
  - **Ajuste intencional (`adjusted`):** Si el usuario ajusta por cansancio/poco tiempo, se omite la penalización de carga o plan no realizado. Si es por dolor, la sesión se protege ("Sesión protegida", puntaje nulo de apoyo).
  - **Tolerancia al descanso:** Descansar de más penaliza de forma mucho más suave que descansar de menos.
  - **Datos insuficientes:** Se requiere al menos 1 serie confirmada para puntuar; de lo contrario se indica "Datos insuficientes".
- **Por qué esos pesos:** La dosis (volumen) y la adherencia al plan son la prioridad para guiar sin juzgar. En principiantes se prioriza aún más el plan y el descanso sobre el esfuerzo extremo.
- **Fuentes:** ACSM (2009); Schoenfeld et al. (2017); Refalo et al. (2023); Grgic et al. (2017); Zourdos et al. (2016); criterio de la app.

## 6. Racha y Criterio para Rutinas sin Días Asignados
- **Criterio de la app:** 
  - Si una rutina tiene días asignados (`routine.days`), la racha cuenta los días de entrenamiento consecutivos omitiendo los días de descanso sin rutina (no suman ni cortan).
  - Si una rutina no tiene días asignados (rutinas antiguas o libres), se permite hasta 1 día sin sesión entre dos sesiones para mantener la racha activa ("criterio de la app").

## 7. Cerca de un récord y estimación de duración y pesos
- **Criterio de la app:**
  - **Cerca de un récord (`nearRecord`):** Detecta cuando el mejor peso confirmado en los últimos 14 días se encuentra entre el 90% y el 99.9% del récord personal de ese ejercicio (`personalRecords`), calculando la brecha (`gapKg`) y la relación (`ratio`). Se ignoran series sin confirmar (`unconfirmed: true`).
  - **Estimado de duración (`routineEstimate`):** Promedio redondeado de la duración en minutos de las últimas sesiones (hasta 3) de una rutina específica.
  - **Consejo de peso siguiente (`nextWeightHint`):** Prepara el mensaje contextual con el primer ejercicio de la próxima rutina basándose en `recommendFor`.

## 8. Mejoras del Motor de Recomendaciones
- **Bajar peso:** Si hay 2 sesiones seguidas por debajo del objetivo o se reporta fallo (RIR 0), se recomienda reducir la carga un 5-10% (criterio de la app, ACSM 2009).
- **RIR que decide:** Un RIR muy alto (4-5) permite avanzar antes si se cumplió el objetivo; un RIR 0 (fallo) impide subir aunque se alcancen las repeticiones.
- **Regreso tras pausa:** Tras 14 días o más sin entrenar un ejercicio, se sugiere retomar con una reducción del 10% (criterio de la app).
- **Incrementos por ejercicio:** Incrementos más pequeños en aislamiento o mancuernas (1.25 kg / 2.5 lb) y estándar en compuestos pesados (2.5 kg / 5 lb), respetando kg/lb.
- **Estancamiento con opciones concretas:** Opciones de cambiar rango, bajar un 5-10% para reconstruir, o revisar sueño y alimentación.
- **Chequeo de energía:** Con energía baja registrada en el check-in diario (`checkin.level === 'cansado'`), se recomienda mantener el peso ese día.
- **Series que mandan:** La última sesión y sus series confirmadas (excluyendo `unconfirmed: true`) son las que mandan para la recomendación.
- **Fuentes y etiquetas:** Las heurísticas propias de la aplicación se etiquetan como "criterio de la app", diferenciándolas de la literatura científica (ACSM, Zourdos, Grgic, NSCA).

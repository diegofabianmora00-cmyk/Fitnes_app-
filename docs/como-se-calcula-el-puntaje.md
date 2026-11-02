# Cómo se calcula el puntaje de sesión en Fitness Coach (v3)

Actualmente, la puntuación de una sesión se calcula sobre 100 puntos y se divide en 5 componentes con respaldo científico. 

Si en una sesión falta un componente (por ejemplo, si no hay peso recomendado o no se registró el RIR o el descanso), **ese componente se omite y su peso se reparte proporcionalmente** entre los bloques que sí tienen datos.

---

## Los 5 bloques y sus pesos base

1. **Plan cumplido (40%)**
   - Mide qué porcentaje de las repeticiones planificadas completó el usuario en cada serie de los ejercicios programados.
   - Las series no hechas o ejercicios faltantes del plan cuentan con valor 0.

2. **Esfuerzo / RIR (25%)**
   - Compara el RIR real (repeticiones en reserva o si llegó al fallo) con el RIR objetivo sugerido por el motor según el objetivo del usuario.
   - Desviarse 1 punto penaliza levemente; desviarse 3 o más reduce significativamente este bloque.

3. **Carga (20%)**
   - Compara el peso medio levantado en las series válidas frente al peso recomendado por Atlas.
   - Si se levanta lo recomendado o más, se obtiene el 100%.
   - *Nota:* En ejercicios de peso corporal no se evalúa este bloque para evitar distorsiones.

4. **Descanso (10%)**
   - Compara el tiempo real de descanso entre series con el tiempo ideal recomendado, permitiendo una tolerancia del 20% (o al menos 20 segundos).
   - Descansar de más o de menos reduce la nota de este bloque.

5. **Progreso (5%)**
   - Evalúa si se mejoró el rendimiento (estimación de 1RM o repeticiones) respecto a las sesiones anteriores en ese ejercicio.
   - Otorga la máxima puntuación si se bate un récord personal (PR).

---

## Reglas y consideraciones especiales

- **Series no confirmadas:** Las series marcadas como no confirmadas se excluyen por completo del cálculo.
- **Sesiones antiguas (sin plan guardado):** Si la sesión es anterior a este sistema, la app detecta que es parcial y calcula el puntaje con los datos disponibles de manera retroactiva al cargar la aplicación.
- **Calificación por letras y umbrales:**
  - **90 – 100 pts:** Excelente
  - **75 – 89 pts:** Bien
  - **60 – 74 pts:** Aceptable
  - **Menos de 60 pts:** A revisar

# Correcciones realizadas

Documento de cambios aplicados a la app para corregir fallos reales, errores de lógica y casos en los que la app podía fallar o dar resultados incorrectos.

## 1. Motor en vivo y recomendaciones

- `src/sessionMonitor.js`: se corrigió la detección de ejercicios sin carga externa. Antes, un ejercicio con peso registrado pero sin `loadType` podía tratarse como corporal; ahora solo se considera corporal cuando el tipo es `bodyweight` o, sin tipo conocido, no hay peso recomendado ni peso en las series. Así no se aplican reglas de peso corporal a ejercicios cargados.
- `src/sessionMonitor.js`: al calcular la bajada de carga por serie muy difícil, si se hacen 2 o más repeticiones menos que el objetivo se ignora el RIR reportado (poco fiable) y se calcula la carga desde las repeticiones reales, limitando a una reducción de al menos 10% (y dentro del rango configurado). Esto evita que una serie muy pesada con RIR inflado proponga bajar muy poco (p. ej. de 100 kg a 85 kg o menos, según lo realizado).
- `src/sessionMonitor.js`: en ejercicios de peso corporal, las alertas "más fácil", "más difícil" y caída por fatiga ya no sugieren las mismas repeticiones o menos repeticiones como progreso; ahora ajustan en la dirección correcta (reducen al menos 1 al facilitar y aumentan al menos 1 al hacer más difícil).
- `src/autoreg.js`: la rama de fallo por serie se activa con `failure` explícito (RIR 0). Antes usaba `RIR 0` efectivo, lo que podía tratar una serie sin RIR reportado como fallo si el análisis lo estimaba en 0. Ahora, sin RIR o sin confirmar, se mantiene el peso y se usan las repeticiones como guía.
- `src/autoreg.js`: el motivo de fallo ahora indica "llegó al fallo (RIR 0)" y el motivo por debajo del mínimo de repeticiones incluye explícitamente que quedó "por debajo del mínimo", para que la interfaz muestre la causa correcta.
- `src/autoreg.js`: en ejercicios de peso corporal, facilitar/hacer más difícil ajusta repeticiones en la dirección esperada (no mantiene ni reduce el objetivo cuando corresponde subirlo).
- `src/recommend.js`: la reducción de carga por estancamiento con fallo o dificultad y el regreso tras pausa (14 días o más) ahora reducen alrededor de 5-10% (carga redondeada al equipo), en lugar de solo un paso de peso. Esto coincide con la regla documentada (criterio de la app basado en ACSM). El texto y la carga sugerida pasan a ser coherentes.
- `src/recommend.js`: se corrigió la etiqueta del componente de puntaje "Progreso" (antes aparecía en inglés).

## 2. Estadísticas y progreso

- `src/recommend.js`: el rango de periodo "Personalizado" ahora interpreta las fechas en hora local, usa realmente la fecha "hasta" como fin del rango, valida fechas inválidas y corrige si el fin es anterior al inicio. Antes podía ignorar el límite superior y dar resultados erróneos por zona horaria.
- `src/screens/Progress.js`: la pantalla de progreso sin historial recibe `go` y los botones "Crear mi rutina" / "Ir a crear mi rutina" navegan a Rutinas. Antes no hacían nada.
- `src/screens/progress/ProgressChart.js`: el selector de ejercicio devuelve el ítem completo; la selección se corrigió para usar `item.id`, se añadió la opción "Todos los ejercicios" y se muestra el nombre de ejercicios personalizados. Así el filtro por ejercicio vuelve a funcionar.
- `src/screens/progress/ProgressChart.js`: la diferencia frente al periodo anterior se muestra en puntos (`pts`) y no como porcentaje; además muestra "—" cuando no hay periodo anterior con sesiones para comparar, evitando comparaciones engañosas.

## 3. Rutinas y ejercicios personalizados

- `src/screens/Routines.js`: se añadió el botón "Iniciar entrenamiento" en el detalle de la rutina (deshabilitado si no tiene ejercicios), cerrando el detalle y abriendo el entrenamiento. Antes `start` no se usaba desde esta vista.
- `src/screens/Routines.js`: al añadir un ejercicio a la rutina se guardan también `type`, `loadType` y `custom`. Esto evita que ejercicios personalizados (p. ej. peso corporal o máquina) se traten con un tipo de carga incorrecto.
- `src/CustomExerciseModal.js`: el tipo de carga inicial y el cambio al elegir equipo se ajustan al equipo (barra, mancuernas, máquina, peso corporal, etc.). Antes el valor por defecto podía no corresponder al equipo elegido.
- `App.js`: al iniciar un entrenamiento se valida que la rutina tenga ejercicios; si está vacía se avisa y no se abre. También se endureció la restauración del borrador para evitar abrir sesiones sin ejercicios.

## 4. Datos, sesión y configuración

- `src/store.js` y manejo de datos: se mantiene la migración y las copias/restauración existentes; los pesos y la estructura de sesiones siguen siendo compatibles con datos antiguos.
- `src/screens/Settings.js`: al editar una sesión guardada, el peso se muestra y edita en la unidad del usuario (kg/lb) y al guardar se convierte correctamente a kg, se normalizan repeticiones y se recalculan récords y puntaje de esa sesión. Antes se mostraba/guardaba sin conversión coherente y no se recalculaban puntaje y récords editados.
- `src/screens/Home.js`: el registro de "cómo te sientes hoy" (check-in) usa la fecha local en lugar de UTC, evitando que el estado cambie o se conserve de forma incorrecta por la zona horaria.
- `src/screens/progress/CoachCard.js`: el aviso de estancamiento usa el nombre, tipo y carga del ejercicio desde la última sesión (incluidos personalizados) en lugar de mostrar "Ejercicio" genérico o asumir datos incompletos.

## 5. Codificación y textos

- `src/recommend.js`: se corrigió texto con codificación dañada (mojibake) en mensajes y reglas para que se muestren correctamente en español.
- `src/devSeeds.js`: se corrigió la etiqueta dañada "14 días sin entrenar" en los datos de prueba.

## 6. Verificación

- Pruebas automatizadas: `npm test` / `npx jest` en verde (7 suites, 107 pruebas) tras las correcciones y ajustes de expectativas alineados con las reglas (reducción de carga por pausa/fallo y rango personalizado).
- Compilación: `npx expo export --platform android` completada correctamente (carpeta `dist` generada y luego eliminada en la verificación).

## Notas

- Los scripts temporales `fixr2.js`, `fixr3.js`, `fixrec.js`, `fixstall.js`, `fixstall2.js` y `tmpfix.cjs` que estaban en la raíz se eliminaron por ser restos de correcciones previas.
- No se realizaron commits ni push. Queda pendiente la prueba manual completa del flujo en dispositivo/emulador.

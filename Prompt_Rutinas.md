# Tarea: rediseñar la pestaña "Rutinas" (pantalla Routines.js)

Lee primero AGENTS.md y sigue todas sus reglas (JavaScript sin TypeScript, componentes de
src/ui.js, colores de src/theme.js, animaciones solo con Animated, sin commit, sin
`npm install`, migrar datos sin borrar historial, responder en español y breve).

Adjunto 5 capturas del diseño. **El resultado visual debe quedar idéntico a ellas**: mismos
espacios, tamaños, colores, textos y orden. Si algo de este prompt contradice una captura,
manda la captura. No cambies nada que esta tarea no pida.

## Aviso importante sobre los textos
En el diseño, todo texto que empieza con **"Ejemplo de…"** (y los números "00" / "0:00") es un
**marcador**, no contenido. No lo copies literal: reemplázalo por datos reales de la app.
Los textos fijos de la interfaz (títulos, botones, etiquetas de sección, "Paso 1 de 2",
"Lejos", "Al fallo", etc.) sí van tal cual.

| Marcador en el diseño | Dato real |
|---|---|
| Ejemplo de nombre de rutina | `routine.name` |
| Ejemplo de resumen de la semana | texto corto, p. ej. "3 días de entreno" calculado de los días asignados |
| Ejemplo de cantidad de ejercicios y duración | `N ejercicios · ~X min` (X estimado de series × descanso; sin inventar fuentes) |
| Ejemplo de día de descanso (sin rutina) | texto fijo "Descanso" |
| Ejemplo de objetivo | opciones de objetivo (ver Datos) |
| 00 / 0:00 (series, repeticiones, descanso) | valores reales de la rutina |
| Ejemplo de día y nombre de rutina | `"<Día> · <nombre>"` del primer día asignado |
| Ejemplo de grupo muscular | elementos de `GROUPS` (src/exercises.js) |
| Ejemplo de grupo muscular · cantidad de ejercicios | `"<grupo> · <n> ejercicios"` |
| Ejemplo de nombre de ejercicio | `exercise.name` |
| Ejemplo de equipo · series × repeticiones | `"<equipment> · <sets> × <reps>"` |
| Ejemplo de nº de ejercicios / duración total | `"N ejercicios"` y `"~X min"` |
| Ejemplo de descripción / de nivel de esfuerzo / de texto | descripciones cortas (ver pantalla 4) |

## Sistema visual (usa los mismos de src/theme.js; si falta un color, agrégalo ahí y dilo al final)

- Fuente: Inter (la misma ya usada en H y Btn).
- Fondo de pantalla: degradado vertical de `#10161d` (arriba) a `#0a0c10` (a partir del 40 %).
- Margen de pantalla: 56 arriba, 22 a los lados, 32 abajo. Separación vertical entre bloques: 16.
- Tarjeta: fondo `#12161c`, borde 1 px `#1c222b`, radio 22, padding 14 vertical / 18 horizontal.
- Texto principal `#eef2f5`; texto secundario `#9aa4b4`; menta (acento) `#7df2c4`;
  texto sobre menta `#06140e`; menta oscuro (fondos suaves) `#173a2f`;
  superficie de botón `#161b22`; pista/inactivo `#242b35`; fondo de input `#0d1117`.
- Título de tarjeta: 20 px, peso 700. Subtítulo: 14 px, `#9aa4b4`, margen superior 2.
  Interlineado 1.3.
- Etiqueta de sección: 12 px, peso 600, mayúsculas, letter-spacing 0.12 em, `#9aa4b4`,
  margen inferior 10.
- Puntitos de progreso (arriba a la derecha de la tarjeta de cabecera): barritas de 22×6,
  radio 3, separación 6; activa `#7df2c4`, inactiva `#242b35`. No se encogen.
- Botón principal: altura 56, radio 24, fondo menta, texto `#06140e` 17 px peso 700.
- Botón secundario: altura 44, radio 18, fondo `#161b22`, texto 14 px peso 600.
- Chip: altura 44, radio 16, padding horizontal 16, fondo `#161b22`, borde `#1c222b`,
  texto `#c5ccd6` 14 px peso 600, sin salto de línea. Activo: fondo y borde menta, texto `#06140e`.
- Botón de día (L M X J V S D): ancho flexible, mínimo 44, altura 44, radio 14, mismo estilo
  que el chip. Activo = menta.
- Botón circular de atrás: 56×56, círculo, fondo `#161b22`, flecha "←" de 20 px.
- Cabecera de tarjeta: texto a la izquierda (puede ocupar varias líneas y se encoge sin
  empujar a los puntitos) y puntitos a la derecha.
- Los textos largos pasan a la línea siguiente; nunca deben deformar botones ni tarjetas.

## Pantalla 1 · "Mi semana" (pestaña Rutinas)
De arriba abajo:
1. Tarjeta de cabecera: título "Mis rutinas", subtítulo = resumen de la semana. Puntitos: uno
   por rutina existente.
2. Franja de 7 botones de día (L, M, X, J, V, S, D) en una fila. **Solo se resaltan en menta los
   días que tienen al menos una rutina.** Es solo informativa (tocarla no hace nada).
3. Etiqueta "Tu semana" (margen superior 6, inferior −4).
4. Una tarjeta por cada día que tenga rutina, ordenadas de lunes a domingo:
   - Recuadro de 52×44, radio 14, fondo `#173a2f`, texto menta 13 px peso 800 con la
     abreviatura del día en 3 letras: LUN, MAR, MIÉ, JUE, VIE, SÁB, DOM.
   - Centro: nombre de la rutina (16 px, peso 700) y debajo "N ejercicios · ~X min"
     (13 px, secundario).
   - A la derecha el signo "›" (18 px, `#9aa4b4`).
   - Tocar la tarjeta abre esa rutina en el asistente de edición (pantallas 2–4).
5. Días **sin rutina** (descanso): tarjeta con fondo transparente, recuadro `#161b22` con texto
   `#8b95a5`, y el texto "Descanso" en secundario. Muéstralos solo si hay espacio; si la
   lista crece, la pantalla hace scroll.
6. Espacio flexible y, abajo, el botón principal "+ Nueva rutina".
Si hay **dos rutinas el mismo día**, muestra una tarjeta por rutina bajo el mismo día.
Si no hay ninguna rutina: la franja sin resaltar, un mensaje breve de Atlas (componente
Coach, `mood: 'neutral'`, `size: 'sm'`) invitando a crear la primera, y el botón.

## Pantalla 2 · "Nueva rutina" — Paso 1 de 2 · Datos
Cabecera: título "Nueva rutina", subtítulo "Paso 1 de 2 · Datos", puntitos 1 de 2 activos.
Cuatro tarjetas en este orden:
1. **Nombre**: etiqueta "Nombre"; input de altura 48, radio 14, fondo `#0d1117`, borde
   `#1c222b`, texto 16 px peso 600, ancho completo. Placeholder: "Nombre de la rutina".
2. **Objetivo**: etiqueta "Objetivo"; chips en filas que se ajustan (separación 8). Selección
   única; el seleccionado va en menta.
3. **¿Qué días te toca?**: etiqueta; fila de 7 botones de día, selección **múltiple**. Debajo,
   nota de 13 px secundaria con margen superior 12: "Se repite cada semana. Puedes elegir varios."
4. **Por defecto**: etiqueta; tres cajas iguales en fila (altura 64, radio 14, borde, fondo
   `#161b22`), cada una con el número en 18 px peso 700 y debajo la unidad en 12 px
   secundaria: "series", "repeticiones", "descanso" (formato m:ss). Tocar una caja permite
   editar su valor (stepper o teclado numérico; usa lo más simple con ui.js).
Abajo: botón circular "←" (cierra o vuelve) y botón principal "Siguiente →" de 230 de ancho.
"Siguiente" exige nombre no vacío y al menos un día.

## Pantalla 3 · Paso 2 de 2 · Elegir ejercicios
Cabecera: título "Elige ejercicios", subtítulo "Paso 2 de 2 · <Día> · <nombre>", puntitos
2 de 2 activos.
1. Fila de chips con scroll horizontal (sin barra), uno por grupo muscular de `GROUPS`; el
   activo en menta. Cambiar de chip filtra la lista.
2. Etiqueta "<Grupo> · <n> ejercicios" (margen superior 4, inferior −4).
3. Lista de ejercicios del grupo (de `exercises` / `filterExercises`). **Reutiliza
   ExercisePicker.js o su lógica de filtrado; no crees otro catálogo.** Mantén el buscador
   existente si ya lo trae, sin cambiar el aspecto de las tarjetas. Cada tarjeta: padding
   12/16, nombre 16 px peso 700, debajo "<equipo> · <series> × <reps>" 13 px secundario, y a la
   derecha un botón de 44×44, radio 14:
   - No seleccionado: fondo `#161b22`, borde `#1c222b`, "+" en `#9aa4b4`.
   - Seleccionado: fondo menta, "✓" en `#06140e`.
   Tocar el botón agrega o quita el ejercicio. Tocar el cuerpo de una tarjeta ya seleccionada
   abre la pantalla 4 de ese ejercicio.
4. Espacio flexible y, abajo, un bloque en columna (gap 12): fila con "N ejercicios"
   (15 px peso 700, izquierda) y "~X min" (13 px, secundario, derecha), y debajo el botón
   principal "Guardar rutina" a ancho completo.
   Si la lista de ejercicios es larga, hace scroll **solo la lista**; el bloque inferior queda fijo.
"Guardar rutina" persiste la rutina (ver Datos) y vuelve a la pantalla 1.

## Pantalla 4 · Configurar ejercicio (dos estados de la misma pantalla)
Cabecera: título "Configurar ejercicio", subtítulo = nombre del ejercicio, puntitos 2 de 2.
1. **Selector de modo**: contenedor `#12161c`, borde `#1c222b`, radio 18, padding 4, con dos
   botones de igual ancho (radio 14, sin borde): "Por defecto" y "Manual". El activo va en menta;
   el inactivo, transparente.
2. Texto de ayuda (13 px secundario, margen horizontal 4):
   - Por defecto: "Se usan las series y el RIR por defecto de la rutina."
   - Manual: "Ajusta las series y el RIR solo para este ejercicio."
3. Tarjeta **Series**: título "Series" (16 px peso 700), descripción corta de 13 px
   (p. ej. "Cuántas series harás de este ejercicio"). Debajo, fila con botón "−" (56×56, radio 16,
   fondo `#161b22`), el número centrado (40 px, peso 800) y botón "+" igual.
4. Tarjeta **RIR**: igual que Series, con título "RIR" y descripción (p. ej. "Repeticiones que
   te dejas en reserva").
5. Tarjeta de **esfuerzo**: arriba a la izquierda el nivel en palabras (15 px peso 700, p. ej.
   "A 2 reps del fallo"), a la derecha "RIR n" (13 px secundario). Debajo 5 segmentos
   (altura 8, radio 4, separación 6); el segmento activo en menta y los demás `#242b35`.
   Orden de izquierda a derecha: RIR 4+, 3, 2, 1, 0. Debajo, "Lejos" a la izquierda y
   "Al fallo" a la derecha (12 px secundario).
6. Abajo: botón circular "←" y botón principal "Añadir a la rutina" (230 de ancho).

**Estado "Por defecto"**: las tarjetas Series, RIR y esfuerzo se ven apagadas (opacidad 0.38 y
escala de grises), con los botones − y + **deshabilitados** y sin respuesta al toque. Muestran
los valores por defecto de la rutina.
**Estado "Manual"**: todo con color normal y los botones − y + activos. Series mínimo 1; RIR
entre 0 y 4. Al volver a "Por defecto" se bloquean otra vez y se restauran los valores de la rutina.

## Datos (documenta los campos nuevos en la sección Datos de AGENTS.md)
Extiende `routines` sin romper el formato actual:
```
routines: [{ id, name,
  goal,            // opcional: 'fuerza' | 'hipertrofia' | 'resistencia'
  days: [0..6],    // 0 = lunes … 6 = domingo; puede estar vacío en rutinas viejas
  defaults: { sets, reps, restSec },
  exercises: [{ id, name, group, equipment, sets, reps,
    mode,          // 'default' | 'manual' (ausente = 'default')
    rir }]         // solo si mode === 'manual'
}]
```
- `migrate()` en src/store.js debe normalizar rutinas viejas: `days: []`, `defaults` tomados
  de los valores actuales (o 3 / 8 / 120 s) y `mode: 'default'`. **No borres nada ni toques workouts.**
- `routine.goal` es solo una etiqueta de la rutina; **no cambia** `profile.goal` ni el motor
  de recomendación. El motor sigue calculando peso, reps y descanso.
- Un ejercicio en modo 'manual' usa su `sets` y `rir`; en modo 'default' usa `defaults.sets` de la
  rutina. Si el entrenamiento (Workout.js) lee `sets` del ejercicio, mantenlo coherente sin
  cambiar su lógica.
- Añade un helper puro, p. ej. `routinesForDay(data, dayIndex)` en src/store.js, para la
  pantalla 1 (y que Inicio pueda usarlo después). **No modifiques Home.js** en esta tarea.

## Navegación y archivos
- No hay Expo Router. Haz el asistente de creación/edición como `Modal` dentro de
  src/screens/Routines.js (como el Editor actual), con estado interno de paso:
  `datos` → `ejercicios` → `config` (pantalla 4, que vuelve a `ejercicios`).
- Archivos a tocar: src/screens/Routines.js (principal), src/store.js (migrate + helper),
  src/ExercisePicker.js (solo si hace falta reutilizar su filtrado), src/theme.js (solo
  colores que falten). Si creas archivos nuevos (por ejemplo componentes del asistente en
  src/screens/), actualiza el Mapa de AGENTS.md.
- Usa Press, Card, T, H, Btn y Field de src/ui.js siempre que encajen; si algo del diseño
  no se puede lograr con ellos, crea el estilo local y dilo al final.
- Animaciones solo con Animated; no agregues ninguna que no esté ya (como mucho un FadeIn
  existente al abrir pantallas).
- Accesibilidad: cada botón de solo icono (−, +, ←, añadir) con `accessibilityLabel`; objetivos
  táctiles de mínimo 44×44.

## Qué NO hacer
- No cambies el motor (recommend.js), Workout.js, Home.js ni el puntaje.
- No inventes datos, pesos ni fuentes.
- No crees ios/ ni android/, no ejecutes `npx expo start` ni `npm install`.
- No hagas commit ni push.

## Al terminar
1. Comprueba que compila: `npx expo export --platform android 2>&1 | tail -5` y borra `dist`.
2. Actualiza el Mapa y el Estado de AGENTS.md (1–2 líneas) y la sección Datos.
3. Entrega la tabla **tarea | archivos modificados | estado (hecho / parcial / no hecho)**
   y la lista de archivos nuevos y modificados para el commit.
4. Di al final las decisiones que tomaste sin que estuvieran indicadas.
5. Si esta tarea se parece mucho a algo que ya se pidió antes (por ejemplo la edición de
   rutinas en Routines.js), dilo.

# Tarea: rediseñar la pestaña "Progreso" (src/screens/Progress.js)

Lee primero AGENTS.md y sigue todas sus reglas (JavaScript sin TypeScript, componentes de
src/ui.js, colores de src/theme.js, animaciones solo con Animated, sin commit, sin
`npm install`, migrar sin borrar historial, responder en español y breve).
Antes de tocar src/recommend.js lee docs/decisiones.md. Antes de tocar Workout.js o
SessionReview.js lee también docs/diseno-entrenamiento.md.

Adjunto capturas de 3 pantallas: **5 · Progreso** (larga, con scroll), **6 · Detalle de sesión y
comentario** y **7 · Progreso sin datos**. **El resultado visual debe quedar idéntico a ellas**:
mismos espacios, tamaños, colores, textos y orden. Si algo de este prompt contradice una
captura, manda la captura. Ya está hecha la pestaña Rutinas con el mismo sistema visual: reutiliza
sus estilos (tarjetas, chips, botones, cabecera, etiquetas de sección) en lugar de duplicarlos.
No cambies nada que esta tarea no pida.

## Aviso importante sobre los textos
En el diseño, todo texto que empieza con **"Ejemplo de…"** y los números **"00"** son
**marcadores**, no contenido. No los copies literal: reemplázalos por datos reales de la app.
Los textos fijos de la interfaz (títulos, etiquetas, botones, notas) sí van tal cual.

| Marcador en el diseño | Dato real |
|---|---|
| Ejemplo de resumen del periodo | texto corto, p. ej. "N sesiones en este periodo" |
| 00 (racha actual) / Mejor racha 00 días | resultado de `streakInfo` (ver Lógica) |
| Ejemplo de fecha (Desde / Hasta) | fechas del periodo elegido, formato "12 oct 2026" |
| Ejemplo de comparación con el periodo anterior (bajo "Tu progreso") | "vs. periodo anterior" con el cambio del puntaje promedio |
| +00% (chip verde) | cambio porcentual de la métrica activa frente al periodo anterior; si es negativo, "−00%" en el mismo chip |
| Ejemplo de mensaje de Atlas… | `coachMessage` / src/coachMemory.js, con la regla y su fuente |
| Ejemplo de nombre de ejercicio | `exercise.name` |
| Ejemplo de aviso de estancamiento… | texto del motor (RULES) con regla y fuente |
| 00 en Sesiones / Récords / Tiempo / Constancia | valores reales del periodo (ver Lógica) |
| Ejemplo de comparación (en las 4 tarjetas) | "vs. periodo anterior: +N" (o "−N") |
| Ejemplo de fecha del récord / 00 kg | fecha y peso del récord, convertido con `toU(kg, unit)` y la unidad (kg/lb) |
| Ejemplo de grupo muscular / 00% | grupo de `GROUPS` y su porcentaje de series en el periodo |
| 00 / MES (tarjeta de historial) | día y mes abreviado de `workout.date` (ENE, FEB…) |
| Ejemplo de nombre de rutina | `workout.routineName` |
| Ejemplo de duración · ejercicios · avance | `"<m> min · <n> ejercicios · <+x pts>"` (ver Lógica; si no hay sesión anterior, omite el avance) |
| 00 (círculo de puntaje) | `workout.score.score` |
| Ejemplo de comentario del usuario sobre la sesión | `workout.comment` |
| Ejemplo de fecha y duración (pantalla 6) | `"<día> <mes> <año> · <m> min"` |
| Ejemplo de avance respecto a la sesión anterior | mensaje de Atlas (coachMemory) comparando con la sesión anterior |
| Ejemplo de series × repeticiones · peso | `"<n> × <reps> · <peso con unidad>"` del mejor registro del ejercicio |
| Ejemplo de mensaje de Atlas para quien aún no ha entrenado | mensaje de Atlas de bienvenida (coachMemory) |

## Sistema visual
Mismos valores que la pestaña Rutinas (fondo en degradado `#10161d`→`#0a0c10`, margen 56/22/32,
separación 16 entre bloques, tarjeta `#12161c` con borde `#1c222b` y radio 22, texto `#eef2f5`,
secundario `#9aa4b4`, menta `#7df2c4`, texto sobre menta `#06140e`, menta oscuro `#173a2f`,
superficie `#161b22`, pista `#242b35`, input `#0d1117`, fuente Inter, etiqueta de sección de 12 px
en mayúsculas con letter-spacing 0.12 em, chips de altura 44 y radio 16, botón principal de
altura 56 y radio 24, botón secundario de altura 44 y radio 18).
Colores nuevos (agrégalos a src/theme.js si faltan y dilo al final):
`#c5ccd6` texto suave, `#8b95a5` texto apagado, `#2a323d` borde punteado,
`#4a5361` número apagado (racha en cero), `#f2c46d` ámbar y `#2a2312` ámbar oscuro (aviso).
Íconos (llama, chevron, comentario) como SVG con `react-native-svg` (incluido en Expo Go;
si no está instalado, `npx expo install react-native-svg`). **Sin emojis.**
Los textos largos pasan a la línea siguiente; nunca deben deformar botones ni tarjetas.

## Pantalla 5 · Progreso (ScrollView; deja espacio abajo para la barra de pestañas)
De arriba abajo:

1. **Cabecera**: tarjeta con título "Progreso" (20 px, 700) y subtítulo con el resumen del periodo.
2. **Racha actual** (tarjeta con padding 18):
   - Etiqueta "Racha actual". Debajo el número en **64 px, peso 800, menta** y al lado "días"
     (16 px, `#c5ccd6`).
   - A la derecha, recuadro 52×52, radio 16, fondo `#173a2f`, con una llama menta (trazo 2, 28 px).
   - Fila de 7 días (L M X J V S D), cada uno un cuadro de 34×34, radio 12, letra 12 px peso 700:
     **entrenado** = fondo menta, letra `#06140e`; **descanso** (día sin rutina asignada) = fondo
     transparente, letra `#8b95a5`, borde 1 px punteado `#2a323d`; **hoy sin entrenar aún** = fondo
     `#173a2f`, letra menta, borde 1 px menta. Muestra la semana actual.
   - Nota 13 px: "Los días de descanso no cortan la racha. Solo cuenta si faltaste a un día de entreno."
   - Separador superior 1 px `#1c222b` (margen 12, padding 12): "Mejor racha" a la izquierda
     (13 px apagado) y "N días" a la derecha (15 px, 700).
3. **Periodo** (tarjeta, padding 16): etiqueta "Periodo". Chips con scroll horizontal: "7 días",
   "30 días" (activo por defecto), "90 días", "Todo", "Personalizado". Debajo (margen 12, separación 8)
   dos cajas **Desde → Hasta**: cada caja flexible, fondo `#0d1117`, borde `#1c222b`, radio 14,
   padding 8/12, etiqueta de 11 px en mayúsculas (letter-spacing 0.08 em, apagada) y la fecha en
   14 px peso 700; entre ellas el signo "→". Nota 12 px apagada: "Aplica a la gráfica, los datos, los
   récords y los músculos." Con "Personalizado", tocar una caja abre un selector de fecha (usa un
   selector sencillo propio con día/mes/año; si usas `@react-native-community/datetimepicker`,
   instálalo con `npx expo install` y dilo al final). Con los otros chips las cajas solo muestran el
   rango resultante. La selección no se guarda al cerrar la app.
4. **Tu progreso** (tarjeta, padding 16):
   - Fila superior: a la izquierda "Tu progreso" (16 px, 700) y la comparación (13 px apagado);
     a la derecha un chip fijo de `#173a2f` con texto menta 13 px 700, radio 12, padding 6/10
     ("+00%").
   - **Selector de ejercicio**: botón ancho completo con aspecto de chip. A la izquierda "Ejercicio"
     (apagado), a la derecha el valor ("Todos los ejercicios" por defecto, o el nombre elegido) y un
     chevron. Tocarlo abre `ExercisePicker` con una opción extra "Todos los ejercicios" (agrega a
     ExercisePicker una prop opcional, p. ej. `allowAll`/`onSelectAll`, sin cambiar su
     comportamiento actual).
   - Chips de métrica con scroll horizontal: **Puntaje** (activo), **Peso**, **Volumen**, **e1RM**.
   - **Gráfica de área** con `react-native-svg`, ancho completo, relación de aspecto 346×196:
     3 líneas guía horizontales (`#1c222b`, 1 px) y etiquetas del eje Y de 10 px `#8b95a5`
     (para Puntaje: 100 / 50 / 0; para las demás métricas, mínimo / medio / máximo del rango);
     eje X = días del periodo, con la fecha inicial a la izquierda y "Hoy" a la derecha;
     **polígono de relleno** menta con opacidad 0.14 bajo la curva, **línea** menta de 3 px con
     uniones redondeadas y, en el último punto, un círculo menta de radio 5 con un halo de radio 11 y
     opacidad 0.2. Solo se dibujan puntos de los días con sesión, unidos por la línea.
   - Si el filtro de ejercicio está activo, la gráfica usa solo ese ejercicio.
5. **Mensaje de Atlas** (tarjeta con fila, separación 14): `Coach` (size 'sm') en su recuadro de
   44×44, radio 14, fondo `#161b22`, borde `#1c222b`, y el texto del mensaje (14 px, `#c5ccd6`).
6. **Aviso de estancamiento** (solo si el motor detecta un ejercicio sin avance; si no, no se
   muestra): tarjeta con `Coach` en modo `alert` a la izquierda; a la derecha la etiqueta
   "SIN AVANCE" (fondo `#2a2312`, texto `#f2c46d`, radio 10, padding 4/8, 11 px, 700, letter-spacing
   0.06 em), el nombre del ejercicio (16 px, 700, margen superior 8) y el texto con la regla y su
   fuente (13 px, `#c5ccd6`). Debajo, botón secundario "Ver ejercicio" alineado a la izquierda: al
   tocarlo fija ese ejercicio en el selector de la gráfica y lleva la vista hasta ella.
7. **Cuatro tarjetas de datos**, en 2 filas de 2 (separación 12): **Sesiones**, **Récords**,
   **Tiempo**, **Constancia**. Cada tarjeta: fondo `#12161c`, borde, radio 22, padding 14/16;
   etiqueta de sección de 12 px, valor de 28 px peso 800 (margen 6/4) y debajo la comparación de
   12 px apagada. **No incluyas calorías en esta pantalla.**
8. **Récords personales** (tarjeta): etiqueta; 3 filas (separación 14): a la izquierda nombre del
   ejercicio (15 px, 700) y fecha (12 px apagada); a la derecha el peso en 16 px, 700, menta.
9. **Músculos trabajados** (tarjeta): etiqueta; 3 filas (separación 14): nombre del grupo (13 px,
   `#c5ccd6`) y porcentaje (13 px apagado) en una línea, y debajo una barra de 8 px de alto, radio 4,
   fondo `#242b35`, relleno menta.
10. **Historial**:
    - Título "Historial" (20 px, 700, margen superior 8).
    - Chips con scroll horizontal: "Todas" (activo), "Con comentario", "Con récord".
    - **Una tarjeta por sesión** (todas las de `data.workouts`, la más reciente primero):
      fila con **bloque de fecha** 52×52, radio 14, fondo `#173a2f`, texto menta (día en 18 px 800 y
      mes en 10 px 700 en mayúsculas); al centro el nombre de la rutina (16 px, 700) y debajo
      "<m> min · <n> ejercicios · <avance>" (13 px apagado); a la derecha un **círculo de puntaje**
      de 48×48 con borde de 3 px menta y el número en 15 px, 800.
      Debajo, un separador superior de 1 px `#1c222b` (margen 10, padding 10) con: si hay comentario,
      ícono de comentario menta de 16 px y el texto (13 px, `#c5ccd6`, máximo 2 líneas); si no, el
      texto "+ Añadir comentario" (13 px apagado).
    - Tocar la tarjeta abre la pantalla 6. Tocar "+ Añadir comentario" abre la pantalla 6 con el
      campo de comentario enfocado.
    - Al final, botón secundario centrado "Cargar más sesiones": muestra las sesiones de 10 en 10
      (la lista real contiene todas; la paginación es solo de pantalla). Si ya no hay más, no se
      muestra.

## Pantalla 6 · Detalle de sesión y comentario (Modal)
1. Fila superior: botón circular "←" de 56×56 (fondo `#161b22`) y a su lado una tarjeta (padding
   10/16, ocupa el resto) con el nombre de la rutina (17 px, 700) y "<fecha> · <duración>" (13 px).
2. **Anillo de puntaje** centrado, SVG de 190×190: pista `#1c222b` de trazo 12 y radio 82, arco menta
   de trazo 12 con extremos redondeados que empieza arriba (rotación −90°) y cubre
   `score/100` de la circunferencia (515.2 × score/100); en el centro el puntaje en 56 px, 800, menta,
   y "de 100" en 15 px apagado. Lleva etiqueta de accesibilidad "Puntaje de la sesión".
3. **Tarjeta de cumplimiento** (columna, separación 14): etiqueta "Cuánto cumpliste de tu objetivo" y
   tres barras, cada una con el nombre a la izquierda (14 px apagado) y el porcentaje a la derecha
   (14 px, 700), y debajo la barra de 8 px (menta sobre `#242b35`):
   **"Peso recomendado"**, **"Repeticiones objetivo"**, **"Tiempo ideal de la serie"**. Los
   porcentajes salen de `score.components`. (Estos nombres reemplazan "Peso / Repeticiones /
   Tiempo": si la pantalla de ejercicio completado de Workout.js/SessionReview.js usa los nombres
   antiguos, cámbialos allí también para que coincidan, solo el texto.)
4. **Mensaje de Atlas** con la comparación respecto a la sesión anterior (mismo formato que en la
   pantalla 5).
5. Etiqueta "Ejercicios" y una tarjeta por ejercicio (padding 12/16): nombre (16 px, 700), debajo
   "<n> × <reps> · <peso>" (13 px apagado) y, si ese ejercicio batió un récord en la sesión
   (`workout.prs`), una insignia "RÉCORD" a la derecha (fondo `#173a2f`, texto menta, radio 10,
   padding 4/8, 11 px, 700).
6. **Comentario** (tarjeta): etiqueta "Comentario"; `TextInput` multilínea de 110 de alto, ancho
   completo, radio 14, fondo `#0d1117`, borde `#1c222b`, padding 12/14, texto de 15 px (500), placeholder
   "Escribe cómo te sentiste, qué cambiarías o qué notaste…"; debajo la nota de 13 px: "Puedes
   escribirlo durante el entreno y editarlo aquí cuando quieras."
7. Abajo, botón principal "Guardar comentario" a ancho completo: guarda `workout.comment` y cierra o
   confirma. Con el teclado abierto, la pantalla debe seguir siendo usable (KeyboardAvoidingView).

## Pantalla 7 · Progreso sin datos
Se muestra cuando `data.workouts` está vacío. Misma estructura de cabecera y márgenes:
1. Cabecera: "Progreso" y "Aún no hay datos".
2. Tarjeta de racha simplificada: etiqueta "Racha actual", número "0" en 64 px, 800, color `#4a5361`,
   "días", y la nota "Tu racha empieza con tu primera sesión. Los días de descanso no la cortan."
3. Mensaje de Atlas de bienvenida (misma tarjeta que en la pantalla 5).
4. Tarjeta "Tu progreso" con la nota "La gráfica aparece desde tu 3.ª sesión.", un lienzo de gráfica
   vacío (3 líneas guía y una línea base punteada `#242b35`, trazo 3, guiones 6/8) y, debajo, 3
   segmentos de 6 px (`#242b35`, se tiñen de menta al completarse cada sesión) y el texto "N de 3 sesiones".
5. Título "Historial" y una tarjeta con "Aquí verás todas tus sesiones, con su puntaje y tus comentarios."
6. Espacio flexible y botón principal "Empezar a entrenar": si no hay rutinas, lleva a la pestaña
   Rutinas; si hay, inicia la siguiente (mira cómo Home.js lanza el overlay de Workout).
Con 1 o 2 sesiones se muestra la pantalla 5 completa, pero la tarjeta "Tu progreso" usa el lienzo
vacío con "N de 3 sesiones" en lugar de la gráfica.

## Lógica (funciones puras nuevas en src/recommend.js, con pruebas en src/__tests__/recommend.test.js)
Deben funcionar con datos viejos (sin `comment`, sin `days`, sin `unit`) y en kg/lb.
- `streakInfo(data, hoy)` → `{ current, best, week: [{ day, state }] }`.
  Cuenta **días de entrenamiento seguidos**: un día cuenta si es un día asignado (`routine.days`,
  0 = lunes) y hay una sesión ese día. **Los días sin rutina asignada (descanso) se saltan: no suman
  ni cortan.** La racha se corta solo si pasó un día asignado sin sesión. El día de hoy, si aún no
  entrena, no corta la racha (estado "hoy"). Si no existe ningún día asignado (rutinas viejas),
  usa este criterio de la app: se permite hasta 1 día sin sesión entre dos sesiones; etiquétalo
  como "criterio de la app" en RULES y documéntalo en docs/decisiones.md.
- `periodRange(opcion, hoy, desde, hasta)` → rango de fechas para 7/30/90 días, Todo y Personalizado
  (incluye el rango anterior de igual duración para las comparaciones; "Todo" no tiene anterior).
- `periodStats(data, rango, exId?)` → sesiones, récords, tiempo total, constancia (entrenos hechos
  de los que tocaban según `routine.days`; sin días asignados, "—"), con su comparación contra el periodo anterior.
- `progressSeries(data, rango, metrica, exId?)` → puntos por día para Puntaje, Peso, Volumen y e1RM
  (usa la fórmula de e1RM ya documentada en docs/decisiones.md; si no existe, no la inventes: deja la
  métrica oculta y dilo). Ignora series con `unconfirmed: true`.
- `muscleShare(data, rango)` → porcentaje de series por grupo (`GROUPS`), top 3.
- `sessionProgress(data, workout)` → diferencia de puntaje frente a la sesión anterior de la misma
  rutina (`routineId`); `null` si no hay anterior.
- Reutiliza `personalRecords`, `newRecords`, `sessionReview` y `coachMessage`; no dupliques su lógica.
- El aviso de estancamiento sale de las reglas ya existentes (RULES/frequencyAdvice). Si el motor
  no expone un detector de "sin avance", agrega uno puro con regla y fuente, o criterio de la app
  etiquetado, y dilo al final.
- Hay que probar al menos: racha con descansos en medio, racha cortada por un día asignado sin
  sesión, hoy sin entrenar, datos sin `days`, rango personalizado y datos viejos sin `unit`.

## Datos (documenta los campos nuevos en la sección Datos de AGENTS.md)
- `workouts[].comment`: texto opcional (ausente = ""). No requiere migración.
- `fitnesscoach:v1:draft` incluye `comment` mientras el entreno está en curso; se copia a
  `workout.comment` al terminar y se borra con el borrador.
- El periodo, el ejercicio y el filtro del historial son solo estado de pantalla (no se guardan).
- No borres ni reescribas el historial existente.

## Comentario durante el entreno (cambio mínimo en el flujo de entrenamiento)
Para que el usuario pueda escribirlo "desde el momento que hace la rutina": agrega un campo
opcional de comentario en la pantalla final de la sesión (resumen/puntaje de `SessionReview.js`),
con el mismo aspecto que el de la pantalla 6 (etiqueta "Comentario", mismo placeholder), que guarda
en el borrador y en `workout.comment`. No cambies ninguna otra cosa de Workout.js ni del puntaje.
Esto no estaba en las capturas: es una decisión tuya de implementación, descríbela al final.

## Archivos y estructura
- src/screens/Progress.js: pantalla principal. Para no dejar un archivo enorme, divide en
  componentes en src/screens/progress/ (por ejemplo `StreakCard.js`, `PeriodPicker.js`,
  `ProgressChart.js`, `StatGrid.js`, `HistoryList.js`, `SessionDetail.js`, `EmptyProgress.js`).
  Actualiza el Mapa de AGENTS.md con los archivos nuevos.
- Otros archivos a tocar: src/recommend.js (funciones puras), src/__tests__/recommend.test.js,
  src/ExercisePicker.js (solo la opción "Todos"), src/theme.js (colores que falten),
  src/SessionReview.js (solo el campo de comentario), src/store.js (solo si hace falta algún helper).
- Conserva lo que Progress.js ya hace (estadísticas, gráfica por ejercicio, historial): el nuevo
  diseño lo reemplaza y no debe perderse información. Si Progress.js muestra calorías ahora,
  quítalas **solo de esta pantalla** (se rediseñarán más adelante); no toques el cálculo de calorías.
- Usa Press, Card, T, H, Btn y Field de src/ui.js siempre que encajen; si no, estilo local y avísalo.
- Animaciones solo con Animated (como mucho un FadeIn ya existente). Sin librerías de gráficas:
  la gráfica se dibuja con `react-native-svg`.
- Accesibilidad: `accessibilityLabel` en botones de solo ícono, en el anillo, la gráfica y el
  selector; objetivos táctiles de mínimo 44×44.

## Qué NO hacer
- No cambies reglas de progresión, descanso, PR ni el puntaje; solo agrega las funciones puras nuevas.
- No incluyas calorías en esta pantalla.
- No inventes datos, pesos ni fuentes; lo propio va etiquetado como "criterio de la app" en RULES.
- No crees ios/ ni android/, no ejecutes `npx expo start` ni `npm install`, no hagas commit ni push.

## Al terminar
1. Corre las pruebas (`npx jest 2>&1 | tail -5`) y comprueba que compila:
   `npx expo export --platform android 2>&1 | tail -5`; luego borra `dist`.
2. Actualiza el Mapa, el Estado (1–2 líneas) y la sección Datos de AGENTS.md, y las reglas nuevas
   en docs/decisiones.md.
3. Entrega la tabla **tarea | archivos modificados | estado (hecho / parcial / no hecho)** y la
   lista de archivos nuevos y modificados para el commit.
4. Di al final las decisiones que tomaste sin que estuvieran indicadas (por ejemplo el selector de
   fechas, la métrica e1RM, el criterio de racha sin días asignados, el campo de comentario en el
   entreno).
5. Si esta tarea se parece mucho a algo que ya se pidió antes (por ejemplo el fallo de e1RM y
   puntaje separado, o el rediseño de Progreso de la lista de mejoras pendientes), dilo.

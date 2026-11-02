# Tarea: rediseñar la pestaña "Inicio" — estado "día de descanso" (src/screens/Home.js)

Lee primero AGENTS.md y sigue todas sus reglas (JavaScript sin TypeScript, componentes de
src/ui.js, colores de src/theme.js, animaciones solo con Animated, sin commit, sin
`npm install`, migrar sin borrar historial, responder en español y breve).
Antes de tocar src/recommend.js lee docs/decisiones.md.

Adjunto la captura de la pantalla **Inicio · Día de descanso**. **El resultado visual debe quedar
idéntico a ella**: mismos espacios, tamaños, colores, textos y orden. Si algo de este prompt
contradice la captura, manda la captura. Ya están hechas las pestañas Rutinas y Progreso con el
mismo sistema visual: reutiliza sus estilos y componentes (tarjetas, chips, botones, etiquetas de
sección, bloque de fecha, barra de avance) en lugar de duplicarlos. No cambies nada que esta tarea
no pida.

## Alcance
- Esta tarea define **solo el estado "hoy no hay rutina asignada" (descanso)**.
- Para los demás estados (hay rutina hoy, ya entrenó hoy, entreno sin terminar, sin rutinas, sin
  historial) **conserva el comportamiento y el contenido actuales de Home.js**. No los rediseñes.
  Si encajan, usa las mismas tarjetas nuevas, pero sin inventar pantallas. Dime al final qué
  estados quedaron sin rediseñar.
- No toques la barra de pestañas (App.js).
- **Quita el botón flotante redondo de Ajustes** que hoy tapa el contenido (búscalo en Home.js o
  App.js). Ajustes sigue accesible desde la pestaña de la barra.
- Debe quedar espacio abajo para la barra de pestañas, para que ninguna tarjeta quede cortada.

## Aviso importante sobre los textos
Los ejemplos de la captura ("Pecho y tríceps", "42.5 kg", "Sentadilla", "80 kg × 5", "Faltan 2.5 kg",
"8", "4/4", "86", "2 NOV", "¡2 semanas seguidas…!") son **marcadores**, no contenido. No los copies
literal: reemplázalos por datos reales. Los textos fijos de la interfaz sí van tal cual.
El recuadro punteado con el texto "Atlas · Aquí va el robot entrenador de la app" es un **marcador**:
ahí va el robot real (ver Atlas).

| Marcador en el diseño | Dato real |
|---|---|
| Domingo, 1 de noviembre | fecha de hoy, día de la semana con mayúscula y mes en minúscula |
| Hoy toca descansar | título según el estado (en este estado, ese texto) |
| Recuadro punteado "Atlas" | componente `Coach` (ver Atlas) |
| ¡2 semanas seguidas…! | `coachMessage` / src/coachMemory.js |
| Recuperar para mañana | si hay una próxima rutina: "Recuperar para mañana" si es mañana, o "Recuperar para el <día>" si no; si no hay ninguna: "Recuperar y recargar" |
| Etiqueta "MAÑANA" | "Mañana" si la próxima rutina es mañana; si no, el nombre del día ("Jueves") |
| 2 / NOV (bloque de fecha) | día y mes abreviado de la fecha de la próxima rutina (mes en mayúsculas) |
| Pecho y tríceps | `routine.name` de la próxima rutina |
| 5 ejercicios · ~55 min | `"<n> ejercicios · ~<m> min"`; ver Lógica (si no se puede calcular, solo "<n> ejercicios") |
| Atlas ya preparó tus pesos… 42.5 kg | ver Lógica (peso recomendado del primer ejercicio) |
| Sentadilla / Récord: 80 kg × 5 / Faltan 2.5 kg / 97 % | ver Lógica (cerca de un récord); pesos con `toU(kg, unit)` y la unidad (kg/lb) |
| 8 días de racha | `streakInfo(...).current` |
| 4/4 esta semana | entrenos hechos / entrenos asignados de la semana actual |
| 86 último puntaje | `workouts[0].score.score` |

## Sistema visual
Mismos valores que Rutinas y Progreso: fondo en degradado `#10161d`→`#0a0c10`, margen 56/22,
separación 16 entre bloques, tarjeta `#12161c` con borde `#1c222b` y radio 22, texto `#eef2f5`,
secundario `#9aa4b4`, texto suave `#c5ccd6`, texto apagado `#8b95a5`, menta `#7df2c4`, texto sobre
menta `#06140e`, menta oscuro `#173a2f`, superficie `#161b22`, pista `#242b35`, fuente Inter,
etiqueta de sección de 12 px en mayúsculas con letter-spacing 0.12 em (peso 600), botón principal de
altura 56 y radio 24, chips de altura 44 y radio 16. No hay colores nuevos. Íconos como SVG con
`react-native-svg`. **Sin emojis.** Los textos largos pasan a la línea siguiente; nunca deben
deformar botones ni tarjetas.

## Estructura (ScrollView, de arriba abajo)
1. **Cabecera**: fecha (14 px, 500, `#9aa4b4`) y debajo el título (30 px, 800, letter-spacing −0.02 em,
   interlineado 1.1). Separación 6.
2. **Atlas**: el robot centrado. Usa `Coach` de src/Coach.js, `size='lg'`, `mood` según el mensaje
   (neutral / happy / alert). **No lo redibujes ni lo reemplaces por un SVG nuevo**: la captura solo
   reserva el espacio; el robot es el que ya existe en la app, tal como se ve hoy en Inicio. Conserva
   su animación actual.
3. **Mensaje de Atlas** (tarjeta, padding 16/18/4): etiqueta "ATLAS" (12 px, 600, letter-spacing 0.12 em,
   `#9aa4b4`, margen inferior 8); el mensaje (17 px, 600, interlineado 1.35, `#eef2f5`); un separador
   superior de 1 px `#1c222b` (margen superior 10) y, debajo, el botón de texto **"¿Por qué lo dice
   Atlas?"** (13 px, 600, menta, alto mínimo 44, ícono de información de 16 px a la izquierda, separación 8).
   Al tocarlo abre `RuleInfo` con la regla y la fuente del mensaje; si el mensaje no tiene regla o
   fuente, no muestres el botón.
4. **Meta de hoy** (tarjeta, padding 18, separación 14):
   - Fila superior: etiqueta "META DE HOY" a la izquierda y a la derecha un chip fijo "Descanso"
     (fondo `#173a2f`, texto menta, 13 px, 700, radio 12, padding 6/10).
   - Fila: recuadro 48×48, radio 16, fondo `#173a2f`, ícono de taza menta (trazo 2, 24 px) y a su lado
     (separación 14) el título (20 px, 700, interlineado 1.2) y debajo el texto fijo "Sin rutina hoy.
     Tu cuerpo se recupera mientras descansas." (13 px, `#c5ccd6`, interlineado 1.4, separación 3).
   - Separador superior de 1 px `#1c222b` (padding superior 14, separación 10): texto "¿Cómo te sientes
     hoy?" (14 px, 600); **3 chips en una cuadrícula de 3 columnas iguales** (separación 8): "Bien",
     "Normal", "Cansado" (alto 44, radio 16, 14 px, 700). Activo: fondo `#173a2f`, borde 1 px menta,
     texto menta. Inactivo: fondo `#161b22`, borde 1 px `#1c222b`, texto `#c5ccd6`. Nota de 12 px
     `#8b95a5`: "Atlas lo tiene en cuenta para los pesos de mañana." (ver Lógica: ajusta este texto
     según lo que realmente haga la app).
   - Tocar un chip lo activa; volver a tocar el activo lo desmarca. Con `accessibilityState.selected`.
5. **Mañana** (tarjeta, padding 16, separación 12; solo si existe una próxima rutina):
   - Etiqueta "MAÑANA" (o el nombre del día).
   - Fila (separación 14): **bloque de fecha** 52×52, radio 14, fondo `#173a2f`, texto menta (día 18 px
     800, mes 10 px 700 en mayúsculas, letter-spacing 0.06 em); a su derecha el nombre de la rutina
     (16 px, 700) y debajo "<n> ejercicios · ~<m> min" (13 px, `#8b95a5`).
   - Separador superior 1 px `#1c222b` (padding superior 12) con el texto de Atlas (13 px, `#c5ccd6`,
     interlineado 1.45); el peso va en menta, peso 700.
   - Botón principal ancho completo **"Ver rutina de mañana"** (alto 56, radio 24, fondo menta, texto
     `#06140e`, 16 px, 800). Si la próxima rutina no es mañana, el texto es "Ver rutina del <día>".
   - Debajo, botón de texto centrado **"Ver o crear rutinas"** (alto mínimo 44, 14 px, 600, `#c5ccd6`).
   - Ambos llevan a la pestaña Rutinas. Si Routines.js permite abrir una rutina concreta sin cambiar su
     comportamiento, "Ver rutina…" abre esa rutina; si no, solo lleva a la pestaña. Dime cuál hiciste.
   - Si no existe una próxima rutina (no hay rutinas o ninguna tiene días asignados): sustituye la
     tarjeta por una con el texto "Aún no tienes rutinas programadas." y el botón principal "Ver o crear
     rutinas".
6. **Cerca de un récord** (tarjeta, padding 16, separación 12; **solo si hay uno**): etiqueta "CERCA DE
   UN RÉCORD"; fila con a la izquierda el nombre del ejercicio (16 px, 700) y debajo "Récord: <peso> ×
   <reps>" (12 px, `#8b95a5`), y a la derecha un chip "Faltan <peso>" (como el chip "Descanso");
   debajo la barra de 8 px, radio 4, fondo `#242b35`, relleno menta con el porcentaje que ya lleva.
   Sin ejercicio cercano a un récord, la tarjeta no se muestra.
7. **Resumen simple** (tarjeta, padding 14/16): 3 columnas iguales centradas, separadas por líneas
   verticales de 1 px `#1c222b` y 32 de alto. Cada columna: valor (20 px, 800) y etiqueta (12 px,
   `#8b95a5`). Orden: racha (valor en menta, "días de racha"), "esta semana" (formato "4/4") y "último
   puntaje". Sin sesiones, no muestres la tarjeta.

## Lógica (funciones puras nuevas en src/recommend.js, con pruebas en src/__tests__/recommend.test.js)
Deben funcionar con datos viejos (sin `comment`, sin `days`, sin `unit`) y en kg/lb. Reutiliza
`streakInfo`, `weekSummary`, `personalRecords`, `recommendFor`, `coachMessage` y `toU`; no dupliques
su lógica. Si `streakInfo` aún no existe en el código, dímelo y no lo inventes.
- `nextRoutineDay(data, hoy)` → `{ routine, date, daysAway }` con la próxima rutina según `routine.days`
  (0 = lunes), empezando desde mañana y mirando hasta 7 días; `null` si ninguna rutina tiene días.
  Si varias rutinas caen el mismo día, la primera por orden de `routines`.
- `routineEstimate(data, routine)` → `{ exercises, minutes }`. `exercises` = `routine.exercises.length`.
  `minutes` = promedio redondeado de `durationSec` de las últimas sesiones de esa rutina (`routineId`),
  hasta 3; si no hay sesiones previas, `null` (muestra solo los ejercicios). No inventes duraciones.
  Etiquétalo como "criterio de la app" en RULES.
- `nextWeightHint(data, routine)` → texto/dato del primer ejercicio de la rutina con
  `recommendFor`: si la recomendación es subir, "te toca subir a <peso>"; si es mantener, "mantén
  <peso>"; sin historial de ese ejercicio, el texto estándar de la app para elegir con RIR 2-3 (no
  inventes el primer peso). La frase completa de la tarjeta se arma así: "Atlas ya preparó tus pesos.
  En <ejercicio> te toca subir a <peso>." (o "mantener <peso>"). Pesos en la unidad del usuario.
- `nearRecord(data, hoy)` → `{ exId, name, prKg, prReps, recentKg, gapKg, ratio }` o `null`. Criterio
  propio, etiquétalo como "criterio de la app" en RULES y documéntalo en docs/decisiones.md: entre los
  ejercicios con récord (`personalRecords`), el mejor peso confirmado de los últimos 14 días debe estar
  entre el 90 % y el 100 % (sin llegar) del récord de peso; se elige el de mayor `ratio`. Ignora series
  con `unconfirmed: true`. La barra usa `ratio`; el chip, `gapKg` convertido con `toU`.
- El mensaje de Atlas y su "por qué" salen de `coachMessage`; no agregues mensajes nuevos salvo que la
  plantilla ya exista.
- Pruebas mínimas: próxima rutina cruzando el fin de semana, rutinas sin `days`, estimado de minutos
  con y sin sesiones previas, recomendación de subir y de mantener, sin historial, `nearRecord` dentro
  y fuera del rango del 90 %, series sin confirmar y datos viejos sin `unit`.

## Datos (documenta los campos nuevos en la sección Datos de AGENTS.md)
- `data.checkin`: `{ date: "YYYY-MM-DD", level: "bien" | "normal" | "cansado" }`, opcional (ausente =
  sin respuesta). Solo guarda el último; es válido solo si `date` es hoy. No requiere migración.
- **No cambies reglas de progresión, descanso, PR ni puntaje.** Por eso el chequeo de energía **no
  modifica `recommendFor`**. Úsalo solo como contexto del mensaje de Atlas si ya existe una plantilla
  adecuada en src/coachMemory.js; si no existe, solo se guarda. En ese caso cambia la nota de 12 px a
  "Atlas lo tendrá presente." y dilo al final. Si el chequeo sí llega a usarse en los mensajes, deja la
  nota del diseño.
- No borres ni reescribas el historial existente.

## Archivos y estructura
- src/screens/Home.js: pantalla principal. Para no dejar un archivo enorme, divide en componentes en
  src/screens/home/ (por ejemplo `DayHeader.js`, `AtlasMessage.js`, `TodayGoal.js`, `TomorrowCard.js`,
  `NearRecordCard.js`, `QuickSummary.js`). Actualiza el Mapa de AGENTS.md.
- Otros archivos a tocar: src/recommend.js (funciones puras), src/__tests__/recommend.test.js,
  src/store.js (solo si hace falta un helper para `checkin`), App.js solo si el botón flotante de
  Ajustes está allí.
- Conserva lo que Home.js ya hace en los demás estados; no pierdas información. Si Home.js muestra
  calorías, déjalas como están en esos estados, pero **no las incluyas en el estado de descanso**.
- Usa Press, Card, T, H, Btn y Field de src/ui.js siempre que encajen; si no, estilo local y avísalo.
- Animaciones solo con Animated (como mucho un FadeIn ya existente). Sin librerías nuevas.
- Accesibilidad: `accessibilityLabel` en el botón de información, en cada chip del chequeo (con su
  estado), en el robot ("Atlas, tu entrenador virtual") y en los botones; objetivos táctiles de mínimo
  44×44.

## Qué NO hacer
- No cambies reglas de progresión, descanso, PR ni el puntaje; solo agrega funciones puras nuevas.
- No redibujes el robot Atlas: usa el componente `Coach` existente.
- No repitas Progreso: no pongas gráficas, tira de 7 días ni historial en Inicio.
- No inventes datos, pesos, duraciones ni fuentes; lo propio va etiquetado como "criterio de la app"
  en RULES.
- No crees ios/ ni android/, no ejecutes `npx expo start` ni `npm install`, no hagas commit ni push.

## Al terminar
1. Corre las pruebas (`npx jest 2>&1 | tail -5`) y comprueba que compila:
   `npx expo export --platform android 2>&1 | tail -5`; luego borra `dist`.
2. Actualiza el Mapa, el Estado (1–2 líneas) y la sección Datos de AGENTS.md, y las reglas nuevas en
   docs/decisiones.md.
3. Entrega la tabla **tarea | archivos modificados | estado (hecho / parcial / no hecho)** y la lista
   de archivos nuevos y modificados para el commit.
4. Di al final las decisiones que tomaste sin que estuvieran indicadas (por ejemplo cómo calculaste los
   minutos, el criterio de "cerca de un récord", a dónde lleva "Ver rutina de mañana", el texto final
   de la nota del chequeo de energía y qué estados de Inicio quedaron sin rediseñar).
5. Si esta tarea se parece mucho a algo que ya se pidió antes (por ejemplo la racha o el último puntaje
   de Progreso, o el "siguiente entreno" que ya mostraba Home.js), dilo.

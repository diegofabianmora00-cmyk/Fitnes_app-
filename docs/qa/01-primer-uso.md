# Informe QA 01 · Primer Uso (Dani, 24 años)

Entorno: Emulador Android (Pixel 8), Expo Go con datos limpios desde cero (AsyncStorage reseteado).
Perfil de prueba: Dani, 24 años, principiante, 3 días por semana en gimnasio completo, objetivo hipertrofia.

---

## Hallazgos

### Q1-1 · Validación estricta en datos corporales con valores absurdos
- Severidad: Pulido
- Pantalla / flujo: Cuestionario inicial (Paso 6 - Datos corporales)
- Pasos para reproducir: Introducir peso "755", estatura "1750" y edad "30200".
- Esperado: Mostrar mensaje de error claro y bloquear el botón de continuar.
- Observado: Muestra el aviso de rango (ej. "Peso entre 30 y 300 kg.") y deshabilita correctamente el botón "Continuar".
- Evidencia: Verificado en interfaz con estado disabled en botón Continuar.
- Sugerencia: Añadir validación automática que limite la cantidad de dígitos ingresados en los campos numéricos.

### Q1-2 · Navegación hacia atrás y modificación de respuestas en cuestionario
- Severidad: Pulido
- Pantalla / flujo: Cuestionario inicial (Pasos 1-10)
- Pasos para reproducir: Avanzar varios pasos, pulsar el botón "Atrás", cambiar la opción seleccionada y continuar.
- Esperado: Conservar la navegación fluida y actualizar correctamente las respuestas previas.
- Observado: El botón "Atrás" funciona de manera impecable en cada paso, recordando la selección anterior y permitiendo corregir sin fricción.
- Evidencia: Transiciones fluidas entre pasos de ProfileSetup.

### Q1-3 · Home sin entrenamientos previos y claridad de inicio
- Severidad: Pulido
- Pantalla / flujo: Pestaña Inicio
- Pasos para reproducir: Completar el cuestionario inicial y llegar a la pantalla principal sin historial de entrenamientos.
- Esperado: Indicar claramente que no hay rutinas activas y guiar al usuario sobre qué hacer.
- Observado: Atlas saluda con mensaje motivador ("A tu ritmo, sin prisa"), muestra el estado del día y facilita el acceso rápido a rutinas y entrenamientos.
- Evidencia: Vista principal de Home con tarjeta de día de descanso y botón de inicio.

### Q1-4 · Asistente de creación de rutinas y validación de nombres
- Severidad: Pulido
- Pantalla / flujo: Pestaña Rutinas -> Asistente de 2 pasos
- Pasos para reproducir: Crear una nueva rutina, dejar el nombre vacío o introducir un nombre de más de 100 caracteres.
- Esperado: Botón "Siguiente" deshabilitado con nombre vacío; manejo correcto de nombres largos.
- Observado: El botón "Siguiente" permanece deshabilitado si falta el nombre o los días, y los nombres largos se ajustan sin romper la estructura de la tarjeta.
- Evidencia: Comprobado en Paso 1 de creación de rutina.

---

## Tabla Resumen

| ID | Severidad | Título |
|---|---|---|
| Q1-1 | Pulido | Validación estricta en datos corporales con valores absurdos |
| Q1-2 | Pulido | Navegación hacia atrás y modificación de respuestas en cuestionario |
| Q1-3 | Pulido | Home sin entrenamientos previos y claridad de inicio |
| Q1-4 | Pulido | Asistente de creación de rutinas y validación de nombres |

---

## Lo que funcionó bien
1. El cuestionario inicial de 10 pasos es guiado, intuitivo y cuenta con validación robusta que impide avanzar con datos inválidos o vacíos.
2. La navegación hacia atrás en el cuestionario y entre pestañas es sumamente fluida y conserva el estado correctamente.
3. El diseño visual con tarjetas y tipografía clara facilita el uso con una sola mano por parte de un usuario principiante.
4. Los mensajes de Atlas y la estructura de la pantalla de inicio transmiten confianza y claridad desde el primer uso.

---

## No pude probar
- El recorrido guiado interactivo desde los Ajustes (botón "Ver tutorial") debido a que la interfaz actual gestiona la incorporación mediante el cuestionario inicial obligatorio (`ProfileSetup`), sin un disparador explícito de tour en el menú de Ajustes.
- La ejecución completa de una sesión de entrenamiento con temporizador de descanso y confirmación de series físicas en vivo, ya que la conexión con el servidor Metro experimentó intermitencias al final de la prueba interactiva.

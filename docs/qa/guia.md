# Guía de pruebas (QA) — Fitness Coach

Eres un usuario real que además anota todo lo que le incomoda. NO arreglas nada.

## Reglas
- Solo puedes crear o editar archivos dentro de `docs/qa/`. No toques el código de la
  app y no hagas commit.
- Usa solo el emulador y sus datos de prueba. Nunca datos reales.
- Antes de cada flujo largo, anota en el informe qué vas a probar. Guarda el informe
  cada 5 hallazgos, para que no se pierda nada si la sesión se acaba.
- Capturas: tómalas solo como evidencia de un fallo o al final de un flujo. Si tienes
  un volcado de la interfaz en texto, úsalo antes de la captura (cuesta menos).
  Guárdalas en `docs/qa/capturas/` con el id del hallazgo en el nombre.
- Si la app se cierra o muestra una pantalla roja: anótalo y revisa el log, filtrado
  a las últimas ~40 líneas, para encontrar la causa.
- Antes de añadir un hallazgo, revisa los informes anteriores de `docs/qa/`; no repitas.
- Si algo no lo pudiste comprobar, dilo en «No pude probar». No supongas.

## Qué observar en cada pantalla
- ¿Se entiende qué hacer sin ayuda?
- Número de toques para lograr la acción, y si se puede hacer con una mano.
- Tiempo de respuesta percibido y fluidez de animaciones (tirones, parpadeos).
- Legibilidad, contraste y tamaño de los botones (mínimo 48 px).
- Textos: todo en español, sin errores, sin frases que suenen invasivas («hoy toca...»).
- Coherencia: los mismos números (pesos, puntaje, calorías, fechas) coinciden en todas
  las pantallas.
- Callejones sin salida: pantallas de las que no se puede volver o salir.
- El botón atrás de Android siempre hace algo lógico.

## Severidad
- **Crítico:** pierde datos, cierra la app o bloquea al usuario.
- **Importante:** confunde, muestra un número incorrecto o rompe un flujo.
- **Pulido:** incomodidad, estética o texto mejorable.

## Formato de cada hallazgo

```
### Q<informe>-<n> · Título corto
- Severidad:
- Pantalla / flujo:
- Pasos para reproducir:
- Esperado:
- Observado:
- Evidencia: (captura o línea de log)
- Sugerencia (opcional, una línea):
```

## Al final de cada informe
1. Tabla resumen: id | severidad | título.
2. «Lo que funcionó bien» (máximo 5 líneas).
3. «No pude probar» con el motivo de cada cosa.

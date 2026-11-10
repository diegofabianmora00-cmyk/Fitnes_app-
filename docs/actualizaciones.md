# Actualizaciones de Fitness Coach

La app lee `update.json` (en la rama `main` del repo) al abrirse y también desde
Ajustes > Buscar actualizaciones. Si la versión de `update.json` es mayor que la
instalada, muestra el aviso con el botón "Actualizar ahora" y el botón
"Continuar con mi versión actual".

## Publicar una versión nueva

1. Sube la versión en `app.json` (ejemplo: `1.1.2` → `1.2.0`) y suma 1 a
   `android.versionCode`.
2. Compila el APK:

   `npx eas-cli build -p android --profile preview --non-interactive --wait --json`

3. Copia la URL que sale en `artifacts.applicationArchiveUrl`.
4. Edita `update.json`:
   - `version`: la misma versión nueva de `app.json`.
   - `downloadUrl`: la URL del APK recién compilado.
   - `notes`: un resumen corto de los cambios.
5. Haz commit y push de `app.json` y `update.json`.

El botón "Actualizar ahora" descarga el APK dentro de la app y abre el instalador
de Android. Necesita el permiso `REQUEST_INSTALL_PACKAGES` (ya está en `app.json`).
La primera vez que se pasa de una versión anterior a la 1.1.2 hay que instalar el
APK a mano; desde la 1.1.2 las siguientes actualizaciones ya se instalan desde la
propia app.

## Reglas

- La comparación es numérica: `1.10.0` es mayor que `1.9.0`.
- El aviso automático aparece una vez por versión nueva. Si la persona pulsa
  "Continuar con mi versión actual", no se le vuelve a mostrar sola, pero puede
  revisar de nuevo en Ajustes > Buscar actualizaciones.
- Los datos del usuario se conservan al instalar el APK nuevo encima del actual.
- Las versiones anteriores a la 1.1.0 no tienen el sistema de avisos: hay que
  pasarles el APK nuevo una vez. A partir de la 1.1.0 las siguientes
  actualizaciones ya se avisan solas.

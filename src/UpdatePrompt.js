import { Dialog } from './Dialog';
import { APP_VERSION } from './version';
import { downloadAndInstallUpdate, setSeenUpdate } from './updates';

export function promptUpdate(info) {
  if (!info || !info.downloadUrl) return;
  const notes = info.notes ? `\n\n${info.notes}` : '';
  Dialog.alert(
    'Nueva versión disponible',
    `Ya salió la versión ${info.version}. Tú tienes la ${APP_VERSION}.${notes}`,
    [
      {
        text: 'Actualizar ahora',
        onPress: async () => {
          await setSeenUpdate(info.version);
          let cancelled = false;
          let task = null;
          let lastPct = -1;
          const progressId = Dialog.alert(
            'Descargando actualización',
            'Preparando la descarga...',
            [
              {
                text: 'Cancelar',
                style: 'cancel',
                onPress: () => {
                  cancelled = true;
                  if (task) task.cancel();
                },
              },
            ],
            { cancelable: false }
          );
          try {
            const result = await downloadAndInstallUpdate(
              info.downloadUrl,
              (progress) => {
                const pct = Math.round(progress * 100);
                if (pct !== lastPct) {
                  lastPct = pct;
                  Dialog.update(progressId, { message: `Descargando... ${pct}%` });
                }
              },
              (t) => { task = t; }
            );
            Dialog.hide(progressId);
            if (!result.ok && !cancelled) {
              Dialog.alert(
                'No se pudo actualizar',
                'No se pudo descargar o abrir el instalador. Revisa tu conexión e inténtalo de nuevo, o escríbele a Diego para que te pase la versión actualizada.'
              );
            }
          } catch (e) {
            Dialog.hide(progressId);
            if (!cancelled) {
              Dialog.alert(
                'No se pudo actualizar',
                'No se pudo descargar la actualización. Revisa tu conexión e inténtalo de nuevo, o escríbele a Diego para que te pase la versión actualizada.'
              );
            }
          }
        },
      },
      {
        text: 'Continuar con mi versión actual',
        onPress: async () => {
          await setSeenUpdate(info.version);
          Dialog.alert(
            'Actualización pendiente',
            'Escríbele a Diego para que te pase la versión actualizada. Al instalar la nueva versión encima de la actual, tus datos y entrenamientos se conservan.'
          );
        },
      },
    ],
    { cancelable: false }
  );
}

import { Dialog } from './Dialog';
import { APP_VERSION } from './version';
import { openUpdate, setSeenUpdate } from './updates';

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
          const ok = await openUpdate(info.downloadUrl);
          if (!ok) {
            Dialog.alert(
              'No se pudo abrir el enlace',
              'Escríbele a Diego para que te pase la versión actualizada.'
            );
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

import * as Notifications from 'expo-notifications';
import Storage from 'expo-sqlite/kv-store';

import { EstadoReporte, Reporte } from '../tipos';
import { ETIQUETAS_ESTADO } from '../utilidades/estados';

const CLAVE_ESTADOS_VISTOS = 'seguimiento.estadosVistos';
const CLAVE_AVISOS_ACTIVOS = 'seguimiento.avisosActivos';
const CLAVE_YA_OFRECIMOS = 'seguimiento.yaOfrecimosAvisos';

const CANAL = 'cambios-de-estado';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const prepararCanal = async (): Promise<void> => {
  await Notifications.setNotificationChannelAsync(CANAL, {
    name: 'Cambios de estado',
    description: 'Avisos cuando cambia el estado de un reclamo tuyo',
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#2563EB',
  });
};

export const permisoConcedido = async (): Promise<boolean> => {
  const actual = await Notifications.getPermissionsAsync();
  return actual.status === 'granted';
};

export const pedirPermisoDeAvisos = async (): Promise<boolean> => {
  await prepararCanal();

  const actual = await Notifications.getPermissionsAsync();
  if (actual.status === 'granted') return true;
  if (!actual.canAskAgain) return false;

  const pedido = await Notifications.requestPermissionsAsync();
  return pedido.status === 'granted';
};

export const yaOfrecimosLosAvisos = async (): Promise<boolean> => {
  return (await Storage.getItem(CLAVE_YA_OFRECIMOS)) === 'true';
};

export const marcarAvisosOfrecidos = async (): Promise<void> => {
  await Storage.setItem(CLAVE_YA_OFRECIMOS, 'true');
};

export const avisosActivos = async (): Promise<boolean> => {
  const guardado = await Storage.getItem(CLAVE_AVISOS_ACTIVOS);
  return guardado === null ? true : guardado === 'true';
};

export const definirAvisosActivos = async (activos: boolean): Promise<void> => {
  await Storage.setItem(CLAVE_AVISOS_ACTIVOS, String(activos));
};

type EstadosVistos = Record<string, EstadoReporte>;

const leerEstadosVistos = async (): Promise<EstadosVistos> => {
  const crudo = await Storage.getItem(CLAVE_ESTADOS_VISTOS);
  if (!crudo) return {};

  try {
    return JSON.parse(crudo) as EstadosVistos;
  } catch {
    return {};
  }
};

const guardarEstadosVistos = async (vistos: EstadosVistos): Promise<void> => {
  await Storage.setItem(CLAVE_ESTADOS_VISTOS, JSON.stringify(vistos));
};

export const revisarCambiosDeEstado = async (
  reportes: Reporte[],
): Promise<number> => {
  if (!(await avisosActivos())) return 0;

  const vistos = await leerEstadosVistos();
  const nuevosVistos: EstadosVistos = { ...vistos };
  let avisados = 0;

  for (const reporte of reportes) {
    const estadoAnterior = vistos[reporte.id];

    if (estadoAnterior === undefined) {
      nuevosVistos[reporte.id] = reporte.estado;
      continue;
    }

    if (estadoAnterior !== reporte.estado) {
      await avisarCambioDeEstado(reporte);
      nuevosVistos[reporte.id] = reporte.estado;
      avisados += 1;
    }
  }

  await guardarEstadosVistos(nuevosVistos);
  return avisados;
};

export const avisarCambioDeEstado = async (reporte: Reporte): Promise<void> => {
  const etiqueta = ETIQUETAS_ESTADO[reporte.estado];

  const cuerpo =
    reporte.estado === 'rechazado'
      ? `Tu reclamo de ${reporte.direccion} fue rechazado. Tocá para ver el motivo.`
      : `Tu reclamo de ${reporte.direccion} ahora está: ${etiqueta}.`;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: reporte.codigo,
      body: cuerpo,
      data: { reporteId: reporte.id },
    },
    trigger: { channelId: CANAL },
  });
};

export const avisarAdhesion = async (reporte: Reporte): Promise<void> => {
  if (!(await avisosActivos())) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: reporte.codigo,
      body: `Un vecino se sumó a tu reclamo de ${reporte.direccion}.`,
      data: { reporteId: reporte.id },
    },
    trigger: { channelId: CANAL },
  });
};

export const escucharToquesDeNotificacion = (
  alTocar: (reporteId: string) => void,
): (() => void) => {
  const suscripcion = Notifications.addNotificationResponseReceivedListener(
    (respuesta) => {
      const datos = respuesta.notification.request.content.data as
        | { reporteId?: string }
        | undefined;

      if (datos?.reporteId) alTocar(datos.reporteId);
    },
  );

  return () => suscripcion.remove();
};

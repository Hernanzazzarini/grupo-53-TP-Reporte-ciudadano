import * as Notifications from 'expo-notifications';
import Storage from 'expo-sqlite/kv-store';

import { EstadoReporte, Reporte } from '../tipos';
import { ETIQUETAS_ESTADO } from '../utilidades/estados';
import { actualizarConfiguracion, obtenerUsuarioActual } from './usuarios';

const CLAVE_ESTADOS_VISTOS = 'seguimiento.estadosVistos';
const CLAVE_ADHESIONES_VISTAS = 'seguimiento.adhesionesVistas';
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

export const avisosActivos = async (): Promise<boolean> =>
  obtenerUsuarioActual()?.avisosActivos ?? false;

export const definirAvisosActivos = async (activos: boolean): Promise<void> => {
  await actualizarConfiguracion(activos);
};

type Vistos<T> = Record<string, T>;

const leerVistos = async <T>(clave: string): Promise<Vistos<T>> => {
  const crudo = await Storage.getItem(clave);
  if (!crudo) return {};

  try {
    return JSON.parse(crudo) as Vistos<T>;
  } catch {
    return {};
  }
};

const guardarVistos = async <T>(clave: string, vistos: Vistos<T>): Promise<void> => {
  await Storage.setItem(clave, JSON.stringify(vistos));
};

export const revisarCambiosDeEstado = async (
  reportes: Reporte[],
): Promise<number> => {
  if (!(await avisosActivos())) return 0;

  const vistos = await leerVistos<EstadoReporte>(CLAVE_ESTADOS_VISTOS);
  const nuevosVistos: Vistos<EstadoReporte> = { ...vistos };
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

  await guardarVistos(CLAVE_ESTADOS_VISTOS, nuevosVistos);
  return avisados;
};

export const revisarAdhesiones = async (reportes: Reporte[]): Promise<number> => {
  if (!(await avisosActivos())) return 0;

  const vistas = await leerVistos<number>(CLAVE_ADHESIONES_VISTAS);
  const nuevasVistas: Vistos<number> = { ...vistas };
  let avisados = 0;

  for (const reporte of reportes) {
    const anteriores = vistas[reporte.id];
    nuevasVistas[reporte.id] = reporte.adhesiones;

    if (anteriores !== undefined && reporte.adhesiones > anteriores) {
      await avisarAdhesion(reporte, reporte.adhesiones - anteriores);
      avisados += 1;
    }
  }

  await guardarVistos(CLAVE_ADHESIONES_VISTAS, nuevasVistas);
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

export const avisarAdhesion = async (reporte: Reporte, cantidad: number = 1): Promise<void> => {
  if (!(await avisosActivos())) return;

  const quienes = cantidad === 1 ? 'Un vecino se sumó' : `${cantidad} vecinos se sumaron`;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: reporte.codigo,
      body: `${quienes} a tu reclamo de ${reporte.direccion}.`,
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

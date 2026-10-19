import { useRouter } from 'expo-router';
import { useCallback, useEffect } from 'react';
import { AppState } from 'react-native';

import { misReportes } from '../servicios/seguimiento';
import {
  escucharToquesDeNotificacion,
  permisoConcedido,
  prepararCanal,
  revisarCambiosDeEstado,
} from '../servicios/notificaciones';

export default function AvisosDeEstado() {
  const router = useRouter();

  const revisar = useCallback(async () => {
    if (!(await permisoConcedido())) return;

    const reportes = await misReportes().catch(() => null);
    if (reportes) await revisarCambiosDeEstado(reportes);
  }, []);

  useEffect(() => {
    let vivo = true;

    const arrancar = async () => {
      await prepararCanal();
      if (vivo) await revisar();
    };

    arrancar();

    return () => {
      vivo = false;
    };
  }, [revisar]);

  useEffect(() => {
    const suscripcion = AppState.addEventListener('change', (estado) => {
      if (estado === 'active') revisar();
    });

    return () => suscripcion.remove();
  }, [revisar]);

  useEffect(() => {
    return escucharToquesDeNotificacion((reporteId) => {
      router.push({
        pathname: '/detalle-reporte' as any,
        params: { id: reporteId },
      });
    });
  }, [router]);

  return null;
}

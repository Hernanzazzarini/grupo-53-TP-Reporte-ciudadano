import { EstadoReporte } from '../tipos';

export const ETIQUETAS_ESTADO: Record<EstadoReporte, string> = {
  recibido: 'Recibido',
  en_revision: 'En revisión',
  asignado: 'Asignado a cuadrilla',
  resuelto: 'Resuelto',
  rechazado: 'Rechazado',
};

export const COLORES_ESTADO: Record<EstadoReporte, string> = {
  recibido: '#64748B',
  en_revision: '#CA8A04',
  asignado: '#2563EB',
  resuelto: '#16A34A',
  rechazado: '#DC2626',
};

export const ORDEN_ESTADOS: EstadoReporte[] = [
  'recibido',
  'en_revision',
  'asignado',
  'resuelto',
  'rechazado',
];

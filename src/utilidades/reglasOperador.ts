import { Cuadrilla, EstadoReporte, Reporte } from '../tipos';

// Todo lo marcado PENDIENTE es provisorio hasta que responda la cátedra.

// PENDIENTE hueco 1: si es true, la bandeja no deja sacar el filtro de la zona del operador.
export const OPERADOR_VE_SOLO_SU_ZONA = false;

// PENDIENTE hueco 2
export const SOLO_CUADRILLAS_ACTIVAS = true;
export const SOLO_CUADRILLAS_DE_LA_ZONA = false;

// PENDIENTE hueco 3
export const FOTO_ARREGLO_OBLIGATORIA = false;

// PENDIENTE hueco 4: resuelto y rechazado son finales, no se reabren.
export const TRANSICIONES: Record<EstadoReporte, EstadoReporte[]> = {
  recibido: ['en_revision', 'asignado', 'rechazado'],
  en_revision: ['asignado', 'resuelto', 'rechazado'],
  asignado: ['en_revision', 'resuelto', 'rechazado'],
  resuelto: [],
  rechazado: [],
};

// El PDF pide "cambiar el estado y dejar escrito por qué". Al asignar, el
// comentario es el nombre de la cuadrilla, así que no se le pide al operador.
export const EXIGEN_COMENTARIO: EstadoReporte[] = ['en_revision', 'resuelto', 'rechazado'];

// PENDIENTE hueco 5: marcar duplicados queda afuera hasta saber qué pasa con el
// estado y las adhesiones del duplicado, y si es de este módulo o del 4.

export const puedePasarA = (desde: EstadoReporte, hacia: EstadoReporte): boolean =>
  TRANSICIONES[desde].includes(hacia);

export const estadosSiguientes = (desde: EstadoReporte): EstadoReporte[] =>
  TRANSICIONES[desde];

export const puedeAsignarse = (cuadrilla: Cuadrilla, reporte: Reporte): boolean =>
  (!SOLO_CUADRILLAS_ACTIVAS || cuadrilla.activa) &&
  (!SOLO_CUADRILLAS_DE_LA_ZONA || cuadrilla.zonaId === reporte.zonaId);

// Primero las de la zona del reporte.
export const cuadrillasAsignables = (
  cuadrillas: Cuadrilla[],
  reporte: Reporte,
): Cuadrilla[] =>
  cuadrillas
    .filter((cuadrilla) => puedeAsignarse(cuadrilla, reporte))
    .sort(
      (a, b) =>
        Number(b.zonaId === reporte.zonaId) - Number(a.zonaId === reporte.zonaId) ||
        a.nombre.localeCompare(b.nombre),
    );

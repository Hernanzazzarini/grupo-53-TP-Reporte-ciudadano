import { CUADRILLAS, ZONAS } from '../mocks/cuadrillas';
import { CAMBIOS_DE_ESTADO, REPORTES } from '../mocks/reportes';
import {
  CambioDeEstado,
  Coordenadas,
  Cuadrilla,
  EstadoReporte,
  Reporte,
  Zona,
} from '../tipos';
import { ETIQUETAS_ESTADO } from '../utilidades/estados';
import {
  cuadrillasAsignables,
  EXIGEN_COMENTARIO,
  FOTO_ARREGLO_OBLIGATORIA,
  puedeAsignarse,
  puedePasarA,
} from '../utilidades/reglasOperador';
import { ErrorDeRed, SIMULAR } from './seguimiento';

const DEMORA_MS = 600;
const esperar = (ms: number) => new Promise((resolver) => setTimeout(resolver, ms));

const conRed = async () => {
  await esperar(DEMORA_MS);
  if (SIMULAR.errorDeRed) throw new ErrorDeRed();
};

// Argentina está siempre en UTC-3, sin horario de verano.
const ahoraIso = (): string => {
  const local = new Date(Date.now() - 3 * 60 * 60 * 1000);
  return `${local.toISOString().slice(0, 19)}-03:00`;
};

const idNuevo = (prefijo: string) =>
  `${prefijo}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

const estaDentro = (punto: Coordenadas, limite: Coordenadas[]): boolean => {
  let dentro = false;
  for (let i = 0, j = limite.length - 1; i < limite.length; j = i++) {
    const a = limite[i];
    const b = limite[j];
    const cruza =
      a.latitud > punto.latitud !== b.latitud > punto.latitud &&
      punto.longitud <
        ((b.longitud - a.longitud) * (punto.latitud - a.latitud)) /
          (b.latitud - a.latitud) +
          a.longitud;
    if (cruza) dentro = !dentro;
  }
  return dentro;
};

const buscarReporte = (reporteId: string): number => {
  const indice = REPORTES.findIndex((reporte) => reporte.id === reporteId);
  if (indice === -1) throw new Error('No encontramos el reclamo.');
  return indice;
};

const registrarCambio = (
  reporteId: string,
  estado: EstadoReporte,
  comentario: string | null,
  operadorId: string,
) => {
  const cambio: CambioDeEstado = {
    id: idNuevo('cam'),
    reporteId,
    estado,
    comentario,
    operadorId,
    fechaHora: ahoraIso(),
  };
  CAMBIOS_DE_ESTADO.push(cambio);
};

export const listarZonas = async (): Promise<Zona[]> => {
  await conRed();
  return [...ZONAS];
};

export const listarCuadrillas = async (zonaId?: string): Promise<Cuadrilla[]> => {
  await conRed();
  return CUADRILLAS.filter((cuadrilla) => !zonaId || cuadrilla.zonaId === zonaId);
};

export const cuadrillasParaReporte = async (reporteId: string): Promise<Cuadrilla[]> => {
  await conRed();
  return cuadrillasAsignables(CUADRILLAS, REPORTES[buscarReporte(reporteId)]);
};

export const zonaDePunto =async (coordenadas: Coordenadas): Promise<Zona | null> => {
  await conRed();
  return ZONAS.find((zona) => estaDentro(coordenadas, zona.limite)) ?? null;
};

export interface FiltrosBandeja {
  estado?: EstadoReporte;
  tipoId?: string;
  zonaId?: string;
}

// Más adhesiones primero; a igual cantidad, el que hace más que espera.
export const bandeja = async (filtros: FiltrosBandeja = {}): Promise<Reporte[]> => {
  await conRed();

  return REPORTES
    .filter((reporte) => !filtros.estado || reporte.estado === filtros.estado)
    .filter((reporte) => !filtros.tipoId || reporte.tipoId === filtros.tipoId)
    .filter((reporte) => !filtros.zonaId || reporte.zonaId === filtros.zonaId)
    .sort(
      (a, b) => b.adhesiones - a.adhesiones || a.creadoEn.localeCompare(b.creadoEn),
    );
};

export const cambiarEstado = async (
  reporteId: string,
  estado: EstadoReporte,
  comentario: string | null,
  operadorId: string,
): Promise<Reporte> => {
  await conRed();

  if (estado === 'asignado') {
    throw new Error('Para asignar el reclamo, elegí una cuadrilla.');
  }

  const indice = buscarReporte(reporteId);
  const reporte = REPORTES[indice];

  if (!puedePasarA(reporte.estado, estado)) {
    throw new Error(
      `Un reclamo ${ETIQUETAS_ESTADO[reporte.estado].toLowerCase()} no puede pasar a ${ETIQUETAS_ESTADO[estado].toLowerCase()}.`,
    );
  }

  const texto = comentario?.trim() || null;
  if (EXIGEN_COMENTARIO.includes(estado) && !texto) {
    throw new Error(
      estado === 'rechazado'
        ? 'Para rechazar un reclamo hay que explicar el motivo.'
        : 'Contá brevemente por qué cambia el estado.',
    );
  }

  const tieneFotoArreglo = reporte.fotos.some((foto) => foto.momento === 'arreglo');
  if (estado === 'resuelto' && FOTO_ARREGLO_OBLIGATORIA && !tieneFotoArreglo) {
    throw new Error('Para cerrar el reclamo, subí la foto del arreglo.');
  }

  const actualizado: Reporte = { ...reporte, estado };
  REPORTES[indice] = actualizado;
  registrarCambio(reporteId, estado, texto, operadorId);

  return actualizado;
};

export const asignarCuadrilla = async (
  reporteId: string,
  cuadrillaId: string,
  operadorId: string,
): Promise<Reporte> => {
  await conRed();

  const cuadrilla = CUADRILLAS.find((c) => c.id === cuadrillaId);
  if (!cuadrilla) throw new Error('No encontramos la cuadrilla.');

  const indice = buscarReporte(reporteId);
  const reporte = REPORTES[indice];

  // Reasignar un reclamo que ya estaba asignado está permitido.
  if (reporte.estado !== 'asignado' && !puedePasarA(reporte.estado, 'asignado')) {
    throw new Error(
      `Un reclamo ${ETIQUETAS_ESTADO[reporte.estado].toLowerCase()} no se puede asignar.`,
    );
  }
  if (!puedeAsignarse(cuadrilla, reporte)) {
    throw new Error(`${cuadrilla.nombre} no puede tomar este reclamo.`);
  }

  const actualizado: Reporte = {
    ...reporte,
    cuadrillaId,
    estado: 'asignado',
  };
  REPORTES[indice] = actualizado;
  registrarCambio(reporteId, 'asignado', cuadrilla.nombre, operadorId);

  return actualizado;
};

// Si ya había una foto del arreglo, la reemplaza.
export const agregarFotoArreglo = async (
  reporteId: string,
  uri: string,
): Promise<Reporte> => {
  await conRed();

  const indice = buscarReporte(reporteId);
  const reporte = REPORTES[indice];
  const actualizado: Reporte = {
    ...reporte,
    fotos: [
      ...reporte.fotos.filter((foto) => foto.momento !== 'arreglo'),
      { id: idNuevo('fot'), url: uri, momento: 'arreglo' },
    ],
  };
  REPORTES[indice] = actualizado;

  return actualizado;
};

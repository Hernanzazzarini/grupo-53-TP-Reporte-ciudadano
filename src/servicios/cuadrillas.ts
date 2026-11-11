import { cliente } from '../api/cliente';
import { mensajeDeError } from '../api/errores';
import { ArchivoSubido, RespuestaLista, RespuestaUno } from '../tipos/api';
import { Cuadrilla, EstadoReporte, Reporte, Zona } from '../tipos';
import { cuadrillasAsignables } from '../utilidades/reglasOperador';

// =====================================================================
// SERVICIO DE CUADRILLAS (Módulo 6) — conectado a la API con Axios.
// Antes trabajaba contra mocks en memoria; ahora habla con la API real,
// igual que seguimiento.ts, usuarios.ts y adhesiones.ts.
// =====================================================================

const MAXIMO_POR_PAGINA = 100;

export const listarZonas = async (): Promise<Zona[]> => {
  try {
    const respuesta = await cliente.get<RespuestaLista<Zona>>('/zonas', {
      params: { porPagina: MAXIMO_POR_PAGINA },
    });
    return respuesta.data.datos;
  } catch (error) {
    throw new Error(mensajeDeError(error, 'No pudimos cargar las zonas.'));
  }
};

export const listarCuadrillas = async (zonaId?: string): Promise<Cuadrilla[]> => {
  try {
    const respuesta = await cliente.get<RespuestaLista<Cuadrilla>>('/cuadrillas', {
      params: {
        porPagina: MAXIMO_POR_PAGINA,
        ...(zonaId ? { zonaId } : {}),
      },
    });
    return respuesta.data.datos;
  } catch (error) {
    throw new Error(mensajeDeError(error, 'No pudimos cargar las cuadrillas.'));
  }
};

// Trae todas las cuadrillas y aplica las reglas del operador (activa / misma
// zona primero) del lado del cliente, igual que antes.
export const cuadrillasParaReporte = async (reporte: Reporte): Promise<Cuadrilla[]> => {
  const todas = await listarCuadrillas();
  return cuadrillasAsignables(todas, reporte);
};

export interface FiltrosBandeja {
  estado?: EstadoReporte;
  tipoId?: string;
  zonaId?: string;
}

export const bandeja = async (filtros: FiltrosBandeja = {}): Promise<Reporte[]> => {
  try {
    const respuesta = await cliente.get<RespuestaLista<Reporte>>('/bandeja', {
      params: {
        porPagina: MAXIMO_POR_PAGINA,
        ...(filtros.estado ? { estado: filtros.estado } : {}),
        ...(filtros.tipoId ? { tipoId: filtros.tipoId } : {}),
        ...(filtros.zonaId ? { zonaId: filtros.zonaId } : {}),
      },
    });

    // Más adhesiones primero; a igual cantidad, el que hace más que espera.
    return [...respuesta.data.datos].sort(
      (a, b) => b.adhesiones - a.adhesiones || a.creadoEn.localeCompare(b.creadoEn),
    );
  } catch (error) {
    throw new Error(mensajeDeError(error, 'No pudimos cargar la bandeja.'));
  }
};

export const cambiarEstado = async (
  reporteId: string,
  estado: EstadoReporte,
  comentario: string | null,
): Promise<Reporte> => {
  try {
    const respuesta = await cliente.patch<RespuestaUno<Reporte>>(
      `/reportes/${reporteId}/estado`,
      { estado, comentario },
    );
    return respuesta.data.datos;
  } catch (error) {
    throw new Error(mensajeDeError(error, 'No se pudo cambiar el estado.'));
  }
};

export const asignarCuadrilla = async (
  reporteId: string,
  cuadrillaId: string,
): Promise<Reporte> => {
  try {
    const respuesta = await cliente.patch<RespuestaUno<Reporte>>(
      `/reportes/${reporteId}/cuadrilla`,
      { cuadrillaId },
    );
    return respuesta.data.datos;
  } catch (error) {
    throw new Error(mensajeDeError(error, 'No se pudo asignar la cuadrilla.'));
  }
};

// Sube la foto a /archivos y después la liga al reporte, igual que hace
// crear-reporte.tsx para la foto del problema.
export const agregarFotoArreglo = async (reporteId: string, uri: string): Promise<Reporte> => {
  try {
    const nombre = uri.split('/').pop() || 'foto.jpg';
    const extension = nombre.split('.').pop()?.toLowerCase();
    const mimeType =
      extension === 'png' ? 'image/png' : extension === 'webp' ? 'image/webp' : 'image/jpeg';

    const archivo = new FormData();
    archivo.append('archivo', { uri, name: nombre, type: mimeType } as any);

    const subida = await cliente.post<RespuestaUno<ArchivoSubido>>('/archivos', archivo);
    const url = subida.data?.datos?.url;
    if (!url) throw new Error('El servidor no devolvió la URL de la foto.');

    const respuesta = await cliente.post<RespuestaUno<Reporte>>(`/reportes/${reporteId}/fotos`, {
      url,
    });
    return respuesta.data.datos;
  } catch (error) {
    throw new Error(mensajeDeError(error, 'No se pudo subir la foto.'));
  }
};

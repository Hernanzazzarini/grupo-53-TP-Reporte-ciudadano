import { cliente } from '../api/cliente';
import { ErrorDeApi } from '../api/errores';
import { CambioDeEstado, Reporte } from '../tipos';
import { RespuestaLista, RespuestaUno } from '../tipos/api';

const MAXIMO_POR_PAGINA = 100;

const esNoEncontrado = (error: unknown): boolean =>
  error instanceof ErrorDeApi &&
  (error.codigo === 'REPORTE_NO_ENCONTRADO' || error.codigo === 'VALIDACION_FALLIDA');

export const misReportes = async (): Promise<Reporte[]> => {
  const respuesta = await cliente.get<RespuestaLista<Reporte>>('/yo/reportes', {
    params: { porPagina: MAXIMO_POR_PAGINA },
  });
  return respuesta.data.datos;
};

export const reportePorId = async (id: string): Promise<Reporte | null> => {
  try {
    const respuesta = await cliente.get<RespuestaUno<Reporte>>(
      `/reportes/${encodeURIComponent(id)}`,
    );
    return respuesta.data.datos;
  } catch (error) {
    if (esNoEncontrado(error)) return null;
    throw error;
  }
};

export const reportePorCodigo = async (codigo: string): Promise<Reporte | null> => {
  const buscado = codigo.trim().toUpperCase();
  if (buscado.length === 0) return null;

  try {
    const respuesta = await cliente.get<RespuestaUno<Reporte>>(
      `/reportes/codigo/${encodeURIComponent(buscado)}`,
    );
    return respuesta.data.datos;
  } catch (error) {
    if (esNoEncontrado(error)) return null;
    throw error;
  }
};

export const historialDeReporte = async (
  reporteId: string,
): Promise<CambioDeEstado[]> => {
  try {
    const respuesta = await cliente.get<RespuestaLista<CambioDeEstado>>(
      `/reportes/${encodeURIComponent(reporteId)}/cambios`,
      { params: { porPagina: MAXIMO_POR_PAGINA } },
    );
    return respuesta.data.datos;
  } catch (error) {
    if (esNoEncontrado(error)) return [];
    throw error;
  }
};

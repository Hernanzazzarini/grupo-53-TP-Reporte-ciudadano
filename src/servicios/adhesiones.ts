import { cliente } from "../api/cliente";
import { mensajeDeError } from "../api/errores";
import { RespuestaLista, RespuestaUno } from "../tipos/api";
import { Reporte } from "../tipos/index";

export async function obtenerReportesCercanos(
  latitud: number,
  longitud: number,
  radioMetros: number = 50,
): Promise<Reporte[]> {
  try {
    const respuesta = await cliente.get<RespuestaLista<Reporte>>(
      "/reportes/cercanos",
      {
        params: {
          latitud,
          longitud,
          radioMetros,
        },
      },
    );

    return respuesta.data.datos;
  } catch (error) {
    const mensaje = mensajeDeError(
      error,
      "No pudimos buscar los reportes cercanos.",
    );
    throw new Error(mensaje);
  }
}

export async function adherirAReporte(reporteId: string): Promise<Reporte> {
  try {
    const respuesta = await cliente.post<RespuestaUno<Reporte>>(
      `/reportes/${reporteId}/adhesiones`,
    );
    return respuesta.data.datos;
  } catch (error) {
    const mensaje = mensajeDeError(error, "No pudimos sumarte al reclamo.");
    throw new Error(mensaje);
  }
}

export async function marcarComoDuplicado(
  reporteId: string,
  reporteOriginalId: string,
): Promise<Reporte> {
  try {
    const respuesta = await cliente.post<RespuestaUno<Reporte>>(
      `/reportes/${reporteId}/duplicado`,
      {
        originalId: reporteOriginalId,
      },
    );
    return respuesta.data.datos;
  } catch (error) {
    const mensaje = mensajeDeError(
      error,
      "No se pudo marcar el reporte como duplicado.",
    );
    throw new Error(mensaje);
  }
}

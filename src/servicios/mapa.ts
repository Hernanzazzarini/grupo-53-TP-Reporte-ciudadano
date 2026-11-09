
import { cliente } from '../api/cliente';
import type { RespuestaLista } from '../tipos/api';
import type { Reporte } from '../tipos/index';

export async function obtenerReportes(): Promise<Reporte[]> {
  const respuesta = await cliente.get<RespuestaLista<Reporte>>(
    '/reportes',
    {
      params: {
        pagina: 1,
        porPagina: 500,
      },
    }
  );

  return respuesta.data.datos;
}

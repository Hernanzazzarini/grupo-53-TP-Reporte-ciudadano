
import { cliente } from '../api/cliente';
import type { Coordenadas, Reporte, ReporteDatos, TipoDeReporte } from '../tipos';
import type { ArchivoSubido, RespuestaLista, RespuestaUno } from '../tipos/api';

export async function obtenerTiposDeReporte(): Promise<TipoDeReporte[]> {
    const respuesta = await cliente.get('/tipos-de-reporte');
    return respuesta.data.datos;
}

export async function obtenerReportesCercanos(
    coordenadas: Coordenadas,
    tipoId?: string
): Promise<Reporte[]> {
    const respuesta = await cliente.get<RespuestaLista<Reporte>>(
        '/reportes/cercanos',
        {
            params: {
                latitud: coordenadas.latitud,
                longitud: coordenadas.longitud,
                radioMetros: 50,
                ...(tipoId ? { tipoId } : {}),
            },
        }
    );

    return respuesta.data.datos;
}

export async function sumarmeAReporte(id: string): Promise<void> {
    await cliente.post(`/reportes/${id}/adhesiones`);
}

export async function enviarReporte(datos: ReporteDatos) {
    // 1. Subir las fotos al backend
    const fotos = await Promise.all(
        datos.fotosLocales.map(async (uri) => {
            const nombre = uri.split('/').pop() || 'foto.jpg';
            const extension = nombre.split('.').pop()?.toLowerCase();

            const mimeType =
                extension === 'png' ? 'image/png' :
                    extension === 'webp' ? 'image/webp' :
                        'image/jpeg';

            const archivo = new FormData();

            archivo.append('archivo', {
                uri,
                name: nombre,
                type: mimeType,
            } as any);

            const respuesta = await cliente.post<RespuestaUno<ArchivoSubido>>(
                '/archivos',
                archivo
            );

            return {
                url: respuesta.data.datos.url,
                momento: 'problema' as const,
            };
        })
    );

    // 2. Crear el reporte con las URLs devueltas por la API
    const respuesta = await cliente.post<RespuestaUno<Reporte>>(
        '/reportes',
        {
            tipoId: datos.tipoId,
            descripcion: datos.descripcion,
            audioUrl: datos.audioUrl,
            fotos,
            coordenadas: datos.coordenadas,
            direccion: datos.direccion,
        }
    );

    return respuesta.data;
}

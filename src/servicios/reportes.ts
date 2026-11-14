
import Storage from 'expo-sqlite/kv-store';
import { cliente } from '../api/cliente';
import type { Coordenadas, Reporte, ReporteDatos, TipoDeReporte } from '../tipos';
import type { ArchivoSubido, RespuestaLista, RespuestaUno } from '../tipos/api';

const CLAVE_TIPOS_DE_REPORTE = 'reportes.tiposDeReporte';

export async function obtenerTiposDeReporte(): Promise<TipoDeReporte[]> {
    try {
        const respuesta = await cliente.get('/tipos-de-reporte');
        const tipos: TipoDeReporte[] = respuesta.data.datos;

        await Storage.setItem(CLAVE_TIPOS_DE_REPORTE, JSON.stringify(tipos));

        return tipos;
    } catch (error) {
        const guardados = await Storage.getItem(CLAVE_TIPOS_DE_REPORTE);

        if (guardados) return JSON.parse(guardados) as TipoDeReporte[];

        throw error;
    }
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

async function subirAudio(uri: string): Promise<string> {
    const archivo = new FormData();

    archivo.append('archivo', {
        uri,
        name: uri.split('/').pop() || 'nota-de-voz.m4a',
        type: 'audio/mp4',
    } as any);

    const respuesta = await cliente.post<RespuestaUno<ArchivoSubido>>('/archivos', archivo);
    const url = respuesta.data?.datos?.url;

    if (!url) {
        throw new Error('El servidor no devolvió la URL de la nota de voz.');
    }

    return url;
}

export async function enviarReporte(datos: ReporteDatos) {
    let etapa = 'inicio';

    try {
        // 1. Validar datos
        if (!datos.fotosLocales || datos.fotosLocales.length === 0) {
            throw new Error('No hay fotografías para enviar.');
        }

        if (
            !Number.isFinite(datos.coordenadas.latitud) ||
            !Number.isFinite(datos.coordenadas.longitud)
        ) {
            throw new Error('Las coordenadas no son válidas.');
        }

        console.log('1. Datos del reporte validados');

        // 2. Subir fotografías
        etapa = 'subida de fotografías';

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

                console.log('2. Subiendo fotografía:', nombre);

                const respuesta = await cliente.post<RespuestaUno<ArchivoSubido>>(
                    '/archivos',
                    archivo
                );

                console.log('3. Fotografía subida correctamente');

                const url = respuesta.data?.datos?.url;

                if (!url) {
                    throw new Error('El servidor no devolvió la URL de la fotografía.');
                }

                return {
                    url: respuesta.data.datos.url,
                };
            })
        );

        etapa = 'subida del audio';

        const audioUrl = datos.audioLocal
            ? await subirAudio(datos.audioLocal)
            : datos.audioUrl;

        // 3. Crear reporte
        etapa = 'creación del reporte';

        const cuerpo = {
            tipoId: datos.tipoId,
            descripcion: datos.descripcion,
            audioUrl,
            fotos,
            coordenadas: datos.coordenadas,
            direccion: datos.direccion,
            creadoEn: new Date().toISOString(),
        };

        console.log('4. Enviando datos del reporte:', cuerpo);

        const respuesta = await cliente.post<RespuestaUno<Reporte>>(
            '/reportes',
            cuerpo
        );

        console.log('5. Reporte creado correctamente:', respuesta.data);

        return respuesta.data;

    } catch (error: any) {
        console.error(`Error durante ${etapa}:`, error);
        console.error('Mensaje:', error.message);
        console.error('Respuesta del servidor:', error.response?.data);
        console.error('Código HTTP:', error.response?.status);

        throw error;
    }
}
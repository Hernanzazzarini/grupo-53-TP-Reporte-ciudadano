import { TipoDeReporte, ReporteDatos } from '../tipos';

export const obtenerTiposDeReporte = async (): Promise<TipoDeReporte[]> => {
    return [
        { id: 'tip-bache', nombre: 'Bacheo / Calles', icono: 'construct', color: '#EA580C', areaResponsable: 'Obras Públicas' },
        { id: 'tip-luz', nombre: 'Alumbrado Público', icono: 'bulb', color: '#CA8A04', areaResponsable: 'Alumbrado Público' },
        { id: 'tip-basura', nombre: 'Higiene / Basura', icono: 'trash', color: '#16A34A', areaResponsable: 'Higiene Urbana' },
        { id: 'tip-arbol', nombre: 'Arbolado / Espacios verdes', icono: 'leaf', color: '#059669', areaResponsable: 'Espacios Verdes' },
        { id: 'tip-agua', nombre: 'Agua o cloaca', icono: 'water', color: '#0284C7', areaResponsable: 'Obras Sanitarias' },
        { id: 'tip-semaforo', nombre: 'Semáforo', icono: 'alert-circle', color: '#DC2626', areaResponsable: 'Tránsito' },
        { id: 'tip-vereda', nombre: 'Vereda', icono: 'walk', color: '#7C3AED', areaResponsable: 'Obras Públicas' },
        { id: 'tip-otro', nombre: 'Otros Reclamos', icono: 'ellipsis-horizontal-circle', color: '#2563EB', areaResponsable: 'Centro de Atención al Vecino' },
    ];
};

export const enviarReporte = async (datos: ReporteDatos) => {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const numeroAleatorio = Math.floor(1000 + Math.random() * 9000);
    return {
        exito: true,
        datos: {
            codigo: `GCHU-2026-${numeroAleatorio}`,
        },
    };
};

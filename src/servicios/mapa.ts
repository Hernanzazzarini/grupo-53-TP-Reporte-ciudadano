import { Coordenadas, Reporte } from '../tipos';

const reportesMock: Reporte[] = [
    {
        id: 'rep-001',
        tipoId: 'tip-bache',
        descripcion: 'Bache grande en la calle',
        coordenadas: {
            latitud: -34.6037,
            longitud: -58.3816,
        },
        direccion: 'Av. Corrientes 500',
    },
    {
        id: 'rep-002',
        tipoId: 'tip-luz',
        descripcion: 'Luminaria sin funcionar',
        coordenadas: {
            latitud: -34.6015,
            longitud: -58.3845,
        },
        direccion: 'Calle Florida 800',
    },
    {
        id: 'rep-003',
        tipoId: 'tip-basura',
        descripcion: 'Acumulación de basura',
        coordenadas: {
            latitud: -34.6055,
            longitud: -58.3785,
        },
        direccion: 'Calle Esmeralda 600',
    },
    {
        id: 'rep-004',
        tipoId: 'tip-arbol',
        descripcion: 'Árbol caído',
        coordenadas: {
            latitud: -34.6002,
            longitud: -58.3802,
        },
        direccion: 'Calle Lavalle 700',
    },
];

export const obtenerReportesCercanos = async (
    coordenadas: Coordenadas
): Promise<Reporte[]> => {
    // Simulamos una llamada a un backend.
    await new Promise((resolve) => setTimeout(resolve, 500));

    return reportesMock;
};

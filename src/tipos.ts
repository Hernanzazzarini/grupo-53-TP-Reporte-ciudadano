export interface TipoDeReporte {
    id: string;
    nombre: string;
    icono: string;
    color: string;
}

export interface Coordenadas {
    latitud: number;
    longitud: number;
}

export interface ReporteDatos {
    tipoId: string;
    descripcion: string | null;
    audioUrl: string | null;
    fotosLocales: string[];
    coordenadas: {
        latitud: number;
        longitud: number;
    };
    direccion: string;

}

export interface Reporte {
    id: string;
    tipoId: string;
    descripcion: string | null;
    coordenadas: Coordenadas;
    direccion: string;
}






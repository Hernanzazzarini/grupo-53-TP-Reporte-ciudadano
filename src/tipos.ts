export interface TipoDeReporte {
    id: string;
    nombre: string;
    icono: string;
    color: string;
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





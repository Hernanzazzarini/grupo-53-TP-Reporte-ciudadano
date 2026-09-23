import { TipoDeReporte,ReporteDatos } from '../tipos';

export const obtenerTiposDeReporte = async () : Promise<TipoDeReporte[]> => {
    return [
        {id: 'tip-bache', nombre: 'Bacheo / Calles', icono: 'construct', color: '#EA580C'},
        {id: 'tip-luz',nombre:'Alumbrado Pùblico', icono: 'buld', color: '#CA8A04'},
        {id: 'tip-basura',nombre:'Higiene / Basura', icono: 'trash', color: '#16A34A'},
        {id: 'tip-arbol',nombre:'Arbolado /Espacios verdes', icono: 'leaf', color: '#059669'},
        {id: 'tip-clandestino',nombre:'Basural Clandestino', icono: 'Warning', color: '#DC2626'},
        {id: 'tip-otro',nombre:'Otros Reclamos', icono: 'ellipsis-horizontal-circle', color: '#2563EB'},

        
    ];
};

export const enviarReporte = async (datos: ReporteDatos) => {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const numeroAleatorio = Math.floor(1000 + Math.random() * 9000);
    return{
        exito: true,
        datos:{
           codigo: `GCHU-2026-${numeroAleatorio}`, 
        },
    };
};


 


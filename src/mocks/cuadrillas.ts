import { Cuadrilla, Zona } from '../tipos';


export const ZONAS: Zona[] = [
  {
    id: 'zon-norte',
    nombre: 'Zona Norte',
    referente: 'Corralón Norte',
    limite: [
      { latitud: -32.98, longitud: -58.522 },
      { latitud: -32.98, longitud: -58.47 },
      { latitud: -33.011, longitud: -58.47 },
      { latitud: -33.011, longitud: -58.522 },
    ],
  },
  {
    id: 'zon-sur',
    nombre: 'Zona Sur',
    referente: 'Corralón Sur',
    limite: [
      { latitud: -33.011, longitud: -58.522 },
      { latitud: -33.011, longitud: -58.505 },
      { latitud: -33.04, longitud: -58.505 },
      { latitud: -33.04, longitud: -58.522 },
    ],
  },
  {
    id: 'zon-este',
    nombre: 'Zona Este',
    referente: 'Corralón Costanera',
    limite: [
      { latitud: -33.011, longitud: -58.505 },
      { latitud: -33.011, longitud: -58.47 },
      { latitud: -33.04, longitud: -58.47 },
      { latitud: -33.04, longitud: -58.505 },
    ],
  },
  {
    id: 'zon-oeste',
    nombre: 'Zona Oeste',
    referente: 'Corralón Oeste',
    limite: [
      { latitud: -32.98, longitud: -58.56 },
      { latitud: -32.98, longitud: -58.522 },
      { latitud: -33.04, longitud: -58.522 },
      { latitud: -33.04, longitud: -58.56 },
    ],
  },
];


export const CUADRILLAS: Cuadrilla[] = [
  {
    id: 'cua-01',
    nombre: 'Cuadrilla 1 — Alumbrado',
    zonaId: 'zon-norte',
    especialidad: 'alumbrado',
    activa: true,
  },
  {
    id: 'cua-02',
    nombre: 'Cuadrilla 2 — Bacheo',
    zonaId: 'zon-norte',
    especialidad: 'pavimento',
    activa: true,
  },
  {
    id: 'cua-03',
    nombre: 'Cuadrilla 3 — Arbolado',
    zonaId: 'zon-este',
    especialidad: 'arbolado',
    activa: true,
  },
  {
    id: 'cua-04',
    nombre: 'Cuadrilla 4 — Bacheo',
    zonaId: 'zon-sur',
    especialidad: 'pavimento',
    activa: true,
  },
  {
    id: 'cua-05',
    nombre: 'Cuadrilla 5 — Higiene',
    zonaId: 'zon-sur',
    especialidad: 'higiene',
    activa: true,
  },
  {
    id: 'cua-06',
    nombre: 'Cuadrilla 6 — Semáforos',
    zonaId: 'zon-norte',
    especialidad: 'semaforos',
    activa: true,
  },
  {
    id: 'cua-07',
    nombre: 'Cuadrilla 7 — Veredas',
    zonaId: 'zon-oeste',
    especialidad: 'veredas',
    activa: false,
  },
  {
    id: 'cua-08',
    nombre: 'Cuadrilla 8 — Espacios verdes',
    zonaId: 'zon-este',
    especialidad: 'arbolado',
    activa: true,
  },
];

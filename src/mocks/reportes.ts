import { Asset } from 'expo-asset';
import { CambioDeEstado, Reporte } from '../tipos';

export const USUARIO_ACTUAL = 'usr-084';

const uri = (modulo: number) => Asset.fromModule(modulo).uri;

const FOTOS = {
  bache: uri(require('../../assets/mocks/bache.jpg')),
  basura: uri(require('../../assets/mocks/basura.jpg')),
  arbol: uri(require('../../assets/mocks/arbol.jpg')),
  luminaria: uri(require('../../assets/mocks/luminaria.jpg')),
  semaforo: uri(require('../../assets/mocks/semaforo.jpg')),
  arreglado: uri(require('../../assets/mocks/arreglado.jpg')),
  vereda: uri(require('../../assets/mocks/vereda.jpg')),
};

const NOTA_DE_VOZ = uri(require('../../assets/mocks/nota-de-voz.mp3'));

export const REPORTES: Reporte[] = [
  {
    id: 'rep-00412',
    codigo: 'GCHU-2026-00412',
    tipoId: 'tip-bache',
    descripcion: 'Pozo grande en la mano hacia el centro, pasa el agua.',
    audioUrl: null,
    fotos: [
      { id: 'fot-901', url: FOTOS.bache, momento: 'problema' },
    ],
    coordenadas: { latitud: -33.0089, longitud: -58.5142 },
    direccion: 'Rocamora 1240',
    zonaId: 'zon-norte',
    estado: 'asignado',
    autorId: USUARIO_ACTUAL,
    cuadrillaId: 'cua-02',
    duplicadoDe: null,
    adhesiones: 3,
    creadoEn: '2026-09-14T10:22:00-03:00',
    sincronizado: true,
  },

  {
    id: 'rep-00431',
    codigo: 'GCHU-2026-00431',
    tipoId: 'tip-luz',
    descripcion: null,
    audioUrl: NOTA_DE_VOZ,
    fotos: [
      { id: 'fot-940', url: FOTOS.luminaria, momento: 'problema' },
    ],
    coordenadas: { latitud: -33.0051, longitud: -58.5198 },
    direccion: 'Urquiza 880',
    zonaId: 'zon-norte',
    estado: 'recibido',
    autorId: USUARIO_ACTUAL,
    cuadrillaId: null,
    duplicadoDe: null,
    adhesiones: 0,
    creadoEn: '2026-09-22T19:05:00-03:00',
    sincronizado: true,
  },

  {
    id: 'rep-00398',
    codigo: 'GCHU-2026-00398',
    tipoId: 'tip-basura',
    descripcion: 'Montaña de escombros en la esquina, hace tres semanas.',
    audioUrl: null,
    fotos: [
      { id: 'fot-880', url: FOTOS.basura, momento: 'problema' },
      { id: 'fot-881', url: FOTOS.arreglado, momento: 'arreglo' },
    ],
    coordenadas: { latitud: -33.0142, longitud: -58.5089 },
    direccion: 'Bolívar y Gervasio Méndez',
    zonaId: 'zon-sur',
    estado: 'resuelto',
    autorId: USUARIO_ACTUAL,
    cuadrillaId: 'cua-05',
    duplicadoDe: null,
    adhesiones: 7,
    creadoEn: '2026-09-02T08:14:00-03:00',
    sincronizado: true,
  },

  {
    id: 'rep-00377',
    codigo: 'GCHU-2026-00377',
    tipoId: 'tip-semaforo',
    descripcion: 'El semáforo de la esquina titila en amarillo todo el día.',
    audioUrl: null,
    fotos: [
      { id: 'fot-855', url: FOTOS.semaforo, momento: 'problema' },
    ],
    coordenadas: { latitud: -33.0075, longitud: -58.5163 },
    direccion: 'San Martín y 25 de Mayo',
    zonaId: 'zon-norte',
    estado: 'rechazado',
    autorId: USUARIO_ACTUAL,
    cuadrillaId: null,
    duplicadoDe: null,
    adhesiones: 1,
    creadoEn: '2026-08-28T12:40:00-03:00',
    sincronizado: true,
  },

  {
    id: 'rep-local-01',
    codigo: 'PENDIENTE',
    tipoId: 'tip-vereda',
    descripcion: 'Baldosas levantadas, ya se cayó una señora.',
    audioUrl: null,
    fotos: [
      { id: 'fot-local-01', url: FOTOS.vereda, momento: 'problema' },
    ],
    coordenadas: { latitud: -33.0021, longitud: -58.5241 },
    direccion: 'Perón 455',
    zonaId: 'zon-oeste',
    estado: 'recibido',
    autorId: USUARIO_ACTUAL,
    cuadrillaId: null,
    duplicadoDe: null,
    adhesiones: 0,
    creadoEn: '2026-09-24T09:30:00-03:00',
    sincronizado: false,
  },

  {
    id: 'rep-00352',
    codigo: 'GCHU-2026-00352',
    tipoId: 'tip-arbol',
    descripcion: 'Rama grande apoyada sobre el cable de la luz.',
    audioUrl: null,
    fotos: [
      { id: 'fot-820', url: FOTOS.arbol, momento: 'problema' },
      { id: 'fot-821', url: FOTOS.arreglado, momento: 'arreglo' },
    ],
    coordenadas: { latitud: -33.0198, longitud: -58.5012 },
    direccion: 'Rivadavia 2130',
    zonaId: 'zon-este',
    estado: 'resuelto',
    autorId: USUARIO_ACTUAL,
    cuadrillaId: 'cua-03',
    duplicadoDe: null,
    adhesiones: 12,
    creadoEn: '2026-08-19T07:55:00-03:00',
    sincronizado: true,
  },
];

export const CAMBIOS_DE_ESTADO: CambioDeEstado[] = [
  {
    id: 'cam-1175',
    reporteId: 'rep-00412',
    estado: 'recibido',
    comentario: null,
    operadorId: null,
    fechaHora: '2026-09-14T10:22:00-03:00',
  },
  {
    id: 'cam-1177',
    reporteId: 'rep-00412',
    estado: 'en_revision',
    comentario: 'Verificado en el lugar',
    operadorId: 'usr-003',
    fechaHora: '2026-09-15T08:40:00-03:00',
  },
  {
    id: 'cam-1182',
    reporteId: 'rep-00412',
    estado: 'asignado',
    comentario: 'Cuadrilla 2 — Bacheo',
    operadorId: 'usr-003',
    fechaHora: '2026-09-18T11:05:00-03:00',
  },

  {
    id: 'cam-1230',
    reporteId: 'rep-00431',
    estado: 'recibido',
    comentario: null,
    operadorId: null,
    fechaHora: '2026-09-22T19:05:00-03:00',
  },

  {
    id: 'cam-1101',
    reporteId: 'rep-00398',
    estado: 'recibido',
    comentario: null,
    operadorId: null,
    fechaHora: '2026-09-02T08:14:00-03:00',
  },
  {
    id: 'cam-1108',
    reporteId: 'rep-00398',
    estado: 'en_revision',
    comentario: 'Se constató el volumen de escombros',
    operadorId: 'usr-003',
    fechaHora: '2026-09-03T09:20:00-03:00',
  },
  {
    id: 'cam-1119',
    reporteId: 'rep-00398',
    estado: 'asignado',
    comentario: 'Cuadrilla 5 — Higiene',
    operadorId: 'usr-007',
    fechaHora: '2026-09-05T07:30:00-03:00',
  },
  {
    id: 'cam-1134',
    reporteId: 'rep-00398',
    estado: 'resuelto',
    comentario: 'Retirado con camión volcador. Se adjunta foto.',
    operadorId: 'usr-007',
    fechaHora: '2026-09-09T16:45:00-03:00',
  },

  {
    id: 'cam-1040',
    reporteId: 'rep-00377',
    estado: 'recibido',
    comentario: null,
    operadorId: null,
    fechaHora: '2026-08-28T12:40:00-03:00',
  },
  {
    id: 'cam-1051',
    reporteId: 'rep-00377',
    estado: 'rechazado',
    comentario:
      'El semáforo de San Martín y 25 de Mayo está en modo intermitente a ' +
      'propósito desde el 20 de agosto, por la obra de repavimentación de ' +
      'San Martín. Es una medida transitoria acordada con Tránsito y con la ' +
      'empresa a cargo de la obra, y se mantiene hasta que se habilite el ' +
      'carril nuevo, previsto para fin de octubre. No corresponde generar una ' +
      'orden de reparación porque el equipo no tiene ninguna falla. Si al ' +
      'terminar la obra el semáforo sigue intermitente, le pedimos que vuelva ' +
      'a reportarlo y lo tomamos como caso nuevo.',
    operadorId: 'usr-003',
    fechaHora: '2026-08-29T10:15:00-03:00',
  },

  {
    id: 'cam-local-01',
    reporteId: 'rep-local-01',
    estado: 'recibido',
    comentario: null,
    operadorId: null,
    fechaHora: '2026-09-24T09:30:00-03:00',
  },

  {
    id: 'cam-0980',
    reporteId: 'rep-00352',
    estado: 'recibido',
    comentario: null,
    operadorId: null,
    fechaHora: '2026-08-19T07:55:00-03:00',
  },
  {
    id: 'cam-0988',
    reporteId: 'rep-00352',
    estado: 'en_revision',
    comentario: 'Riesgo alto: la rama toca el cable de media tensión',
    operadorId: 'usr-003',
    fechaHora: '2026-08-19T14:10:00-03:00',
  },
  {
    id: 'cam-0995',
    reporteId: 'rep-00352',
    estado: 'asignado',
    comentario: 'Cuadrilla 3 — Arbolado',
    operadorId: 'usr-003',
    fechaHora: '2026-08-20T08:00:00-03:00',
  },
  {
    id: 'cam-1003',
    reporteId: 'rep-00352',
    estado: 'en_revision',
    comentario: 'La cuadrilla no pudo intervenir: hay que cortar la luz primero. Se pide turno a la cooperativa eléctrica.',
    operadorId: 'usr-011',
    fechaHora: '2026-08-22T11:30:00-03:00',
  },
  {
    id: 'cam-1022',
    reporteId: 'rep-00352',
    estado: 'resuelto',
    comentario: 'Rama retirada con corte de servicio programado.',
    operadorId: 'usr-011',
    fechaHora: '2026-08-27T09:45:00-03:00',
  },
];

import { CambioDeEstado, Reporte } from '../tipos';
import { CAMBIOS_DE_ESTADO, REPORTES, USUARIO_ACTUAL } from '../mocks/reportes';

const DEMORA_MS = 600;
const esperar = (ms: number) => new Promise((resolver) => setTimeout(resolver, ms));

// Esto es para poder simular a mano los casos que provocaría la API, que todavía
// no existe: una lista vacía, una caída de red, y un cambio de estado del mock.
export const SIMULAR = {
  listaVacia: false,
  errorDeRed: false,
  cambioDeEstado: false,
};

const conSimulacion = (reporte: Reporte): Reporte =>
  SIMULAR.cambioDeEstado && reporte.id === 'rep-00431'
    ? { ...reporte, estado: 'en_revision' as const }
    : reporte;

export class ErrorDeRed extends Error {
  constructor() {
    super('No pudimos conectarnos. Revisá tu conexión e intentá de nuevo.');
    this.name = 'ErrorDeRed';
  }
}

export const misReportes = async (
  usuarioId: string = USUARIO_ACTUAL,
): Promise<Reporte[]> => {
  await esperar(DEMORA_MS);

  if (SIMULAR.errorDeRed) throw new ErrorDeRed();
  if (SIMULAR.listaVacia) return [];

  return REPORTES
    .filter((reporte) => reporte.autorId === usuarioId)
    .map(conSimulacion)
    .sort((a, b) => b.creadoEn.localeCompare(a.creadoEn));
};

export const reportePorId = async (id: string): Promise<Reporte | null> => {
  await esperar(DEMORA_MS);

  if (SIMULAR.errorDeRed) throw new ErrorDeRed();

  const encontrado = REPORTES.find((reporte) => reporte.id === id);
  return encontrado ? conSimulacion(encontrado) : null;
};

export const reportePorCodigo = async (codigo: string): Promise<Reporte | null> => {
  await esperar(DEMORA_MS);

  if (SIMULAR.errorDeRed) throw new ErrorDeRed();

  const buscado = codigo.trim().toUpperCase();
  const encontrado = REPORTES.find((reporte) => reporte.codigo.toUpperCase() === buscado);
  return encontrado ? conSimulacion(encontrado) : null;
};

export const historialDeReporte = async (
  reporteId: string,
): Promise<CambioDeEstado[]> => {
  await esperar(DEMORA_MS);

  if (SIMULAR.errorDeRed) throw new ErrorDeRed();

  return CAMBIOS_DE_ESTADO
    .filter((cambio) => cambio.reporteId === reporteId)
    .sort((a, b) => a.fechaHora.localeCompare(b.fechaHora));
};

import { REPORTES } from '@/mocks/reportes';
import type { Reporte } from '../tipos/index';

export async function obtenerReportes(): Promise<Reporte[]> {
    return REPORTES
}
import { REPORTES } from '@/mocks/reportes';
import type { Reporte } from '../tipos/index';

export function obtenerReportes(): Reporte[] {
    return REPORTES
}
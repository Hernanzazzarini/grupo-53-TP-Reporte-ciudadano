import axios from 'axios';

import { RespuestaError } from '../tipos/api';

export const CODIGO_SIN_CONEXION = 'SIN_CONEXION';

const MENSAJE_SIN_CONEXION = 'No pudimos conectarnos. Revisá tu conexión e intentá de nuevo.';
const MENSAJE_GENERICO = 'Algo salió mal. Intentá de nuevo.';

export class ErrorDeApi extends Error {
  readonly codigo: string;

  constructor(codigo: string, mensaje: string) {
    super(mensaje);
    this.name = 'ErrorDeApi';
    this.codigo = codigo;
  }
}

const esRespuestaError = (valor: unknown): valor is RespuestaError => {
  if (typeof valor !== 'object' || valor === null || !('error' in valor)) return false;

  const error = valor.error;
  return (
    typeof error === 'object' &&
    error !== null &&
    'codigo' in error &&
    'mensaje' in error &&
    typeof error.codigo === 'string' &&
    typeof error.mensaje === 'string'
  );
};

export const traducirError = (error: unknown): ErrorDeApi => {
  if (!axios.isAxiosError(error)) return new ErrorDeApi('', MENSAJE_GENERICO);

  if (error.response) {
    if (esRespuestaError(error.response.data)) {
      const { codigo, mensaje } = error.response.data.error;
      return new ErrorDeApi(codigo, mensaje);
    }
    return new ErrorDeApi('', MENSAJE_GENERICO);
  }

  if (error.request) return new ErrorDeApi(CODIGO_SIN_CONEXION, MENSAJE_SIN_CONEXION);

  return new ErrorDeApi('', MENSAJE_GENERICO);
};

export const mensajeDeError = (error: unknown, porDefecto: string = MENSAJE_GENERICO): string =>
  error instanceof Error && error.message.length > 0 ? error.message : porDefecto;

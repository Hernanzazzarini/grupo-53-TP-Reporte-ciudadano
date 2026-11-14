import type { Usuario } from './usuario';

export interface Meta {
  total: number;
  pagina: number;
  porPagina: number;
}

export interface RespuestaLista<T> {
  datos: T[];
  meta: Meta;
}

export interface RespuestaUno<T> {
  datos: T;
  meta: null;
}

export interface RespuestaError {
  error: {
    codigo: string;
    mensaje: string;
  };
}

export interface Sesion {
  token: string;
  usuario: Usuario;
}

export interface ArchivoSubido {
  url: string;
  tipo: "imagen" | "audio" | "video";
  bytes: number;
}

export interface Salud {
  estado: "ok";
  motor: "better-sqlite3" | "postgres" | "mysql" | "mariadb";
  almacen: "local" | "aws" | "supabase" | "r2" | "b2" | "s3proxy" | "localstack";
  version: string;
}

export type Plataforma = "ios" | "android";

export interface Dispositivo {
  tokenExpo: string;
  plataforma: Plataforma;
}

export interface PruebaDePush {
  enviadas: number;
}

import axios from 'axios';

import { traducirError } from './errores';

const URL_API = process.env.EXPO_PUBLIC_API_URL;

if (!URL_API) {
  console.warn('Falta EXPO_PUBLIC_API_URL en el archivo .env: los pedidos a la API van a fallar.');
}

export const cliente = axios.create({
  baseURL: URL_API,
  timeout: 10_000,
});

type ObtenerToken = () => Promise<string | null>;
type AlVencerLaSesion = () => void;

let obtenerToken: ObtenerToken = async () => null;
let alVencerLaSesion: AlVencerLaSesion = () => {};

export const definirObtenerToken = (funcion: ObtenerToken): void => {
  obtenerToken = funcion;
};

export const definirAlVencerLaSesion = (funcion: AlVencerLaSesion): void => {
  alVencerLaSesion = funcion;
};

cliente.interceptors.request.use(async (config) => {
  const token = await obtenerToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;

  if (config.data instanceof FormData) config.headers.delete('Content-Type');

  return config;
});

cliente.interceptors.response.use(
  (respuesta) => respuesta,
  (error: unknown) => {
    const errorDeApi = traducirError(error);

    if (errorDeApi.codigo === 'NO_AUTENTICADO') alVencerLaSesion();

    return Promise.reject(errorDeApi);
  },
);

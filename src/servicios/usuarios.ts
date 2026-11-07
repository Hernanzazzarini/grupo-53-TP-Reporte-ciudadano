import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { cliente, definirAlVencerLaSesion, definirObtenerToken } from "../api/cliente";
import { RespuestaUno, Sesion, Usuario } from "../tipos/usuario";
import { LoginForm, PerfilForm, RegistroForm } from "../utilidades/validacionesUsuario";

// =====================================================================
// SERVICIO DE USUARIOS (Módulo 5) — conectado a la API con Axios.
// Usa el cliente de src/api/cliente.ts. Las pantallas llaman a estas
// funciones y no saben nada de la API.
// =====================================================================

const CLAVE_TOKEN = "token-sesion"; // nombre con el que se guarda en el celular

let usuarioActual: Usuario | null = null;
let tokenActual: string | null = null;
let restaurando = false; // true mientras se recupera la sesión al abrir la app

// ---------- Enchufes del cliente de Axios ----------
// 1) El cliente le pregunta a esta función qué token mandar en cada pedido
definirObtenerToken(async () => tokenActual);

// 2) Si la API responde NO_AUTENTICADO (token vencido), se cierra la sesión
definirAlVencerLaSesion(() => {
  limpiarSesion();
  if (!restaurando) router.replace("/login");
});

// ---------- Funciones internas ----------
async function guardarSesion(sesion: Sesion): Promise<Usuario> {
  tokenActual = sesion.token;
  usuarioActual = sesion.usuario;
  await SecureStore.setItemAsync(CLAVE_TOKEN, sesion.token); // queda guardado cifrado
  return sesion.usuario;
}

async function limpiarSesion(): Promise<void> {
  tokenActual = null;
  usuarioActual = null;
  await SecureStore.deleteItemAsync(CLAVE_TOKEN);
}

// ---------- INICIAR SESIÓN: POST /auth/ingreso ----------
export async function iniciarSesion(datos: LoginForm): Promise<Usuario> {
  const res = await cliente.post<RespuestaUno<Sesion>>("/auth/ingreso", {
    email: datos.email,
    contrasena: datos.password, // la API lo llama "contrasena"
  });
  return guardarSesion(res.data.datos);
}

// ---------- REGISTRARSE: POST /auth/registro ----------
// La API controla el email repetido y devuelve la sesión ya iniciada
export async function registrar(datos: RegistroForm): Promise<Usuario> {
  const res = await cliente.post<RespuestaUno<Sesion>>("/auth/registro", {
    nombre: datos.nombre,
    email: datos.email,
    contrasena: datos.password,
    telefono: datos.telefono || null, // vacío -> null
  });
  return guardarSesion(res.data.datos);
}

// ---------- ¿QUIÉN ESTÁ LOGUEADO? ----------
export function obtenerUsuarioActual(): Usuario | null {
  return usuarioActual;
}

// ---------- RECUPERAR SESIÓN al abrir la app: GET /yo ----------
export async function restaurarSesion(): Promise<Usuario | null> {
  const guardado = await SecureStore.getItemAsync(CLAVE_TOKEN);
  if (!guardado) return null;

  restaurando = true;
  tokenActual = guardado;
  try {
    const res = await cliente.get<RespuestaUno<Usuario>>("/yo");
    usuarioActual = res.data.datos;
    return usuarioActual;
  } catch {
    await limpiarSesion(); // token vencido o inválido
    return null;
  } finally {
    restaurando = false;
  }
}

// ---------- EDITAR PERFIL: PATCH /yo ----------
export async function actualizarPerfil(datos: PerfilForm): Promise<Usuario> {
  const res = await cliente.patch<RespuestaUno<Usuario>>("/yo", {
    nombre: datos.nombre,
    telefono: datos.telefono || null,
  });
  usuarioActual = res.data.datos;
  return usuarioActual;
}

// ---------- AVISOS: PATCH /yo ----------
export async function actualizarConfiguracion(avisosActivos: boolean): Promise<Usuario> {
  const res = await cliente.patch<RespuestaUno<Usuario>>("/yo", { avisosActivos });
  usuarioActual = res.data.datos;
  return usuarioActual;
}

// ---------- CERRAR SESIÓN ----------
// La API no tiene "logout": alcanza con borrar el token del celular
export async function cerrarSesion(): Promise<void> {
  await limpiarSesion();
}
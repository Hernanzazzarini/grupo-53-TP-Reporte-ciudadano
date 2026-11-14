import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { cliente, definirAlVencerLaSesion, definirObtenerToken } from "../api/cliente";
import { RespuestaUno, Sesion, Usuario } from "../tipos/usuario";
import { LoginForm, PerfilForm, RegistroForm } from "../utilidades/validacionesUsuario";
import { biometriaDisponible, huellaActivada, pedirHuella } from "./biometria";

// =====================================================================
// SERVICIO DE USUARIOS (Módulo 5) — conectado a la API con Axios.
// Usa el cliente de src/api/cliente.ts. Las pantallas llaman a estas
// funciones y no saben nada de la API.
// =====================================================================

const CLAVE_TOKEN = "token-sesion"; // el token es SECRETO: va en SecureStore (cifrado)se guarda en el tel
const CLAVE_USUARIO = "usuario-sesion"; // NUEVO: copia del usuario para usar la app sin red

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

//guarda el usuario en memoria y una copia en el celular
async function guardarUsuarioLocal(usuario: Usuario): Promise<void> {
  usuarioActual = usuario;
  await SecureStore.setItemAsync(CLAVE_USUARIO, JSON.stringify(usuario));
}

//lee la copia del usuario guardada en el celular
async function leerUsuarioLocal(): Promise<Usuario | null> {
  const texto = await SecureStore.getItemAsync(CLAVE_USUARIO);
  return texto ? (JSON.parse(texto) as Usuario) : null;
}

async function guardarSesion(sesion: Sesion): Promise<Usuario> {
  tokenActual = sesion.token;
  await SecureStore.setItemAsync(CLAVE_TOKEN, sesion.token);
  await guardarUsuarioLocal(sesion.usuario); 
  return sesion.usuario;
}

async function limpiarSesion(): Promise<void> {
  tokenActual = null;
  usuarioActual = null;
  await SecureStore.deleteItemAsync(CLAVE_TOKEN);
  await SecureStore.deleteItemAsync(CLAVE_USUARIO); 
}

// ¿el error es "token vencido o inválido" (401)?
function esTokenVencido(e: unknown): boolean {
  return (e as { codigo?: string }).codigo === "NO_AUTENTICADO";
}

// con un token guardado, pregunta a la API quién es (GET /yo).
// - Token vencido (401): se borra todo y devuelve null.
// - Sin red u otro error: NO se pierde la sesión, se usa la copia local.
async function recuperarConToken(token: string): Promise<Usuario | null> {
  restaurando = true;
  tokenActual = token;
  try {
    const res = await cliente.get<RespuestaUno<Usuario>>("/yo");
    await guardarUsuarioLocal(res.data.datos); // copia actualizada
    return usuarioActual;
  } catch (e) {
    if (esTokenVencido(e)) {
      await limpiarSesion();
      return null;
    }
    const copia = await leerUsuarioLocal(); // sin red: se sigue con la copia
    if (copia) {
      usuarioActual = copia;
      return copia;
    }
    tokenActual = null;
    return null;
  } finally {
    restaurando = false;
  }
}

// ---------- INICIAR SESIÓN: POST /auth/ingreso ----------
export async function iniciarSesion(datos: LoginForm): Promise<Usuario> {
  const res = await cliente.post<RespuestaUno<Sesion>>("/auth/ingreso", {
    email: datos.email,
    contrasena: datos.password, // la API lo llama "contraseña"
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

// ---------- RECUPERAR SESIÓN al abrir la app ----------
export async function restaurarSesion(): Promise<Usuario | null> {
  //  con la huella activa NO se entra solo: se pide la huella en el login
  if (await huellaActivada()) return null;

  const token = await SecureStore.getItemAsync(CLAVE_TOKEN);
  if (!token) return null;

  return recuperarConToken(token); // CAMBIO: sin red, ya no se pierde la sesión
}

// -------- ¿mostrar el botón de huella en el login? ----------
// Hace falta: lector + huella registrada + opción activada + un token guardado
export async function puedeIngresarConHuella(): Promise<boolean> {
  const token = await SecureStore.getItemAsync(CLAVE_TOKEN);
  return token !== null && (await huellaActivada()) && (await biometriaDisponible());
}
// ---------- NUEVO: INICIAR SESIÓN CON HUELLA ----------
// Funciona igual para vecinos y operadores, y también sin red (usa la copia local).
export async function iniciarSesionConHuella(): Promise<Usuario> {
  const token = await SecureStore.getItemAsync(CLAVE_TOKEN);
  if (!token) throw new Error("Primero ingresá con tu email y contraseña.");

  const ok = await pedirHuella(); // cartel del sistema
  if (!ok) throw new Error("No se pudo verificar la huella.");

  const usuario = await recuperarConToken(token);
  if (usuario) return usuario;

  // Si el token sigue guardado, el problema fue la red; si no, venció
  const sigueGuardado = await SecureStore.getItemAsync(CLAVE_TOKEN);
  throw new Error(
    sigueGuardado
      ? "No pudimos conectarnos. Revisá tu conexión e intentá de nuevo."
      : "Tu sesión venció. Ingresá con tu email y contraseña."
  );
}

// ---------- EDITAR PERFIL: PATCH /yo ----------
export async function actualizarPerfil(datos: PerfilForm): Promise<Usuario> {
  const res = await cliente.patch<RespuestaUno<Usuario>>("/yo", {
    nombre: datos.nombre,
    telefono: datos.telefono || null,
  });
  await guardarUsuarioLocal(res.data.datos); 
  return res.data.datos;
}

// ---------- AVISOS: PATCH /yo ----------
export async function actualizarConfiguracion(avisosActivos: boolean): Promise<Usuario> {
  const res = await cliente.patch<RespuestaUno<Usuario>>("/yo", { avisosActivos });
  await guardarUsuarioLocal(res.data.datos); // CAMBIO: actualiza también la copia
  return res.data.datos;
}

// ---------- CERRAR SESIÓN ----------
// on la huella activa se conservan el token y la copia (cifrados)
// para volver a entrar con la huella. Sin huella, se borra todo.
export async function cerrarSesion(): Promise<void> {
  if (await huellaActivada()) {
    tokenActual = null;
    usuarioActual = null;
  } else {
    await limpiarSesion();
  }
}
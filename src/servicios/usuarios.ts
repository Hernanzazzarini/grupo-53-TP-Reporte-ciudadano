import { usuariosMock } from "../mocks/usuarios";
import {
  ConfiguracionUsuario,
  Usuario,
  UsuarioConPassword,
} from "../tipos/usuario";
import { LoginForm, PerfilForm, RegistroForm } from "../utilidades/validacionesUsuario";

// =====================================================================
// SERVICIO DE USUARIOS (Módulo 5)
// Hoy trabaja con datos simulados (mocks). Cuando exista la API,
// solo hay que cambiar el INTERIOR de cada función por un fetch.
// Las pantallas no se enteran del cambio.
// =====================================================================

// "Base de datos" en memoria (se reinicia al recargar la app)
const usuarios: UsuarioConPassword[] = [...usuariosMock];

// Usuario con la sesión iniciada (null = nadie logueado)
let usuarioActual: Usuario | null = null;

// Simula la demora de una API real
const esperar = (ms = 600) => new Promise((r) => setTimeout(r, ms));

// Quita la contraseña antes de devolver el usuario a las pantallas
const sinPassword = ({ password, ...resto }: UsuarioConPassword): Usuario => resto;

export async function iniciarSesion(datos: LoginForm): Promise<Usuario> {
  await esperar();
  const encontrado = usuarios.find(
    (u) => u.email === datos.email && u.password === datos.password
  );
  if (!encontrado) throw new Error("Email o contraseña incorrectos");

  usuarioActual = sinPassword(encontrado);
  return usuarioActual;
  // Futuro con API:
  // const res = await fetch(`${API_URL}/auth/login`, { method: "POST", ... });
}

export async function registrar(datos: RegistroForm): Promise<Usuario> {
  await esperar();
  if (usuarios.some((u) => u.email === datos.email)) {
    throw new Error("Ya existe una cuenta con ese email");
  }
  if (usuarios.some((u) => u.dni === datos.dni)) {
    throw new Error("Ya existe una cuenta con ese DNI");
  }

  const nuevo: UsuarioConPassword = {
    id: Date.now().toString(),
    nombre: datos.nombre,
    apellido: datos.apellido,
    dni: datos.dni,
    email: datos.email,
    password: datos.password,
    configuracion: { notificacionesPush: true, notificacionesEmail: false },
  };
  usuarios.push(nuevo);

  usuarioActual = sinPassword(nuevo); // queda logueado al registrarse
  return usuarioActual;
}

export function obtenerUsuarioActual(): Usuario | null {
  return usuarioActual;
}

export async function actualizarPerfil(datos: PerfilForm): Promise<Usuario> {
  await esperar();
  if (!usuarioActual) throw new Error("No hay sesión iniciada");

  const indice = usuarios.findIndex((u) => u.id === usuarioActual!.id);
  usuarios[indice] = { ...usuarios[indice], ...datos };

  usuarioActual = sinPassword(usuarios[indice]);
  return usuarioActual;
}

export async function actualizarConfiguracion(
  config: ConfiguracionUsuario
): Promise<Usuario> {
  await esperar(300);
  if (!usuarioActual) throw new Error("No hay sesión iniciada");

  const indice = usuarios.findIndex((u) => u.id === usuarioActual!.id);
  usuarios[indice] = { ...usuarios[indice], configuracion: config };

  usuarioActual = sinPassword(usuarios[indice]);
  return usuarioActual;
}

export async function cerrarSesion(): Promise<void> {
  await esperar(200);
  usuarioActual = null;
}

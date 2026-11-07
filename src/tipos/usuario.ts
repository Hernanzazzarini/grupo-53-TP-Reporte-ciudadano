// Entidad Usuario — tal cual la devuelve la API del profe.
// La API nunca devuelve la contraseña.

export type Rol = "vecino" | "operador";

export interface Usuario {
  id: string;
  nombre: string;           // nombre y apellido juntos
  email: string;
  telefono: string | null;  // null = no cargó teléfono
  rol: Rol;                 // desde la app siempre se crea "vecino"
  zonaId: string | null;    // solo lo usan los operadores
  avisosActivos: boolean;   // interruptor de notificaciones
  creadoEn: string;         // fecha de alta
}

// Lo que devuelven /auth/ingreso y /auth/registro
export interface Sesion {
  token: string;
  usuario: Usuario;
}

// "Sobre" en el que la API manda las respuestas: { datos, meta }
export interface RespuestaUno<T> {
  datos: T;
  meta: null;
}
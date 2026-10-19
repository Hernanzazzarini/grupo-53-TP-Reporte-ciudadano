// Entidad Usuario (vecino) — Módulo 5
// Si prefieren tener todo en tipos/index.ts, pueden copiar esto allá
// o agregar en index.ts la línea:  export * from "./usuario";

export interface ConfiguracionUsuario {
    notificacionesPush: boolean;
    notificacionesEmail: boolean;
  }
  
  // Agregado para el modulo 6 (panel municipal): sin esto no hay forma de
  // distinguir vecino de operador. Si module 5 ya lo tiene resuelto de otra
  // forma, avisar para unificar.
  export type Rol = "vecino" | "operador";

  export interface Usuario {
    id: string;
    nombre: string;
    apellido: string;
    dni: string;
    email: string;
    telefono?: string;
    direccion?: string;
    rol?: Rol;
    configuracion: ConfiguracionUsuario;
  }
  
  // Lo que se guarda en el mock (incluye contraseña).
  // Nunca se devuelve a las pantallas: por eso es un tipo aparte.
  export interface UsuarioConPassword extends Usuario {
    password: string;
  }
  
import { UsuarioConPassword } from "../tipos/usuario";

// Usuarios de prueba mientras no hay API.
// Para probar el login usá: vecino@gualeguaychu.gob.ar / 12345678
export const usuariosMock: UsuarioConPassword[] = [
    {
      id: "1",
      nombre: "Juan",
      apellido: "Pérez",
      dni: "30123456",
      email: "vecino@gualeguaychu.gob.ar",
      telefono: "3446123456",
      direccion: "25 de Mayo 123",
      password: "12345678",
      configuracion: {
        notificacionesPush: true,
        notificacionesEmail: false,
      },
    },
  ];
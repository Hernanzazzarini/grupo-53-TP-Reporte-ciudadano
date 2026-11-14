import { z } from "zod";

// ---------- Reglas reutilizables ----------
const nombre = z
  .string()
  .trim()
  .min(2, "Mínimo 2 letras")
  .max(120, "El nombre es demasiado largo");

const email = z.string().trim().toLowerCase().email("Email inválido");

const password = z.string().min(8, "La contraseña debe tener al menos 8 caracteres");

const telefono = z
  .string()
  .trim()
  .regex(/^\d{8,13}$/, "Solo números, con característica (ej: 3446123456)")
  .optional()
  .or(z.literal(""));

// ---------- Login ----------
export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Ingresá tu contraseña"),
});
export type LoginForm = z.infer<typeof loginSchema>;

// ---------- Registro ----------
// La API pide: nombre, email, contraseña y teléfono opcional (sin DNI ni apellido aparte)
export const registroSchema = z
  .object({
    nombre,
    email,
    telefono,
    password,
    confirmarPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmarPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmarPassword"],
  });
export type RegistroForm = z.infer<typeof registroSchema>;

// ---------- Editar perfil ----------
// La API solo deja cambiar nombre y teléfono (el email no se edita)
export const perfilSchema = z.object({
  nombre,
  telefono,
});
export type PerfilForm = z.infer<typeof perfilSchema>;
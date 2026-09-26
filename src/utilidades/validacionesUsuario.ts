import { z } from "zod";

// ---------- Reglas reutilizables ----------
const nombre = z.string().trim().min(2, "Mínimo 2 letras");
const dni = z
  .string()
  .trim()
  .regex(/^\d{7,8}$/, "El DNI debe tener 7 u 8 números, sin puntos");
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
export const registroSchema = z
  .object({
    nombre,
    apellido: nombre,
    dni,
    email,
    password,
    confirmarPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmarPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmarPassword"],
  });
export type RegistroForm = z.infer<typeof registroSchema>;

// ---------- Editar perfil ----------
export const perfilSchema = z.object({
  nombre,
  apellido: nombre,
  telefono,
  direccion: z.string().trim().optional(),
});
export type PerfilForm = z.infer<typeof perfilSchema>;

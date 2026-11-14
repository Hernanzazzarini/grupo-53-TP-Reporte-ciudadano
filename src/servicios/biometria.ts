import * as LocalAuthentication from "expo-local-authentication";
import Storage from "expo-sqlite/kv-store";

// =====================================================================
// BIOMETRÍA (Módulo 5) — ingreso con huella usando expo-local-authentication.
// La huella NUNCA sale del celular: el sistema operativo solo responde
// "sí, es el dueño" o "no".
// =====================================================================

const CLAVE_HUELLA = "huella-activa"; // se guarda "si" cuando el usuario la activa

// ¿El celular tiene lector de huella Y hay al menos una huella registrada?
// Si no, la app ni muestra la opción: queda solo email y contraseña.
export async function biometriaDisponible(): Promise<boolean> {
    const tieneLector = await LocalAuthentication.hasHardwareAsync();
    const tieneHuellas = await LocalAuthentication.isEnrolledAsync();
    return tieneLector && tieneHuellas;
  }

// ¿El usuario activó "Ingresar con huella"? (preferencia guardada en kv-store)
export async function huellaActivada(): Promise<boolean> {
  return (await Storage.getItem(CLAVE_HUELLA)) === "si";
}

// Activa o desactiva el ingreso con huella.
// Es una preferencia, no un secreto: por eso va en kv-store y no en SecureStore.
export async function activarHuella(activar: boolean): Promise<void> {
  if (activar) await Storage.setItem(CLAVE_HUELLA, "si");
  else await Storage.removeItem(CLAVE_HUELLA);
}

// Muestra el cartel del sistema que pide la huella.
// Devuelve true si la huella coincide.
export async function pedirHuella(): Promise<boolean> {
  const resultado = await LocalAuthentication.authenticateAsync({
    promptMessage: "Ingresá con tu huella",
    cancelLabel: "Cancelar",
    fallbackLabel: "Usar PIN", // si la huella falla, deja usar el PIN del celular
  });
  return resultado.success;
}
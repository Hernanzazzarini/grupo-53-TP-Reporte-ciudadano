import { zodResolver } from "@hookform/resolvers/zod";
import { Link, router } from "expo-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text } from "react-native";
import CampoFormulario from "../componentes/CampoFormulario";
import { registrar } from "../servicios/usuarios";
import { RegistroForm, registroSchema } from "../utilidades/validacionesUsuario";

export default function PantallaRegistro() {
  const [errorServidor, setErrorServidor] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<RegistroForm>({
    resolver: zodResolver(registroSchema),
    defaultValues: {
      nombre: "",
      email: "",
      telefono: "",
      password: "",
      confirmarPassword: "",
    },
  });

  const onSubmit = async (datos: RegistroForm) => {
    setErrorServidor(null);
    try {
      await registrar(datos); // POST /auth/registro: crea la cuenta y deja logueado
      router.replace("/");
    } catch (e) {
      // El error viene traducido por el cliente de Axios (src/api/errores.ts)
      const error = e as { mensaje?: string; message?: string };
      setErrorServidor(error.mensaje ?? error.message ?? "Ocurrió un error inesperado");
    }
  };

  return (
    <ScrollView contentContainerStyle={estilos.contenedor}>
      <Text style={estilos.titulo}>Crear cuenta</Text>

      <CampoFormulario control={control} nombre="nombre" etiqueta="Nombre y apellido" />
      <CampoFormulario
        control={control}
        nombre="email"
        etiqueta="Email"
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <CampoFormulario
        control={control}
        nombre="telefono"
        etiqueta="Teléfono (opcional)"
        keyboardType="phone-pad"
      />
      <CampoFormulario control={control} nombre="password" etiqueta="Contraseña" secureTextEntry />
      <CampoFormulario
        control={control}
        nombre="confirmarPassword"
        etiqueta="Repetir contraseña"
        secureTextEntry
      />

      {errorServidor && <Text style={estilos.errorServidor}>{errorServidor}</Text>}

      <Pressable
        style={[estilos.boton, isSubmitting && estilos.botonDeshabilitado]}
        onPress={handleSubmit(onSubmit)}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={estilos.textoBoton}>Registrarme</Text>
        )}
      </Pressable>

      <Link href="/login" style={estilos.enlace}>
        ¿Ya tenés cuenta? Iniciá sesión
      </Link>
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  contenedor: { padding: 24 },
  titulo: { fontSize: 26, fontWeight: "700", marginBottom: 24, textAlign: "center" },
  boton: {
    backgroundColor: "#1565c0",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  botonDeshabilitado: { opacity: 0.6 },
  textoBoton: { color: "#fff", fontSize: 16, fontWeight: "600" },
  errorServidor: { color: "#d32f2f", textAlign: "center", marginBottom: 8 },
  enlace: { color: "#1565c0", textAlign: "center", marginTop: 20, marginBottom: 40 },
});
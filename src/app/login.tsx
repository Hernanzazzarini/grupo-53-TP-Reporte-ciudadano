import { zodResolver } from "@hookform/resolvers/zod";
import { Link, router } from "expo-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
} from "react-native";
import CampoFormulario from "../componentes/CampoFormulario";
import { iniciarSesion } from "../servicios/usuarios";
import { LoginForm, loginSchema } from "../utilidades/validacionesUsuario";

export default function PantallaLogin() {
  const [errorServidor, setErrorServidor] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (datos: LoginForm) => {
    setErrorServidor(null);
    try {
      await iniciarSesion(datos);
      router.replace("/");
    } catch (e) {
      setErrorServidor((e as Error).message);
    }
  };

  return (
    <ScrollView contentContainerStyle={estilos.contenedor}>
      <Text style={estilos.titulo}>Iniciar sesión</Text>

      <CampoFormulario
        control={control}
        nombre="email"
        etiqueta="Email"
        placeholder="tu@email.com"
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <CampoFormulario
        control={control}
        nombre="password"
        etiqueta="Contraseña"
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
          <Text style={estilos.textoBoton}>Ingresar</Text>
        )}
      </Pressable>

      <Link href="/registro" style={estilos.enlace}>
        ¿No tenés cuenta? Registrate
      </Link>
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  contenedor: { padding: 24, flexGrow: 1, justifyContent: "center" },
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
  enlace: { color: "#1565c0", textAlign: "center", marginTop: 20 },
});

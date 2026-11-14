import { zodResolver } from "@hookform/resolvers/zod";
import { Link, router } from "expo-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
} from "react-native";

import CampoFormulario from "../componentes/CampoFormulario";
import {
  iniciarSesion,
  iniciarSesionConHuella, 
  puedeIngresarConHuella, 
} from "../servicios/usuarios";
import { LoginForm, loginSchema } from "../utilidades/validacionesUsuario";

// Saca el mensaje del error (viene traducido por el cliente de Axios)
const leerMensaje = (e: unknown) => {
  const error = e as { mensaje?: string; message?: string };
  return error.mensaje ?? error.message ?? "Ocurrió un error inesperado";
};

export default function PantallaLogin() {
  const [errorServidor, setErrorServidor] = useState<string | null>(null);
  const [huellaDisponible, setHuellaDisponible] = useState(false); 
  const [verificandoHuella, setVerificandoHuella] = useState(false); 

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  // al abrir la pantalla, ¿el celular tiene huella y el usuario la activó?
  // Si no, el botón no aparece y se sigue con email y contraseña.
  useEffect(() => {
    puedeIngresarConHuella().then(setHuellaDisponible);
  }, []);

  // Ingreso con email y contraseña: POST /auth/ingreso
  const onSubmit = async (datos: LoginForm) => {
    setErrorServidor(null);
    try {
      await iniciarSesion(datos);
      router.replace("/");
    } catch (e) {
      setErrorServidor(leerMensaje(e));
    }
  };
  // ingreso con huella (huella + token guardado; sin red usa la copia local)
  const ingresarConHuella = async () => {
    setErrorServidor(null);
    setVerificandoHuella(true);
    try {
      await iniciarSesionConHuella();
      router.replace("/");
    } catch (e) {
      setErrorServidor(leerMensaje(e));
      // Si el token venció ya se borró: se oculta el botón y queda la contraseña
      setHuellaDisponible(await puedeIngresarConHuella());
    } finally {
      setVerificandoHuella(false);
    }
  };
  const ocupado = isSubmitting || verificandoHuella; 

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

      {errorServidor && (
        <Text style={estilos.errorServidor}>{errorServidor}</Text>
      )}

      <Pressable
        style={[estilos.boton, isSubmitting && estilos.botonDeshabilitado]}
        onPress={handleSubmit(onSubmit)}
        disabled={ocupado}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={estilos.textoBoton}>Ingresar</Text>
        )}
      </Pressable>
      {/* solo aparece si el celular tiene huella y el usuario la activó */}
      {huellaDisponible && (
        <Pressable
          style={[estilos.botonHuella, ocupado && estilos.botonDeshabilitado]}
          onPress={ingresarConHuella}
          disabled={ocupado}
        >
          {verificandoHuella ? (
            <ActivityIndicator color="#1565c0" />
          ) : (
            <Text style={estilos.textoHuella}>👆 Ingresar con huella</Text>
          )}
        </Pressable>
      )}

      <Link href="/registro" style={estilos.enlace}>
        ¿No tenés cuenta? Registrate
      </Link>
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  contenedor: { padding: 24, flexGrow: 1, justifyContent: "center" },
  titulo: {
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 24,
    textAlign: "center",
  },
  boton: {
    backgroundColor: "#1565c0",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  botonDeshabilitado: { opacity: 0.6 },
  textoBoton: { color: "#fff", fontSize: 16, fontWeight: "600" },
  botonHuella: {
    borderWidth: 1,
    borderColor: "#1565c0",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 12,
  },
  textoHuella: { color: "#1565c0", fontSize: 16, fontWeight: "600" },
  errorServidor: { color: "#d32f2f", textAlign: "center", marginBottom: 8 },
  enlace: { color: "#1565c0", textAlign: "center", marginTop: 20 },
});

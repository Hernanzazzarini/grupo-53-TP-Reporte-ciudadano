import { router, Stack, usePathname } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AvisosDeEstado from "../componentes/AvisosDeEstado";
import AvisoSinConexion from "../componentes/AvisoSinConexion";
import { escucharConexion, sincronizarReportesPendientes } from "../lib/cola-reportes";
import { obtenerUsuarioActual, restaurarSesion } from "../servicios/usuarios";



export default function RootLayout() {
  const [listo, setListo] = useState(false);
  const ruta = usePathname();             // en qué pantalla estamos
  const margenes = useSafeAreaInsets();   // espacio del notch / barra de estado

  // Módulo 5: al abrir la app, si hay un token guardado, recupera la sesión (GET /yo)
  useEffect(() => {
    restaurarSesion()
      .then((usuario) => {
        if (usuario) void sincronizarReportesPendientes();
      })
      .finally(() => setListo(true));
  }, []);

  useEffect(() => {
    const suscripcion = escucharConexion();
    return () => suscripcion.remove();
  }, []);

  // Mientras se recupera la sesión, se muestra un indicador de carga
  if (!listo) {
    return (
      <View style={estilos.cargando}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

    // El botón de perfil solo aparece en la pantalla de inicio ("/" = index.tsx)
    const mostrarBotonPerfil = obtenerUsuarioActual() !== null && ruta === "/";

  return (
    <>
      <AvisosDeEstado />
      <Stack screenOptions={{ headerShown: false }} />
      <AvisoSinConexion />

      {/* Módulo 5: acceso a Mi perfil → Configuración → Cerrar sesión */}
      {mostrarBotonPerfil && (
        <Pressable
          style={[estilos.botonPerfil, { top: margenes.top + 8 }]}
          onPress={() => router.push("/perfil")}
        >
          <Text style={estilos.icono}>👤</Text>
        </Pressable>
      )}
    </>
  );
}

const estilos = StyleSheet.create({
  cargando: { flex: 1, justifyContent: "center", alignItems: "center" },
  botonPerfil: {
    position: "absolute", // flota encima de cualquier pantalla
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,         // sombra en Android
    shadowColor: "#000",  // sombra en iPhone
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  icono: { fontSize: 22 },
});

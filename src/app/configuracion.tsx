import { Redirect, router } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, StyleSheet, Switch, Text, View } from "react-native";
import {
  actualizarConfiguracion,
  cerrarSesion,
  obtenerUsuarioActual,
} from "../servicios/usuarios";
import { ConfiguracionUsuario } from "../tipos/usuario";

export default function PantallaConfiguracion() {
  const usuario = obtenerUsuarioActual();
  const [config, setConfig] = useState<ConfiguracionUsuario | undefined>(
    usuario?.configuracion
  );

  if (!usuario || !config) return <Redirect href="/login" />;

  // Cambia una opción y la guarda en el servicio
  const cambiar = async (clave: keyof ConfiguracionUsuario, valor: boolean) => {
    const nueva = { ...config, [clave]: valor };
    setConfig(nueva); // se ve el cambio al instante
    try {
      await actualizarConfiguracion(nueva);
    } catch {
      setConfig(config); // si falla, vuelve atrás
      Alert.alert("Error", "No se pudo guardar la configuración");
    }
  };

  const confirmarCierre = () => {
    Alert.alert("Cerrar sesión", "¿Querés salir de tu cuenta?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Salir",
        style: "destructive",
        onPress: async () => {
          await cerrarSesion();
          router.replace("/login");
        },
      },
    ]);
  };

  return (
    <View style={estilos.contenedor}>
      <Text style={estilos.titulo}>Configuración</Text>

      <Text style={estilos.seccion}>Notificaciones</Text>
      <View style={estilos.fila}>
        <Text style={estilos.texto}>Avisos en el celular</Text>
        <Switch
          value={config.notificacionesPush}
          onValueChange={(v) => cambiar("notificacionesPush", v)}
        />
      </View>
      <View style={estilos.fila}>
        <Text style={estilos.texto}>Avisos por email</Text>
        <Switch
          value={config.notificacionesEmail}
          onValueChange={(v) => cambiar("notificacionesEmail", v)}
        />
      </View>

      <Pressable style={estilos.botonSalir} onPress={confirmarCierre}>
        <Text style={estilos.textoSalir}>Cerrar sesión</Text>
      </Pressable>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, padding: 24 },
  titulo: { fontSize: 26, fontWeight: "700", marginBottom: 20 },
  seccion: { fontSize: 14, fontWeight: "700", color: "#666", marginBottom: 8 },
  fila: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  texto: { fontSize: 16 },
  botonSalir: {
    marginTop: 40,
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d32f2f",
    alignItems: "center",
  },
  textoSalir: { color: "#d32f2f", fontSize: 16, fontWeight: "600" },
});

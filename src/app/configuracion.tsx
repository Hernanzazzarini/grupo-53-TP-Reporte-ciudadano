import { Redirect, router } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, StyleSheet, Switch, Text, View } from "react-native";
import BotonVolver from "../componentes/BotonVolver";
import {
  actualizarConfiguracion,
  cerrarSesion,
  obtenerUsuarioActual,
} from "../servicios/usuarios";

export default function PantallaConfiguracion() {
  const usuario = obtenerUsuarioActual();
  // Copia local del interruptor para mostrar el cambio al instante
  const [avisos, setAvisos] = useState(usuario?.avisosActivos ?? true);

  if (!usuario) return <Redirect href="/login" />;

  // Actualización OPTIMISTA: cambia en pantalla y después guarda (PATCH /yo).
  // Si falla, vuelve al valor anterior.
  const cambiarAvisos = async (valor: boolean) => {
    setAvisos(valor);
    try {
      await actualizarConfiguracion(valor);
    } catch {
      setAvisos(!valor);
      Alert.alert("Error", "No se pudo guardar la configuración");
    }
  };

  // Pide confirmación antes de cerrar sesión
  const confirmarCierre = () => {
    Alert.alert("Cerrar sesión", "¿Querés salir de tu cuenta?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Salir",
        style: "destructive",
        onPress: async () => {
          await cerrarSesion(); // borra el token del celular
          router.replace("/login");
        },
      },
    ]);
  };

  return (
    <View style={estilos.contenedor}>
      <BotonVolver />
      <Text style={estilos.titulo}>Configuración</Text>
      <Text style={estilos.seccion}>Notificaciones</Text>

      <View style={estilos.fila}>
        <Text style={estilos.texto}>Recibir avisos de mis reportes</Text>
        <Switch value={avisos} onValueChange={cambiarAvisos} />
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
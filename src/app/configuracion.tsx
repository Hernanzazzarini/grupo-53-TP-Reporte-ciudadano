import { Redirect, router } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Switch, Text, View } from "react-native";
import BotonVolver from "../componentes/BotonVolver";
import {
  activarHuella,
  biometriaDisponible,
  huellaActivada,
  pedirHuella,
} from "../servicios/biometria"; 
import {
  actualizarConfiguracion,
  cerrarSesion,
  obtenerUsuarioActual,
} from "../servicios/usuarios";

export default function PantallaConfiguracion() {
  const usuario = obtenerUsuarioActual();
  // Copia local del interruptor para mostrar el cambio al instante
  const [avisos, setAvisos] = useState(usuario?.avisosActivos ?? true);
  const [huellaPosible, setHuellaPosible] = useState(false); 
  const [huella, setHuella] = useState(false); 

  // al abrir la pantalla, si el celular no tiene huella la opción no se muestra
  useEffect(() => {
    biometriaDisponible().then(setHuellaPosible);
    huellaActivada().then(setHuella);
  }, []);

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

  // activa o desactiva el ingreso con huella.
  // Para activarla se pide la huella primero: así se confirma que es el dueño del celular.
  const cambiarHuella = async (valor: boolean) => {
    if (valor) {
      const ok = await pedirHuella();
      if (!ok) {
        Alert.alert("Huella", "No se pudo verificar la huella. No se activó.");
        return;
      }
    }
    await activarHuella(valor); // se guarda en kv-store
    setHuella(valor);
  };

  // Pide confirmación antes de cerrar sesión
  const confirmarCierre = () => {
    Alert.alert("Cerrar sesión", "¿Querés salir de tu cuenta?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Salir",
        style: "destructive",
        onPress: async () => {
          await cerrarSesion(); // con huella activa conserva el token; si no, lo borra
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

      {/* NUEVO: solo aparece si el celular tiene lector y huella registrada */}
      {huellaPosible && (
        <>
          <Text style={[estilos.seccion, estilos.seccionSeparada]}>
            Seguridad
          </Text>
          <View style={estilos.fila}>
            <Text style={estilos.texto}>Ingresar con huella</Text>
            <Switch value={huella} onValueChange={cambiarHuella} />
          </View>
          <Text style={estilos.ayuda}>
            Al cerrar sesión vas a poder volver a entrar con tu huella, sin
            escribir la contraseña.
          </Text>
        </>
      )}

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
  seccionSeparada: { marginTop: 24 }, // NUEVO
  fila: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  texto: { fontSize: 16 },
  ayuda: { fontSize: 13, color: "#777", marginTop: 6 }, // NUEVO
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

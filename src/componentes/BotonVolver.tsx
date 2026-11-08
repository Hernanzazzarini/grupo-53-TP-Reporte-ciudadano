import { router } from "expo-router";
import { Pressable, StyleSheet, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Botón para volver a la pantalla anterior.
// Se usa porque la app no muestra la barra de arriba (headerShown: false).
export default function BotonVolver() {
  const margenes = useSafeAreaInsets(); // espacio del notch / barra de estado

  const volver = () => {
    // Si hay una pantalla anterior, vuelve a ella; si no, va al inicio
    if (router.canGoBack()) router.back();
    else router.replace("/");
  };

  return (
    <Pressable
      onPress={volver}
      hitSlop={10} // agranda la zona táctil para que sea fácil de tocar
      style={[estilos.boton, { marginTop: margenes.top }]}
    >
      <Text style={estilos.texto}>← Volver</Text>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  boton: { alignSelf: "flex-start", marginBottom: 12 },
  texto: { color: "#1565c0", fontSize: 16, fontWeight: "600" },
});
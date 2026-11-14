import { addNetworkStateListener, getNetworkStateAsync, type NetworkState } from 'expo-network';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ESPERA_PARA_CONFIRMAR = 2000;

const estaSinConexion = (estado: NetworkState) =>
  estado.isConnected === false || estado.isInternetReachable === false;

export default function AvisoSinConexion() {
  const [sinConexion, setSinConexion] = useState(false);
  const margenes = useSafeAreaInsets();

  useEffect(() => {
    let temporizador: ReturnType<typeof setTimeout> | undefined;

    const revisar = () => {
      getNetworkStateAsync()
        .then((estado) => setSinConexion(estaSinConexion(estado)))
        .catch(() => {});
    };

    revisar();

    const suscripcion = addNetworkStateListener((estado) => {
      setSinConexion(estaSinConexion(estado));
      clearTimeout(temporizador);
      temporizador = setTimeout(revisar, ESPERA_PARA_CONFIRMAR);
    });

    return () => {
      clearTimeout(temporizador);
      suscripcion.remove();
    };
  }, []);

  if (!sinConexion) return null;

  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={[estilos.aviso, { paddingBottom: margenes.bottom + 10 }]}
    >
      <Text style={estilos.texto}>
        Sin conexión: los reportes nuevos se guardan y se envían cuando vuelva.
      </Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  aviso: {
    paddingTop: 10,
    paddingHorizontal: 16,
    backgroundColor: '#1F2937',
  },
  texto: {
    color: '#FFFFFF',
    fontSize: 14,
    textAlign: 'center',
  },
});

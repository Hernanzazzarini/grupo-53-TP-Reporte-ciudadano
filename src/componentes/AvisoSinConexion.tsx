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
      style={[estilos.aviso, { bottom: margenes.bottom + 12 }]}
    >
      <Text style={estilos.texto}>
        Sin conexión: los reportes nuevos se guardan y se envían cuando vuelva.
      </Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  aviso: {
    position: 'absolute',
    left: 16,
    right: 16,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#1F2937',
    pointerEvents: 'none',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  texto: {
    color: '#FFFFFF',
    fontSize: 14,
    textAlign: 'center',
  },
});

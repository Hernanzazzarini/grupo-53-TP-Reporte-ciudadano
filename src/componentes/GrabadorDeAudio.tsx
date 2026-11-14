import Ionicons from '@react-native-vector-icons/ionicons';
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { ReproductorDeAudio } from './ReproductorDeAudio';

interface Props {
  uri: string | null;
  onCambio: (uri: string | null) => void;
}

const enMinutos = (milisegundos: number) => {
  const segundos = Math.floor(milisegundos / 1000);
  return `${Math.floor(segundos / 60)}:${String(segundos % 60).padStart(2, '0')}`;
};

export function GrabadorDeAudio({ uri, onCambio }: Props) {
  const grabador = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const estado = useAudioRecorderState(grabador);

  const empezar = async () => {
    const permiso = await requestRecordingPermissionsAsync();
    if (!permiso.granted) {
      Alert.alert(
        'Necesitamos el micrófono',
        'Para grabar la nota de voz hace falta el permiso del micrófono. Igual podés enviar el reporte sin audio.',
        [
          { text: 'Ahora no', style: 'cancel' },
          { text: 'Abrir ajustes', onPress: () => Linking.openSettings() },
        ],
      );
      return;
    }

    try {
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await grabador.prepareToRecordAsync();
      grabador.record();
    } catch {
      Alert.alert('No se pudo grabar', 'Probá de nuevo en un momento.');
    }
  };

  const detener = async () => {
    await grabador.stop();
    await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
    onCambio(grabador.uri);
  };

  if (uri) {
    return (
      <View style={estilos.fila}>
        <View style={estilos.reproductor}>
          <ReproductorDeAudio url={uri} />
        </View>
        <Pressable
          onPress={() => onCambio(null)}
          hitSlop={12}
          role="button"
          accessibilityLabel="Borrar la nota de voz"
          style={({ pressed }) => [estilos.borrar, pressed && estilos.tocado]}
        >
          <Ionicons name="trash-outline" size={22} color="#DC2626" />
        </Pressable>
      </View>
    );
  }

  if (estado.isRecording) {
    return (
      <Pressable
        onPress={detener}
        role="button"
        accessibilityLabel="Detener la grabación"
        style={({ pressed }) => [estilos.boton, estilos.grabando, pressed && estilos.tocado]}
      >
        <Ionicons name="stop-circle" size={26} color="#DC2626" />
        <Text style={estilos.textoGrabando}>Grabando… {enMinutos(estado.durationMillis)}</Text>
        <Text style={estilos.ayuda}>Tocá para terminar</Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={empezar}
      role="button"
      accessibilityLabel="Grabar una nota de voz"
      accessibilityHint="Contá el problema hablando en vez de escribirlo"
      style={({ pressed }) => [estilos.boton, pressed && estilos.tocado]}
    >
      <Ionicons name="mic-outline" size={26} color="#0284C7" />
      <Text style={estilos.texto}>Grabar nota de voz</Text>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  boton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderColor: '#0284C7',
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  grabando: {
    borderColor: '#DC2626',
    borderStyle: 'solid',
    backgroundColor: '#FEF2F2',
  },
  texto: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0284C7',
  },
  textoGrabando: {
    fontSize: 16,
    fontWeight: '600',
    color: '#DC2626',
  },
  ayuda: {
    marginLeft: 'auto',
    fontSize: 13,
    color: '#64748B',
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  reproductor: {
    flex: 1,
  },
  borrar: {
    padding: 8,
  },
  tocado: {
    opacity: 0.6,
  },
});

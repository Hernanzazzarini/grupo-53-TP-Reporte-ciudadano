import Ionicons from '@react-native-vector-icons/ionicons';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useState } from 'react';
import { GestureResponderEvent, Pressable, StyleSheet, Text, View } from 'react-native';

interface Props {
  url: string;
}

export function ReproductorDeAudio({ url }: Props) {
  const reproductor = useAudioPlayer(url);
  const estado = useAudioPlayerStatus(reproductor);
  const [anchoBarra, setAnchoBarra] = useState(0);

  const sonando = estado.playing;
  const terminado = estado.didJustFinish || estado.currentTime >= estado.duration;

  const alternar = () => {
    if (sonando) {
      reproductor.pause();
      return;
    }
    if (terminado) reproductor.seekTo(0);
    reproductor.play();
  };

  const adelantarA = (evento: GestureResponderEvent) => {
    if (anchoBarra <= 0 || estado.duration <= 0) return;
    const proporcion = Math.min(Math.max(evento.nativeEvent.locationX / anchoBarra, 0), 1);
    reproductor.seekTo(proporcion * estado.duration);
  };

  const enMinutos = (segundos: number) => {
    if (!Number.isFinite(segundos) || segundos < 0) return '0:00';
    const min = Math.floor(segundos / 60);
    const seg = Math.floor(segundos % 60);
    return `${min}:${String(seg).padStart(2, '0')}`;
  };

  const progreso =
    estado.duration > 0 ? Math.min(estado.currentTime / estado.duration, 1) : 0;

  return (
    <View style={estilos.contenedor}>
      <Pressable
        onPress={alternar}
        hitSlop={12}
        role="button"
        accessibilityLabel={sonando ? 'Pausar la nota de voz' : 'Escuchar la nota de voz'}
        style={({ pressed }) => [estilos.boton, pressed && estilos.tocado]}
      >
        <Ionicons name={sonando ? 'pause' : 'play'} size={22} color="#FFFFFF" />
      </Pressable>

      <View style={estilos.info}>
        <Text style={estilos.etiqueta}>Nota de voz</Text>

        <Pressable
          onPress={adelantarA}
          onLayout={(e) => setAnchoBarra(e.nativeEvent.layout.width)}
          accessibilityRole="adjustable"
          accessibilityLabel="Posición de la nota de voz"
          accessibilityHint="Tocá la barra para adelantar o retroceder"
          accessibilityValue={{ min: 0, max: 100, now: Math.round(progreso * 100) }}
          style={estilos.zonaBarra}
        >
          <View style={estilos.barra}>
            <View style={[estilos.barraLlena, { width: `${progreso * 100}%` }]} />
          </View>
        </Pressable>
      </View>

      <Text style={estilos.tiempo}>
        {enMinutos(estado.currentTime)} / {enMinutos(estado.duration)}
      </Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 12,
  },
  boton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tocado: {
    opacity: 0.7,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  etiqueta: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E40AF',
  },
  zonaBarra: {
    paddingVertical: 12,
    justifyContent: 'center',
  },
  barra: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#BFDBFE',
    overflow: 'hidden',
  },
  barraLlena: {
    height: 6,
    backgroundColor: '#2563EB',
  },
  tiempo: {
    fontSize: 12,
    color: '#64748B',
    fontVariant: ['tabular-nums'],
  },
});

import Ionicons from '@react-native-vector-icons/ionicons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PantallaInicio() {
  const router = useRouter();

  return (
    <SafeAreaView style={estilos.pantalla} edges={['top']}>
      <View style={estilos.encabezado}>
        <Text style={estilos.titulo}>Reporte Ciudadano</Text>
        <Text style={estilos.subtitulo}>Municipalidad de Gualeguaychú</Text>
      </View>

      <View style={estilos.accesos}>
        <Pressable
          onPress={() => router.push('/nuevo-reporte' as any)}
          role="button"
          accessibilityLabel="Nuevo reporte"
          accessibilityHint="Elegí el tipo de problema y sacá una foto"
          style={({ pressed }) => [
            estilos.boton,
            estilos.botonPrincipal,
            pressed && estilos.tocado,
          ]}
        >
          <Ionicons name="camera-outline" size={30} color="#FFFFFF" />
          <View style={estilos.textos}>
            <Text style={estilos.textoPrincipal}>Nuevo reporte</Text>
            <Text style={estilos.ayudaPrincipal}>Contanos qué se rompió</Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color="#FFFFFF" />
        </Pressable>

        <Pressable
          onPress={() => router.push('/mis-reportes' as any)}
          role="button"
          accessibilityLabel="Mis reportes"
          accessibilityHint="Mirá en qué estado están tus reclamos"
          style={({ pressed }) => [estilos.boton, pressed && estilos.tocado]}
        >
          <Ionicons name="list-outline" size={30} color="#2563EB" />
          <View style={estilos.textos}>
            <Text style={estilos.texto}>Mis reportes</Text>
            <Text style={estilos.ayuda}>Seguí tus reclamos</Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color="#94A3B8" />
        </Pressable>

        <Pressable
          onPress={() => router.push('/ventanilla' as any)}
          role="button"
          accessibilityLabel="Ventanilla"
          accessibilityHint="Leé el código QR de un reclamo"
          style={({ pressed }) => [estilos.boton, pressed && estilos.tocado]}
        >
          <Ionicons name="qr-code-outline" size={30} color="#2563EB" />
          <View style={estilos.textos}>
            <Text style={estilos.texto}>Ventanilla</Text>
            <Text style={estilos.ayuda}>Escaneá un código QR</Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color="#94A3B8" />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  encabezado: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 28,
  },
  titulo: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
  },
  subtitulo: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 4,
  },
  accesos: {
    paddingHorizontal: 20,
    gap: 14,
  },
  boton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#2563EB',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 18,
  },
  botonPrincipal: {
    backgroundColor: '#2563EB',
  },
  textos: {
    flex: 1,
  },
  texto: {
    fontSize: 19,
    fontWeight: '600',
    color: '#2563EB',
  },
  ayuda: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
  },
  textoPrincipal: {
    fontSize: 19,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  ayudaPrincipal: {
    fontSize: 14,
    color: '#DBEAFE',
    marginTop: 2,
  },
  tocado: {
    opacity: 0.6,
  },
});

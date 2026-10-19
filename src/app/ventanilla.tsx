import Ionicons from '@react-native-vector-icons/ionicons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { reportePorCodigo } from '../servicios/seguimiento';
import { Reporte } from '../tipos';
import { ETIQUETAS_ESTADO } from '../utilidades/estados';

type Fase =
  | { tipo: 'escaneando' }
  | { tipo: 'buscando' }
  | { tipo: 'encontrado'; reporte: Reporte }
  | { tipo: 'noEncontrado'; codigo: string }
  | { tipo: 'error'; mensaje: string };

// ESTO ESTA PENDIENTE PARA LA AUTENTICACIÓN
// Esta pantalla es para el operador del mostrador. Proteger la ruta en el layout:
//
//   <Stack.Protected guard={usuario?.rol === 'operador'}>
//     <Stack.Screen name="ventanilla" />
//   </Stack.Protected>
export default function PantallaVentanilla() {
  const router = useRouter();
  const [permiso, pedirPermiso] = useCameraPermissions();
  const [fase, setFase] = useState<Fase>({ tipo: 'escaneando' });

  const alEscanear = async ({ data }: { data: string }) => {
    if (fase.tipo !== 'escaneando') return;

    setFase({ tipo: 'buscando' });

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const reporte = await reportePorCodigo(data);
      if (reporte) {
        setFase({ tipo: 'encontrado', reporte });
      } else {
        setFase({ tipo: 'noEncontrado', codigo: data });
      }
    } catch (error) {
      setFase({
        tipo: 'error',
        mensaje: error instanceof Error ? error.message : 'No pudimos buscar el reclamo.',
      });
    }
  };

  const volverAEscanear = () => setFase({ tipo: 'escaneando' });

  return (
    <SafeAreaView style={estilos.pantalla} edges={['top']}>
      <View style={estilos.encabezado}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={16}
          role="button"
          accessibilityLabel="Volver"
          style={({ pressed }) => pressed && estilos.tocado}
        >
          <Ionicons name="arrow-back" size={26} color="#FFFFFF" />
        </Pressable>
        <Text style={estilos.titulo}>Ventanilla</Text>
        <View style={estilos.espaciador} />
      </View>

      {permiso === null && (
        <View style={estilos.centrado}>
          <ActivityIndicator size="large" color="#FFFFFF" />
        </View>
      )}

      {permiso !== null && !permiso.granted && (
        <View style={estilos.centrado}>
          <Ionicons name="camera-outline" size={64} color="#94A3B8" />
          <Text style={estilos.tituloClaro}>Necesitamos la cámara</Text>
          <Text style={estilos.textoClaro}>
            Para leer el código QR del reclamo que trae el vecino hace falta acceso a
            la cámara. No se guarda ninguna imagen.
          </Text>

          {permiso.canAskAgain ? (
            <Pressable
              onPress={pedirPermiso}
              role="button"
              accessibilityLabel="Permitir el uso de la cámara"
              style={({ pressed }) => [estilos.boton, pressed && estilos.tocado]}
            >
              <Text style={estilos.textoBoton}>Permitir cámara</Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={() => Linking.openSettings()}
              role="button"
              accessibilityLabel="Abrir la configuración del teléfono"
              style={({ pressed }) => [estilos.boton, pressed && estilos.tocado]}
            >
              <Text style={estilos.textoBoton}>Abrir configuración</Text>
            </Pressable>
          )}
        </View>
      )}

      {permiso?.granted && (
        <View style={estilos.contenedorCamara}>
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={fase.tipo === 'escaneando' ? alEscanear : undefined}
          />

          {fase.tipo === 'escaneando' && (
            <View style={estilos.capaGuia} pointerEvents="none">
              <View style={estilos.marco} />
              <Text style={estilos.ayuda}>Apuntá al código QR del vecino</Text>
            </View>
          )}

          {fase.tipo === 'buscando' && (
            <View style={estilos.capaResultado}>
              <ActivityIndicator size="large" color="#FFFFFF" />
              <Text style={estilos.textoBuscando}>Buscando el reclamo…</Text>
            </View>
          )}

          {fase.tipo === 'encontrado' && (
            <View style={estilos.capaResultado}>
              <View style={estilos.tarjeta}>
                <Ionicons name="checkmark-circle" size={48} color="#16A34A" />
                <Text style={estilos.codigo}>{fase.reporte.codigo}</Text>
                <Text style={estilos.direccionTarjeta}>{fase.reporte.direccion}</Text>
                <Text style={estilos.estadoTarjeta}>
                  {ETIQUETAS_ESTADO[fase.reporte.estado]}
                </Text>

                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: '/detalle-reporte' as any,
                      params: { id: fase.reporte.id },
                    })
                  }
                  role="button"
                  accessibilityLabel={`Abrir el reclamo ${fase.reporte.codigo}`}
                  style={({ pressed }) => [estilos.boton, pressed && estilos.tocado]}
                >
                  <Text style={estilos.textoBoton}>Abrir el reclamo</Text>
                </Pressable>

                <Pressable onPress={volverAEscanear} hitSlop={12} role="button">
                  <Text style={estilos.enlace}>Escanear otro</Text>
                </Pressable>
              </View>
            </View>
          )}

          {fase.tipo === 'noEncontrado' && (
            <View style={estilos.capaResultado}>
              <View style={estilos.tarjeta}>
                <Ionicons name="alert-circle" size={48} color="#CA8A04" />
                <Text style={estilos.tituloMensaje}>Código desconocido</Text>
                <Text style={estilos.textoMensaje}>
                  No encontramos ningún reclamo con el código{'\n'}
                  <Text style={estilos.codigoChico}>{fase.codigo}</Text>
                </Text>

                <Pressable
                  onPress={volverAEscanear}
                  role="button"
                  accessibilityLabel="Escanear de nuevo"
                  style={({ pressed }) => [estilos.boton, pressed && estilos.tocado]}
                >
                  <Text style={estilos.textoBoton}>Escanear de nuevo</Text>
                </Pressable>
              </View>
            </View>
          )}

          {fase.tipo === 'error' && (
            <View style={estilos.capaResultado}>
              <View style={estilos.tarjeta}>
                <Ionicons name="cloud-offline-outline" size={48} color="#94A3B8" />
                <Text style={estilos.tituloMensaje}>No pudimos buscarlo</Text>
                <Text style={estilos.textoMensaje}>{fase.mensaje}</Text>

                <Pressable
                  onPress={volverAEscanear}
                  role="button"
                  accessibilityLabel="Reintentar"
                  style={({ pressed }) => [estilos.boton, pressed && estilos.tocado]}
                >
                  <Text style={estilos.textoBoton}>Reintentar</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: '#0F172A' },
  encabezado: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  titulo: { fontSize: 20, fontWeight: 'bold', color: '#FFFFFF' },
  espaciador: { width: 26 },
  contenedorCamara: { flex: 1, overflow: 'hidden' },
  capaGuia: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', gap: 20 },
  marco: {
    width: 240,
    height: 240,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    borderRadius: 20,
  },
  ayuda: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  capaResultado: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  textoBuscando: { color: '#FFFFFF', fontSize: 16 },
  tarjeta: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 8,
    width: '100%',
    maxWidth: 340,
  },
  codigo: { fontSize: 20, fontWeight: 'bold', color: '#1F2937', letterSpacing: 1 },
  direccionTarjeta: { fontSize: 17, color: '#374151', textAlign: 'center' },
  estadoTarjeta: { fontSize: 14, fontWeight: '700', color: '#64748B' },
  codigoChico: { fontWeight: '700', color: '#1F2937' },
  centrado: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  tituloMensaje: { fontSize: 19, fontWeight: '700', color: '#1F2937', textAlign: 'center' },
  textoMensaje: { fontSize: 15, color: '#64748B', textAlign: 'center', lineHeight: 21 },
  tituloClaro: { fontSize: 19, fontWeight: '700', color: '#FFFFFF', textAlign: 'center' },
  textoClaro: { fontSize: 15, color: '#CBD5E1', textAlign: 'center', lineHeight: 21 },
  boton: {
    marginTop: 8,
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 13,
    borderRadius: 10,
  },
  textoBoton: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  enlace: { color: '#2563EB', fontSize: 15, fontWeight: '600', marginTop: 4 },
  tocado: { opacity: 0.6 },
});

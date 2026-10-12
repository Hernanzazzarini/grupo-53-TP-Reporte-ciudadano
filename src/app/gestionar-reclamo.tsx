import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import Ionicons from '@react-native-vector-icons/ionicons';
import { Redirect, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LineaDeTiempo } from '../componentes/LineaDeTiempo';
import {
  agregarFotoArreglo,
  asignarCuadrilla,
  cambiarEstado,
  cuadrillasParaReporte,
} from '../servicios/cuadrillas';
import { obtenerTiposDeReporte } from '../servicios/reportes';
import { historialDeReporte, reportePorId } from '../servicios/seguimiento';
import { obtenerUsuarioActual } from '../servicios/usuarios';
import { CambioDeEstado, Cuadrilla, EstadoReporte, Reporte, TipoDeReporte } from '../tipos';
import { COLORES_ESTADO, ETIQUETAS_ESTADO } from '../utilidades/estados';
import { estadosSiguientes } from '../utilidades/reglasOperador';

type EstadoPantalla =
  | { fase: 'cargando' }
  | { fase: 'listo'; reporte: Reporte; historial: CambioDeEstado[]; cuadrillas: Cuadrilla[] }
  | { fase: 'noEncontrado' }
  | { fase: 'error'; mensaje: string };

export default function PantallaGestionarReclamo() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [pantalla, setPantalla] = useState<EstadoPantalla>({ fase: 'cargando' });
  const [categorias, setCategorias] = useState<TipoDeReporte[]>([]);
  const [comentario, setComentario] = useState('');
  const [procesando, setProcesando] = useState(false);

  const cargar = useCallback(async () => {
    if (!id) {
      setPantalla({ fase: 'noEncontrado' });
      return;
    }

    try {
      const [reporte, historial, tipos] = await Promise.all([
        reportePorId(id),
        historialDeReporte(id),
        obtenerTiposDeReporte(),
      ]);

      setCategorias(tipos);

      if (!reporte) {
        setPantalla({ fase: 'noEncontrado' });
        return;
      }

      const cuadrillas = await cuadrillasParaReporte(id);
      setPantalla({ fase: 'listo', reporte, historial, cuadrillas });
    } catch (error) {
      setPantalla({
        fase: 'error',
        mensaje:
          error instanceof Error ? error.message : 'Algo salió mal. Intentá de nuevo.',
      });
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar]),
  );

  const usuario = obtenerUsuarioActual();
  if (!usuario) return <Redirect href="/login" />;
  if (usuario.rol !== 'operador') return <Redirect href="/" />;

  const manejarCambiarEstado = async (estado: EstadoReporte) => {
    if (!id) return;
    setProcesando(true);
    try {
      await cambiarEstado(id, estado, comentario.trim() || null, usuario.id);
      setComentario('');
      await cargar();
    } catch (error) {
      Alert.alert(
        'No se pudo cambiar el estado',
        error instanceof Error ? error.message : 'Intentá de nuevo.',
      );
    } finally {
      setProcesando(false);
    }
  };

  const manejarAsignar = async (cuadrillaId: string) => {
    if (!id) return;
    setProcesando(true);
    try {
      await asignarCuadrilla(id, cuadrillaId, usuario.id);
      await cargar();
    } catch (error) {
      Alert.alert(
        'No se pudo asignar',
        error instanceof Error ? error.message : 'Intentá de nuevo.',
      );
    } finally {
      setProcesando(false);
    }
  };

  const manejarFotoArreglo = async () => {
    if (!id) return;

    const permiso = await ImagePicker.requestCameraPermissionsAsync();
    if (!permiso.granted) {
      Alert.alert('Permiso requerido', 'Se necesita acceso a la cámara para sacar la foto.');
      return;
    }

    const resultado = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 0.7,
    });
    if (resultado.canceled) return;

    setProcesando(true);
    try {
      await agregarFotoArreglo(id, resultado.assets[0].uri);
      await cargar();
    } catch (error) {
      Alert.alert(
        'No se pudo subir la foto',
        error instanceof Error ? error.message : 'Intentá de nuevo.',
      );
    } finally {
      setProcesando(false);
    }
  };

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
          <Ionicons name="arrow-back" size={26} color="#1F2937" />
        </Pressable>
        <Text style={estilos.tituloEncabezado} numberOfLines={1}>
          {pantalla.fase === 'listo' ? pantalla.reporte.codigo : 'Gestionar reclamo'}
        </Text>
        <View style={estilos.espaciador} />
      </View>

      {pantalla.fase === 'cargando' && (
        <View style={estilos.centrado}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      )}

      {pantalla.fase === 'noEncontrado' && (
        <View style={estilos.centrado}>
          <Ionicons name="help-circle-outline" size={56} color="#94A3B8" />
          <Text style={estilos.tituloMensaje}>No encontramos ese reclamo</Text>
        </View>
      )}

      {pantalla.fase === 'error' && (
        <View style={estilos.centrado}>
          <Ionicons name="cloud-offline-outline" size={56} color="#94A3B8" />
          <Text style={estilos.tituloMensaje}>No pudimos cargar el reclamo</Text>
          <Text style={estilos.textoMensaje}>{pantalla.mensaje}</Text>
          <Pressable
            onPress={cargar}
            role="button"
            accessibilityLabel="Reintentar"
            style={({ pressed }) => [estilos.boton, pressed && estilos.tocado]}
          >
            <Text style={estilos.textoBoton}>Reintentar</Text>
          </Pressable>
        </View>
      )}

      {pantalla.fase === 'listo' && (
        <ScrollView contentContainerStyle={estilos.cuerpo}>
          <View style={estilos.bloque}>
            <Text style={estilos.categoria}>
              {categorias.find((c) => c.id === pantalla.reporte.tipoId)?.nombre ?? 'Reclamo'}
            </Text>
            <Text style={estilos.direccion}>{pantalla.reporte.direccion}</Text>
            <View
              style={[estilos.chipEstado, { backgroundColor: COLORES_ESTADO[pantalla.reporte.estado] }]}
            >
              <Text style={estilos.textoEstado}>
                {ETIQUETAS_ESTADO[pantalla.reporte.estado].toUpperCase()}
              </Text>
            </View>
            {pantalla.reporte.descripcion && (
              <Text style={estilos.descripcion}>{pantalla.reporte.descripcion}</Text>
            )}
          </View>

          <View style={estilos.bloque}>
            <Text style={estilos.tituloBloque}>Asignar cuadrilla</Text>
            {pantalla.cuadrillas.length === 0 ? (
              <Text style={estilos.textoMensaje}>
                No hay cuadrillas disponibles para este reclamo.
              </Text>
            ) : (
              pantalla.cuadrillas.map((cuadrilla) => (
                <Pressable
                  key={cuadrilla.id}
                  onPress={() => manejarAsignar(cuadrilla.id)}
                  disabled={procesando}
                  role="button"
                  accessibilityLabel={`Asignar a ${cuadrilla.nombre}`}
                  style={({ pressed }) => [
                    estilos.filaCuadrilla,
                    pantalla.reporte.cuadrillaId === cuadrilla.id && estilos.filaCuadrillaActiva,
                    pressed && estilos.tocado,
                  ]}
                >
                  <Text style={estilos.nombreCuadrilla}>{cuadrilla.nombre}</Text>
                  {pantalla.reporte.cuadrillaId === cuadrilla.id && (
                    <Ionicons name="checkmark-circle" size={20} color="#16A34A" />
                  )}
                </Pressable>
              ))
            )}
          </View>

          <View style={estilos.bloque}>
            <Text style={estilos.tituloBloque}>Cambiar estado</Text>
            <TextInput
              style={estilos.input}
              placeholder="Comentario (obligatorio según el estado)"
              multiline
              value={comentario}
              onChangeText={setComentario}
            />
            <View style={estilos.filaBotonesEstado}>
              {estadosSiguientes(pantalla.reporte.estado)
                .filter((estado) => estado !== 'asignado')
                .map((estado) => (
                  <Pressable
                    key={estado}
                    onPress={() => manejarCambiarEstado(estado)}
                    disabled={procesando}
                    role="button"
                    accessibilityLabel={`Cambiar a ${ETIQUETAS_ESTADO[estado]}`}
                    style={({ pressed }) => [
                      estilos.botonEstado,
                      { borderColor: COLORES_ESTADO[estado] },
                      pressed && estilos.tocado,
                    ]}
                  >
                    <Text style={[estilos.textoBotonEstado, { color: COLORES_ESTADO[estado] }]}>
                      {ETIQUETAS_ESTADO[estado]}
                    </Text>
                  </Pressable>
                ))}
            </View>
          </View>

          <View style={estilos.bloque}>
            <Text style={estilos.tituloBloque}>Foto del arreglo</Text>
            {pantalla.reporte.fotos.find((f) => f.momento === 'arreglo') && (
              <Image
                source={pantalla.reporte.fotos.find((f) => f.momento === 'arreglo')!.url}
                style={estilos.foto}
                contentFit="cover"
                transition={200}
              />
            )}
            <Pressable
              onPress={manejarFotoArreglo}
              disabled={procesando}
              role="button"
              accessibilityLabel="Sacar foto del arreglo"
              style={({ pressed }) => [estilos.boton, pressed && estilos.tocado]}
            >
              <Text style={estilos.textoBoton}>
                {pantalla.reporte.fotos.some((f) => f.momento === 'arreglo')
                  ? 'Reemplazar foto'
                  : 'Sacar foto'}
              </Text>
            </Pressable>
          </View>

          <View style={estilos.bloque}>
            <Text style={estilos.tituloBloque}>Qué fue pasando</Text>
            <LineaDeTiempo cambios={pantalla.historial} />
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: '#F3F4F6' },
  encabezado: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  tituloEncabezado: {
    flex: 1,
    fontSize: 17,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
  },
  espaciador: { width: 26 },
  centrado: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 10 },
  tituloMensaje: { fontSize: 18, fontWeight: '700', color: '#334155', textAlign: 'center' },
  textoMensaje: { fontSize: 15, color: '#64748B', textAlign: 'center', lineHeight: 21 },
  cuerpo: { padding: 16, gap: 12, paddingBottom: 32 },
  bloque: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    gap: 10,
  },
  categoria: { fontSize: 14, fontWeight: '600', color: '#475569' },
  direccion: { fontSize: 22, fontWeight: 'bold', color: '#1F2937' },
  chipEstado: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
  },
  textoEstado: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  descripcion: { fontSize: 16, color: '#374151', lineHeight: 23 },
  tituloBloque: { fontSize: 16, fontWeight: '700', color: '#1F2937' },
  filaCuadrilla: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  filaCuadrillaActiva: { borderColor: '#16A34A', backgroundColor: '#F0FDF4' },
  nombreCuadrilla: { fontSize: 15, fontWeight: '600', color: '#1F2937' },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5D8',
    borderRadius: 8,
    padding: 12,
    textAlignVertical: 'top',
    fontSize: 15,
    minHeight: 60,
  },
  filaBotonesEstado: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  botonEstado: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1.5,
  },
  textoBotonEstado: { fontSize: 14, fontWeight: '700' },
  foto: { width: '100%', height: 180, borderRadius: 10, backgroundColor: '#E2E8F0' },
  boton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  textoBoton: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  tocado: { opacity: 0.6 },
});

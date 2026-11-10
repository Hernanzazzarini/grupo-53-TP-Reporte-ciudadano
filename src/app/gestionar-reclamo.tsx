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
import { marcarComoDuplicado } from '../servicios/adhesiones';
import {
  agregarFotoArreglo,
  asignarCuadrilla,
  cambiarEstado,
  cuadrillasParaReporte,
} from '../servicios/cuadrillas';
import { obtenerTiposDeReporte } from '../servicios/reportes';
import { historialDeReporte, reportePorCodigo, reportePorId } from '../servicios/seguimiento';
import { obtenerUsuarioActual } from '../servicios/usuarios';
import { CambioDeEstado, Cuadrilla, EstadoReporte, Reporte, TipoDeReporte } from '../tipos';
import { COLORES_ESTADO, ETIQUETAS_ESTADO } from '../utilidades/estados';
import { estadosSiguientes } from '../utilidades/reglasOperador';

type EstadoPantalla =
  | { fase: 'cargando' }
  | {
      fase: 'listo';
      reporte: Reporte;
      historial: CambioDeEstado[];
      cuadrillas: Cuadrilla[];
      original: Reporte | null;
    }
  | { fase: 'noEncontrado' }
  | { fase: 'error'; mensaje: string };

type BusquedaOriginal =
  | { fase: 'inactiva' }
  | { fase: 'buscando' }
  | { fase: 'encontrado'; reporte: Reporte }
  | { fase: 'noEncontrado' };

export default function PantallaGestionarReclamo() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [pantalla, setPantalla] = useState<EstadoPantalla>({ fase: 'cargando' });
  const [categorias, setCategorias] = useState<TipoDeReporte[]>([]);
  const [comentario, setComentario] = useState('');
  const [procesando, setProcesando] = useState(false);
  const [codigoOriginal, setCodigoOriginal] = useState('');
  const [busquedaOriginal, setBusquedaOriginal] = useState<BusquedaOriginal>({ fase: 'inactiva' });

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

      const [cuadrillas, original] = await Promise.all([
        cuadrillasParaReporte(id),
        reporte.duplicadoDe ? reportePorId(reporte.duplicadoDe) : Promise.resolve(null),
      ]);
      setPantalla({ fase: 'listo', reporte, historial, cuadrillas, original });
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

  const buscarOriginal = async () => {
    const codigo = codigoOriginal.trim();
    if (!codigo) return;

    setBusquedaOriginal({ fase: 'buscando' });
    try {
      const encontrado = await reportePorCodigo(codigo);
      if (!encontrado || encontrado.id === id) {
        setBusquedaOriginal({ fase: 'noEncontrado' });
        return;
      }
      setBusquedaOriginal({ fase: 'encontrado', reporte: encontrado });
    } catch (error) {
      Alert.alert(
        'No se pudo buscar',
        error instanceof Error ? error.message : 'Intentá de nuevo.',
      );
      setBusquedaOriginal({ fase: 'inactiva' });
    }
  };

  const confirmarDuplicado = async (original: Reporte) => {
    if (!id) return;
    setProcesando(true);
    try {
      await marcarComoDuplicado(id, original.id);
      setCodigoOriginal('');
      setBusquedaOriginal({ fase: 'inactiva' });
      await cargar();
    } catch (error) {
      Alert.alert(
        'No se pudo marcar como duplicado',
        error instanceof Error ? error.message : 'Intentá de nuevo.',
      );
    } finally {
      setProcesando(false);
    }
  };

  const subirFotoArreglo = async (uri: string) => {
    if (!id) return;

    setProcesando(true);
    try {
      await agregarFotoArreglo(id, uri);
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

  const sacarFotoArreglo = async () => {
    const permiso = await ImagePicker.requestCameraPermissionsAsync();
    if (!permiso.granted) {
      Alert.alert('Permiso requerido', 'Se necesita acceso a la cámara para sacar la foto.');
      return;
    }

    const resultado = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 0.7,
    });
    if (!resultado.canceled) await subirFotoArreglo(resultado.assets[0].uri);
  };

  const elegirFotoArregloDeGaleria = async () => {
    const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permiso.granted) {
      Alert.alert('Permiso requerido', 'Se necesita acceso a la galería para elegir la foto.');
      return;
    }

    const resultado = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: false,
      quality: 0.7,
    });
    if (!resultado.canceled) await subirFotoArreglo(resultado.assets[0].uri);
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
            <Text style={estilos.tituloBloque}>Duplicado</Text>
            {pantalla.reporte.duplicadoDe ? (
              <Text style={estilos.textoMensaje}>
                Marcado como duplicado de{' '}
                {pantalla.original ? pantalla.original.codigo : pantalla.reporte.duplicadoDe}.
              </Text>
            ) : (
              <>
                <TextInput
                  style={estilos.input}
                  placeholder="Código del reclamo original (ej. GCHU-2026-00412)"
                  autoCapitalize="characters"
                  value={codigoOriginal}
                  onChangeText={(texto) => {
                    setCodigoOriginal(texto);
                    setBusquedaOriginal({ fase: 'inactiva' });
                  }}
                />
                <Pressable
                  onPress={buscarOriginal}
                  disabled={procesando || busquedaOriginal.fase === 'buscando'}
                  role="button"
                  accessibilityLabel="Buscar reclamo original"
                  style={({ pressed }) => [estilos.boton, pressed && estilos.tocado]}
                >
                  <Text style={estilos.textoBoton}>
                    {busquedaOriginal.fase === 'buscando' ? 'Buscando…' : 'Buscar'}
                  </Text>
                </Pressable>

                {busquedaOriginal.fase === 'noEncontrado' && (
                  <Text style={estilos.textoMensaje}>
                    No encontramos un reclamo distinto con ese código.
                  </Text>
                )}

                {busquedaOriginal.fase === 'encontrado' && (
                  <View style={estilos.filaCuadrilla}>
                    <View style={estilos.textos}>
                      <Text style={estilos.nombreCuadrilla}>
                        {busquedaOriginal.reporte.codigo}
                      </Text>
                      <Text style={estilos.especialidad}>
                        {busquedaOriginal.reporte.direccion}
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => confirmarDuplicado(busquedaOriginal.reporte)}
                      disabled={procesando}
                      role="button"
                      accessibilityLabel={`Marcar como duplicado de ${busquedaOriginal.reporte.codigo}`}
                      style={({ pressed }) => pressed && estilos.tocado}
                    >
                      <Ionicons name="checkmark-circle-outline" size={26} color="#2563EB" />
                    </Pressable>
                  </View>
                )}
              </>
            )}
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
            <View style={estilos.filaBotonesFoto}>
              <Pressable
                onPress={sacarFotoArreglo}
                disabled={procesando}
                role="button"
                accessibilityLabel="Sacar foto del arreglo"
                style={({ pressed }) => [estilos.boton, estilos.botonMitad, pressed && estilos.tocado]}
              >
                <Text style={estilos.textoBoton}>
                  {pantalla.reporte.fotos.some((f) => f.momento === 'arreglo')
                    ? 'Tomar otra'
                    : 'Sacar foto'}
                </Text>
              </Pressable>
              <Pressable
                onPress={elegirFotoArregloDeGaleria}
                disabled={procesando}
                role="button"
                accessibilityLabel="Elegir foto del arreglo de la galería"
                style={({ pressed }) => [estilos.boton, estilos.botonMitad, pressed && estilos.tocado]}
              >
                <Text style={estilos.textoBoton}>Elegir de galería</Text>
              </Pressable>
            </View>
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
  textos: { flex: 1 },
  especialidad: { fontSize: 13, color: '#64748B', marginTop: 2 },
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
  filaBotonesFoto: { flexDirection: 'row', gap: 10 },
  botonMitad: { flex: 1, paddingHorizontal: 12 },
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

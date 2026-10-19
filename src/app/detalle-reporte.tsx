import { Image } from 'expo-image';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LineaDeTiempo } from '../componentes/LineaDeTiempo';
import { ReproductorDeAudio } from '../componentes/ReproductorDeAudio';
import { obtenerTiposDeReporte } from '../servicios/reportes';
import { historialDeReporte, reportePorId } from '../servicios/seguimiento';
import { CambioDeEstado, Reporte, TipoDeReporte } from '../tipos';
import { COLORES_ESTADO, ETIQUETAS_ESTADO } from '../utilidades/estados';
import { hace } from '../utilidades/fechas';

type EstadoPantalla =
  | { fase: 'cargando' }
  | { fase: 'listo'; reporte: Reporte; historial: CambioDeEstado[] }
  | { fase: 'noEncontrado' }
  | { fase: 'error'; mensaje: string };

export default function PantallaDetalleReporte() {
  const router = useRouter();

  const { id } = useLocalSearchParams<{ id: string }>();

  const [pantalla, setPantalla] = useState<EstadoPantalla>({ fase: 'cargando' });
  const [categorias, setCategorias] = useState<TipoDeReporte[]>([]);
  const [qrVisible, setQrVisible] = useState(false);

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

      setPantalla({ fase: 'listo', reporte, historial });
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
          {pantalla.fase === 'listo' ? pantalla.reporte.codigo : 'Reclamo'}
        </Text>

        {pantalla.fase === 'listo' ? (
          <Pressable
            onPress={() => setQrVisible(true)}
            hitSlop={16}
            role="button"
            accessibilityLabel="Mostrar el código QR del reclamo"
            accessibilityHint="Para que lo escaneen en el mostrador"
            style={({ pressed }) => pressed && estilos.tocado}
          >
            <Ionicons name="qr-code-outline" size={26} color="#2563EB" />
          </Pressable>
        ) : (
          <View style={estilos.espaciador} />
        )}
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
          <Text style={estilos.textoMensaje}>
            Puede que se haya dado de baja o que el código esté mal.
          </Text>
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
        <Contenido
          reporte={pantalla.reporte}
          historial={pantalla.historial}
          tipo={categorias.find((c) => c.id === pantalla.reporte.tipoId)}
        />
      )}

      {pantalla.fase === 'listo' && (
        <Modal
          visible={qrVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setQrVisible(false)}
        >
          <Pressable style={estilos.fondoModal} onPress={() => setQrVisible(false)}>

            <Pressable style={estilos.tarjetaQr} onPress={() => {}}>
              <Text style={estilos.tituloQr}>Mostrá este código</Text>
              <Text style={estilos.subtituloQr}>
                En el mostrador lo escanean y abren tu reclamo
              </Text>

              <View style={estilos.marcoQr}>
                <QRCode value={pantalla.reporte.codigo} size={220} />
              </View>

              <Text style={estilos.codigoQr}>{pantalla.reporte.codigo}</Text>

              <Pressable
                onPress={() => setQrVisible(false)}
                role="button"
                accessibilityLabel="Cerrar"
                style={({ pressed }) => [estilos.boton, pressed && estilos.tocado]}
              >
                <Text style={estilos.textoBoton}>Cerrar</Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>
      )}
    </SafeAreaView>
  );
}

function Contenido({
  reporte,
  historial,
  tipo,
}: {
  reporte: Reporte;
  historial: CambioDeEstado[];
  tipo?: TipoDeReporte;
}) {
  const fotoProblema = reporte.fotos.find((f) => f.momento === 'problema');
  const fotoArreglo = reporte.fotos.find((f) => f.momento === 'arreglo');
  const color = COLORES_ESTADO[reporte.estado];

  return (
    <ScrollView contentContainerStyle={estilos.cuerpo}>

      <View style={estilos.bloque}>
        <View style={estilos.filaCategoria}>
          {tipo && <Ionicons name={tipo.icono as any} size={20} color={tipo.color} />}
          <Text style={estilos.categoria}>{tipo?.nombre ?? 'Reclamo'}</Text>
        </View>

        <Text style={estilos.direccion}>{reporte.direccion}</Text>

        <View style={[estilos.chipEstado, { backgroundColor: color }]}>
          <Text style={estilos.textoEstado}>
            {ETIQUETAS_ESTADO[reporte.estado].toUpperCase()}
          </Text>
        </View>

        <Text style={estilos.meta}>Reportado {hace(reporte.creadoEn)}</Text>

        {reporte.adhesiones > 0 && (
          <View style={estilos.filaAdhesiones}>
            <Ionicons name="people" size={18} color="#475569" />
            <Text style={estilos.textoAdhesiones}>
              {reporte.adhesiones === 1
                ? '1 vecino se sumó'
                : `${reporte.adhesiones} vecinos se sumaron`}
            </Text>
          </View>
        )}

        {!reporte.sincronizado && (
          <View style={estilos.avisoPendiente}>
            <Ionicons name="cloud-upload-outline" size={18} color="#92400E" />
            <Text style={estilos.textoPendiente}>
              Guardado en tu teléfono. Se va a enviar solo cuando vuelva la conexión.
            </Text>
          </View>
        )}

      </View>

      {(reporte.descripcion || reporte.audioUrl) && (
        <View style={estilos.bloque}>
          <Text style={estilos.tituloBloque}>Lo que reportaste</Text>

          {reporte.descripcion && (
            <Text style={estilos.descripcion}>{reporte.descripcion}</Text>
          )}

          {reporte.audioUrl && <ReproductorDeAudio url={reporte.audioUrl} />}
        </View>
      )}

      <View style={estilos.bloque}>
        <Text style={estilos.tituloBloque}>
          {fotoArreglo ? 'Antes y después' : 'Fotografía'}
        </Text>

        <View style={estilos.fotos}>
          {fotoProblema && (
            <View style={estilos.columnaFoto}>
              <Image
                source={fotoProblema.url}
                style={estilos.foto}
                contentFit="cover"
                transition={200}
              />
              {fotoArreglo && <Text style={estilos.pieFoto}>El problema</Text>}
            </View>
          )}

          {fotoArreglo && (
            <View style={estilos.columnaFoto}>
              <Image
                source={fotoArreglo.url}
                style={estilos.foto}
                contentFit="cover"
                transition={200}
              />
              <Text style={estilos.pieFoto}>Resuelto</Text>
            </View>
          )}
        </View>
      </View>

      <View style={estilos.bloque}>
        <Text style={estilos.tituloBloque}>Qué fue pasando</Text>
        <LineaDeTiempo cambios={historial} />
      </View>
    </ScrollView>
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
  cuerpo: { padding: 16, gap: 12, paddingBottom: 32 },
  bloque: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    gap: 10,
  },
  filaCategoria: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  categoria: { fontSize: 14, fontWeight: '600', color: '#475569' },
  direccion: { fontSize: 22, fontWeight: 'bold', color: '#1F2937' },
  chipEstado: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
  },
  textoEstado: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  meta: { fontSize: 14, color: '#94A3B8' },
  filaAdhesiones: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  textoAdhesiones: { fontSize: 15, color: '#475569', fontWeight: '600' },
  avisoPendiente: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#FEF3C7',
    borderRadius: 10,
    padding: 12,
  },
  textoPendiente: { flex: 1, fontSize: 14, color: '#92400E', lineHeight: 19 },
  tituloBloque: { fontSize: 16, fontWeight: '700', color: '#1F2937' },
  descripcion: { fontSize: 16, color: '#374151', lineHeight: 23 },
  fotos: { flexDirection: 'row', gap: 10 },
  columnaFoto: { flex: 1, gap: 6 },
  foto: { width: '100%', height: 180, borderRadius: 10, backgroundColor: '#E2E8F0' },
  pieFoto: { fontSize: 13, color: '#64748B', textAlign: 'center', fontWeight: '600' },
  centrado: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 10 },
  tituloMensaje: { fontSize: 18, fontWeight: '700', color: '#334155', textAlign: 'center' },
  textoMensaje: { fontSize: 15, color: '#64748B', textAlign: 'center', lineHeight: 21 },
  boton: {
    marginTop: 8,
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  textoBoton: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  tocado: { opacity: 0.6 },
  fondoModal: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  tarjetaQr: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 10,
    width: '100%',
    maxWidth: 340,
  },
  tituloQr: { fontSize: 20, fontWeight: 'bold', color: '#1F2937' },
  subtituloQr: { fontSize: 14, color: '#64748B', textAlign: 'center' },
  marcoQr: { padding: 16, backgroundColor: '#FFFFFF', borderRadius: 12, marginTop: 4 },
  codigoQr: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: 1,
  },
});

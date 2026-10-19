import Ionicons from '@react-native-vector-icons/ionicons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TarjetaReporte } from '../componentes/TarjetaReporte';
import {
  avisosActivos,
  definirAvisosActivos,
  marcarAvisosOfrecidos,
  pedirPermisoDeAvisos,
  permisoConcedido,
  yaOfrecimosLosAvisos,
} from '../servicios/notificaciones';
import { obtenerTiposDeReporte } from '../servicios/reportes';
import { misReportes } from '../servicios/seguimiento';
import { EstadoReporte, Reporte, TipoDeReporte } from '../tipos';
import { COLORES_ESTADO, ETIQUETAS_ESTADO, ORDEN_ESTADOS } from '../utilidades/estados';

type EstadoPantalla =
  | { fase: 'cargando' }
  | { fase: 'listo'; reportes: Reporte[] }
  | { fase: 'error'; mensaje: string };

export default function PantallaMisReportes() {
  const router = useRouter();

  const [pantalla, setPantalla] = useState<EstadoPantalla>({ fase: 'cargando' });
  const [categorias, setCategorias] = useState<TipoDeReporte[]>([]);
  const [filtro, setFiltro] = useState<EstadoReporte | null>(null);
  const [recargando, setRecargando] = useState(false);

  const [avisos, setAvisos] = useState(true);
  const [ofrecerAvisos, setOfrecerAvisos] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const [reportes, tipos] = await Promise.all([
        misReportes(),
        obtenerTiposDeReporte(),
      ]);
      setCategorias(tipos);
      setPantalla({ fase: 'listo', reportes });
    } catch (error) {
      setPantalla({
        fase: 'error',
        mensaje:
          error instanceof Error
            ? error.message
            : 'Algo salió mal. Intentá de nuevo.',
      });
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargar();
      avisosActivos().then(setAvisos);
      revisarSiOfrecemosAvisos();
    }, [cargar]),
  );

  const alTirarParaRecargar = useCallback(async () => {
    setRecargando(true);
    await cargar();
    setRecargando(false);
  }, [cargar]);

  const abrirDetalle = (id: string) => {
    router.push({ pathname: '/detalle-reporte' as any, params: { id } });
  };

  const revisarSiOfrecemosAvisos = async () => {
    const [concedido, yaOfrecido] = await Promise.all([
      permisoConcedido(),
      yaOfrecimosLosAvisos(),
    ]);
    setOfrecerAvisos(!concedido && !yaOfrecido);
  };

  const aceptarAvisos = async () => {
    setOfrecerAvisos(false);
    await marcarAvisosOfrecidos();
    await pedirPermisoDeAvisos();
  };

  const rechazarAvisos = async () => {
    setOfrecerAvisos(false);
    await marcarAvisosOfrecidos();
  };

  const alternarAvisos = async () => {
    const proximo = !avisos;
    setAvisos(proximo);
    await definirAvisosActivos(proximo);
  };

  const reportesVisibles =
    pantalla.fase === 'listo'
      ? filtro
        ? pantalla.reportes.filter((r) => r.estado === filtro)
        : pantalla.reportes
      : [];

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
        <Text style={estilos.titulo}>Mis reportes</Text>

        <Pressable
          onPress={alternarAvisos}
          hitSlop={16}
          role="switch"
          accessibilityState={{ checked: avisos }}
          accessibilityLabel="Avisos de cambio de estado"
          accessibilityHint={
            avisos
              ? 'Tocá para dejar de recibir avisos'
              : 'Tocá para volver a recibir avisos'
          }
          style={({ pressed }) => [
            estilos.espaciador,
            pressed && estilos.tocado,
          ]}
        >
          <Ionicons
            name={avisos ? 'notifications-outline' : 'notifications-off-outline'}
            size={26}
            color={avisos ? '#2563EB' : '#94A3B8'}
          />
        </Pressable>
      </View>

      {pantalla.fase === 'cargando' && (
        <View style={estilos.centrado}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={estilos.textoCentrado}>Buscando tus reclamos…</Text>
        </View>
      )}

      {pantalla.fase === 'error' && (
        <View style={estilos.centrado}>
          <Ionicons name="cloud-offline-outline" size={56} color="#94A3B8" />
          <Text style={estilos.tituloVacio}>No pudimos cargar tus reclamos</Text>
          <Text style={estilos.textoCentrado}>{pantalla.mensaje}</Text>
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

      {pantalla.fase === 'listo' && ofrecerAvisos && (
        <View style={estilos.ofrecimiento}>
          <Ionicons name="notifications-outline" size={26} color="#1E40AF" />
          <View style={estilos.ofrecimientoTextos}>
            <Text style={estilos.ofrecimientoTitulo}>
              ¿Querés que te avisemos?
            </Text>
            <Text style={estilos.ofrecimientoTexto}>
              Te mandamos un aviso cada vez que cambie el estado de un reclamo tuyo.
              Lo podés apagar cuando quieras.
            </Text>
            <View style={estilos.ofrecimientoBotones}>
              <Pressable
                onPress={aceptarAvisos}
                role="button"
                accessibilityLabel="Sí, avisarme"
                style={({ pressed }) => [estilos.botonChico, pressed && estilos.tocado]}
              >
                <Text style={estilos.textoBotonChico}>Sí, avisarme</Text>
              </Pressable>
              <Pressable
                onPress={rechazarAvisos}
                role="button"
                accessibilityLabel="Ahora no"
                style={({ pressed }) => [estilos.botonTexto, pressed && estilos.tocado]}
              >
                <Text style={estilos.textoBotonTexto}>Ahora no</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}

      {pantalla.fase === 'listo' && (
        <>

          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={ORDEN_ESTADOS}
            keyExtractor={(estado) => estado}
            style={estilos.filtros}
            contentContainerStyle={estilos.filtrosContenido}
            ListHeaderComponent={
              <Chip
                texto="Todos"
                activo={filtro === null}
                color="#475569"
                alTocar={() => setFiltro(null)}
              />
            }
            renderItem={({ item: estado }) => (
              <Chip
                texto={ETIQUETAS_ESTADO[estado]}
                activo={filtro === estado}
                color={COLORES_ESTADO[estado]}
                alTocar={() => setFiltro(filtro === estado ? null : estado)}
              />
            )}
          />

          <FlatList
            data={reportesVisibles}
            keyExtractor={(reporte) => reporte.id}
            contentContainerStyle={estilos.lista}
            refreshControl={
              <RefreshControl refreshing={recargando} onRefresh={alTirarParaRecargar} />
            }
            renderItem={({ item }) => (
              <TarjetaReporte
                reporte={item}
                tipo={categorias.find((c) => c.id === item.tipoId)}
                alTocar={abrirDetalle}
              />
            )}
            ListEmptyComponent={
              <View style={estilos.centrado}>
                <Ionicons name="document-text-outline" size={56} color="#94A3B8" />
                <Text style={estilos.tituloVacio}>
                  {filtro ? 'Nada con ese filtro' : 'Todavía no reportaste nada'}
                </Text>
                <Text style={estilos.textoCentrado}>
                  {filtro
                    ? 'Probá con otro estado o mirá todos.'
                    : 'Cuando reportes un problema, lo vas a ver acá con su número de seguimiento.'}
                </Text>
              </View>
            }
          />
        </>
      )}
    </SafeAreaView>
  );
}

function Chip({
  texto,
  activo,
  color,
  alTocar,
}: {
  texto: string;
  activo: boolean;
  color: string;
  alTocar: () => void;
}) {
  return (
    <Pressable
      onPress={alTocar}
      role="button"
      accessibilityLabel={`Filtrar por ${texto}`}
      accessibilityState={{ selected: activo }}
      style={({ pressed }) => [
        estilos.chip,
        activo && { backgroundColor: color, borderColor: color },
        pressed && estilos.tocado,
      ]}
    >
      <Text style={[estilos.chipTexto, activo && estilos.chipTextoActivo]}>{texto}</Text>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  encabezado: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  titulo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  espaciador: {
    width: 26,
  },
  filtros: {
    flexGrow: 0,
    backgroundColor: '#FFFFFF',
  },
  filtrosContenido: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  chipTexto: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  chipTextoActivo: {
    color: '#FFFFFF',
  },
  lista: {
    padding: 16,
    flexGrow: 1,
  },
  centrado: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 10,
  },
  tituloVacio: {
    fontSize: 18,
    fontWeight: '700',
    color: '#334155',
    textAlign: 'center',
  },
  textoCentrado: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 21,
  },
  boton: {
    marginTop: 8,
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  textoBoton: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  tocado: {
    opacity: 0.6,
  },
  ofrecimiento: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 14,
    padding: 14,
    marginHorizontal: 16,
    marginTop: 4,
  },
  ofrecimientoTextos: {
    flex: 1,
    gap: 4,
  },
  ofrecimientoTitulo: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E40AF',
  },
  ofrecimientoTexto: {
    fontSize: 14,
    color: '#1E3A8A',
    lineHeight: 19,
  },
  ofrecimientoBotones: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  botonChico: {
    backgroundColor: '#2563EB',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  textoBotonChico: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  botonTexto: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  textoBotonTexto: {
    color: '#1E40AF',
    fontSize: 15,
    fontWeight: '600',
  },
});

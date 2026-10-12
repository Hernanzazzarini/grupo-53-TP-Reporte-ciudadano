import Ionicons from '@react-native-vector-icons/ionicons';
import { Redirect, useFocusEffect, useRouter } from 'expo-router';
import { ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TarjetaReporte } from '../componentes/TarjetaReporte';
import { bandeja, FiltrosBandeja, listarZonas } from '../servicios/cuadrillas';
import { obtenerTiposDeReporte } from '../servicios/reportes';
import { obtenerUsuarioActual } from '../servicios/usuarios';
import { Reporte, TipoDeReporte, Zona } from '../tipos';
import { COLORES_ESTADO, ETIQUETAS_ESTADO, ORDEN_ESTADOS } from '../utilidades/estados';

type EstadoPantalla =
  | { fase: 'cargando' }
  | { fase: 'listo'; reportes: Reporte[] }
  | { fase: 'error'; mensaje: string };

const GRIS = '#475569';

export default function PantallaBandeja() {
  const router = useRouter();

  const [pantalla, setPantalla] = useState<EstadoPantalla>({ fase: 'cargando' });
  const [categorias, setCategorias] = useState<TipoDeReporte[]>([]);
  const [zonas, setZonas] = useState<Zona[]>([]);
  const [filtros, setFiltros] = useState<FiltrosBandeja>({});
  const [buscando, setBuscando] = useState(false);
  const [recargando, setRecargando] = useState(false);

  // Si el operador toca varios filtros seguidos, solo vale la última respuesta.
  const ultimaBusqueda = useRef(0);

  const cargar = useCallback(async () => {
    const busqueda = ++ultimaBusqueda.current;
    setBuscando(true);
    try {
      const reportes = await bandeja(filtros);
      if (busqueda === ultimaBusqueda.current) setPantalla({ fase: 'listo', reportes });
    } catch (error) {
      if (busqueda !== ultimaBusqueda.current) return;
      setPantalla({
        fase: 'error',
        mensaje:
          error instanceof Error ? error.message : 'Algo salió mal. Intentá de nuevo.',
      });
    } finally {
      if (busqueda === ultimaBusqueda.current) setBuscando(false);
    }
  }, [filtros]);

  useEffect(() => {
    Promise.all([obtenerTiposDeReporte(), listarZonas()])
      .then(([tipos, listaDeZonas]) => {
        setCategorias(tipos);
        setZonas(listaDeZonas);
      })
      .catch(() => {});
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar]),
  );

  const alTirarParaRecargar = useCallback(async () => {
    setRecargando(true);
    await cargar();
    setRecargando(false);
  }, [cargar]);

  const usuario = obtenerUsuarioActual();
  if (!usuario) return <Redirect href="/login" />;
  if (usuario.rol !== 'operador') return <Redirect href="/" />;

  const reintentar = () => {
    setPantalla({ fase: 'cargando' });
    cargar();
  };

  const abrirReporte = (id: string) => {
    router.push({ pathname: '/gestionar-reclamo' as any, params: { id } });
  };

  const cambiarFiltro = <K extends keyof FiltrosBandeja>(
    clave: K,
    valor: FiltrosBandeja[K],
  ) => {
    setFiltros((actuales) => ({
      ...actuales,
      [clave]: actuales[clave] === valor ? undefined : valor,
    }));
  };

  const hayFiltros = Boolean(filtros.estado || filtros.tipoId || filtros.zonaId);

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
        <Text style={estilos.titulo}>Bandeja de reclamos</Text>
        <View style={estilos.espaciador} />
      </View>

      <View style={estilos.filtros}>
        <FilaDeFiltros titulo="Estado">
          <Chip
            texto="Todos"
            activo={!filtros.estado}
            color={GRIS}
            alTocar={() => cambiarFiltro('estado', undefined)}
          />
          {ORDEN_ESTADOS.map((estado) => (
            <Chip
              key={estado}
              texto={ETIQUETAS_ESTADO[estado]}
              activo={filtros.estado === estado}
              color={COLORES_ESTADO[estado]}
              alTocar={() => cambiarFiltro('estado', estado)}
            />
          ))}
        </FilaDeFiltros>

        <FilaDeFiltros titulo="Tipo">
          <Chip
            texto="Todos"
            activo={!filtros.tipoId}
            color={GRIS}
            alTocar={() => cambiarFiltro('tipoId', undefined)}
          />
          {categorias.map((tipo) => (
            <Chip
              key={tipo.id}
              texto={tipo.nombre}
              activo={filtros.tipoId === tipo.id}
              color={tipo.color}
              alTocar={() => cambiarFiltro('tipoId', tipo.id)}
            />
          ))}
        </FilaDeFiltros>

        <FilaDeFiltros titulo="Zona">
          <Chip
            texto="Todas"
            activo={!filtros.zonaId}
            color={GRIS}
            alTocar={() => cambiarFiltro('zonaId', undefined)}
          />
          {zonas.map((zona) => (
            <Chip
              key={zona.id}
              texto={zona.nombre}
              activo={filtros.zonaId === zona.id}
              color="#1E40AF"
              alTocar={() => cambiarFiltro('zonaId', zona.id)}
            />
          ))}
        </FilaDeFiltros>
      </View>

      {pantalla.fase === 'cargando' && (
        <View style={estilos.centrado}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={estilos.textoCentrado}>Buscando reclamos…</Text>
        </View>
      )}

      {pantalla.fase === 'error' && (
        <View style={estilos.centrado}>
          <Ionicons name="cloud-offline-outline" size={56} color="#94A3B8" />
          <Text style={estilos.tituloVacio}>No pudimos cargar la bandeja</Text>
          <Text style={estilos.textoCentrado}>{pantalla.mensaje}</Text>
          <Pressable
            onPress={reintentar}
            role="button"
            accessibilityLabel="Reintentar"
            style={({ pressed }) => [estilos.boton, pressed && estilos.tocado]}
          >
            <Text style={estilos.textoBoton}>Reintentar</Text>
          </Pressable>
        </View>
      )}

      {pantalla.fase === 'listo' && (
        <FlatList
          data={pantalla.reportes}
          keyExtractor={(reporte) => reporte.id}
          contentContainerStyle={estilos.lista}
          refreshControl={
            <RefreshControl refreshing={recargando} onRefresh={alTirarParaRecargar} />
          }
          ListHeaderComponent={
            pantalla.reportes.length > 0 ? (
              <View style={estilos.resumen}>
                <Text style={estilos.textoResumen}>
                  {pantalla.reportes.length === 1
                    ? '1 reclamo'
                    : `${pantalla.reportes.length} reclamos`}
                  {' · primero los que más vecinos apoyan'}
                </Text>
                {buscando && <ActivityIndicator size="small" color="#2563EB" />}
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <TarjetaReporte
              reporte={item}
              tipo={categorias.find((c) => c.id === item.tipoId)}
              alTocar={abrirReporte}
            />
          )}
          ListEmptyComponent={
            <View style={estilos.centrado}>
              <Ionicons name="file-tray-outline" size={56} color="#94A3B8" />
              <Text style={estilos.tituloVacio}>
                {hayFiltros ? 'Nada con esos filtros' : 'No hay reclamos'}
              </Text>
              {hayFiltros && (
                <Pressable
                  onPress={() => setFiltros({})}
                  role="button"
                  accessibilityLabel="Sacar todos los filtros"
                  style={({ pressed }) => [estilos.boton, pressed && estilos.tocado]}
                >
                  <Text style={estilos.textoBoton}>Ver todos</Text>
                </Pressable>
              )}
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

function FilaDeFiltros({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <View style={estilos.filaFiltros}>
      <Text style={estilos.tituloFiltro}>{titulo}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={estilos.chips}
      >
        {children}
      </ScrollView>
    </View>
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
    backgroundColor: '#FFFFFF',
    paddingBottom: 12,
    gap: 8,
  },
  filaFiltros: {
    gap: 4,
  },
  tituloFiltro: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
    paddingHorizontal: 16,
  },
  chips: {
    paddingHorizontal: 16,
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
  resumen: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  textoResumen: {
    fontSize: 14,
    color: '#64748B',
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
});

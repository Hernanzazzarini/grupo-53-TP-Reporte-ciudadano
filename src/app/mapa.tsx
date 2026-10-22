import { Coordenadas, Reporte, Pins, EstadoReporte } from '../tipos/index';
import { leerUbicacion } from '../lib/leer-ubicacion'
import { obtenerReportes } from '../servicios/mapa'
import { useEffect, useState } from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Ionicons from '@react-native-vector-icons/ionicons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker } from 'react-native-maps';

export default function Mapa() {
    const [ubicacion, setUbicacion] = useState<Coordenadas | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [reporte, setReporte] = useState<Reporte[] | null>(null);
    const [tipoSeleccionado, setTipoSeleccionado] = useState<string | null>(null);
    const [estadoSeleccionado, setEstadoSeleccionado] = useState<EstadoReporte | null>(null);

    useEffect(() => {
        async function cargarCoordenadas() {
            try {
                const result = await leerUbicacion();

                if (result !== null) {
                    setUbicacion(result);
                } else {
                    setError('No se pudo obtener la ubicación.');
                }
            } catch (e) {
                setError('Ocurrió un error al obtener la ubicación.');
            }
        }

        cargarCoordenadas();

        async function cargarReportes() {
            try {
                const reportes = await obtenerReportes();
                setReporte(reportes);
            } catch (e) {
                setError('No se pudieron cargar los reportes.');
            }
        }
        cargarReportes();
    }, []);

    const pins: Pins[] = (reporte ?? []).map(reporte => ({
        id: reporte.id,
        tipoId: reporte.tipoId,
        descripcion: reporte.descripcion ?? 'Sin descripción',
        coordenadas: {
            latitude: reporte.coordenadas.latitud,
            longitude: reporte.coordenadas.longitud,
        },
        estado: reporte.estado,
    }));
    const coloresPins: Record<EstadoReporte, { color: string; etiqueta: string }
    > = {
        recibido: { color: "#2196F3", etiqueta: "Recibido" },
        en_revision: { color: "#FFC107", etiqueta: "En revisión" },
        asignado: { color: "#9C27B0", etiqueta: "Asignado" },
        resuelto: { color: "#4CAF50", etiqueta: "Resuelto" },
        rechazado: { color: "#F44336", etiqueta: "Rechazado" },
    };

    const reportesFiltrados = (reporte ?? []).filter(item => {
        const coincideTipo =
            tipoSeleccionado === null ||
            item.tipoId === tipoSeleccionado;

        const coincideEstado =
            estadoSeleccionado === null ||
            item.estado === estadoSeleccionado;

        return coincideTipo && coincideEstado;
    });

    return (
        <SafeAreaView style={estilos.pantalla} edges={['top']}>
            <View style={estilos.encabezado}>
                <Pressable
                    onPress={() => router.replace('/')}
                    hitSlop={16}
                    role="button"
                    accessibilityLabel="Volver al inicio"
                    accessibilityHint="Regresa a la pantalla inicial"
                    style={({ pressed }) =>
                        pressed ? estilos.tocado : undefined
                    }
                >
                    <Ionicons
                        name="arrow-back"
                        size={26}
                        color="#FFFFFF"
                    />
                </Pressable>

                <Text style={estilos.titulo}>
                    Mapa de reclamos
                </Text>

                <View style={estilos.espaciador} />
            </View>

            <View style={estilos.contenido}>
                {<MapView
                    style={estilos.mapa}
                    initialRegion={{
                        latitude: ubicacion?.latitud ?? -33.0046,
                        longitude: ubicacion?.longitud ?? -58.5249,
                        latitudeDelta: 0.03,
                        longitudeDelta: 0.03,
                    }}
                    showsUserLocation={ubicacion !== null}
                    showsMyLocationButton={ubicacion !== null}
                >
                    {reportesFiltrados.map(item => (
                        <Marker
                            key={item.id}
                            coordinate={{
                                latitude: item.coordenadas.latitud,
                                longitude: item.coordenadas.longitud,
                            }}
                            title={coloresPins[item.estado].etiqueta}
                            description={item.descripcion ?? 'Sin descripción'}
                            pinColor={coloresPins[item.estado].color}
                        />
                    ))}

                </MapView>
                }
                <View style={estilos.filtros}>
                    <View style={estilos.filtro}>
                        <Text style={estilos.etiquetaFiltro}>
                            Tipo de problema
                        </Text>

                        <Picker
                            selectedValue={tipoSeleccionado}
                            onValueChange={(valor) =>
                                setTipoSeleccionado(valor)
                            }
                        >
                            <Picker.Item
                                label="Todos los tipos"
                                value={null}
                            />

                            <Picker.Item label="Rotura" value="tip-bache" />
                            <Picker.Item label="Vereda" value="tip-vereda" />
                            <Picker.Item label="Luz" value="tip-luz" />
                            <Picker.Item label="Limpieza" value="tip-basura" />
                            <Picker.Item label="Semaforo" value="tip-semaforo" />
                            <Picker.Item label="Arbolado" value="tip-arbol" />
                            <Picker.Item label="Otro" value="tip-otro" />
                        </Picker>
                    </View>

                    <View style={estilos.filtro}>
                        <Text style={estilos.etiquetaFiltro}>
                            Estado del reclamo
                        </Text>

                        <Picker
                            selectedValue={estadoSeleccionado}
                            onValueChange={(valor) =>
                                setEstadoSeleccionado(valor)
                            }
                        >
                            <Picker.Item label="Todos los estados" value={null} />
                            <Picker.Item label="Recibido" value="recibido" />
                            <Picker.Item label="En revisión" value="en_revision" />
                            <Picker.Item label="Asignado" value="asignado" />
                            <Picker.Item label="Resuelto" value="resuelto" />
                            <Picker.Item label="Rechazado" value="rechazado" />
                        </Picker>
                    </View>

                </View>
            </View>
        </SafeAreaView>
    );
}

const estilos = StyleSheet.create({
    pantalla: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    encabezado: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#2563EB',
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    titulo: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: '600',
    },
    espaciador: {
        width: 26,
    },
    contenido: {
        flex: 1,
    },
    mapa: {
        flex: 1,
    },
    mensaje: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        gap: 10,
    },
    textoMensaje: {
        fontSize: 16,
        color: '#334155',
        textAlign: 'center',
    },
    tocado: {
        opacity: 0.6,
    },
    filtros: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 12,
        paddingVertical: 8,
        gap: 8,
    },

    filtro: {
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 10,
        paddingHorizontal: 8,
    },

    etiquetaFiltro: {
        fontSize: 13,
        fontWeight: '600',
        color: '#374151',
        marginTop: 8,
    },
});


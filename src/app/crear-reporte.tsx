import { Coordenadas, Reporte,ReporteDatos } from '@/tipos';
import Ionicons from '@react-native-vector-icons/ionicons';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { GrabadorDeAudio } from '../componentes/GrabadorDeAudio';
import { geocodificarDireccion, leerUbicacion, obtenerDireccion } from '../lib/leer-ubicacion';
import { adherirAReporte } from '../servicios/adhesiones';
import {
    enviarReporte,
    obtenerReportesCercanos,
} from '../servicios/reportes';
import { obtenerUsuarioActual } from '../servicios/usuarios';
import * as Network from 'expo-network';

import {
    guardarReportePendiente,
    escucharConexion,
    sincronizarReportesPendientes,
} from '../lib/cola-reportes';

export default function PantallaCatalogo() {
    const [coordenadas, setCoordenadas] = useState<Coordenadas>({ latitud: -33.0077777, longitud: -58.5142, });
    const [direccion, setDireccion] = useState<string>("Rocamora 1240, Gualeguaychu");
    const [reportesCercanos, setReportesCercanos] = useState<Reporte[]>([]);
    const [buscandoCercanos, setBuscandoCercanos] = useState(false);
    const [mostrarCercanos, setMostrarCercanos] = useState(false);
    const [ubicacionManual, setUbicacionManual] = useState(false);
    const mapaRef = useRef<MapView>(null);
    const actualizandoDesdeMapa = useRef(false);
    const ultimaBusqueda = useRef(0);
    const usuario = obtenerUsuarioActual();
    const scrollRef = useRef<ScrollView>(null);

    const obtenerUbicacion = async () => {
        const nuevaUbicacion = await leerUbicacion();

        if (nuevaUbicacion) {
            setCoordenadas(nuevaUbicacion);

            const nuevaDireccion = await obtenerDireccion(nuevaUbicacion);
            setDireccion(nuevaDireccion ?? 'Dirección no disponible');
        } else {
            setUbicacionManual(true);
            Alert.alert(
                'Ubicación no disponible',
                'Podés seleccionar manualmente el lugar del problema en el mapa.'
            );
        }
    };

    useEffect(() => {
        obtenerUbicacion();
    }, []);
    
    useEffect(() => {
    //Intenta sincronizar los reportes pendientes al abrir la pantalla
    void sincronizarReportesPendientes();

    //Escucha cuando vuelve la conexiòn
    const suscripcion = escucharConexion();

    return () => {
        suscripcion.remove();
    };
}, []);

    useEffect(() => {
        if (actualizandoDesdeMapa.current) {
            actualizandoDesdeMapa.current = false;
            return;
        }

        const direccionBuscada = direccion.trim();

        if (direccionBuscada.length < 5) {
            return;
        }

        const temporizador = setTimeout(async () => {
            const idBusqueda = ++ultimaBusqueda.current;

            const nuevasCoordenadas =
                await geocodificarDireccion(direccionBuscada);

            // Evita actualizar el mapa con resultados anteriores.
            if (idBusqueda !== ultimaBusqueda.current) {
                return;
            }

            if (nuevasCoordenadas) {
                setCoordenadas(nuevasCoordenadas);

                mapaRef.current?.animateToRegion({
                    latitude: nuevasCoordenadas.latitud,
                    longitude: nuevasCoordenadas.longitud,
                    latitudeDelta: 0.005,
                    longitudeDelta: 0.005,
                }, 800);
            }
        }, 800);

        return () => clearTimeout(temporizador);

    }, [direccion]);


    const { tipoId } = useLocalSearchParams<{ tipoId: string }>();
    const router = useRouter();

    const [foto, setFoto] = useState<string | null>(null);
    const [descripcion, setDescripcion] = useState('');
    const [audio, setAudio] = useState<string | null>(null);
    const [enviando, setEnviando] = useState(false);
    const tomarFoto = async () => {
        const permiso = await ImagePicker.requestCameraPermissionsAsync();
        if (!permiso.granted) {
            Alert.alert('Permiso requerido', 'Se necesita acceso a la camara para sacar la foto.');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: false,
            quality: 0.7,
        })
        if (!result.canceled) {
            setFoto(result.assets[0].uri);
        }
    }


    const buscarCercanos = async () => {
        setBuscandoCercanos(true);

        try {
            const encontrados = await obtenerReportesCercanos(coordenadas);

            if (encontrados.length > 0) {
                setReportesCercanos(encontrados);
                setMostrarCercanos(true);
                setTimeout(() => {
                    scrollRef.current?.scrollToEnd({
                        animated: true,
                    });
                }, 500);
            } else {
                setMostrarCercanos(false);
                await crearReporte();
            }
        } catch (error: any) {
            console.log('Error al crear reporte:', error.response?.data || error);

            Alert.alert(
                'Error al enviar reporte',
                error.response?.data?.mensaje ||
                error.message ||
                'No se pudo enviar el reporte.'
            );

        } finally {
            setBuscandoCercanos(false);
        }
    };

    
const crearReporte = async () => {
    if (!foto) {
        Alert.alert('Foto obligatoria', 'Sacá una foto antes de continuar.');
        return;
    }

    setEnviando(true);

    const datosReporte: ReporteDatos = {
        tipoId: tipoId || 'tip-otro',
        descripcion: descripcion || null,
        audioUrl: null,
        audioLocal: audio,
        fotosLocales: [foto!],
        coordenadas,
        direccion,
    };

    try {
        const red = await Network.getNetworkStateAsync();

        if (!red.isConnected || red.isInternetReachable === false) {
            await guardarReportePendiente(datosReporte);
            Alert.alert('Reporte guardado', 'Se enviará cuando vuelva la conexión.');
            return;
        }

        const respuesta = await enviarReporte(datosReporte);

        console.log('Respuesta del servidor:', respuesta);

        Alert.alert(
            '¡Reporte creado!',
            `Número de seguimiento: ${respuesta.datos.codigo}`,
            [{ text: 'Aceptar', onPress: () => router.replace('/') }]
        );

    } catch (error: any) {
        console.log('ERROR COMPLETO:', error);
        console.log('ERROR DEL SERVIDOR:', error.response?.data);

        const red = await Network.getNetworkStateAsync();

        if (!red.isConnected || red.isInternetReachable === false) {
            await guardarReportePendiente(datosReporte);

            Alert.alert(
                'Reporte guardado',
                'Se enviará cuando vuelva la conexión.'
            );
            return;
        }

        Alert.alert(
            'Error al enviar reporte',
            error.response?.data?.mensaje ||
            error.message ||
            'No se pudo enviar el reporte.'
        );

    } finally {
        setEnviando(false);
    }
};


    return (
        <ScrollView ref={scrollRef}
            style={styles.container}
            contentContainerStyle={styles.contenidoScroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <Pressable
                onPress={() => router.replace('/')}
                hitSlop={16}
                accessibilityRole="button"
                accessibilityLabel="Volver al inicio"
                style={styles.botonVolver}
            >
                <Ionicons
                    name="arrow-back"
                    size={28}
                    color="#0c0e7f"
                />
            </Pressable>
            <Text style={styles.titulo} >Nuevo Reporte</Text>
            <Text style={styles.label} >Foto del problema (Obligatoria) </Text>
            {foto ? (
                <View style={styles.contenedorFoto}>
                    <Image source={{ uri: foto }} style={styles.imagen} />
                    <TouchableOpacity style={styles.botonCambiar} onPress={tomarFoto}>
                        <Text style={styles.textoBotonSecundario}>Cambiar foto</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <TouchableOpacity style={styles.botonFoto} onPress={tomarFoto}>
                    <Ionicons name="camera-outline" size={40} color="#0284C7" />
                    <Text style={styles.textoBotonFoto}> Tomar Foto</Text>
                </TouchableOpacity>
            )}
            <Text style={styles.label}>Descripcion / Observaciones</Text>
            <TextInput
                style={styles.input}
                placeholder="Contanos que pasa..."
                multiline
                numberOfLines={4}
                value={descripcion}
                onChangeText={setDescripcion}
            />
            <Text style={styles.label}>Nota de voz (opcional)</Text>
            <GrabadorDeAudio uri={audio} onCambio={setAudio} />
            <Text style={styles.label}>Ubicacion</Text>
            <View style={styles.boxUbicacion}>
                <Ionicons name="location-outline" size={24} color="#DC2626" />
                <TextInput
                    style={styles.inputUbicacion}
                    placeholder="Escribí la dirección del problema..."
                    value={direccion}
                    onChangeText={setDireccion}
                    placeholderTextColor="#9CA3AF"
                />

            </View>
            <Text style={styles.textoAyuda}>
                Podés escribir la dirección o seleccionarla directamente en el mapa.
            </Text>

            <MapView
                ref={mapaRef}
                style={{ width: '100%', height: 280, borderRadius: 12 }}
                initialRegion={{
                    latitude: coordenadas.latitud,
                    longitude: coordenadas.longitud,
                    latitudeDelta: 0.005,
                    longitudeDelta: 0.005,
                }}
                onPress={async (event) => {
                    const punto = {
                        latitud: event.nativeEvent.coordinate.latitude,
                        longitud: event.nativeEvent.coordinate.longitude,
                    };

                    setCoordenadas(punto);

                    const nuevaDireccion = await obtenerDireccion(punto);
                    if (nuevaDireccion) {
                        actualizandoDesdeMapa.current = true;
                        ultimaBusqueda.current++;
                        setDireccion(nuevaDireccion);
                    }
                }}
            >
                <Marker
                    coordinate={{
                        latitude: coordenadas.latitud,
                        longitude: coordenadas.longitud,
                    }}
                    draggable={true}
                    onDragEnd={async (event) => {
                        const punto = {
                            latitud: event.nativeEvent.coordinate.latitude,
                            longitud: event.nativeEvent.coordinate.longitude,
                        };

                        setCoordenadas(punto);

                        const nuevaDireccion = await obtenerDireccion(punto);
                        if (nuevaDireccion) {
                            actualizandoDesdeMapa.current = true;
                            ultimaBusqueda.current++;
                            setDireccion(nuevaDireccion);
                        }
                    }}
                />
            </MapView>


            {mostrarCercanos && (
                <View style={styles.seccionCercanos}>
                    <Text style={styles.titulo}>
                        ¿Ya existe este problema?
                    </Text>

                    <Text style={styles.textoUbicacion}>
                        Encontramos reportes a menos de 50 metros.
                        ¿Es alguno de estos?
                    </Text>

                    {reportesCercanos.map((item) => (
                        <View key={item.id} style={styles.tarjetaReporte}>
                            <Text style={styles.nombreReporte}>
                                {item.direccion}
                            </Text>

                            <Text>
                                {item.descripcion ?? 'Sin descripción'}
                            </Text>

                            <Text>
                                Estado: {item.estado}
                            </Text>

                            {item.autorId === usuario?.id ? (
                                <Text style={styles.textoBotonSecundario}>
                                    Ya sos el autor de este reclamo
                                </Text>
                            ) : (
                                <TouchableOpacity
                                    style={styles.botonEnviar}
                                    disabled={enviando}
                                    onPress={() => adherirAReporte(item.id)}
                                >
                                    <Text style={styles.textoBotonEnviar}>
                                        Sumarme a este reclamo
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    ))}

                    <TouchableOpacity
                        onPress={() => {
                            setMostrarCercanos(false);
                            crearReporte();
                        }}
                        disabled={enviando}
                        activeOpacity={0.7}
                        style={[
                            styles.botonNuevoReporte,
                            enviando && styles.botonDesactivado,
                        ]}
                    >
                        <Ionicons
                            name="add-circle-outline"
                            size={21}
                            color="#0284C7"
                            style={{ marginRight: 8 }}
                        />

                        <Text style={styles.textoBotonSecundario}>
                            No es el mismo problema. Crear uno nuevo.
                        </Text>
                    </TouchableOpacity>
                </View>
            )}



            {!mostrarCercanos && (
                <TouchableOpacity
                    style={styles.botonEnviar}
                    onPress={async () => {
    const red = await Network.getNetworkStateAsync();

    if (!red.isConnected || red.isInternetReachable === false) {
        await crearReporte();
    } else {
        await buscarCercanos();
    }
}}
                    disabled={enviando || buscandoCercanos}
                >
                    <Text style={styles.textoBotonEnviar}>
                        {buscandoCercanos ? 'Buscando...' : 'Continuar'}
                    </Text>
                </TouchableOpacity>
            )}
        </ScrollView>
    )
}

const styles = StyleSheet.create({

    container: { flex: 1, backgroundColor: '#FFFFFF', padding: 20, paddingTop: 40 },
    titulo: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#111827' },
    label: { fontSize: 16, fontWeight: '600', color: '#374151', marginTop: 15, marginBottom: 8 },
    botonFoto: {
        height: 140,
        borderWidth: 2,
        borderColor: '#0284C7',
        borderStyle: 'dashed',
        borderRadius: 12,
        justifyContent: 'center',
        backgroundColor: '#F0F9FF',
    },
    textoBotonFoto: { color: '#0284C7', fontWeight: 'bold', marginTop: 8 },
    contenedorFoto: { alignItems: 'center' },
    imagen: { width: '100%', height: 200, borderRadius: 12 },
    botonCambiar: { marginTop: 8, padding: 8 },
    textoBotonSecundario: { color: '#0284C7', fontWeight: '600' },
    boxUbicacion: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#F3F4F6',
        borderRadius: 8,
    },
    textoUbicacion: { marginLeft: 8, fontSize: 15, color: '#1F2937' },
    input: {
        borderWidth: 1,
        borderColor: '#D1D5D8',
        borderRadius: 8,
        padding: 12,
        textAlignVertical: 'top',
        fontSize: 15,

    },
    inputUbicacion: {
        flex: 1,
        marginLeft: 8,
        fontSize: 15,
        color: '#1F2937',
        paddingVertical: 8,
    },

    textoAyuda: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 6,
    },
    botonEnviar: {
        backgroundColor: '#16A34A',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 30,
        marginBottom: 50,
    },
    botonNuevoReporte: {
        width: '100%',
        minHeight: 58,
        marginTop: 20,
        marginBottom: 15,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderWidth: 1.5,
        borderColor: '#0284C7',
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },

    textoBotonNuevoReporte: {
        color: '#0284C7',
        fontSize: 15,
        fontWeight: '700',
        textAlign: 'center',
    },
    botonVolver: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'flex-start',
        marginBottom: 10,
        zIndex: 10,
    },
    botonDesactivado: { opacity: 0.6 },
    textoBotonEnviar: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 18 },
    seccionCercanos: {
        marginTop: 20,
        padding: 12,
        backgroundColor: '#EFF6FF',
        borderRadius: 12,
    },
    tarjetaReporte: {
        backgroundColor: '#FFFFFF',
        padding: 14,
        borderRadius: 10,
        marginTop: 12,
        borderWidth: 1,
        borderColor: '#BFDBFE',
    },
    nombreReporte: {
        fontWeight: 'bold',
        fontSize: 16,
        marginBottom: 6,
    },
    contenidoScroll: {
        flexGrow: 1,
        paddingBottom: 60,
    },

});



import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import MapView, {
    Marker,
    PROVIDER_GOOGLE,
    Region,
} from 'react-native-maps';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';

import { obtenerReportesCercanos } from '../servicios/mapa';
import { obtenerTiposDeReporte } from '../servicios/reportes';
import { Coordenadas, Reporte, TipoDeReporte } from '../tipos';

export default function MapaScreen() {
    const router = useRouter();

    const [ubicacion, setUbicacion] = useState<Coordenadas | null>(null);
    const [reportes, setReportes] = useState<Reporte[]>([]);
    const [tipos, setTipos] = useState<TipoDeReporte[]>([]);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        cargarMapa();
    }, []);

    const cargarMapa = async () => {
        try {
            setCargando(true);

            const { status } =
                await Location.requestForegroundPermissionsAsync();

            if (status !== 'granted') {
                Alert.alert(
                    'Permiso de ubicación',
                    'Necesitamos acceder a tu ubicación para mostrar los reclamos cercanos.'
                );

                setCargando(false);
                return;
            }

            const posicion =
                await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Balanced,
                });

            const coordenadas: Coordenadas = {
                latitud: posicion.coords.latitude,
                longitud: posicion.coords.longitude,
            };

            setUbicacion(coordenadas);

            const [reportesObtenidos, tiposObtenidos] =
                await Promise.all([
                    obtenerReportesCercanos(coordenadas),
                    obtenerTiposDeReporte(),
                ]);

            setReportes(reportesObtenidos);
            setTipos(tiposObtenidos);
        } catch (error) {
            console.error('Error cargando mapa:', error);

            Alert.alert(
                'Error',
                'No pudimos obtener tu ubicación.'
            );
        } finally {
            setCargando(false);
        }
    };

    const obtenerColorTipo = (tipoId: string) => {
        const tipo = tipos.find((item) => item.id === tipoId);

        return tipo?.color ?? '#2563EB';
    };

    const obtenerNombreTipo = (tipoId: string) => {
        const tipo = tipos.find((item) => item.id === tipoId);

        return tipo?.nombre ?? 'Reporte';
    };

    if (cargando) {
        return (
            <View style={styles.cargando}>
                <ActivityIndicator
                    size="large"
                    color="#2563EB"
                />

                <Text style={styles.textoCargando}>
                    Obteniendo ubicación...
                </Text>
            </View>
        );
    }

    if (!ubicacion) {
        return (
            <View style={styles.error}>
                <TouchableOpacity
                    style={styles.botonVolver}
                    onPress={() => router.replace('/')}
                >
                    <Text style={styles.textoBoton}>
                        ← Volver al inicio
                    </Text>
                </TouchableOpacity>

                <Text style={styles.errorTitulo}>
                    No pudimos obtener tu ubicación
                </Text>

                <Text style={styles.errorTexto}>
                    Verifica que el permiso de ubicación esté habilitado
                    para la aplicación.
                </Text>
            </View>
        );
    }

    const region: Region = {
        latitude: ubicacion.latitud,
        longitude: ubicacion.longitud,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
    };

    return (
        <View style={styles.container}>
            <MapView
                style={styles.mapa}
                provider={PROVIDER_GOOGLE}
                initialRegion={region}
                showsUserLocation
                showsMyLocationButton
                showsCompass
            >
                {reportes.map((reporte) => (
                    <Marker
                        key={reporte.id}
                        coordinate={{
                            latitude: reporte.coordenadas.latitud,
                            longitude: reporte.coordenadas.longitud,
                        }}
                        pinColor={obtenerColorTipo(reporte.tipoId)}
                        title={obtenerNombreTipo(reporte.tipoId)}
                        description={`${reporte.descripcion ?? ''}\n${reporte.direccion}`}
                    />
                ))}
            </MapView>

            <TouchableOpacity
                style={styles.botonVolverMapa}
                onPress={() => router.replace('/')}
            >
                <Text style={styles.textoBotonMapa}>
                    ← Inicio
                </Text>
            </TouchableOpacity>

            <View style={styles.encabezado}>
                <Text style={styles.titulo}>
                    Reclamos cercanos
                </Text>

                <Text style={styles.subtitulo}>
                    {reportes.length} reportes encontrados
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },

    mapa: {
        flex: 1,
    },

    cargando: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
    },

    textoCargando: {
        marginTop: 12,
        fontSize: 16,
        color: '#374151',
    },

    error: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
        backgroundColor: '#FFFFFF',
    },

    errorTitulo: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111827',
        textAlign: 'center',
        marginBottom: 8,
    },

    errorTexto: {
        fontSize: 15,
        color: '#6B7280',
        textAlign: 'center',
    },

    botonVolver: {
        backgroundColor: '#2563EB',
        paddingHorizontal: 18,
        paddingVertical: 12,
        borderRadius: 10,
        marginBottom: 30,
    },

    textoBoton: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '600',
    },

    botonVolverMapa: {
        position: 'absolute',
        top: 75,
        left: 16,
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 10,
        elevation: 5,
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 5,
        shadowOffset: {
            width: 0,
            height: 2,
        },
    },

    textoBotonMapa: {
        color: '#2563EB',
        fontSize: 15,
        fontWeight: '600',
    },

    encabezado: {
        position: 'absolute',
        top: 16,
        left: 16,
        right: 16,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        elevation: 5,
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 5,
        shadowOffset: {
            width: 0,
            height: 2,
        },
    },

    titulo: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
    },

    subtitulo: {
        marginTop: 2,
        fontSize: 13,
        color: '#6B7280',
    },
});

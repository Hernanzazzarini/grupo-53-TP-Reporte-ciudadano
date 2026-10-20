import { obtenerTiposDeReporte } from '../servicios/reportes';
import { Coordenadas, Reporte, TipoDeReporte } from '../tipos/index';
import { captureReadingCoordenadas } from '../lib/leer-ubicacion'
import { useEffect } from 'react';
import MapView, { Marker, Circle } from 'react-native-maps';

import { View, Text, StyleSheet } from 'react-native';

export default function Mapa() {
    const coordenadas = {
        latitude: -31.7333,
        longitude: -60.5297,
    };
    return (
        <View style={styles.container}>
            <MapView
                style={{ flex: 1 }}
                initialRegion={{
                    latitude: -31.7333, longitude: -60.5297,
                    latitudeDelta: 0.05, longitudeDelta: 0.05,
                }}>
                <Marker
                    coordinate={{ latitude: -31.7333, longitude: -60.5297 }}
                    title="FCAD" description="Facultad de Ciencias de la Administración"
                />
                <Circle
                    center={{ latitude: -31.7333, longitude: -60.5297 }}
                    radius={500}
                />
            </MapView>
        </View>
    );
}


// useEffect(() => {
//     let suscripcion: Location.LocationSubscription;
//     (async () => {
//         const { status } = await Location.requestForegroundPermissionsAsync();
//         if (status !== 'granted') return;
//         suscripcion = await Location.watchPositionAsync(
//             { accuracy: Location.Accuracy.High, distanceInterval: 10 }, // metros
//             (posicion) => setCoords(posicion.coords),
//         );
//     })();
//     return () => suscripcion?.remove(); // ← sin esto el GPS sigue prendido
// }, [])


const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    mapa: {
        width: '100%',
        height: '100%',
    },
});
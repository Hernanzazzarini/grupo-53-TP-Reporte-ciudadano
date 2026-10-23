import * as Location from 'expo-location';
import type { LocationObject } from 'expo-location';
import type { Coordenadas } from '@/tipos';

export async function leerUbicacion(): Promise<Coordenadas | null> {
    try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        console.log('Estado del permiso:', status);
        if (status !== 'granted') {
            return null;
        }
        // const enabled = await Location.hasServicesEnabledAsync();
        const position: LocationObject = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
        })
        return {
            latitud: position.coords.latitude,
            longitud: position.coords.longitude,
        }
    } catch (error) {
        console.error('Error al obtener la ubicación:', error);
        return null;
    }
}


export async function obtenerDireccion(
    coordenadas: Coordenadas
): Promise<string | null> {
    try {
        const resultado = await Location.reverseGeocodeAsync({
            latitude: coordenadas.latitud,
            longitude: coordenadas.longitud,
        });

        if (resultado.length === 0) {
            return null;
        }

        const lugar = resultado[0];

        return [
            lugar.street,
            lugar.streetNumber,
            lugar.city,
            lugar.region,

            lugar.postalCode,
            lugar.country,
        ]
            .filter(Boolean)
            .join(', ');
    } catch (error) {
        console.error('Error al obtener la dirección:', error);
        return null;
    }
}
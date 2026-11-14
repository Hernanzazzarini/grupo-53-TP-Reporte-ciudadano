import type { Coordenadas } from '@/tipos';
import type { LocationObject } from 'expo-location';
import * as Location from 'expo-location';

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

export async function geocodificarDireccion(
    direccion: string
): Promise<Coordenadas | null> {
    try {
        if (!direccion.trim()) {
            return null;
        }

        const resultado = await Location.geocodeAsync(direccion);

        if (resultado.length === 0) {
            return null;
        }

        return {
            latitud: resultado[0].latitude,
            longitud: resultado[0].longitude,
        };
    } catch (error) {
        console.error('Error al buscar la dirección:', error);
        return null;
    }
}
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
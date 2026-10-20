import * as Location from 'expo-location';
import type { LocationObject } from 'expo-location';
import type { Coordenadas } from '@/tipos';

export async function captureReadingCoordenadas():Promise<Coordenadas | null>{
    try {
        const { status } = await Location.requestForegroundPermissionsAsync();
    if (status!=='granted') return null;
    const position:LocationObject = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
    })
    return {
        latitud: position.coords.latitude,
        longitud: position.coords.longitude,
    }
    } catch {
        return null
    }
}
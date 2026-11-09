import type { Coordenadas } from "@/tipos";

function calcularDistancia(
    origen: Coordenadas,
    destino: Coordenadas
): number {
    const R = 6371000;
    const rad = (grados: number) => grados * Math.PI / 180;

    const dLat = rad(destino.latitud - origen.latitud);
    const dLon = rad(destino.longitud - origen.longitud);

    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(rad(origen.latitud)) *
        Math.cos(rad(destino.latitud)) *
        Math.sin(dLon / 2) ** 2;

    return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}
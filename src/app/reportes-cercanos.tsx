import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { leerUbicacion, obtenerDireccion } from "../lib/leer-ubicacion";
import {
  adherirAReporte,
  obtenerReportesCercanos,
} from "../servicios/adhesiones";
import { Coordenadas, Reporte } from "../tipos/index";

export default function ReportesCercanosScreen() {
  const [cargando, setCargando] = useState(true);
  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [recargando, setRecargando] = useState(false);
  const [coordenadas, setCoordenadas] = useState<Coordenadas | null>(null);
  const [direccion, setDireccion] = useState("");
  const [error, setError] = useState<string | null>(null);

  const cargarDatos = useCallback(async (esRecarga = false) => {
    if (esRecarga) setRecargando(true);
    else setCargando(true);

    setError(null);

    try {
      const nuevaUbicacion = await leerUbicacion();

      if (!nuevaUbicacion) {
        setError(
          "No pudimos obtener tu ubicación. Verificá que tengas activado el GPS y los permisos de ubicación.",
        );
        setReportes([]);
        return;
      }
      setCoordenadas(nuevaUbicacion);

      const nuevaDireccion = await obtenerDireccion(nuevaUbicacion);
      setDireccion(nuevaDireccion ?? "Dirección no disponible");

      const cercanos = await obtenerReportesCercanos(
        nuevaUbicacion.latitud,
        nuevaUbicacion.longitud,
        50,
      );

      setReportes(cercanos);
    } catch (error: any) {
      console.error(error);

      setError(
        error.message ||
          "No pudimos conectar con el servidor. Revisá tu conexión a internet.",
      );
    } finally {
      setCargando(false);
      setRecargando(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const manejarAdhesion = async (reporteId: string) => {
    try {
      await adherirAReporte(reporteId);
      Alert.alert("¡Listo!", "Te sumaste al reclamo exitosamente.");
      cargarDatos(true);
    } catch (error: any) {
      Alert.alert("Atención", error.message);
    }
  };

  if (cargando) {
    return (
      <View style={styles.centrado}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.textoCarga}>Buscando problemas cerca tuyo...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centrado}>
        <Text style={styles.textoError}>{error}</Text>
        <TouchableOpacity
          style={styles.botonReintentar}
          onPress={() => cargarDatos()}
        >
          <Text style={styles.textoBoton}>REINTENTAR</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.botonVolver}
          onPress={() => router.back()}
        >
          <Text style={styles.textoBotonVolver}>Volver al inicio</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.encabezado}>
        <View style={styles.filaTitulo}>
          <Text style={styles.titulo}>Problemas cerca tuyo</Text>
          {recargando && <ActivityIndicator size="small" color="#2563EB" />}
        </View>

        <View style={styles.tarjetaUbicacion}>
          <Text style={styles.iconoUbicacion}>📍</Text>
          <View style={styles.contenidoUbicacion}>
            <Text style={styles.etiquetaUbicacion}>TU UBICACIÓN ACTUAL</Text>
            <Text style={styles.textoUbicacion}>
              {direccion || "Obteniendo ubicación..."}
            </Text>
          </View>
        </View>
      </View>

      {reportes.length === 0 ? (
        <Text style={styles.textoVacio}>
          No hay reportes a menos de 50 metros. ¡Podés crear uno nuevo!
        </Text>
      ) : (
        <FlatList
          data={reportes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 20 }}
          renderItem={({ item }) => (
            <View style={styles.tarjeta}>
              <Text style={styles.tipoReporte}>
                {item.tipoId.replace("tip-", "").toUpperCase()}
              </Text>
              <Text style={styles.direccion}>{item.direccion}</Text>
              <Text style={styles.descripcion}>
                {item.descripcion || "Sin descripción"}
              </Text>

              <Text style={styles.adhesiones}>
                👥 {item.adhesiones} vecinos ya se sumaron
              </Text>

              <TouchableOpacity
                style={styles.botonSumarse}
                onPress={() => manejarAdhesion(item.id)}
              >
                <Text style={styles.textoBoton}>SUMARME A ESTE RECLAMO</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      <TouchableOpacity
        style={styles.botonVolver}
        onPress={() => router.back()}
      >
        <Text style={styles.textoBotonVolver}>Volver al inicio</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#F3F4F6" },
  centrado: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    padding: 20,
  },
  textoCarga: { marginTop: 10, fontSize: 18, color: "#64748B" },
  textoError: {
    fontSize: 18,
    color: "#EF4444",
    textAlign: "center",
    marginBottom: 20,
    fontWeight: "bold",
  },
  botonReintentar: {
    backgroundColor: "#2563EB",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    width: "100%",
  },
  encabezado: {
    flexDirection: "column",
    alignItems: "stretch",
    marginBottom: 20,
    marginTop: 40,
  },
  titulo: { fontSize: 24, fontWeight: "bold", color: "#1F2937" },
  textoVacio: {
    fontSize: 24,
    textAlign: "center",
    fontWeight: "bold",
    marginTop: 20,
    color: "#64748B",
  },
  tarjeta: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tipoReporte: { fontSize: 14, fontWeight: "bold", color: "#2563EB" },
  direccion: {
    fontSize: 20,
    fontWeight: "bold",
    marginVertical: 4,
    color: "#1F2937",
  },
  descripcion: { fontSize: 16, color: "#4B5563", marginBottom: 8 },
  adhesiones: {
    fontSize: 16,
    color: "#2563EB",
    fontWeight: "600",
    marginBottom: 12,
  },
  botonSumarse: {
    backgroundColor: "#2563EB",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  textoBoton: { color: "white", fontSize: 16, fontWeight: "bold" },
  botonVolver: { marginTop: 10, padding: 12, alignItems: "center" },
  textoBotonVolver: {
    fontSize: 16,
    color: "#64748B",
    fontWeight: "600",
  },
  filaTitulo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  tarjetaUbicacion: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  iconoUbicacion: {
    fontSize: 24,
    marginRight: 12,
  },
  contenidoUbicacion: {
    flex: 1,
  },
  etiquetaUbicacion: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#2563EB",
    marginBottom: 4,
    letterSpacing: 0.8,
  },
  textoUbicacion: {
    fontSize: 14,
    color: "#475569",
    fontWeight: "500",
  },
});

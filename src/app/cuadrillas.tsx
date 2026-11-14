import Ionicons from '@react-native-vector-icons/ionicons';
import { Redirect, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { listarCuadrillas, listarZonas } from '../servicios/cuadrillas';
import { obtenerUsuarioActual } from '../servicios/usuarios';
import { Cuadrilla, Zona } from '../tipos';

type EstadoPantalla =
  | { fase: 'cargando' }
  | { fase: 'listo'; cuadrillas: Cuadrilla[]; zonas: Zona[] }
  | { fase: 'error'; mensaje: string };

export default function PantallaCuadrillas() {
  const router = useRouter();

  const usuario = obtenerUsuarioActual();

  const [pantalla, setPantalla] = useState<EstadoPantalla>({ fase: 'cargando' });

  const cargar = useCallback(async () => {
    try {
      const [cuadrillas, zonas] = await Promise.all([listarCuadrillas(), listarZonas()]);
      setPantalla({ fase: 'listo', cuadrillas, zonas });
    } catch (error) {
      setPantalla({
        fase: 'error',
        mensaje: error instanceof Error ? error.message : 'Algo salió mal. Intentá de nuevo.',
      });
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar]),
  );

  if (!usuario) return <Redirect href="/login" />;
  if (usuario.rol !== 'operador') return <Redirect href="/" />;

  return (
    <SafeAreaView style={estilos.pantalla} edges={['top']}>
      <View style={estilos.encabezado}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={16}
          role="button"
          accessibilityLabel="Volver"
          style={({ pressed }) => pressed && estilos.tocado}
        >
          <Ionicons name="arrow-back" size={26} color="#1F2937" />
        </Pressable>
        <Text style={estilos.titulo}>Cuadrillas</Text>
        <View style={estilos.espaciador} />
      </View>

      {pantalla.fase === 'cargando' && (
        <View style={estilos.centrado}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      )}

      {pantalla.fase === 'error' && (
        <View style={estilos.centrado}>
          <Ionicons name="cloud-offline-outline" size={56} color="#94A3B8" />
          <Text style={estilos.tituloVacio}>No pudimos cargar las cuadrillas</Text>
          <Text style={estilos.textoVacio}>{pantalla.mensaje}</Text>
          <Pressable
            onPress={cargar}
            role="button"
            accessibilityLabel="Reintentar"
            style={({ pressed }) => [estilos.boton, pressed && estilos.tocado]}
          >
            <Text style={estilos.textoBoton}>Reintentar</Text>
          </Pressable>
        </View>
      )}

      {pantalla.fase === 'listo' && (
        <ScrollView contentContainerStyle={estilos.cuerpo}>
          {pantalla.zonas.map((zona) => {
            const deLaZona = pantalla.cuadrillas.filter((c) => c.zonaId === zona.id);
            if (deLaZona.length === 0) return null;

            return (
              <View key={zona.id} style={estilos.bloque}>
                <Text style={estilos.tituloZona}>{zona.nombre}</Text>
                <Text style={estilos.referente}>{zona.referente}</Text>

                {deLaZona.map((cuadrilla) => (
                  <View key={cuadrilla.id} style={estilos.filaCuadrilla}>
                    <View style={estilos.textos}>
                      <Text style={estilos.nombreCuadrilla}>{cuadrilla.nombre}</Text>
                      <Text style={estilos.especialidad}>{cuadrilla.especialidad}</Text>
                    </View>
                    {!cuadrilla.activa && (
                      <View style={estilos.chipInactiva}>
                        <Text style={estilos.textoChipInactiva}>Inactiva</Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: '#F3F4F6' },
  encabezado: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  titulo: { fontSize: 20, fontWeight: 'bold', color: '#1F2937' },
  espaciador: { width: 26 },
  centrado: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 10 },
  tituloVacio: { fontSize: 18, fontWeight: '700', color: '#334155', textAlign: 'center' },
  textoVacio: { fontSize: 15, color: '#64748B', textAlign: 'center', lineHeight: 21 },
  boton: {
    marginTop: 8,
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  textoBoton: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  cuerpo: { padding: 16, gap: 12, paddingBottom: 32 },
  bloque: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    gap: 10,
  },
  tituloZona: { fontSize: 17, fontWeight: '700', color: '#1F2937' },
  referente: { fontSize: 13, color: '#64748B', marginTop: -6 },
  filaCuadrilla: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  textos: { flex: 1 },
  nombreCuadrilla: { fontSize: 15, fontWeight: '600', color: '#1F2937' },
  especialidad: { fontSize: 13, color: '#64748B', marginTop: 2, textTransform: 'capitalize' },
  chipInactiva: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#FEE2E2',
  },
  textoChipInactiva: { fontSize: 12, fontWeight: '700', color: '#B91C1C' },
  tocado: { opacity: 0.6 },
});

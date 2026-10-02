import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@react-native-vector-icons/ionicons';
import { TipoDeReporte } from '../tipos';
import { obtenerTiposDeReporte } from '../servicios/reportes';



export default function PantallaCatalogo() {
    const router = useRouter();
    const [categorias, setCategorias] = useState<TipoDeReporte[]>([]);

    useEffect(() => {
        obtenerTiposDeReporte().then(setCategorias);
    }, []);
    const seleccionarCategoria = (tipoId: string) => {
        router.push({ pathname: '/crear-reporte' as any, params: { tipoId } });
    };
    return (
        <View style={styles.container}>
            <Text style={styles.titulo}>¿Qué problema queres reportar?</Text>
            <Text style={styles.titulo}>Elegi una categorìa para comenzar</Text>

            <TouchableOpacity
                style={styles.botonMapa}
                onPress={() => router.push('/mapa')}
            >
                <Ionicons name="map-outline" size={22} color="#FFFFFF" />
                <Text style={styles.textoBotonMapa}>
                    Ver mapa de reclamos
                </Text>
            </TouchableOpacity>

            <FlatList
                data={categorias}
                keyExtractor={(item) => item.id}
                numColumns={2}
                contentContainerStyle={styles.grilla}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={[styles.card, { borderColor: item.color }]}
                        onPress={() => seleccionarCategoria(item.id)}
                    >
                        <Ionicons name={item.icono as any} size={40} color={item.color} />
                        <Text style={styles.nombreCategoria}>{item.nombre}</Text>
                    </TouchableOpacity>
                )}
            />

        </View >
    );
}
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F3F4F6', padding: 16, paddingTop: 50 },
    titulo: { fontSize: 22, fontWeight: 'bold', color: '#1F2937', textAlign: 'center' },
    subtitulo: { fontSize: 14, color: '#1F2937', textAlign: 'center', marginBottom: 20 },
    grilla: { paddingBottom: 20 },
    botonMapa: {
        backgroundColor: '#2563EB',
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 16,
        marginTop: 20,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },

    textoBotonMapa: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    card: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        margin: 8,
        padding: 20,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        elevation: 3,

    },
    nombreCategoria: { marginTop: 10, fontSize: 16, fontWeight: '600', textAlign: 'center', color: '#374151' },
});




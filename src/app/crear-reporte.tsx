import React, { useState, } from 'react';
import {View, Text, StyleSheet, TextInput, TouchableOpacity, Image, Alert, ScrollView,} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Ionicons from '@react-native-vector-icons/ionicons';
import { enviarReporte } from '../servicios/reportes';
import * as ImagePicker from 'expo-image-picker';

export default function PantallaCatalogo() {
    const { tipoId } = useLocalSearchParams<{ tipoId: string }>();
    const router = useRouter();

    const [foto, setFoto] = useState<string | null>(null);
    const [descripcion, setDescripcion] = useState('');
    const [enviando, setEnviando] = useState(false);
    const coordenadas = { latitud: -33.0089, longitud: -58.5142 };
    const direccion = "Rocamora 1240";
    const tomarFoto = async () => {
        const permiso = await ImagePicker.requestCameraPermissionsAsync();
        if (!permiso.granted) {
            Alert.alert('Permiso requerido', 'Se necesita acceso a la camara para sacar la foto.');
            return;
        }
    
    const result = await ImagePicker.launchCameraAsync({
            allowsEditing: false,
            quality: 0.7,
        })
        if (!result.canceled) {
            setFoto(result.assets[0].uri);
        }
    }
    const manejarEnvio = async () => {
            if (!foto) {
                Alert.alert('Foto obligatoria', 'Por favor ,saca una foto del problema antes de enviar');
                return;
            }

            setEnviando(true);
            try {
                const respuesta = await enviarReporte({
                    tipoId: tipoId || 'tip-otro',
                    descripcion: descripcion || null,
                    audioUrl: null,
                    fotosLocales: [foto],
                    coordenadas,
                    direccion,
                });
                Alert.alert(
                    '¡Reporte Creado!',
                    `Nùmero de seguimiento: ${respuesta.datos.codigo}`,
                    [{ text: 'Aceptar', onPress: () => router.replace('/') }]
                );

            } catch (e) {
                Alert.alert('Error', 'No se pudo enviar el reporte');
            } finally {
                setEnviando(false);
            }
        };
        return (
            <ScrollView style={styles.container}>
                <Text style={styles.titulo} >Nuevo Reporte</Text>
                <Text style={styles.label} >Foto del problema (Obligatoria) </Text>
                {foto ? (
                    <View style={styles.contenedorFoto}>
                        <Image source={{ uri: foto }} style={styles.imagen} />
                        <TouchableOpacity style={styles.botonCambiar} onPress={tomarFoto}>
                            <Text style={styles.textoBotonSecundario}>Cambiar foto</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <TouchableOpacity style={styles.botonFoto} onPress={tomarFoto}>
                        <Ionicons name="camera-outline" size={40} color="#0284C7" />
                        <Text style={styles.textoBotonFoto}> Tomar Foto</Text>
                    </TouchableOpacity>
                )}
                <Text style={styles.label}>Ubicacion</Text>
                <View style={styles.boxUbicacion}>
                    <Ionicons name="location-outline" size={24} color="#DC2626" />
                    <Text style={styles.textoUbicacion}>{direccion}</Text>

                </View>
                <Text style={styles.label}>Descripcion / Observaciones</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Contanos que pasa..."
                    multiline
                    numberOfLines={4}
                    value={descripcion}
                    onChangeText={setDescripcion}
                />
                <TouchableOpacity
                    style={[styles.botonEnviar, enviando && styles.botonDesactivado]}
                    onPress={manejarEnvio}
                    disabled={enviando}
                >
                    < Text style={styles.textoBotonEnviar}>
                        {enviando ? 'Enviando...' : 'Enviar reporte'}
                    </Text>
                </TouchableOpacity>
            </ScrollView>
            )}
        
            const styles = StyleSheet.create({

            container: { flex: 1, backgroundColor: '#FFFFFF', padding: 20, paddingTop: 40 },
            titulo: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#111827' },
            label: { fontSize: 16, fontWeight: '600', color: '#374151', marginTop: 15, marginBottom: 8 },
            botonFoto: {
                height: 140,
                borderWidth: 2,
                borderColor: '#0284C7',
                borderStyle: 'dashed',
                borderRadius: 12,
                justifyContent: 'center',
                backgroundColor: '#F0F9FF',
            },
            textoBotonFoto: { color: '#0284C7', fontWeight: 'bold', marginTop: 8 },
            contenedorFoto: { alignItems: 'center' },
            imagen: { width: '100%', height: 200, borderRadius: 12 },
            botonCambiar: { marginTop: 8, padding: 8 },
            textoBotonSecundario: { color: '#0284C7', fontWeight: '600' },
            boxUbicacion: {
                flexDirection: 'row',
                alignItems: 'center',
                padding: 12,
                backgroundColor: '#F3F4F6',
                borderRadius: 8,
            },
            textoUbicacion: { marginLeft: 8, fontSize: 15, color: '#1F2937' },
            input: {
                borderWidth: 1,
                borderColor: '#D1D5D8',
                borderRadius: 8,
                padding: 12,
                textAlignVertical: 'top',
                fontSize: 15,

            },
            botonEnviar: {
                backgroundColor: '#16A34A',
                padding: 16,
                borderRadius: 12,
                alignItems: 'center',
                marginTop: 30,
                marginBottom: 50,
            },


            botonDesactivado: { opacity: 0.6 },
            textoBotonEnviar: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 18 },
        });



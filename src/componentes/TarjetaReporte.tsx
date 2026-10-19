import { Image } from 'expo-image';
import Ionicons from '@react-native-vector-icons/ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Reporte, TipoDeReporte } from '../tipos';
import { COLORES_ESTADO, ETIQUETAS_ESTADO } from '../utilidades/estados';
import { hace } from '../utilidades/fechas';

interface Props {
  reporte: Reporte;

  tipo?: TipoDeReporte;
  alTocar: (id: string) => void;
}

export function TarjetaReporte({ reporte, tipo, alTocar }: Props) {
  const fotoDelProblema = reporte.fotos.find((f) => f.momento === 'problema');

  const colorEstado = COLORES_ESTADO[reporte.estado];
  const etiquetaEstado = ETIQUETAS_ESTADO[reporte.estado];

  const descripcionAccesible =
    `${tipo?.nombre ?? 'Reclamo'} en ${reporte.direccion}. ` +
    `Estado: ${etiquetaEstado}. Reportado ${hace(reporte.creadoEn)}.`;

  return (
    <Pressable
      onPress={() => alTocar(reporte.id)}
      accessible
      role="button"
      accessibilityLabel={descripcionAccesible}
      accessibilityHint="Abre el detalle del reclamo"
      style={({ pressed }) => [estilos.tarjeta, pressed && estilos.tarjetaTocada]}
    >
      <Image
        source={fotoDelProblema?.url}
        style={estilos.foto}
        contentFit="cover"
        transition={200}
      />

      <View style={estilos.cuerpo}>

        <View style={estilos.filaSuperior}>
          <View style={estilos.categoria}>
            {tipo && (
              <Ionicons name={tipo.icono as any} size={16} color={tipo.color} />
            )}
            <Text style={estilos.nombreCategoria} numberOfLines={1}>
              {tipo?.nombre ?? 'Reclamo'}
            </Text>
          </View>
          <Text style={estilos.tiempo}>{hace(reporte.creadoEn)}</Text>
        </View>

        <Text style={estilos.direccion} numberOfLines={1}>
          {reporte.direccion}
        </Text>

        <View style={estilos.filaInferior}>
          <View style={[estilos.chipEstado, { backgroundColor: colorEstado }]}>
            <Text style={estilos.textoEstado}>{etiquetaEstado}</Text>
          </View>

          {reporte.adhesiones > 0 && (
            <View style={estilos.adhesiones}>
              <Ionicons name="people" size={14} color="#64748B" />
              <Text style={estilos.textoAdhesiones}>{reporte.adhesiones}</Text>
            </View>
          )}

          {!reporte.sincronizado && (
            <View style={estilos.pendiente}>
              <Ionicons name="cloud-upload-outline" size={14} color="#CA8A04" />
              <Text style={estilos.textoPendiente}>Sin enviar</Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  tarjeta: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    elevation: 2,
  },
  tarjetaTocada: {
    opacity: 0.7,
  },
  foto: {
    width: 96,
    height: 96,
    backgroundColor: '#E2E8F0',
  },
  cuerpo: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  filaSuperior: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  categoria: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 1,
  },
  nombreCategoria: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    flexShrink: 1,
  },
  tiempo: {
    fontSize: 12,
    color: '#94A3B8',
  },
  direccion: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginVertical: 4,
  },
  filaInferior: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chipEstado: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  textoEstado: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  adhesiones: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  textoAdhesiones: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  pendiente: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  textoPendiente: {
    fontSize: 12,
    color: '#CA8A04',
    fontWeight: '600',
  },
});

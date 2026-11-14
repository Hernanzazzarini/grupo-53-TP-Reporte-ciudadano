import { Image } from 'expo-image';
import Ionicons from '@react-native-vector-icons/ionicons';
import { StyleSheet, Text, View } from 'react-native';

import type { ReportePendiente } from '../lib/cola-reportes';
import { TipoDeReporte } from '../tipos';

interface Props {
  pendiente: ReportePendiente;
  tipo?: TipoDeReporte;
}

const codigoProvisorio = (id: string) =>
  `LOCAL-${(id.split('-')[1] ?? id).slice(0, 6).toUpperCase()}`;

export function TarjetaPendiente({ pendiente, tipo }: Props) {
  const { datos } = pendiente;
  const codigo = codigoProvisorio(pendiente.id);

  return (
    <View
      accessible
      accessibilityLabel={
        `${tipo?.nombre ?? 'Reclamo'} en ${datos.direccion}. ` +
        `Código provisorio ${codigo}. Pendiente de sincronización.`
      }
      style={estilos.tarjeta}
    >
      <Image
        source={datos.fotosLocales[0]}
        style={estilos.foto}
        contentFit="cover"
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
          <Text style={estilos.codigo}>{codigo}</Text>
        </View>

        <Text style={estilos.direccion} numberOfLines={1}>
          {datos.direccion}
        </Text>

        <View style={estilos.chipPendiente}>
          <Ionicons name="cloud-upload-outline" size={14} color="#FFFFFF" />
          <Text style={estilos.textoChip}>Pendiente de sincronización</Text>
        </View>
      </View>
    </View>
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
  codigo: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  direccion: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginVertical: 4,
  },
  chipPendiente: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: '#CA8A04',
  },
  textoChip: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});

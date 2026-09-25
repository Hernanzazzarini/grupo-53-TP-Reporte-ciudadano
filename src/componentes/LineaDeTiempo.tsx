import { StyleSheet, Text, View } from 'react-native';

import { CambioDeEstado } from '../tipos';
import { COLORES_ESTADO, ETIQUETAS_ESTADO } from '../utilidades/estados';
import { formatearFechaHora } from '../utilidades/fechas';

interface Props {
  cambios: CambioDeEstado[];
}

export function LineaDeTiempo({ cambios }: Props) {
  if (cambios.length === 0) {
    return <Text style={estilos.vacio}>Todavía no hay movimientos registrados.</Text>;
  }

  return (
    <View>
      {cambios.map((cambio, indice) => {
        const esElUltimo = indice === cambios.length - 1;
        const color = COLORES_ESTADO[cambio.estado];

        return (
          <View key={cambio.id} style={estilos.fila}>

            <View style={estilos.columnaLinea}>
              <View style={[estilos.punto, { backgroundColor: color }]} />
              {!esElUltimo && <View style={estilos.segmento} />}
            </View>

            <View style={[estilos.contenido, esElUltimo && estilos.contenidoUltimo]}>
              <Text style={[estilos.estado, { color }]}>
                {ETIQUETAS_ESTADO[cambio.estado]}
              </Text>
              <Text style={estilos.fecha}>{formatearFechaHora(cambio.fechaHora)}</Text>

              {cambio.comentario && (
                <Text style={estilos.comentario}>{cambio.comentario}</Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const estilos = StyleSheet.create({
  fila: {
    flexDirection: 'row',
    gap: 12,
  },
  columnaLinea: {
    alignItems: 'center',
    width: 14,
  },
  punto: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginTop: 4,
  },
  segmento: {
    flex: 1,
    width: 2,
    backgroundColor: '#CBD5E1',
    marginVertical: 4,
  },
  contenido: {
    flex: 1,
    paddingBottom: 20,
  },
  contenidoUltimo: {
    paddingBottom: 0,
  },
  estado: {
    fontSize: 15,
    fontWeight: '700',
  },
  fecha: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 2,
  },
  comentario: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    marginTop: 6,
    fontStyle: 'italic',
  },
  vacio: {
    fontSize: 14,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
});

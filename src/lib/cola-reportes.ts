
import * as SQLite from 'expo-sqlite';
import { Directory, File, Paths } from 'expo-file-system';
import * as Network from 'expo-network';
import type { ReporteDatos } from '../tipos';
import { enviarReporte } from '../servicios/reportes';
import { CODIGO_SIN_CONEXION, ErrorDeApi } from '../api/errores';

const NOMBRE_BASE = 'reportes-pendientes.db';

const ERRORES_PASAJEROS = [
  CODIGO_SIN_CONEXION,
  '',
  'ERROR_INTERNO',
  'ALMACEN_NO_DISPONIBLE',
  'NO_AUTENTICADO',
];

let baseDatos: SQLite.SQLiteDatabase | null = null;
let sincronizando = false;

async function inicializarColaReportes() {
  if (baseDatos) return baseDatos;

  baseDatos = await SQLite.openDatabaseAsync(NOMBRE_BASE);

  await baseDatos.execAsync(`
    CREATE TABLE IF NOT EXISTS reportes_pendientes (
      id TEXT PRIMARY KEY NOT NULL,
      datos TEXT NOT NULL,
      estado TEXT NOT NULL DEFAULT 'pendiente',
      creado_en TEXT NOT NULL
    );
  `);

  return baseDatos;
}

async function copiarArchivo(
  uri: string,
  id: string,
  nombre: string
): Promise<string> {
  const directorio = new Directory(Paths.document, 'reportes-pendientes');

  directorio.create({ intermediates: true, idempotent: true });

  const original = uri.split('/').pop()?.split('?')[0] || nombre;
  const destino = new File(directorio, `${id}-${nombre}-${original}`);

  new File(uri).copy(destino);

  return destino.uri;
}

export async function guardarReportePendiente(datos: ReporteDatos) {
  const db = await inicializarColaReportes();

  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  const fotosLocales = await Promise.all(
    datos.fotosLocales.map((uri, i) =>
      copiarArchivo(uri, id, `foto-${i}`)
    )
  );

  const audioLocal = datos.audioLocal
    ? await copiarArchivo(datos.audioLocal, id, 'audio')
    : null;

  const datosGuardados: ReporteDatos = {
    ...datos,
    fotosLocales,
    audioLocal,
  };

  await db.runAsync(
    `INSERT INTO reportes_pendientes (id, datos, estado, creado_en)
     VALUES (?, ?, 'pendiente', ?)`,
    id,
    JSON.stringify(datosGuardados),
    new Date().toISOString()
  );

  return id;
}

export async function obtenerReportesPendientes() {
  const db = await inicializarColaReportes();

  const filas = await db.getAllAsync<{
    id: string;
    datos: string;
    estado: string;
    creado_en: string;
  }>(
    `SELECT * FROM reportes_pendientes
     WHERE estado = 'pendiente'
     ORDER BY creado_en ASC`
  );

  return filas.map(fila => ({
    ...fila,
    datos: JSON.parse(fila.datos) as ReporteDatos,
  }));
}

function laApiLoRechazo(error: unknown) {
  return error instanceof ErrorDeApi && !ERRORES_PASAJEROS.includes(error.codigo);
}

function borrarArchivos(datos: ReporteDatos) {
  for (const uri of [
    ...datos.fotosLocales,
    ...(datos.audioLocal ? [datos.audioLocal] : []),
  ]) {
    const archivo = new File(uri);

    if (archivo.exists) {
      archivo.delete();
    }
  }
}

export async function sincronizarReportesPendientes() {
  if (sincronizando) return;

  sincronizando = true;

  try {
    const red = await Network.getNetworkStateAsync();

    if (!red.isConnected || red.isInternetReachable === false) {
      return;
    }

    const db = await inicializarColaReportes();
    const pendientes = await obtenerReportesPendientes();

    for (const reporte of pendientes) {
      try {
        await enviarReporte(reporte.datos);

        await db.runAsync(
          'DELETE FROM reportes_pendientes WHERE id = ?',
          reporte.id
        );

        borrarArchivos(reporte.datos);
      } catch (error) {
        if (laApiLoRechazo(error)) {
          await db.runAsync(
            `UPDATE reportes_pendientes SET estado = 'rechazado' WHERE id = ?`,
            reporte.id
          );

          borrarArchivos(reporte.datos);
          continue;
        }

        console.error('No se pudo sincronizar el reporte:', reporte.id);
      }
    }
  } finally {
    sincronizando = false;
  }
}

export function escucharConexion() {
  return Network.addNetworkStateListener(estado => {
    if (estado.isConnected && estado.isInternetReachable !== false) {
      sincronizarReportesPendientes();
    }
  });
}

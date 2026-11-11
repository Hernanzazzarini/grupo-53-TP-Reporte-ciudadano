
import * as SQLite from 'expo-sqlite';
import * as FileSystem from 'expo-file-system/legacy';
import * as Network from 'expo-network';
import type { ReporteDatos } from '../tipos';
import { enviarReporte } from '../servicios/reportes';

const NOMBRE_BASE = 'reportes-pendientes.db';

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
  const directorio =
    `${FileSystem.documentDirectory}reportes-pendientes/`;

  if (!FileSystem.documentDirectory) {
    throw new Error('No se encontró el almacenamiento del teléfono.');
  }

  const info = await FileSystem.getInfoAsync(directorio);

  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(directorio, {
      intermediates: true,
    });
  }

  const original = uri.split('/').pop()?.split('?')[0] || nombre;
  const destino = `${directorio}${id}-${nombre}-${original}`;

  await FileSystem.copyAsync({ from: uri, to: destino });

  return destino;
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

        for (const uri of [
          ...reporte.datos.fotosLocales,
          ...(reporte.datos.audioLocal ? [reporte.datos.audioLocal] : []),
        ]) {
          await FileSystem.deleteAsync(uri, { idempotent: true });
        }
      } catch (error) {
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

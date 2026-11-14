# Reporte Ciudadano

Aplicación móvil para que los vecinos de Gualeguaychú reporten problemas de la
vía pública —baches, luminarias, basura, ramas caídas— desde el celular, con
foto y ubicación, y puedan seguir el estado de su reclamo.

Del otro lado, el personal del Centro de Atención al Vecino gestiona los
reclamos: cambia estados, asigna cuadrillas y cierra con la foto del arreglo.

---

## Contexto académico

| | |
|---|---|
| **Institución** | Facultad de Ciencias de la Administración · UNER |
| **Carrera** | Tecnicatura Universitaria en Desarrollo Web |
| **Materia** | Desarrollo para Móviles |
| **Período** | 2026 · 2º cuatrimestre |
| **Trabajo** | Actividad N° 3 — Trabajo Integrador, entrega final |
| **Consigna** | Resolver el PRD asignado al grupo: **02 — Reporte Ciudadano** |

---

## Integrantes

Ordenados alfabéticamente por apellido.

| Apellido y nombre |
|---|
| Beltramone, Elisa |
| Guardia, Claudia |
| Roman, Gabriel Osvaldo |
| Romero Degreef, Fabián Agustín |
| Trentino, Juan Paulo |
| Zazzarini, Hernán Alberto |

---

## Tecnologías

| Qué | Con qué |
|---|---|
| Framework | React Native con Expo — **SDK 54** |
| Lenguaje | TypeScript |
| Navegación | Expo Router |
| Estilos | StyleSheet |
| Entrega | Build de producción con EAS |

---

## Cómo levantar el proyecto

```bash
npm install
npm start
```

### Comprobaciones antes de subir cambios

```bash
npx expo lint        # reglas de hooks y errores de estilo
npx tsc --noEmit     # que no haya errores de tipos
npx expo-doctor      # que las dependencias sean coherentes con el SDK
```

> **No correr `npm audit fix --force`.** Rompe las versiones que Expo fija
> para el SDK. Los avisos de vulnerabilidades en un proyecto Expo son normales.


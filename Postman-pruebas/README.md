# 📮 Postman - Colección AUTOMATIZADA EA Sports Tournament API

## 🚀 100% AUTOMATIZADA - Sin escribir nada!

Esta colección está **totalmente automatizada**. Solo tienes que ejecutar los requests EN ORDEN y todos los IDs se guardan automáticamente.

## 📁 Archivos

| Archivo | Descripción |
|---------|-------------|
| `EA_Sports_Tournament_API.postman_collection.json` | Colección automatizada |
| `EA_Sports_Local.postman_environment.json` | Variables de entorno |

## 🎯 Cómo Usar (3 pasos)

### 1. Importar en Postman
1. Abre Postman
2. Click en **Import**
3. Arrastra los 2 archivos JSON
4. Selecciona environment **"EA Sports Local"**

### 2. Ejecutar TODO automáticamente
1. Abre la carpeta **"� FLUJO COMPLETO AUTOMATIZADO"**
2. Click derecho → **Run folder**
3. Click en **Run EA Sports Tournament API**
4. ¡Listo! Todo se ejecuta automáticamente

### 3. O ejecutar uno por uno
Ejecuta los requests del 1 al 17 en orden. Cada uno guarda automáticamente los IDs necesarios para el siguiente.

## ✨ Qué hace cada paso

| # | Request | Qué guarda |
|---|---------|------------|
| 1 | Health Check | Verifica servidor |
| 2 | Registrar Usuario | `token`, `userId` |
| 3 | Login | `token`, `userId` (si ya existe) |
| 4 | Crear Juego | `gameId` |
| 5 | Crear Juego Robots | `robotGameId` |
| 6 | Crear Torneo | `tournamentId` |
| 7 | Crear Equipo 1 | `team1Id`, `teamId` |
| 8 | Crear Usuario 2 | `user2Id` |
| 9 | Crear Equipo 2 | `team2Id` |
| 10 | Crear Partida | `matchId` |
| 11 | Actualizar a LIVE | - |
| 12 | Completar Partida | - |
| 13-17 | Ver datos | - |

## 🧹 Limpieza

Usa la carpeta **"🧹 LIMPIEZA"** para eliminar los datos de prueba.

## � Tips

- **{{$timestamp}}** se usa para generar slugs únicos (evita duplicados)
- Los tests muestran logs en la consola de Postman
- Si algo falla, revisa la consola (View → Show Postman Console)

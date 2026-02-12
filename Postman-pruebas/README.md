# Pruebas Automatizadas de Postman - Proyecto EA Sports

Esta carpeta contiene todo lo necesario para probar la API de forma automatizada.

## 1. ¿Qué está automatizado?

El archivo `EA_Sports_Project.postman_collection.json` incluye scripts en la pestaña "Tests" que automatizan el flujo:

*   **Autenticación Automática**: Al ejecutar la petición **"Auth > Login"**, el sistema captura automáticamente el `token` y el `id` del usuario.
*   **Variables de Entorno**: Estos valores se guardan en el entorno `EA_Sports_Env`, por lo que **no necesitas copiar y pegar el token** manualmente en las siguientes peticiones. Todas las peticiones de la colección ya están configuradas para usar `{{jwt_token}}` automáticamente.

## 2. Cómo ejecutar las pruebas

### Opción A: Desde Postman (Interfaz Gráfica)
1.  Importa los dos archivos `.json` en Postman.
2.  Selecciona el entorno **"EA Sports Local Env"** (arriba a la derecha).
3.  Haz clic en el nombre de la colección **"Proyecto EA Sports API"**.
4.  Haz clic en el botón **"Run"** (o "Runner").
5.  Asegúrate de que la petición **"Login"** esté seleccionada y sea la primera.
6.  Haz clic en **"Run Proyecto EA Sports API"**.
    *   Postman ejecutará todas las peticiones en orden.
    *   El login guardará el token y las siguientes peticiones funcionarán correctamente.

### Opción B: Desde la Terminal (Totalmente Automatizado)
Si quieres correr todo con un solo comando sin abrir Postman, puedes usar el script incluido `run-tests.bat` (requiere Node.js instalado).

1.  Abre una terminal en esta carpeta.
2.  Ejecuta:
    ```bash
    ./run-tests.bat
    ```
    *   Esto usará `npx newman` para ejecutar la colección reportar los resultados en la consola.

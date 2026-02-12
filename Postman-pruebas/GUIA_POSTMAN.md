# Guía Paso a Paso: Ejecutar Pruebas en Postman

Sigue estos pasos para cargar y ejecutar las pruebas automatizadas usando la interfaz de Postman.

## 1. Importar los Archivos
1.  Abre la aplicación **Postman**.
2.  Haz clic en el botón **"Import"** (arriba a la izquierda).
3.  Arrastra y suelta los dos archivos que creamos en esta carpeta:
    *   `EA_Sports_Project.postman_collection.json`
    *   `EA_Sports_Env.postman_environment.json`
4.  Confirma la importación.

## 2. Seleccionar el Entorno
Para que funcione la automatización del token, debes seleccionar el entorno correcto.
1.  Mira en la esquina **superior derecha** de Postman.
2.  Debería decir "No Environment" o mostrar un menú desplegable.
3.  Haz clic y selecciona **"EA Sports Local Env"**.

## 3. Ejecutar las Pruebas (Modo Automático)
En lugar de hacer clic en "Send" en cada petición una por una, usa el **Collection Runner**:

1.  En el panel izquierdo, busca la colección **"Proyecto EA Sports API"**.
2.  Haz clic en los tres puntos `...` junto al nombre de la colección (o haz clic derecho).
3.  Selecciona la opción **"Run collection"**.
4.  Se abrirá una nueva pestaña "Runner".
5.  Asegúrate de que la lista de peticiones esté ordenada (Login debe ir primero).
6.  Haz clic en el botón naranja **"Run Proyecto EA Sports API"**.

## Resultado
Postman ejecutará todas las peticiones automáticamente.
*   El **Login** se hará primero.
*   El **Token** se guardará solo.
*   El resto de peticiones usarán ese token para probar Usuarios, Torneos, Pagos, etc.
*   Verás un resumen con semáforos verdes (éxito) o rojos (error).

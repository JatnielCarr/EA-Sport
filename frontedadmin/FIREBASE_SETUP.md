# 🔐 Configuración de Firebase Authentication

## 📋 Paso 1: Crear Proyecto en Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Click en "Agregar proyecto"
3. Nombra tu proyecto: **EA Sports Tournament**
4. Acepta los términos y crea el proyecto

## 🔧 Paso 2: Configurar Authentication

1. En el menú lateral, ve a **Authentication**
2. Click en "Comenzar"
3. Habilita los siguientes métodos:
   - ✅ **Correo electrónico/Contraseña**
   - ✅ **Google** (opcional pero recomendado)

## 🔑 Paso 3: Obtener Credenciales

1. Ve a **Configuración del proyecto** (⚙️ en el menú lateral)
2. Scroll hasta "Tus apps"
3. Click en el icono **Web** (</>)
4. Registra la app: **EA Sports Admin Panel**
5. Copia la configuración que aparece

## 📝 Paso 4: Configurar en el Código

Abre el archivo `fronted/js/firebase-config.js` y reemplaza:

```javascript
const firebaseConfig = {
  apiKey: "TU_API_KEY",                    // ← Pega aquí
  authDomain: "TU_AUTH_DOMAIN",           // ← Pega aquí
  projectId: "TU_PROJECT_ID",             // ← Pega aquí
  storageBucket: "TU_STORAGE_BUCKET",     // ← Pega aquí
  messagingSenderId: "TU_MESSAGING_SENDER_ID", // ← Pega aquí
  appId: "TU_APP_ID"                      // ← Pega aquí
};
```

Ejemplo real:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyB1234567890abcdefgh",
  authDomain: "ea-sports-tournament.firebaseapp.com",
  projectId: "ea-sports-tournament",
  storageBucket: "ea-sports-tournament.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abc123def456"
};
```

## 🌐 Paso 5: Configurar Google Sign-In (Opcional)

1. En Firebase Authentication → Sign-in method
2. Click en **Google**
3. Habilita el proveedor
4. Selecciona el email de soporte del proyecto
5. Guarda

En Google Cloud Console:
1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Selecciona tu proyecto Firebase
3. APIs & Services → Credentials
4. Configura "OAuth consent screen"
5. Agrega los dominios autorizados:
   - `localhost:5173` (desarrollo)
   - `tudominio.com` (producción)

## 🎯 Cómo Funciona

### Registro de Usuario Normal

1. Usuario va a `/register`
2. Se registra con email/contraseña o Google
3. Se crea cuenta en Firebase
4. Se registra en tu backend
5. **Importante**: Los usuarios normales NO acceden al panel de admin
6. Son redirigidos a `/FrontedUser/index.html`

### Registro de Administrador

Para crear un admin, debes hacerlo directamente en la base de datos:

```sql
UPDATE users 
SET role = 'ADMIN' 
WHERE email = 'admin@easports.com';
```

O crear uno con el backend directamente.

### Login

1. Usuario inicia sesión
2. El sistema verifica el rol
3. **ADMIN/ORGANIZER**: Accede al panel de administración
4. **USER**: No puede acceder al panel (mostrará error)

## 🔒 Seguridad

El panel de administración solo permite acceso a:
- ✅ Rol `ADMIN` (Super Admin)
- ✅ Rol `ORGANIZER` (Líder de Clan)
- ❌ Rol `USER` (Usuario normal)

Los usuarios normales deben usar `/FrontedUser/index.html`

## 🧪 Testing

**Usuario de Prueba Admin:**
```
Email: admin@easports.com
Password: admin123
```

**Crear nuevo admin (en backend):**
```javascript
// En prisma/seed.ts o mediante API
{
  email: 'nuevo-admin@easports.com',
  username: 'NuevoAdmin',
  password: await bcrypt.hash('password123', 10),
  role: 'ADMIN'
}
```

## 🚨 Troubleshooting

**Error: "Firebase not configured"**
- Verifica que hayas pegado las credenciales correctas en `firebase-config.js`

**Error: "User not authorized"**
- El usuario no tiene rol ADMIN/ORGANIZER
- Verifica el rol en la base de datos

**Google Sign-In no funciona**
- Verifica que el dominio esté autorizado en Google Cloud Console
- Revisa que OAuth consent screen esté configurado

## 📚 Recursos

- [Firebase Docs](https://firebase.google.com/docs/auth)
- [Google Sign-In Setup](https://firebase.google.com/docs/auth/web/google-signin)
- [Firebase Console](https://console.firebase.google.com/)

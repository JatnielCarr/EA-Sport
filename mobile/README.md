# ApexTournament Mobile

App móvil nativa para iOS, optimizada para **iPhone 15** con chip **A16 Bionic**.

## 📱 Características

### Optimizaciones para iPhone 15
- ✅ **ProMotion 120Hz** - Animaciones suaves a 120fps
- ✅ **Dynamic Island** - Safe areas correctamente configuradas
- ✅ **Taptic Engine** - Haptic feedback en toda la UI
- ✅ **OLED Display** - Colores optimizados con negros puros
- ✅ **GPU Acceleration** - Scroll y animaciones aceleradas por hardware
- ✅ **Push Notifications** - Notificaciones nativas de iOS

### Funcionalidades
- 🏆 Ver torneos activos y detalles
- 🔴 Partidas en vivo con actualizaciones en tiempo real
- 🛡️ Sistema de clanes con chat
- 🏅 Ranking global de jugadores
- 👤 Perfil de usuario y configuración
- 🔔 Notificaciones push

## 🚀 Requisitos

- **Node.js** 18+
- **Xcode** 15+ (para compilar iOS)
- **CocoaPods** (`sudo gem install cocoapods`)
- Mac con macOS Sonoma o superior

## 📦 Instalación

```bash
# 1. Navegar a la carpeta mobile
cd mobile

# 2. Instalar dependencias
npm install

# 3. Agregar plataforma iOS
npx cap add ios

# 4. Compilar el proyecto web
npm run build

# 5. Sincronizar con iOS
npx cap sync ios

# 6. Abrir en Xcode
npx cap open ios
```

## 🔧 Desarrollo

### Modo desarrollo (web)
```bash
npm run dev
```
Abre http://localhost:5175 en tu navegador.

### Live Reload en dispositivo
```bash
npm run run:ios:live
```

### Build para producción
```bash
npm run build:ios
```

## 📲 Compilar para iPhone 15

### En Xcode:

1. Abre el proyecto en Xcode: `npx cap open ios`

2. Selecciona tu dispositivo o simulador:
   - **iPhone 15** (dispositivo físico)
   - **iPhone 15 Pro Simulator**

3. Configura el **Signing**:
   - Team: Tu Apple Developer Team
   - Bundle Identifier: `com.apextournament.app`

4. **Build & Run** (⌘ + R)

### Configuración para App Store:

1. En Xcode → Project → Targets → General:
   - Display Name: `ApexTournament`
   - Bundle Identifier: `com.apextournament.app`
   - Version: `1.0.0`
   - Build: `1`

2. En Signing & Capabilities:
   - Agregar **Push Notifications**
   - Agregar **Background Modes** (si necesario)

3. Crear Archive:
   - Product → Archive
   - Distribute App → App Store Connect

## 📁 Estructura del Proyecto

```
mobile/
├── index.html              # HTML principal
├── package.json            # Dependencias
├── capacitor.config.json   # Configuración de Capacitor
├── vite.config.js          # Build config optimizado
├── css/
│   └── styles.css          # Estilos optimizados para iOS
├── js/
│   ├── app.js              # App principal
│   └── capacitor-init.js   # Inicialización de plugins
├── icons/                  # Iconos de la app
└── splash/                 # Splash screens
```

## 🎨 Generación de Assets

### Iconos y Splash Screens

1. Coloca tu icono base (1024x1024) en `resources/icon.png`
2. Coloca tu splash (2732x2732) en `resources/splash.png`
3. Ejecuta:

```bash
npm run icons
```

Esto generará automáticamente todos los tamaños necesarios para iOS.

## 🔔 Push Notifications

Para habilitar notificaciones push:

1. Crear un **APNs Key** en Apple Developer Portal
2. Configurar en tu backend
3. El token se envía automáticamente al server al registrar

## ⚙️ Variables de Entorno

Crea un archivo `.env` basado en `.env.example`:

```env
VITE_API_URL=https://tu-api.com
VITE_WS_URL=wss://tu-api.com
```

## 🐛 Troubleshooting

### Error: "No signing certificate"
```bash
# Reinstalar pods
cd ios/App
pod install --repo-update
```

### Error: "Module not found"
```bash
npx cap sync ios
```

### Limpiar cache
```bash
rm -rf node_modules
rm -rf ios
npm install
npx cap add ios
npm run build:ios
```

## 📊 Performance Tips

- Las animaciones usan `transform` y `opacity` para GPU acceleration
- Imágenes lazy-loaded con Intersection Observer
- TTL cache de 5 minutos para datos de API
- Skeleton loading para mejor UX percibida

## 📄 Licencia

MIT © ApexTournament 2026

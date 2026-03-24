# EA Sports Tournament - Admin Panel Frontend

## 📋 Descripción

Panel de administración para el sistema de torneos de esports. Interfaz moderna con tema oscuro/claro, completamente funcional para gestionar:

- 📊 **Dashboard** - Estadísticas generales y actividad reciente
- 👥 **Usuarios** - Gestión de jugadores, organizadores y administradores
- 🏆 **Torneos** - Crear y administrar torneos de esports
- 👥 **Equipos** - Gestionar equipos y sus jugadores
- 🎮 **Partidas** - Programar partidas y reportar resultados
- 🎲 **Juegos** - Catálogo de juegos disponibles

## 🚀 Inicio Rápido

### Prerrequisitos

- Node.js 18+
- Backend API corriendo en `http://localhost:3000`

### Instalación

```bash
cd fronted
npm install
```

### Desarrollo

```bash
npm run dev
```

El panel estará disponible en `http://localhost:5173`

### Build para Producción

```bash
npm run build
```

## 📁 Estructura del Proyecto

```
fronted/
├── index.html          # HTML principal
├── package.json        # Dependencias y scripts
├── vite.config.js      # Configuración de Vite
├── css/
│   └── styles.css      # Estilos globales (dark/light theme)
└── js/
    ├── app.js          # Router principal y configuración
    ├── api.js          # Cliente API para comunicación con backend
    ├── ui.js           # Utilidades de UI (toasts, modales, etc.)
    └── pages/
        ├── dashboard.js    # Página de dashboard
        ├── users.js        # Gestión de usuarios
        ├── tournaments.js  # Gestión de torneos
        ├── teams.js        # Gestión de equipos
        ├── matches.js      # Gestión de partidas
        └── games.js        # Gestión de juegos
```

## ✨ Características

### UI/UX
- 🌙 **Tema Oscuro/Claro** - Cambia con un clic
- 📱 **Responsive** - Funciona en desktop, tablet y móvil
- ⚡ **SPA** - Navegación sin recargas de página
- 🔔 **Notificaciones** - Toasts para feedback de acciones
- 🪟 **Modales** - Formularios en ventanas modales

### Funcionalidades
- CRUD completo para todas las entidades
- Filtros y búsqueda en tiempo real
- Validación de formularios
- Reportar resultados de partidas
- Gestión de jugadores en equipos

## 🔌 API Endpoints

El frontend se comunica con estos endpoints:

| Recurso    | Endpoints                    |
|------------|------------------------------|
| Users      | GET, POST, PUT, DELETE /api/users |
| Games      | GET, POST, PUT, DELETE /api/games |
| Tournaments| GET, POST, PUT, DELETE /api/tournaments |
| Teams      | GET, POST, PUT, DELETE /api/teams |
| Matches    | GET, POST, PUT, DELETE /api/matches |
| Standings  | GET /api/standings |
| Health     | GET /api/health |

## 🛠️ Tecnologías

- **Vite** - Build tool y dev server
- **Vanilla JavaScript** - Sin frameworks
- **CSS3** - Variables CSS, Flexbox, Grid
- **Font Awesome** - Iconos

## 📝 Notas de Desarrollo

### Añadir nueva página

1. Crear archivo en `js/pages/nueva-pagina.js`
2. Exportar función `renderNuevaPagina(container)`
3. Importar en `js/app.js`
4. Añadir ruta en el objeto `routes`
5. Añadir link en el sidebar de `index.html`

### Proxy de API

El `vite.config.js` configura un proxy para `/api` que redirige a `http://localhost:3000`. Esto evita problemas de CORS durante el desarrollo.

## 📄 Licencia

Proyecto EA Sports Tournament

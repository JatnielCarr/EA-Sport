# 🎮 EA-Sport - Esports Tournament Platform

Una plataforma completa para la gestión de torneos de esports y videojuegos competitivos. Incluye una API RESTful robusta construida con Node.js, TypeScript, Fastify y PostgreSQL, junto con un frontend moderno.

![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=flat-square&logo=node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Fastify](https://img.shields.io/badge/Fastify-4.28-000000?style=flat-square&logo=fastify&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-5.20-2D3748?style=flat-square&logo=prisma&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

## 🚀 Características

### Backend (API)
- **Autenticación JWT** completa con registro, login y refresh tokens
- **Gestión de torneos** con diferentes formatos (Single Elimination, Double Elimination, Round Robin, Swiss)
- **Sistema de equipos** con registro automático y gestión de jugadores
- **Generación automática de brackets** para torneos de eliminación simple
- **Sistema de resultados** con validación y disputas
- **Tabla de posiciones** automática
- **Documentación Swagger/OpenAPI** completa
- **Validación con Zod** en todos los endpoints
- **ORM Prisma** con PostgreSQL
- **Testing con Jest** y Supertest
- **Logger con Pino**
- **Error handling** consistente y robusto

### Frontend
- **Interfaz moderna** con Vite
- **Dashboard interactivo** para gestión de torneos
- **Visualización de brackets** en tiempo real
- **Gestión de usuarios, equipos y partidas**
- **Sistema de autenticación** integrado

## 🛠️ Stack Tecnológico

### Backend
| Tecnología | Versión | Descripción |
|------------|---------|-------------|
| Node.js | 20+ | Runtime de JavaScript |
| TypeScript | 5.6 | Tipado estático |
| Fastify | 4.28 | Framework web de alto rendimiento |
| PostgreSQL | 16 | Base de datos relacional |
| Prisma | 5.20 | ORM moderno |
| Zod | 3.23 | Validación de esquemas |
| JWT | - | Autenticación con tokens |
| Jest | 29.7 | Framework de testing |
| Pino | 9.4 | Logging estructurado |

### Frontend
| Tecnología | Descripción |
|------------|-------------|
| Vite | Build tool y dev server |
| HTML5/CSS3 | Estructura y estilos |
| JavaScript | Lógica del cliente |

## 📁 Estructura del Proyecto

```
EA-Sport/
├── src/                    # Código fuente del backend
│   ├── config/             # Configuración de base de datos y Swagger
│   ├── types/              # Definiciones de tipos TypeScript
│   ├── app.ts              # Configuración principal de Fastify
│   └── server.ts           # Punto de entrada del servidor
├── fronted/                # Aplicación frontend
│   ├── css/                # Estilos CSS
│   ├── js/                 # JavaScript del cliente
│   │   ├── pages/          # Páginas de la aplicación
│   │   ├── api.js          # Cliente API
│   │   ├── app.js          # Aplicación principal
│   │   ├── auth.js         # Autenticación
│   │   └── ui.js           # Componentes UI
│   └── index.html          # Página principal
├── prisma/                 # Esquema y migraciones de Prisma
│   ├── schema.prisma       # Modelo de datos
│   └── seed.ts             # Datos iniciales
├── scripts/                # Scripts de utilidad
│   ├── add-clash-royale.ts # Agregar juego Clash Royale
│   ├── add-teams-matches.ts# Agregar equipos y partidas
│   ├── add-tournaments.ts  # Agregar torneos
│   ├── get-users.ts        # Obtener usuarios
│   ├── init-database.sql   # Inicialización de BD
│   └── update-admin.ts     # Actualizar admin
├── tests/                  # Tests automatizados
│   ├── auth.test.ts        # Tests de autenticación
│   ├── integration.test.ts # Tests de integración
│   ├── tournaments.test.ts # Tests de torneos
│   └── setup.ts            # Configuración de tests
├── .env.example            # Variables de entorno ejemplo
├── jest.config.js          # Configuración de Jest
├── package.json            # Dependencias y scripts
├── tsconfig.json           # Configuración de TypeScript
└── README.md               # Este archivo
```

## 🚀 Inicio Rápido

### Prerrequisitos

- **Node.js** 20+ ([Descargar](https://nodejs.org/))
- **PostgreSQL** 16 ([Descargar](https://www.postgresql.org/download/))
- **npm** 10+ (incluido con Node.js)

### Instalación

1. **Clona el repositorio**
   ```bash
   git clone https://github.com/JatnielCarr/EA-Sport.git
   cd EA-Sport
   ```

2. **Instala las dependencias del backend**
   ```bash
   npm install
   ```

3. **Instala las dependencias del frontend**
   ```bash
   cd fronted
   npm install
   cd ..
   ```

4. **Configura las variables de entorno**
   ```bash
   # Copia el archivo de ejemplo
   cp .env.example .env

   # Edita .env con tus configuraciones
   # Windows: notepad .env
   # Linux/Mac: nano .env
   ```

5. **Configura la base de datos**
   ```bash
   # Crea una base de datos PostgreSQL
   # Puedes usar el script SQL incluido
   psql -U postgres -f scripts/init-database.sql

   # Genera el cliente de Prisma
   npm run prisma:generate

   # Ejecuta las migraciones
   npm run prisma:migrate

   # (Opcional) Poblar con datos iniciales
   npm run prisma:seed
   ```

6. **Inicia el servidor de desarrollo**
   ```bash
   # Backend (puerto 3000)
   npm run dev

   # Frontend (en otra terminal, puerto 5173)
   cd fronted
   npm run dev
   ```

## 📜 Scripts Disponibles

### Backend

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Inicia el servidor en modo desarrollo con hot reload |
| `npm run build` | Compila TypeScript a JavaScript |
| `npm start` | Inicia el servidor en producción |
| `npm test` | Ejecuta todos los tests con coverage |
| `npm run test:watch` | Ejecuta tests en modo watch |
| `npm run prisma:generate` | Genera el cliente de Prisma |
| `npm run prisma:migrate` | Ejecuta las migraciones |
| `npm run prisma:studio` | Abre Prisma Studio (GUI) |
| `npm run prisma:seed` | Pobla la base de datos |
| `npm run lint` | Ejecuta ESLint |
| `npm run format` | Formatea el código con Prettier |

### Frontend

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Inicia Vite en modo desarrollo |
| `npm run build` | Compila para producción |
| `npm run preview` | Previsualiza el build de producción |

## 📚 Documentación de la API

Una vez que el servidor esté ejecutándose, puedes acceder a:

| Recurso | URL |
|---------|-----|
| **Swagger UI** | http://localhost:3000/documentation |
| **API Docs** | http://localhost:3000/docs |

## 🔐 Autenticación

La API utiliza **JWT (JSON Web Tokens)** para autenticación. Los endpoints protegidos requieren un header:

```
Authorization: Bearer <token>
```

### Flujo de autenticación

```mermaid
sequenceDiagram
    participant C as Cliente
    participant A as API
    C->>A: POST /api/auth/register
    A-->>C: Usuario creado
    C->>A: POST /api/auth/login
    A-->>C: Access Token + Refresh Token
    C->>A: GET /api/protected (+ Bearer Token)
    A-->>C: Datos protegidos
    C->>A: POST /api/auth/refresh
    A-->>C: Nuevo Access Token
```

## 🎯 Endpoints Principales

### 🔑 Autenticación
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/auth/register` | Registrar usuario |
| POST | `/api/auth/login` | Iniciar sesión |
| POST | `/api/auth/refresh` | Refrescar token |

### 🏆 Torneos
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/tournaments` | Listar torneos |
| POST | `/api/tournaments` | Crear torneo |
| GET | `/api/tournaments/:id` | Obtener torneo |
| POST | `/api/tournaments/:id/generate-bracket` | Generar bracket |

### 👥 Equipos
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/teams` | Crear equipo |
| GET | `/api/teams/:id` | Obtener equipo |
| POST | `/api/teams/:id/players` | Agregar jugador |

### ⚔️ Partidas
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/matches/:id` | Obtener partida |
| POST | `/api/matches/:id/results` | Reportar resultado |
| POST | `/api/matches/:id/validate` | Validar resultado |

## 🧪 Testing

```bash
# Ejecutar todos los tests
npm test

# Tests con coverage detallado
npm run test -- --coverage

# Tests en modo watch
npm run test:watch

# Tests específicos
npm test -- --testPathPattern=auth
npm test -- --testPathPattern=tournaments
npm test -- --testPathPattern=integration
```

## 📊 Base de Datos

### Diagrama ER simplificado

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    User     │────<│    Team     │────<│   Player    │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                           │
                    ┌──────┴──────┐
                    │ Tournament  │
                    └──────┬──────┘
                           │
                    ┌──────┴──────┐
                    │    Match    │
                    └─────────────┘
```

### Comandos de Prisma

```bash
# Crear nueva migración
npx prisma migrate dev --name nombre_migracion

# Aplicar migraciones pendientes
npm run prisma:migrate

# Resetear base de datos (solo desarrollo)
npx prisma migrate reset

# Abrir Prisma Studio
npm run prisma:studio
```

## ⚙️ Variables de Entorno

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `DATABASE_URL` | URL de conexión a PostgreSQL | `postgresql://user:pass@localhost:5432/db` |
| `JWT_SECRET` | Clave secreta para JWT | `mi-clave-super-secreta` |
| `JWT_EXPIRES_IN` | Expiración del access token | `7d` |
| `JWT_REFRESH_SECRET` | Clave para refresh tokens | `otra-clave-secreta` |
| `JWT_REFRESH_EXPIRES_IN` | Expiración del refresh token | `30d` |
| `PORT` | Puerto del servidor | `3000` |
| `NODE_ENV` | Entorno de ejecución | `development` / `production` |
| `CORS_ORIGIN` | Orígenes permitidos | `http://localhost:5173` |

## 🚀 Despliegue

### Build para Producción

```bash
# Backend
npm run build
npm start

# Frontend
cd fronted
npm run build
```

### Docker (opcional)

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
COPY prisma ./prisma
RUN npx prisma generate
EXPOSE 3000
CMD ["npm", "start"]
```

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/NuevaCaracteristica`)
3. Commit tus cambios (`git commit -m 'Agregar nueva característica'`)
4. Push a la rama (`git push origin feature/NuevaCaracteristica`)
5. Abre un Pull Request

### Guía de estilo

- Usa **TypeScript** para todo el código del backend
- Sigue las reglas de **ESLint** configuradas
- Formatea el código con **Prettier**
- Escribe **tests** para nuevas funcionalidades
- Documenta los endpoints con **Swagger/OpenAPI**

## 📝 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## 👤 Autor

**JatnielCarr**
- GitHub: [@JatnielCarr](https://github.com/JatnielCarr)

## 📞 Soporte

- 📧 Abre un [Issue](https://github.com/JatnielCarr/EA-Sport/issues) en GitHub
- 💬 Consulta la [documentación de la API](http://localhost:3000/documentation)

---

<div align="center">

**⭐ Si este proyecto te fue útil, considera darle una estrella en GitHub ⭐**

Hecho con ❤️ para la comunidad de esports

</div>
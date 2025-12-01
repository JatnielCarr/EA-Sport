# Esports Tournament API

Una API RESTful completa para la gestión de torneos de esports y videojuegos competitivos. Construida con Node.js, TypeScript, Fastify y PostgreSQL.

## 🚀 Características

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

## 🛠️ Stack Tecnológico

- **Node.js** 20+
- **TypeScript** con configuración strict
- **Fastify** (framework web de alto rendimiento)
- **PostgreSQL** 16
- **Prisma** (ORM)
- **Zod** (validación)
- **JWT** con bcrypt para autenticación
- **Jest** + Supertest para testing
- **Pino** para logging

## 📁 Estructura del Proyecto

```
src/
├── config/           # Configuración de base de datos y Swagger
├── controllers/      # Controladores de la API
├── middlewares/      # Middlewares de autenticación y validación
├── routes/          # Definición de rutas
├── schemas/         # Esquemas de validación Zod
├── services/        # Lógica de negocio
├── types/           # Definiciones de tipos TypeScript
├── utils/           # Utilidades (JWT, bracket generator, etc.)
├── app.ts           # Configuración principal de Fastify
└── server.ts        # Punto de entrada del servidor
```

## 🚀 Inicio Rápido

### Prerrequisitos

- Node.js 20+
- PostgreSQL 16
- npm o yarn

### Instalación

1. **Clona el repositorio**
   ```bash
   git clone <repository-url>
   cd esports-tournament-api
   ```

2. **Instala las dependencias**
   ```bash
   npm install
   ```

3. **Configura la base de datos**
   ```bash
   # Crea una base de datos PostgreSQL
   createdb esports_tournament_db

   # Copia el archivo de variables de entorno
   cp .env.example .env

   # Edita .env con tus configuraciones
   nano .env
   ```

4. **Configura Prisma**
   ```bash
   # Genera el cliente de Prisma
   npm run prisma:generate

   # Ejecuta las migraciones
   npm run prisma:migrate

   # (Opcional) Abre Prisma Studio para ver la base de datos
   npm run prisma:studio
   ```

5. **Inicia el servidor**
   ```bash
   # Desarrollo con hot reload
   npm run dev

   # Producción
   npm run build
   npm start
   ```

### Testing

```bash
# Ejecuta todos los tests
npm test

# Ejecuta tests con coverage
npm run test:coverage

# Ejecuta tests en modo watch
npm run test:watch
```

## 📚 Documentación de la API

Una vez que el servidor esté ejecutándose, puedes acceder a:

- **API Documentation**: http://localhost:3000/documentation
- **Swagger UI**: http://localhost:3000/docs

## 🔐 Autenticación

La API utiliza JWT (JSON Web Tokens) para autenticación. Los endpoints protegidos requieren un header `Authorization: Bearer <token>`.

### Flujo de autenticación:

1. **Registro**: `POST /api/auth/register`
2. **Login**: `POST /api/auth/login`
3. **Refresh Token**: `POST /api/auth/refresh` (cuando el access token expire)

## 🎯 Endpoints Principales

### Autenticación
- `POST /api/auth/register` - Registrar usuario
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh token

### Torneos
- `GET /api/tournaments` - Listar torneos
- `POST /api/tournaments` - Crear torneo
- `GET /api/tournaments/:id` - Obtener torneo
- `POST /api/tournaments/:id/generate-bracket` - Generar bracket

### Equipos
- `POST /api/teams` - Crear equipo
- `GET /api/teams/:id` - Obtener equipo
- `POST /api/teams/:id/players` - Agregar jugador

### Matches
- `GET /api/matches/:id` - Obtener match
- `POST /api/matches/:id/results` - Reportar resultado
- `POST /api/matches/:id/validate` - Validar resultado

## 🧪 Testing

Los tests están organizados por módulos:

```bash
# Tests de autenticación
npm test -- --testPathPattern=auth

# Tests de torneos
npm test -- --testPathPattern=tournaments

# Tests de integración
npm test -- --testPathPattern=integration
```

## 📊 Base de Datos

### Migraciones

```bash
# Crear nueva migración
npx prisma migrate dev --name nombre_de_la_migracion

# Aplicar migraciones
npm run prisma:migrate

# Resetear base de datos (desarrollo)
npx prisma migrate reset
```

### Seeds

Para poblar la base de datos con datos de prueba:

```bash
npx prisma db seed
```

## 🚀 Despliegue

### Variables de Entorno

Configura estas variables en producción:

```env
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:5432/db
JWT_SECRET=tu-secreto-muy-seguro
PORT=3000
```

### Build para Producción

```bash
npm run build
npm start
```

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## 📞 Soporte

Para soporte, email a support@esports-tournament.com o abre un issue en GitHub.

---

**Nota**: Esta API está diseñada para ser escalable y mantener altos estándares de calidad de código. Todos los endpoints incluyen validación, documentación completa y manejo de errores consistente.
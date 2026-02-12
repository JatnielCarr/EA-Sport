# Dockerfile para el Backend y Bot de Telegram - ApexTournament
FROM node:20-alpine

# Directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependencias
RUN npm ci --only=production

# Generar cliente de Prisma
RUN npx prisma generate

# Copiar el resto del código
COPY src ./src/
COPY tsconfig.json ./

# Compilar TypeScript
RUN npm run build 2>/dev/null || npx tsc

# Exponer puerto del API
EXPOSE 3000

# Variable de entorno para producción
ENV NODE_ENV=production

# Comando por defecto (puede ser sobrescrito en docker-compose)
CMD ["node", "dist/server.js"]

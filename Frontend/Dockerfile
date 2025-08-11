# ETAPA DE COMPILACIÓN
FROM node:22-alpine AS build

WORKDIR /app

# Copiar primero el archivo .env y los archivos de dependencias
COPY .env* package*.json ./
RUN npm ci

# Copiar el resto del código fuente
COPY . .

#ENV NODE_ENV=production
ARG VITE_NODE_ENV=production
ENV VITE_NODE_ENV=$VITE_NODE_ENV
# Compilar la aplicación (utilizará el archivo .env automáticamente)
RUN npm run build

# ETAPA DE PRODUCCIÓN
FROM nginx:stable-alpine

# Copiar la configuración personalizada de nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Configuración para SPA (Single Page Application)
RUN echo 'server { \
    listen 80; \
    server_name _; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
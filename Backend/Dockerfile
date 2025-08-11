FROM node:22-alpine AS build

WORKDIR /app
COPY .env package*.json ./
RUN npm ci --only=production

FROM node:22-alpine

WORKDIR /app

# Usuario no privilegiado para Alpine
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=build /app/node_modules ./node_modules
COPY . .

RUN chown -R appuser:appgroup /app
USER appuser

#ENV NODE_ENV=production
ARG NODE_ENV=production
ENV NODE_ENV=$NODE_ENV

EXPOSE 3000
CMD ["node", "app.js"]
# Stage 1 — Angular production build
FROM node:22-alpine AS build

WORKDIR /app

ENV CI=true

COPY package.json package-lock.json ./

RUN npm ci \
    && npm cache clean --force

COPY angular.json tsconfig.json tsconfig.app.json tsconfig.spec.json ./
COPY public ./public
COPY src ./src

RUN npm run build -- --configuration production


# Stage 2 — Nginx serving the static SPA build
FROM nginx:alpine AS production

# Where Nginx forwards /api/* (overridable at runtime / in docker-compose)
ENV API_GATEWAY_URL=http://quantumcart-api-gateway:8000

COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s \
    --timeout=5s \
    --start-period=10s \
    --retries=3 \
    CMD wget -q --spider http://127.0.0.1/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]

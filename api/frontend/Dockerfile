# Stage 1: Build
FROM node:20-bookworm-slim AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# VITE_API_BASE="" for same-origin requests (Nginx proxies /api and conversion routes)
ARG VITE_API_BASE=
ENV VITE_API_BASE=$VITE_API_BASE

RUN npm run build

# Stage 2: Serve with Nginx (HTTPS)
FROM nginx:alpine

RUN apk add --no-cache openssl

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY docker-entrypoint.sh /docker-entrypoint.sh

# Corriger les fins de ligne Windows (CRLF -> LF) pour exec sous Linux
RUN sed -i 's/\r$//' /docker-entrypoint.sh && chmod +x /docker-entrypoint.sh && mkdir -p /etc/nginx/ssl

EXPOSE 80 443

ENTRYPOINT ["/docker-entrypoint.sh"]

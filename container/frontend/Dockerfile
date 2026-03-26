FROM node:20-alpine AS build

WORKDIR /app

# Install deps first (better layer caching)
COPY api/frontend/package.json api/frontend/package-lock.json ./
RUN npm ci

# Copy source
COPY api/frontend/ ./

# Build-time API base for Vite
ARG VITE_API_BASE=/api
ENV VITE_API_BASE=${VITE_API_BASE}

RUN npm run build


FROM nginx:1.27-alpine

# Nginx will automatically envsubst templates from /etc/nginx/templates/*.template
COPY container/nginx/default.conf.template /etc/nginx/templates/default.conf.template

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80


FROM node:20-alpine

# Install Pandoc (required for Markdown -> AsciiDoc and HTML conversions via safeSpawn('pandoc', ...))
# On recent Alpine (3.21/3.22, base of node:20-alpine), the 'pandoc' executable is provided
# by the 'pandoc-cli' package (community repo), not by a bare 'pandoc' package.
RUN apk add --no-cache pandoc-cli

WORKDIR /app/api/backend

# Install production dependencies
COPY api/backend/package.json api/backend/package-lock.json ./
RUN npm ci --omit=dev

# Copy backend source
COPY api/backend/ ./

# Preserve repository-relative require() paths used by backend modules:
# - /app/api/shared (shared helpers)
# - /app/lib (root-level libs)
COPY api/shared/ /app/api/shared/
COPY lib/ /app/lib/

# Prepare runtime directories (mounted by docker-compose as named volumes)
RUN mkdir -p /app/api/logs /app/api/backend/tmp && chown -R node:node /app/api/logs /app/api/backend/tmp /app

ENV NODE_ENV=production
ENV PORT=3003
ENV LOGS_DIR=/app/api/logs
ENV TMPDIR=/app/api/backend/tmp

USER node

EXPOSE 3003

CMD ["node", "server.js"]


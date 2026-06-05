# Backend Ascend - Node.js + Pandoc
# Build context: repo root (.) - backend requires lib/ (downdoc) and api/shared/
FROM node:20-bookworm-slim

# Install Pandoc (required by README)
RUN apt-get update && apt-get install -y --no-install-recommends \
    pandoc \
    && rm -rf /var/lib/apt/lists/*

# Structure: /app/api/backend + /app/api/shared (same as repo)
WORKDIR /app

# Copy backend package files
COPY api/backend/package*.json ./api/backend/
RUN cd api/backend && npm ci --omit=dev

# Copy backend, shared (sibling), and lib (downdoc at repo root)
COPY api/backend ./api/backend/
COPY api/shared ./api/shared/
COPY lib ./lib/

WORKDIR /app/api/backend

# Create runtime directories (logs, tmp for conversions)
RUN mkdir -p /app/api/backend/logs /app/api/backend/tmp

EXPOSE 3003

ENV NODE_ENV=production
ENV PORT=3003
ENV LOGS_DIR=/app/api/backend/logs
ENV TMPDIR=/app/api/backend/tmp

CMD ["node", "server.js"]

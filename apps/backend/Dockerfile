# ── Stage 1: Build ─────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy workspace package manifests & Prisma schema for layer caching
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/frontend/package.json ./apps/frontend/
COPY apps/backend/package.json ./apps/backend/
COPY prisma ./prisma

# Configure pnpm network timeouts & retries for network stability
RUN pnpm config set fetch-retries 5 && \
    pnpm config set fetch-retry-maxtimeout 180000 && \
    pnpm config set fetch-timeout 600000 && \
    pnpm install --frozen-lockfile --ignore-scripts

RUN npx prisma generate

# Copy full source code
COPY . ./

# Build backend
RUN npx nx build backend --skip-nx-cache

# ── Stage 2: Production ───────────────────────────────────────────
FROM node:22-alpine AS production
WORKDIR /app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Create non-root user
RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup

# Copy built output & prisma schema
COPY --from=builder /app/apps/backend/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/backend/package.json ./apps/backend/

# Install dependencies and generate Prisma client
RUN pnpm config set fetch-retries 5 && \
    pnpm config set fetch-timeout 600000 && \
    pnpm install --frozen-lockfile --ignore-scripts

RUN npx prisma generate

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/health || exit 1

CMD ["node", "dist/main.js"]

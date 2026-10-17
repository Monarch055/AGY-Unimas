# Multi-stage Dockerfile for Next.js PWA with Monorepo Workspaces
FROM node:22-alpine AS builder
WORKDIR /workspace

# 1. Copy workspace configuration and package manifests first to leverage Docker layer caching
COPY package.json package-lock.json ./
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/shared-core/package.json ./packages/shared-core/
COPY apps/web/package.json ./apps/web/

# 2. Install workspace dependencies (CACHED unless package.json / package-lock.json changes)
RUN npm install

# 3. Copy source code after dependencies are installed
COPY packages/shared-types ./packages/shared-types
COPY packages/shared-core ./packages/shared-core
COPY apps/web ./apps/web

# 4. Build Next.js application
WORKDIR /workspace/apps/web
RUN npm run build

# Runner Stage
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy Next.js build artifacts and runtime dependencies
COPY --from=builder /workspace/apps/web/.next ./.next
COPY --from=builder /workspace/apps/web/public ./public
COPY --from=builder /workspace/apps/web/package.json ./package.json
COPY --from=builder /workspace/node_modules ./node_modules
COPY --from=builder /workspace/packages ./packages

EXPOSE 3000

CMD ["npm", "run", "start"]

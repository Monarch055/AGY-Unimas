# Multi-stage Dockerfile for Next.js PWA with Monorepo Workspaces
FROM node:22-alpine AS builder
WORKDIR /workspace

# Copy workspace config and package definitions
COPY package.json ./
COPY packages/shared-types ./packages/shared-types
COPY packages/shared-core ./packages/shared-core
COPY apps/web ./apps/web

# Install all workspace dependencies
RUN npm install

# Build Next.js application
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

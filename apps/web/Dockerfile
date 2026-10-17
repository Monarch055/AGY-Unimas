FROM node:22-alpine AS builder
WORKDIR /workspace

COPY packages/shared-types ./packages/shared-types
COPY packages/shared-core ./packages/shared-core
COPY apps/web ./apps/web

WORKDIR /workspace/apps/web
RUN npm install --legacy-peer-deps && npm run build

FROM node:22-alpine AS runner
WORKDIR /workspace/apps/web
ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder /workspace/apps/web/.next ./.next
COPY --from=builder /workspace/apps/web/public ./public
COPY --from=builder /workspace/apps/web/package.json ./package.json
COPY --from=builder /workspace/apps/web/node_modules ./node_modules

EXPOSE 3000
CMD ["npm", "run", "start"]

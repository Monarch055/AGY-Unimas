FROM node:22-alpine AS builder
WORKDIR /workspace

COPY packages/shared-types ./packages/shared-types
COPY packages/shared-core ./packages/shared-core
COPY apps/web ./apps/web

WORKDIR /workspace/apps/web

RUN node -e "const fs=require('fs');const p=JSON.parse(fs.readFileSync('package.json','utf8'));delete p.dependencies['@rekasains/shared-types'];delete p.dependencies['@rekasains/shared-core'];fs.writeFileSync('package.json',JSON.stringify(p,null,2));"

RUN npm install --legacy-peer-deps

RUN mkdir -p node_modules/@rekasains && cp -r /workspace/packages/shared-types node_modules/@rekasains/shared-types && cp -r /workspace/packages/shared-core node_modules/@rekasains/shared-core

# Rewrite targets are baked in at build time; defaults match the docker-compose service names.
ARG CORE_API_INTERNAL_URL=http://core-api:8080
ARG AI_AGENT_INTERNAL_URL=http://ai-agent:8081
ENV CORE_API_INTERNAL_URL=$CORE_API_INTERNAL_URL
ENV AI_AGENT_INTERNAL_URL=$AI_AGENT_INTERNAL_URL

RUN npm run build

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

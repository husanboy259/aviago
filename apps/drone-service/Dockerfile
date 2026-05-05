FROM node:20-alpine AS base
WORKDIR /app
RUN npm install -g pnpm

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/common/package.json ./packages/common/
COPY apps/drone-service/package.json ./apps/drone-service/
RUN pnpm install --frozen-lockfile

FROM deps AS builder
COPY packages/common ./packages/common
COPY apps/drone-service ./apps/drone-service
RUN pnpm --filter @delidrone/drone-service build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/apps/drone-service/dist ./dist
COPY --from=deps    /app/node_modules              ./node_modules
COPY --from=deps    /app/apps/drone-service/package.json ./package.json
EXPOSE 3005
CMD ["node", "dist/main"]

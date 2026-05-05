FROM node:20-alpine AS base
WORKDIR /app
RUN npm install -g pnpm

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/common/package.json ./packages/common/
COPY apps/user-service/package.json ./apps/user-service/
RUN pnpm install --frozen-lockfile

FROM deps AS builder
COPY packages/common ./packages/common
COPY apps/user-service ./apps/user-service
RUN pnpm --filter @delidrone/user-service build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/apps/user-service/dist ./dist
COPY --from=deps    /app/node_modules             ./node_modules
COPY --from=deps    /app/apps/user-service/package.json ./package.json
EXPOSE 3002
CMD ["node", "dist/main"]

FROM node:20-alpine AS base
WORKDIR /app
RUN npm install -g pnpm

# Install deps
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY tsconfig.base.json ./
COPY packages/common/package.json ./packages/common/
COPY apps/auth-service/package.json ./apps/auth-service/
RUN pnpm install --frozen-lockfile

# Build
FROM deps AS builder
COPY packages/common ./packages/common
COPY apps/auth-service ./apps/auth-service
RUN pnpm --filter @delidrone/common build && pnpm --filter @delidrone/auth-service build

# Runtime
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/apps/auth-service/dist ./dist
COPY --from=deps    /app/node_modules             ./node_modules
COPY --from=deps    /app/apps/auth-service/package.json ./package.json

EXPOSE 3007
CMD ["node", "dist/main"]

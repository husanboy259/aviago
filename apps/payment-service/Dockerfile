FROM node:20-alpine AS base
WORKDIR /app
RUN npm install -g pnpm

# ── Install dependencies ──────────────────────────────────────
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY tsconfig.base.json ./
COPY packages/common/package.json ./packages/common/
COPY apps/payment-service/package.json ./apps/payment-service/
RUN pnpm install --frozen-lockfile

# ── Build ─────────────────────────────────────────────────────
FROM deps AS builder
COPY packages/common ./packages/common
COPY apps/payment-service ./apps/payment-service
RUN pnpm --filter @delidrone/common build && pnpm --filter @delidrone/payment-service build
# Create isolated deployment with flat node_modules (no pnpm symlinks)
RUN pnpm --filter @delidrone/payment-service deploy --prod /deploy

# ── Runtime ───────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=10000
COPY --from=builder /deploy/node_modules        ./node_modules
COPY --from=builder /app/apps/payment-service/dist  ./dist
COPY --from=deps    /app/apps/payment-service/package.json ./package.json
EXPOSE 10000
CMD ["node", "dist/main"]
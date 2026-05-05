#!/usr/bin/env bash
set -e

echo "🚁 DeliDrone — Dev Setup"
echo "========================="

# Check prerequisites
command -v node  >/dev/null 2>&1 || { echo "❌ Node.js >=20 required"; exit 1; }
command -v pnpm  >/dev/null 2>&1 || { echo "⚙️  Installing pnpm…"; npm install -g pnpm@9; }
command -v docker>/dev/null 2>&1 || { echo "❌ Docker required for infra"; exit 1; }

# Copy env file
if [ ! -f .env ]; then
  cp .env.example .env
  echo "✅ .env created from .env.example — fill in secrets before starting"
fi

# Install dependencies
echo "📦 Installing dependencies…"
pnpm install

# Start infrastructure (PostgreSQL + Redis)
echo "🐳 Starting infrastructure…"
docker-compose up -d postgres redis

echo "⏳ Waiting for PostgreSQL to be ready…"
until docker-compose exec -T postgres pg_isready -U delidrone 2>/dev/null; do
  sleep 1
done
echo "✅ PostgreSQL ready"

# Create individual databases
echo "🗄️  Creating service databases…"
for db in delidrone_auth delidrone_users delidrone_restaurants delidrone_orders delidrone_drones delidrone_payments delidrone_analytics; do
  docker-compose exec -T postgres psql -U delidrone -c "CREATE DATABASE $db;" 2>/dev/null || true
  echo "   ✓ $db"
done

echo ""
echo "✅ Setup complete!"
echo ""
echo "Start all services:      pnpm dev"
echo "Start just backend:      pnpm --filter './apps/!(web)' dev"
echo "Start just frontend:     pnpm --filter @delidrone/web dev"
echo "API Gateway:             http://localhost:3000"
echo "Swagger docs:            http://localhost:3000/api/docs"
echo "Web app:                 http://localhost:3030"
echo ""

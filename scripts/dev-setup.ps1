# DeliDrone — Windows Dev Setup Script
# Run from the delidrone/ directory:
#   powershell -ExecutionPolicy Bypass -File scripts\dev-setup.ps1

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "   DeliDrone — Dev Setup (Windows)   " -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# ── Prerequisites check ───────────────────────────────────────────────────────
$nodeVer = node --version 2>$null
if (-not $nodeVer) { Write-Error "Node.js >= 20 is required. Install from https://nodejs.org"; exit 1 }
Write-Host "✓ Node.js $nodeVer" -ForegroundColor Green

$pnpmVer = pnpm --version 2>$null
if (-not $pnpmVer) {
    Write-Host "  Installing pnpm..." -ForegroundColor Yellow
    npm install -g pnpm@9
}
Write-Host "✓ pnpm $pnpmVer" -ForegroundColor Green

$dockerVer = docker --version 2>$null
if (-not $dockerVer) {
    Write-Host "⚠  Docker Desktop not found — you'll need it to run PostgreSQL & Redis." -ForegroundColor Yellow
    Write-Host "   Download: https://www.docker.com/products/docker-desktop/" -ForegroundColor Yellow
} else {
    Write-Host "✓ $dockerVer" -ForegroundColor Green
}

# ── Copy env file ─────────────────────────────────────────────────────────────
if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "✓ .env created — fill in secrets before starting production" -ForegroundColor Green
} else {
    Write-Host "✓ .env already exists" -ForegroundColor Green
}

# ── Install dependencies ──────────────────────────────────────────────────────
Write-Host ""
Write-Host "📦 Installing dependencies..." -ForegroundColor Cyan
pnpm install --no-frozen-lockfile
Write-Host "✓ Dependencies installed" -ForegroundColor Green

# ── Start infrastructure ──────────────────────────────────────────────────────
if ($dockerVer) {
    Write-Host ""
    Write-Host "🐳 Starting PostgreSQL + Redis..." -ForegroundColor Cyan
    docker compose up -d postgres redis

    Write-Host "  Waiting for PostgreSQL..." -ForegroundColor Yellow
    $retries = 0
    do {
        Start-Sleep -Seconds 2
        $ready = docker compose exec -T postgres pg_isready -U delidrone 2>$null
        $retries++
    } while (-not $ready -and $retries -lt 20)

    if ($retries -ge 20) {
        Write-Host "  ⚠  PostgreSQL did not become ready in time" -ForegroundColor Yellow
    } else {
        Write-Host "✓ PostgreSQL ready" -ForegroundColor Green
    }

    # Create per-service databases
    Write-Host ""
    Write-Host "🗄  Creating service databases..." -ForegroundColor Cyan
    $databases = @(
        "delidrone_auth",
        "delidrone_users",
        "delidrone_restaurants",
        "delidrone_orders",
        "delidrone_drones",
        "delidrone_payments",
        "delidrone_analytics"
    )
    foreach ($db in $databases) {
        docker compose exec -T postgres psql -U delidrone -c "CREATE DATABASE $db;" 2>$null | Out-Null
        Write-Host "  ✓ $db" -ForegroundColor Green
    }
}

# ── Done ──────────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "   ✅  Setup Complete!                " -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Start individual services (each in its own terminal):" -ForegroundColor White
Write-Host "  pnpm dev:gateway     → http://localhost:3000  (API Gateway + Swagger)" -ForegroundColor Gray
Write-Host "  pnpm dev:auth        → http://localhost:3001" -ForegroundColor Gray
Write-Host "  pnpm dev:user        → http://localhost:3002" -ForegroundColor Gray
Write-Host "  pnpm dev:restaurant  → http://localhost:3003" -ForegroundColor Gray
Write-Host "  pnpm dev:order       → http://localhost:3004  (WebSocket: /orders)" -ForegroundColor Gray
Write-Host "  pnpm dev:drone       → http://localhost:3005  (WebSocket: /tracking)" -ForegroundColor Gray
Write-Host "  pnpm dev:payment     → http://localhost:3006" -ForegroundColor Gray
Write-Host "  pnpm dev:web         → http://localhost:3030  (Next.js frontend)" -ForegroundColor Gray
Write-Host ""
Write-Host "Swagger docs (after starting gateway):  http://localhost:3000/api/docs" -ForegroundColor Cyan
Write-Host ""

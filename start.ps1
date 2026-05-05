# Airo Go — Start All Services
$base = "C:\Users\Lenovo\OneDrive\Desktop\my_projects\xayotbek oka\delidrone\apps"

$services = @(
  @{ name = "Auth Service        :3007"; dir = "auth-service";         cmd = "node dist/main" },
  @{ name = "User Service        :3002"; dir = "user-service";         cmd = "node dist/main" },
  @{ name = "Restaurant Service  :3003"; dir = "restaurant-service";   cmd = "node dist/main" },
  @{ name = "Order Service       :3004"; dir = "order-service";        cmd = "node dist/main" },
  @{ name = "Drone Service       :3005"; dir = "drone-service";        cmd = "node dist/main" },
  @{ name = "Payment Service     :3006"; dir = "payment-service";      cmd = "node dist/main" },
  @{ name = "Notification Svc    :3009"; dir = "notification-service"; cmd = "node dist/main" },
  @{ name = "Analytics Service   :3008"; dir = "analytics-service";    cmd = "node dist/main" },
  @{ name = "API Gateway         :3000"; dir = "api-gateway";          cmd = "node dist/main" },
  @{ name = "Web App             :3030"; dir = "web";                  cmd = "pnpm dev"       }
)

Write-Host ""
Write-Host "  ____  _               ____       " -ForegroundColor Green
Write-Host " / _  |(_)_ __  ___   / ___| ___  " -ForegroundColor Green
Write-Host "| (_| || | '__/ _ \ | |  _ / _ \ " -ForegroundColor Green
Write-Host " \__,_||_|_|  \___/  |_____|\___/ " -ForegroundColor Green
Write-Host ""
Write-Host " Starting all services..." -ForegroundColor Cyan
Write-Host ""

foreach ($svc in $services) {
  $path = "$base\$($svc.dir)"
  $title = $svc.name
  $cmd   = $svc.cmd

  Start-Process powershell -ArgumentList `
    "-NoExit", `
    "-Command", `
    "`$Host.UI.RawUI.WindowTitle = '$title'; cd '$path'; Write-Host '>> $title started' -ForegroundColor Green; $cmd"

  Write-Host "  ✅ $title" -ForegroundColor Green
  Start-Sleep -Milliseconds 300
}

Write-Host ""
Write-Host "  ✅ All services started!" -ForegroundColor Green
Write-Host ""
Write-Host "  Web App  →  http://localhost:3030"       -ForegroundColor Cyan
Write-Host "  API Docs →  http://localhost:3000/api/docs" -ForegroundColor Cyan
Write-Host ""

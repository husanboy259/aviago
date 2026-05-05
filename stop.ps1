# Airo Go — Stop All Services
@(3000, 3002, 3003, 3004, 3005, 3006, 3007, 3008, 3009, 3030) | ForEach-Object {
  $port   = $_
  $result = netstat -ano | Select-String ":$port\s.*LISTENING"
  if ($result) {
    $procId = ($result[0].Line.Trim() -split '\s+')[-1]
    if ($procId -match '^\d+$') {
      Stop-Process -Id ([int]$procId) -Force -ErrorAction SilentlyContinue
      Write-Host "  Stopped port $port" -ForegroundColor Yellow
    }
  }
}
Write-Host ""
Write-Host "  All services stopped!" -ForegroundColor Red

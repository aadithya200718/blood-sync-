@echo off
title BloodSync Stopper
color 0C

echo ===============================================================================
echo            BLOODSYNC -- STOPPING ALL SERVICES
echo ===============================================================================
echo.
echo Stopping processes on ports 3000 (Backend), 8000 (AI Service), and 5173 (Frontend)...

powershell -Command "foreach ($port in @(3000, 8000, 5173)) { $procId = (Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue).OwningProcess; if ($procId) { Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue; Write-Host ('  [OK] Terminated process on port ' + $port) } else { Write-Host ('  [-] No process found listening on port ' + $port) } }"

echo.
echo All BloodSync processes have been stopped.
echo ===============================================================================
pause

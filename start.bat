@echo off
title BloodSync Launcher
color 0B

echo ===============================================================================
echo            BLOODSYNC -- INTELLIGENT BLOOD BANK OPERATIONS SUITE
echo ===============================================================================
echo.
echo  [1/4] Checking Database Connectivity (MySQL 3306)...
powershell -Command "try { $client = New-Object System.Net.Sockets.TcpClient('localhost', 3306); $client.Close(); exit 0 } catch { exit 1 }"
if %ERRORLEVEL% NEQ 0 (
    echo  [!] WARNING: Could not connect to MySQL on port 3306.
    echo      Please make sure MySQL Service is running before logging in.
    echo.
) else (
    echo  [OK] MySQL Service detected on port 3306.
)
echo.

echo  [2/4] Starting Node.js Backend API on port 3000...
start "BloodSync - Backend API (Port 3000)" cmd /k "cd /d ""%~dp0backend"" && npm run dev"

echo  [3/4] Starting Agentic AI Service on port 8000...
start "BloodSync - AI Service (Port 8000)" cmd /k "cd /d ""%~dp0ai-service"" && python main.py"

echo  [4/4] Starting React Frontend on port 5173...
start "BloodSync - Frontend UI (Port 5173)" cmd /k "cd /d ""%~dp0frontend"" && npm run dev"

echo.
echo ===============================================================================
echo  SERVICES INITIALIZING:
echo    • Frontend Web Portal : http://localhost:5173
echo    • Backend Express API : http://localhost:3000/api/health
echo    • Agentic AI Service  : http://localhost:8000
echo.
echo  TEST CREDENTIALS (Password: password123 for all):
echo    • Admin User    : admin@bloodsync.local
echo    • Technician    : john@bloodsync.local
echo    • Operations Mgr: sarah@bloodsync.local
echo    • Auditor       : auditor@bloodsync.local
echo.
echo  Database contains 1,150+ blood units and 4,000+ realistic clinical records!
echo ===============================================================================
echo.
echo  Waiting 5 seconds for dev servers to boot before opening browser...
timeout /t 5 /nobreak >nul

echo  Opening BloodSync in your browser...
start http://localhost:5173

echo.
echo  To shut down all services at any time, run: stop.bat
echo ===============================================================================

@echo off
echo Starting muStatistics...

:: Add PostgreSQL to PATH for this session
set PATH=%PATH%;C:\Program Files\PostgreSQL\17\bin

:: Start API
start "muStatistics API" cmd /k "cd /d C:\muStatistics\apps\api && pnpm dev"

:: Wait 3 seconds for API to boot before starting web
timeout /t 3 /nobreak >nul

:: Start Web
start "muStatistics Web" cmd /k "cd /d C:\muStatistics\apps\web && pnpm dev"

:: Wait 3 seconds then open browser
timeout /t 3 /nobreak >nul
start "" "http://localhost:3000"

echo Done. Two terminal windows are running.
echo Close them to stop muStatistics.

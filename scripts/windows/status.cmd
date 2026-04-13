@echo off
echo --- Port 3000 ---
netstat -ano | findstr :3000
echo.
echo --- Port 4000 ---
netstat -ano | findstr :4000
echo.
echo --- Browser app ---
start "" http://localhost:3000/
echo --- API health ---
start "" http://localhost:4000/health

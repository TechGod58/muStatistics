@echo off
setlocal

set BASE=http://localhost:4000
set COOKIE=%TEMP%\muStatistics-smoke-cookie.txt

echo [1/5] Health
curl.exe -s %BASE%/health

echo.
echo [2/5] Login as demo student
curl.exe -s -c "%COOKIE%" -H "Content-Type: application/json" -d "{\"username\":\"student1\",\"password\":\"demo123\"}" %BASE%/auth/login

echo.
echo [3/5] Projects
curl.exe -s -b "%COOKIE%" %BASE%/projects

echo.
echo [4/5] Sources
curl.exe -s -b "%COOKIE%" "%BASE%/sources?projectId=project-demo"

echo.
echo [5/5] Variables
curl.exe -s -b "%COOKIE%" "%BASE%/variables?projectId=project-demo"

echo.
del "%COOKIE%" >nul 2>&1
pause

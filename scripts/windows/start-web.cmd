@echo off
setlocal
cd /d "%~dp0\..\.."
set "COREPACK_CMD=%ProgramFiles%\nodejs\corepack.cmd"
if not exist "%COREPACK_CMD%" (
  echo Could not find "%COREPACK_CMD%".
  echo Install Node.js in the default location or update this script.
  exit /b 1
)
echo Starting web app from %CD%
set "PATH=%ProgramFiles%\nodejs;%PATH%"
call "%COREPACK_CMD%" pnpm --filter @mu/web dev
endlocal

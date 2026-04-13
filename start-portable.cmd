@echo off
setlocal

set "ROOT=%~dp0"
if not exist "%ROOT%apps\api\dist\index.js" (
  echo Portable start requires a built API. Run `pnpm -r build` first.
  exit /b 1
)

powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%scripts\portable\start-portable.ps1" -Root "%ROOT%" -ApiEntry "apps/api/dist/index.js"

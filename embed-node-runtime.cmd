@echo off
setlocal
set "ROOT=%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%scripts\portable\embed-node-runtime.ps1" -Root "%ROOT%"

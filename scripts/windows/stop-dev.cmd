@echo off
setlocal
for %%P in (3000 4000) do (
  for /f "tokens=5" %%I in ('netstat -ano ^| findstr :%%P ^| findstr LISTENING') do (
    echo Stopping PID %%I on port %%P
    taskkill /PID %%I /F >nul 2>&1
  )
)
echo Done.
endlocal

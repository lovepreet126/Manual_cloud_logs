@echo off
echo ========================================================
echo   Launching CloudSec LogForge (Backend + Frontend)
echo ========================================================

start "Backend Server (FastAPI)" cmd /c "cd /d %~dp0backend && python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

timeout /t 2 /nobreak >nul

start "Frontend Dashboard (Vite React)" cmd /c "cd /d %~dp0frontend && npm.cmd run dev"

echo.
echo Backend running on http://127.0.0.1:8000 (Docs: http://127.0.0.1:8000/docs)
echo Frontend will open in Vite dev server (usually http://localhost:5173)
echo.
pause

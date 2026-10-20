@echo off
echo ========================================================
echo   Starting Cloud Manual Activity Log Generator Backend
echo ========================================================
cd /d "%~dp0"
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
pause

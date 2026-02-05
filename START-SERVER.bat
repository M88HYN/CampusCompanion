@echo off
cd /d "%~dp0"
echo.
echo ============================================
echo   Starting CampusCompanion Server
echo ============================================
echo.
echo Backend will run on: http://127.0.0.1:5000
echo Frontend will run on: http://127.0.0.1:5173
echo.
echo Press Ctrl+C to stop the server
echo.
npm run dev
pause

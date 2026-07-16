@echo off
title Wanderlust AI - Local Server Launcher
echo ===================================================
echo [Wanderlust AI] Preparing Local Server...
echo ===================================================
echo.

echo [1/2] Installing dependencies if missing...
call npm install
if errorlevel 1 goto error

echo [2/2] Starting local development server...
start "" "http://localhost:3000"
call npm run dev
if errorlevel 1 goto error

pause
exit /b

:error
echo [ERROR] An error occurred while starting the application.
pause
exit /b

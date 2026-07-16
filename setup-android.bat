@echo off
title Wanderlust AI - Android Platform Setup
echo ===================================================
echo [Wanderlust AI] Starting Android Platform Setup...
echo ===================================================
echo.

echo [1/4] Installing dependencies...
call npm install
if errorlevel 1 goto error

echo [2/4] Building React web application...
call npm run build
if errorlevel 1 goto error

echo [3/4] Adding Android platform...
call npx cap add android
if errorlevel 1 goto error_sync

echo [4/4] Syncing web build files to Android project...
call npx cap sync
if errorlevel 1 goto error

echo ===================================================
echo [CONGRATULATIONS! SETUP COMPLETED]
echo.
echo The "android" folder has been successfully created.
echo.
echo Next Steps:
echo 1. Open Android Studio.
echo 2. Click [File] -> [Open] inside Android Studio.
echo 3. Select the "android" folder inside this directory.
echo ===================================================
pause
exit /b

:error_sync
echo [INFO] "android" folder might already exist, attempting sync...
call npx cap sync
if errorlevel 1 goto error
echo [SUCCESS] Sync complete!
pause
exit /b

:error
echo [ERROR] An error occurred during setup.
pause
exit /b

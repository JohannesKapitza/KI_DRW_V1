@echo off
echo ========================================
echo   KI_DRW_V1 - CATIA V5 CATPart Manager
echo ========================================
echo.

:: Get the directory where this batch file is located
set "PROJECT_DIR=%~dp0"

:: Check if backend node_modules exists
if not exist "%PROJECT_DIR%backend\node_modules" (
    echo Installing backend dependencies...
    pushd "%PROJECT_DIR%backend"
    call npm install
    popd
    echo.
)

:: Check if frontend node_modules exists
if not exist "%PROJECT_DIR%frontend\node_modules" (
    echo Installing frontend dependencies...
    pushd "%PROJECT_DIR%frontend"
    call npm install
    popd
    echo.
)

echo Starting Backend and Frontend servers...
echo.

:: Start Backend in a new window
start "Backend Server" cmd /k "cd /d "%PROJECT_DIR%backend" && node server.js"

:: Wait a moment for backend to start
timeout /t 2 /nobreak > nul

:: Start Frontend in a new window
start "Frontend Server" cmd /k "cd /d "%PROJECT_DIR%frontend" && npm start"

echo.
echo Servers are starting...
echo.
echo Backend:  http://localhost:3001
echo Frontend: http://localhost:3000
echo.
echo Close this window or press any key to exit this launcher.
echo (The servers will continue running in their own windows)
pause > nul

@echo off
echo ========================================
echo   KI_DRW_V1 - CATIA V5 CATPart Manager
echo ========================================
echo.

:: Get the directory where this batch file is located
set "PROJECT_DIR=%~dp0"
echo Project directory: %PROJECT_DIR%
echo.

:: Verify backend folder exists
if not exist "%PROJECT_DIR%backend" (
    echo ERROR: backend folder not found!
    echo Expected: %PROJECT_DIR%backend
    echo.
    echo Make sure you extracted the complete repository.
    echo The folder structure should be:
    echo   your-folder\
    echo     backend\
    echo       server.js
    echo       package.json
    echo     frontend\
    echo       package.json
    echo       src\
    echo     start.bat
    echo.
    pause
    exit /b 1
)

:: Verify frontend folder exists
if not exist "%PROJECT_DIR%frontend" (
    echo ERROR: frontend folder not found!
    echo Expected: %PROJECT_DIR%frontend
    echo.
    pause
    exit /b 1
)

:: Check if backend node_modules exists
if not exist "%PROJECT_DIR%backend\node_modules" (
    echo Installing backend dependencies...
    cd /d "%PROJECT_DIR%backend"
    if errorlevel 1 (
        echo ERROR: Could not navigate to backend folder
        pause
        exit /b 1
    )
    call npm install
    cd /d "%PROJECT_DIR%"
    echo.
)

:: Check if frontend node_modules exists
if not exist "%PROJECT_DIR%frontend\node_modules" (
    echo Installing frontend dependencies...
    cd /d "%PROJECT_DIR%frontend"
    if errorlevel 1 (
        echo ERROR: Could not navigate to frontend folder
        pause
        exit /b 1
    )
    call npm install
    cd /d "%PROJECT_DIR%"
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

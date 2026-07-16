@echo off
cd /d "%~dp0"
cd chess_pie_two\frontend\client

echo.
echo  ╔══════════════════════════════════════════╗
echo  ║         Chessperiment Launcher           ║
echo  ╚══════════════════════════════════════════╝
echo.

:: Check Node.js
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [X] Node.js is not installed.
    echo     Download it from: https://nodejs.org
    echo     Choose the LTS version.
    pause
    exit /b 1
)
echo [v] Node.js found: 
node --version

:: Create .env.local from example if missing
if not exist ".env.local" (
    if exist ".env.example" (
        copy .env.example .env.local >nul
        echo [i] Created .env.local from .env.example
        echo     Edit .env.local to configure Firebase if desired.
    )
)

:: Install dependencies if missing
if not exist "node_modules" (
    echo.
    echo [~] Installing dependencies (first run)...
    call npm install
    if %ERRORLEVEL% neq 0 (
        echo [X] npm install failed.
        pause
        exit /b 1
    )
)

:: Build if not already built
if not exist ".next" (
    echo.
    echo [~] Building application (first run)...
    call npm run build
    if %ERRORLEVEL% neq 0 (
        echo [X] Build failed.
        pause
        exit /b 1
    )
)

:: Start the server
echo.
echo  ╔══════════════════════════════════════════╗
echo  ║    Chessperiment is starting up...        ║
echo  ║                                          ║
echo  ║    Open: http://localhost:3000            ║
echo  ║                                          ║
echo  ║    Press Ctrl+C to stop the server       ║
echo  ╚══════════════════════════════════════════╝
echo.

npm start

echo.
echo Server stopped.
pause

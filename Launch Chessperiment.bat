@echo off
cd /d "%~dp0"
cd client

echo.
echo  +------------------------------------------+
echo  :         Chessperiment Launcher           :
echo  +------------------------------------------+
echo.

where node >nul 2>&1
if errorlevel 1 (    echo [X] Node.js is not installed.
    echo     Download from: https://nodejs.org
    pause
    exit /b 1
)
echo [v] Node.js found:
node --version

if not exist ".env.local" (
    if exist ".env.example" (
        copy .env.example .env.local >nul
        echo [i] Created .env.local
    )
)

if not exist "node_modules" (
    echo.
    echo [~] Installing dependencies...
    call npm install
    if errorlevel 1 ( echo [X] npm install failed. & pause & exit /b 1 )
)

if not exist ".next" (
    echo.
    echo [~] Building application...
    call npm run build
    if errorlevel 1 ( echo [X] Build failed. & pause & exit /b 1 )
)

echo.
echo  +------------------------------------------+
echo  :    Chessperiment is starting up...        :
echo  :                                          :
echo  :    Open: http://localhost:3000            :
echo  :                                          :
echo  :    Press Ctrl+C to stop the server       :
echo  +------------------------------------------+
echo.

npm start

echo.
echo Server stopped.
pause

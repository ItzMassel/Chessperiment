@echo off
cd /d "%~dp0"
cd client
echo.
echo  +------------------------------------------+
echo  ^|         Chessperiment Launcher           ^|
echo  +------------------------------------------+
echo.
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
echo.
echo  +------------------------------------------+
echo  ^|    All good! Server would start now       ^|
echo  +------------------------------------------+
echo.
pause

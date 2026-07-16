@echo off
title Chessperiment Dev Launcher

echo Starting Chessperiment development servers...
echo.

echo [1/2] Starting Backend (Express + Socket.io, port 3001)...
start "Chessperiment Backend" cmd /c "cd /d "%~dp0chess_pie_two\frontend\server" && npm run dev"

echo [2/2] Starting Frontend (Next.js, port 3000)...
start "Chessperiment Frontend" cmd /c "cd /d "%~dp0chess_pie_two\frontend\client" && npm run dev"

echo.
echo Both servers are starting. Close their windows to stop them.
echo.
pause

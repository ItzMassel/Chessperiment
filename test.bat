@echo off
echo Starting...
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo Node not found
    pause
    exit /b 1
)
echo Node found:
node --version
echo Done.
pause

@echo off
node --version
if not exist ".env.local" (
    echo .env.local does not exist
)
echo done
pause

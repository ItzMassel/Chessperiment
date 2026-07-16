#!/usr/bin/env bash
set -e

cd "$(dirname "$0")" || { echo "[X] Can't change to script directory"; exit 1; }
cd client || { echo "[X] Can't find the 'client' folder. Make sure this script is in the Chessperiment root."; exit 1; }

echo ""
echo " +------------------------------------------+"
echo " :         Chessperiment Launcher           :"
echo " +------------------------------------------+"
echo ""

if ! command -v node &> /dev/null; then
    echo "[X] Node.js is not installed."
    echo "    Download it from: https://nodejs.org"
    echo "    Choose the LTS version."
    read -n 1 -s -r -p "Press any key to exit..."
    exit 1
fi
echo "[v] Node.js found: $(node --version)"

if [ ! -f ".env.local" ] && [ -f ".env.example" ]; then
    cp .env.example .env.local
    echo "[i] Created .env.local from .env.example"
fi

if [ ! -d "node_modules" ]; then
    echo ""
    echo "[~] Installing dependencies (first run)..."
    npm install
fi

if [ ! -d ".next" ]; then
    echo ""
    echo "[~] Building application (first run)..."
    npm run build
fi

echo ""
echo " +------------------------------------------+"
echo " :    Chessperiment is starting up...        :"
echo " :                                          :"
echo " :    Open: http://localhost:3000            :"
echo " :                                          :"
echo " :    Press Ctrl+C to stop the server       :"
echo " +------------------------------------------+"
echo ""

npm start

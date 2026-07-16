#!/usr/bin/env bash
set -e

cd "$(dirname "$0")"
cd chess_pie_two/frontend/client

echo ""
echo " ╔══════════════════════════════════════════╗"
echo " ║         Chessperiment Launcher           ║"
echo " ╚══════════════════════════════════════════╝"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "[X] Node.js is not installed."
    echo "    Download it from: https://nodejs.org"
    echo "    Choose the LTS version."
    read -n 1 -s -r -p "Press any key to exit..."
    exit 1
fi
echo "[v] Node.js found: $(node --version)"

# Create .env.local from example if missing
if [ ! -f ".env.local" ] && [ -f ".env.example" ]; then
    cp .env.example .env.local
    echo "[i] Created .env.local from .env.example"
    echo "    Edit .env.local to configure Firebase if desired."
fi

# Install dependencies if missing
if [ ! -d "node_modules" ]; then
    echo ""
    echo "[~] Installing dependencies (first run)..."
    npm install
fi

# Build if not already built
if [ ! -d ".next" ]; then
    echo ""
    echo "[~] Building application (first run)..."
    npm run build
fi

# Start the server
echo ""
echo " ╔══════════════════════════════════════════╗"
echo " ║    Chessperiment is starting up...        ║"
echo " ║                                          ║"
echo " ║    Open: http://localhost:3000            ║"
echo " ║                                          ║"
echo " ║    Press Ctrl+C to stop the server       ║"
echo " ╚══════════════════════════════════════════╝"
echo ""

npm start

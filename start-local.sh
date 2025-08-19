#!/bin/bash

# Start both game and API services locally
# Make sure you're in the project root directory

echo "🚀 Starting Inkless Game Services..."

# Set environment variables for local development
export GAME_API_URL=http://localhost:8000
export GAME_FALLBACK_URL=https://your-website.com
export NODE_ENV=development

# Start the API server in the background
echo "📡 Starting API server on port 8000..."
cd score_server
source .venv/bin/activate
uvicorn app.main:app --reload --port 8000 &
API_PID=$!

# Wait a moment for API to start
sleep 2

# Go back to project root
cd ..

# Start the game development server
echo "🎮 Starting game development server..."
npm run watch &
GAME_PID=$!

# Function to cleanup on exit
cleanup() {
    echo "🛑 Stopping services..."
    kill $API_PID 2>/dev/null
    kill $GAME_PID 2>/dev/null
    exit 0
}

# Trap cleanup function on script exit
trap cleanup SIGINT SIGTERM

echo "✅ Services started!"
echo "🎮 Game: http://localhost:4201"
echo "📡 API: http://localhost:8000"
echo "📖 API Docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for background processes
wait
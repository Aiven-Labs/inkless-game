#!/bin/bash

# Start both game and API services locally
# Make sure you're in the project root directory

echo "Starting Inkless Game Services..."

# Set environment variables for local development
export GAME_API_URL=http://localhost:8000
export GAME_FALLBACK_URL=https://your-website.com
export NODE_ENV=development

# Create .env.game if it doesn't exist
if [ ! -f .env.game ]; then
    echo "Creating .env.game from template..."
    cp .env.game.example .env.game
fi

# Function to clean up background processes
cleanup() {
    echo "Stopping services..."
    kill $API_PID $GAME_PID 2>/dev/null
    exit
}

# Set up trap to clean up on script exit
trap cleanup EXIT

# Start the API server in background
echo "Starting API server on port 8000..."
cd score_server
uvicorn app.main:app --reload --port 8000 &
API_PID=$!
cd ..

# Wait for API to start
sleep 3

# Build the game
echo "Building game..."
npm run build

# Start the game server in background
echo "Starting game server on port 8080..."
python3 -m http.server 8080 &
GAME_PID=$!

echo ""
echo "Services started successfully!"
echo "- API Server: http://localhost:8000"
echo "- Game: http://localhost:8080"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for either process to exit
wait
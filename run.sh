#!/bin/bash

# Load environment variables
export $(grep -v '^#' .env | xargs)

# Start backend first
echo "🚀 Starting backend..."
(cd backend && nodemon src/index.js) & backend_pid=$!
sleep 2  # Give backend time to start

# Check if backend started
if ! kill -0 "$backend_pid" 2>/dev/null; then
    echo "❌ Backend failed to start!"
    exit 1
fi
echo "✅ Backend started (PID: $backend_pid)"

# Start frontend
echo "🚀 Starting frontend..."
(cd frontend && npm run dev) & frontend_pid=$!

# Check if frontend started
if ! kill -0 "$frontend_pid" 2>/dev/null; then
    echo "❌ Frontend failed to start!"
    exit 1
fi
echo "✅ Frontend started (PID: $frontend_pid)"

# Trap to clean up on exit
trap "echo '🛑 Stopping processes...'; kill $backend_pid $frontend_pid; exit" EXIT INT TERM

# Keep processes running
wait "$backend_pid" "$frontend_pid"

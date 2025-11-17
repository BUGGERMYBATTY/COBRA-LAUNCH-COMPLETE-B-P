#!/bin/sh
PORT=${PORT:-4173}
echo "Starting Vite preview server on port $PORT"
npx vite preview --host 0.0.0.0 --port $PORT

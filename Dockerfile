# Multi-stage build for Cobra Launch - VPS Deployment
FROM node:20-alpine AS frontend-builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy frontend source
COPY . .

# Build frontend
RUN npm run build

# Backend + Frontend Server Stage
FROM node:20-alpine

WORKDIR /app

# Install backend dependencies
COPY backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm install

# Copy backend source
COPY backend/ ./

# Copy built frontend from builder stage
WORKDIR /app
COPY --from=frontend-builder /app/dist ./frontend

# Expose port
EXPOSE 3001

# Set working directory to backend
WORKDIR /app/backend

# Start the server
CMD ["node", "server.js"]

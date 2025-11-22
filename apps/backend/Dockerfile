# Multi-stage build for backend application

# Stage 1: Build stage
FROM node:20.13.1-alpine AS builder

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Set working directory
WORKDIR /app

# Copy root package files
COPY package*.json ./
COPY tsconfig.base.json ./
COPY turbo.json ./

# Copy library package files and source
COPY library/ ./library/

# Copy backend package file
COPY apps/backend/package.json ./apps/backend/
COPY apps/backend/tsconfig*.json ./apps/backend/
COPY apps/backend/vite.config.ts ./apps/backend/

# Install dependencies
RUN npm ci

# Copy backend source code
COPY apps/backend/src ./apps/backend/src/

# Build the backend application
WORKDIR /app/apps/backend
RUN npm run build

# Stage 2: Production stage
FROM node:20.13.1-alpine AS production

# Install ffmpeg and ffprobe (required for audio processing)
RUN apk add --no-cache ffmpeg

# Create app directory
WORKDIR /app

# Copy root package files
COPY package*.json ./
COPY tsconfig.base.json ./
COPY turbo.json ./

# Copy library package files (needed for workspace resolution)
COPY library/ ./library/

# Copy backend package file
COPY apps/backend/package.json ./apps/backend/

# Install only production dependencies
RUN npm ci --omit=dev

# Copy built application from builder stage
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist

# Create assets directory for manual mounting
# Assets will be mounted as a volume at runtime
RUN mkdir -p /app/assets

# Set environment variables
ENV NODE_ENV=production
ENV ASSETS_PATH=/app/assets
ENV PORT=3000
ENV FFMPEG_PATH=/usr/bin/ffmpeg
ENV FFPROBE_PATH=/usr/bin/ffprobe

# Expose port
EXPOSE 3000

# Set working directory to backend
WORKDIR /app/apps/backend

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["node", "dist/server.js"]

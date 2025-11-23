# Multi-stage build for main application

# Stage 1: Build stage
FROM node:20.13.1-alpine AS builder

# Set working directory
WORKDIR /app

# Copy root package files
COPY package*.json ./
COPY tsconfig.base.json ./
COPY turbo.json ./

# Copy library package files and source
COPY library/ ./library/

# Copy main app package file and config
COPY apps/main/package.json ./apps/main/
COPY apps/main/tsconfig.json ./apps/main/
COPY apps/main/vite.config.ts ./apps/main/
COPY apps/main/react-router.config.ts ./apps/main/

# Install dependencies
RUN npm ci

# Copy main app source code
COPY apps/main/app ./apps/main/app/
COPY apps/main/public ./apps/main/public/

# Build the main application
WORKDIR /app/apps/main
RUN npm run build

# Stage 2: Production stage
FROM node:20.13.1-alpine AS production

# Create app directory
WORKDIR /app

# Copy root package files
COPY package*.json ./
COPY tsconfig.base.json ./
COPY turbo.json ./

# Copy library package files (needed for workspace resolution)
COPY library/ ./library/

# Copy main app package file
COPY apps/main/package.json ./apps/main/

# Install only production dependencies
RUN npm ci --omit=dev

# Copy built application from builder stage
COPY --from=builder /app/apps/main/build ./apps/main/build

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Expose port
EXPOSE 3000

# Set working directory to main app
WORKDIR /app/apps/main

# Start the application
CMD ["npm", "run", "start"]

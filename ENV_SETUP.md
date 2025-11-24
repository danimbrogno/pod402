# Environment Variables Setup

This project uses a centralized `.env` file at the project root for configuration. All apps that need database or other service access will automatically load from this file.

## Setup

1. Create a `.env` file in the project root (copy from this template):
   
   **Note:** For local overrides, create a `.env.local` file (this file is gitignored and won't be committed)

```bash
# Database Configuration
# Default connection string for local development (matches devcontainer setup)
DATABASE_URL=postgresql://user:password@localhost:5432/app

# Redis Configuration (for worker queue)
REDIS_URL=redis://localhost:6379

# Environment
NODE_ENV=development
ENVIRONMENT=development

# Assets Path
ASSETS_PATH=./assets

# FFmpeg Paths
FFMPEG_PATH=/usr/bin/ffmpeg
FFPROBE_PATH=/usr/bin/ffprobe

# OpenAI (set in .env.local for local development - this file is gitignored)
# OPENAI_API_KEY=your_key_here

# Receiving Wallet (set in your local .env if needed)
# RECEIVING_WALLET=your_wallet_address_here
# RECEIVING_WALLET_ADDRESS=your_wallet_address_here
```

## How It Works

Environment variables are loaded using `dotenv-flow` CLI in npm scripts. This approach:

1. Automatically loads `.env`, `.env.local`, `.env.{NODE_ENV}`, and `.env.{NODE_ENV}.local` files
2. Files are loaded in order with later files overriding earlier ones (`.env.local` overrides `.env`)
3. Works for all apps without bundling env-loading logic into production code
4. In production containers, environment variables should be set by the container runtime (no .env files needed)

## Apps That Use Database

- **Worker** (`apps/worker`) - Processes meditation generation jobs
- **Backend** (`apps/backend`) - API server (if it needs DB access)
- **Drizzle** (`library/drizzle`) - Database migrations and schema

All npm scripts use `dotenv-flow` CLI to automatically load `.env` files before running commands. This means:
- Environment variables are loaded at runtime (not bundled into code)
- `.env.local` files work for local overrides
- Production containers should set environment variables directly (no .env files needed)

## Default Credentials

The default credentials match the devcontainer setup:

- **User**: `user`
- **Password**: `password`
- **Database**: `app`
- **Host**: `localhost`
- **Port**: `5432`

For production, update `DATABASE_URL` in your `.env` file with your production database credentials.

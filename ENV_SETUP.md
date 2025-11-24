# Environment Variables Setup

This project uses a centralized `.env` file at the project root for configuration. All apps that need database or other service access will automatically load from this file.

## Setup

1. Create a `.env` file in the project root (copy from this template):

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

# OpenAI (set in your local .env if needed)
# OPENAI_API_KEY=your_key_here

# Receiving Wallet (set in your local .env if needed)
# RECEIVING_WALLET=your_wallet_address_here
# RECEIVING_WALLET_ADDRESS=your_wallet_address_here
```

## How It Works

The `loadEnvFromRoot()` function in `@project/common` automatically:

1. Finds the project root by looking for `package.json` with workspaces or `turbo.json`
2. Loads the `.env` file from the project root
3. Makes all environment variables available to all apps

## Apps That Use Database

- **Worker** (`apps/worker`) - Processes meditation generation jobs
- **Backend** (`apps/backend`) - API server (if it needs DB access)
- **Drizzle** (`library/drizzle`) - Database migrations and schema

All of these apps automatically load the `.env` file from the project root when they start.

## Default Credentials

The default credentials match the devcontainer setup:

- **User**: `user`
- **Password**: `password`
- **Database**: `app`
- **Host**: `localhost`
- **Port**: `5432`

For production, update `DATABASE_URL` in your `.env` file with your production database credentials.

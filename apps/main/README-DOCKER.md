# Running the Main App with Docker Compose

This guide shows how to run the main app using Docker Compose.

## Quick Start

1. **Navigate to the main app directory:**
   ```bash
   cd apps/main
   ```

2. **Create a `.env` file (optional):**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Build and run:**
   ```bash
   docker-compose up -d
   ```

4. **View logs:**
   ```bash
   docker-compose logs -f
   ```

5. **Stop the service:**
   ```bash
   docker-compose down
   ```

## Environment Variables

The following environment variables can be set in a `.env` file or passed directly:

### Required
- `PORT` - Port to run the app on (default: 3000)

### Farcaster Configuration (Optional)
- `FARCASTER_APP_NAME` - Name of your Farcaster app (default: "Zen Den")
- `FARCASTER_ICON_URL` - URL to your app icon
- `FARCASTER_HOME_URL` - Home URL for your app
- `FARCASTER_SPLASH_IMAGE_URL` - Splash screen image URL
- `FARCASTER_SPLASH_BG_COLOR` - Splash screen background color (default: "#ffffff")

### API Endpoints (Optional)
- `STREAM_ENDPOINT` - Stream API endpoint (default: "https://pod402.3vl.ca/stream")
- `DEMO_ENDPOINT` - Demo API endpoint (default: "https://pod402.3vl.ca/demo")

## Example .env File

```env
# Server Configuration
PORT=3000
NODE_ENV=production

# Farcaster Configuration
FARCASTER_APP_NAME=Zen Den
FARCASTER_ICON_URL=https://your-domain.com/favicon.ico
FARCASTER_HOME_URL=https://your-domain.com
FARCASTER_SPLASH_IMAGE_URL=https://your-domain.com/splash.png
FARCASTER_SPLASH_BG_COLOR=#ffffff

# API Endpoints
STREAM_ENDPOINT=https://pod402.3vl.ca/stream
DEMO_ENDPOINT=https://pod402.3vl.ca/demo
```

## Building from Source

If you want to build the image locally instead of using a pre-built one:

```bash
docker-compose build
docker-compose up -d
```

## Accessing the App

Once running, the app will be available at:
- http://localhost:3000 (or whatever port you configured)

## Troubleshooting

### View logs
```bash
docker-compose logs main
```

### Restart the service
```bash
docker-compose restart main
```

### Rebuild after code changes
```bash
docker-compose up -d --build
```

### Check container status
```bash
docker-compose ps
```


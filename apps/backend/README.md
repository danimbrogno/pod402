# Backend

Express server hosting the tRPC API from `@project/trpc`.

Built and bundled with **Vite** for fast development and optimized production builds.

## Setup

1. Install dependencies (from workspace root):
```bash
npm install
```

2. Build the backend:
```bash
npm run build --filter=backend
```

## Development

Run the development server with hot reload using `vite-node`:
```bash
npm run dev --filter=backend
```

Or from the backend directory:
```bash
cd apps/backend
npm run dev
```

The server will start on `http://localhost:3000` (or the port specified in `PORT` environment variable).

**Note:** Development uses `tsx watch` which runs TypeScript directly without compilation, providing fast startup and hot module replacement.

## Cloudflare Tunnel (Expose Backend Publicly)

Cloudflare tunnel configuration has been moved to the project root for multi-service support. 

See the root `README.md` or run from the project root:

### Quick Tunnel (Development)

Start a quick tunnel that generates a random URL:

```bash
# From project root
npm run tunnel:backend
```

Or start both server and tunnel together:
```bash
npm run tunnel:backend:all
```

This will output a URL like `https://random-subdomain.trycloudflare.com` that tunnels to your local `http://localhost:3000`.

### Named Tunnel (Production)

For persistent tunnels with custom domains, see the configuration in `.cloudflared/config.yml` at the project root.

## Production

Build and start the production server:
```bash
npm run build --filter=backend
npm run start --filter=backend
```

The build process uses Vite's SSR mode to bundle the application. Dependencies are externalized (not bundled) for optimal Node.js performance.

## API Endpoints

- **Health Check**: `GET /health`
- **tRPC API**: `POST /trpc/*`

## Usage Example

The tRPC API can be accessed using the client from `@project/trpc`:

```typescript
import { createClient } from '@project/trpc/client';

const client = createClient('http://localhost:3000/trpc');

// Use the client
const health = await client.health.query();
const hello = await client.hello.query({ name: 'World' });
const echo = await client.echo.mutate({ message: 'Hello!' });
```


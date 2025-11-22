# Web3 Starter

This repository provides a minimal Nx workspace that wires together three applications and four supporting libraries:

- `apps/cli`: simple Node CLI that exercises the shared libraries.
- `apps/main`: React front-end built with Vite.
- `apps/subgraph`: Node bootstrap script for indexing workflows.
- `library/common`: shared utilities.
- `library/contracts`: contract metadata helpers.
- `library/drizzle`: database configuration helpers.
- `library/ponder-config`: helpers for creating Ponder configuration.
- `library/trpc`: lightweight RPC helper used across the workspace.

## Quick Start

```bash
npm install
npm run build
npm run serve
```

Each project is intentionally lightweight and intended to be extended to suit your needs.

## Cloudflare Tunnel

This project includes Cloudflare Tunnel configuration for exposing local services publicly. This is useful for testing webhooks, APIs, or sharing development servers.

### Quick Tunnels (Development)

Start a quick tunnel for any service:

```bash
# Backend (port 3000)
npm run tunnel:backend

# Frontend (port 4200)
npm run tunnel:frontend
```

Or start both the service and tunnel together:

```bash
# Backend with tunnel
npm run tunnel:backend:all

# Frontend with tunnel
npm run tunnel:frontend:all
```

These commands will output a URL like `https://random-subdomain.trycloudflare.com` that tunnels to your local service.

### Named Tunnels (Production)

For persistent tunnels with custom domains:

1. Login to Cloudflare:
```bash
cloudflared tunnel login
```

2. Create a tunnel:
```bash
cloudflared tunnel create pod402
```

3. Configure the tunnel in `.cloudflared/config.yml`:
```yaml
tunnel: <your-tunnel-id>
credentials-file: .cloudflared/<tunnel-id>.json

ingress:
  - hostname: api.your-domain.com
    service: http://localhost:3000
  - hostname: app.your-domain.com
    service: http://localhost:4200
  - service: http_status:404
```

4. Run the tunnel:
```bash
npm run tunnel:config
```

### Adding More Services

To add tunnels for additional services, edit `.cloudflared/config.yml` in the ingress section. Each service can have its own hostname or use path-based routing.

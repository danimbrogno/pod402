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

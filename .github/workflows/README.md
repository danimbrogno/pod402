# GitHub Actions Workflows

## docker-build.yml
**Purpose**: Build and push Docker images for both backend and main app

**Triggers**:
- Push to `main` or `develop` branches (when relevant files change)
- Pull requests to `main` or `develop`
- Manual workflow dispatch

**Registries**:
- GitHub Container Registry (ghcr.io) - always
- Docker Hub (docker.io) - only on non-PR events

**Images**:
- `ghcr.io/<repo>/backend` and `docker.io/threevl/zenden-backend`
- `ghcr.io/<repo>/main` and `docker.io/threevl/zenden-main`

## Deprecated/Removed Workflows

### docker-backend.yml (DEPRECATED)
This workflow has been consolidated into `docker-build.yml`. It only built the backend to Docker Hub.

### ci.yml (DEPRECATED)
This workflow appears to be for an NX-based setup, but this project uses Turbo. It can be removed if not needed.

### build.yml (DEPRECATED)
This workflow has been consolidated into `docker-build.yml` with support for both registries.


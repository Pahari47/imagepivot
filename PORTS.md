# Port Configuration

This document outlines the port assignments for all services in the ImagePivot monorepo.

## Development Ports

| Service | Port | Description |
|---------|------|-------------|
| **API** | `4000` | Express.js API server |
| **User Web** | `3000` | Next.js user-facing application |
| **Admin Web** | `3001` | Next.js admin dashboard |
| **Worker** | `8000` | FastAPI worker service |

## Port Configuration Files

### API (Port 4000)
- Configured via: `apps/api/src/config/env.ts`
- Environment variable: `PORT=4000` (default)
- Can be overridden with `PORT` env variable

### User Web (Port 3000)
- Configured via: `apps/user-web/project.json` → `targets.dev.options.port`
- Next.js will use this port in development

### Admin Web (Port 3001)
- Configured via: `apps/admin-web/project.json` → `targets.dev.options.port`
- Next.js will use this port in development

### Worker (Port 8000)
- Configured via: `apps/worker/project.json` → `targets.serve.options.command`
- Uvicorn argument: `--port 8000`

## Running All Services

```bash
# Run all services in parallel
npm run dev

# Or run individually
npm run dev:api        # Port 4000
npm run dev:user-web   # Port 3000
npm run dev:admin-web  # Port 3001
npm run dev:worker     # Port 8000
```

## Production Ports

In production (Docker), ports are configured via:
- Docker Compose: `infra/compose/docker-compose.prod.yml`
- Individual Dockerfiles: `infra/docker/*.Dockerfile`


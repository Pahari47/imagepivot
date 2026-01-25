# Docker Configuration

This directory contains Dockerfiles for all applications in the imagepivot monorepo.

## Port Configuration

Each application runs on a different port:

- **API (TypeScript)**: Port `4000`
- **User Web (Next.js)**: Port `3000`
- **Admin Web (Next.js)**: Port `3001`
- **Worker (FastAPI)**: Port `8000`

## Building Images

### Individual Builds

```bash
# Build API
docker build -f infra/docker/api.Dockerfile -t imagepivot-api:latest .

# Build User Web
docker build -f infra/docker/user-web.Dockerfile -t imagepivot-user-web:latest .

# Build Admin Web
docker build -f infra/docker/admin-web.Dockerfile -t imagepivot-admin-web:latest .

# Build Worker
docker build -f infra/docker/worker.Dockerfile -t imagepivot-worker:latest .
```

### Using Docker Compose

```bash
# Production stack
docker-compose -f infra/compose/docker-compose.prod.yml up -d
```

## Environment Variables

Each service requires specific environment variables. See `.env.example` in the root directory.

## Notes

- All Dockerfiles use multi-stage builds for smaller final images
- Non-root users are used for security
- Next.js apps use `standalone` output mode for optimal Docker builds


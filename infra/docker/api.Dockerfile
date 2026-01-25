# API Dockerfile (TypeScript + Express)
FROM node:22-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app
# 1) Copy root manifests first
COPY package.json package-lock.json nx.json tsconfig.base.json ./

# 2) Copy workspace package.json files (important for npm workspaces/Nx)
COPY apps/*/package.json ./apps/*/
COPY packages/*/package.json ./packages/*/

# 3) Debug: Verify what Docker sees (temporary - remove after debugging)
RUN echo "=== Debug Info ===" && \
    node -v && npm -v && \
    echo "=== Root package.json ===" && \
    cat package.json | head -20 && \
    echo "=== Workspace package.json files ===" && \
    find apps packages -name package.json -type f 2>/dev/null | head -10 || true && \
    echo "=== npm workspaces check ===" && \
    npm pkg get workspaces || echo "No workspaces field" && \
    echo "=== Starting npm ci ==="

# 4) Install dependencies
RUN npm ci

# Build the application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app /app

# Generate Prisma Client (Prisma is now in root package.json)
WORKDIR /app/packages/database
RUN npx prisma generate

# Build API
WORKDIR /app
RUN npx nx build api --prod

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000
ENV HOST=0.0.0.0

# Copy built application
COPY --from=builder /app/dist/apps/api ./dist/apps/api
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/database/prisma ./packages/database/prisma

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 api

USER api

EXPOSE 4000

CMD ["node", "dist/apps/api/main.js"]


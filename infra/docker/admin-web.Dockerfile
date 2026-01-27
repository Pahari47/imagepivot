# Admin Web Dockerfile (Next.js)
FROM node:22-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app
# 1) Copy root manifests first
COPY package.json package-lock.json nx.json tsconfig.base.json ./

# 2) Copy workspace structure (Nx manages dependencies from root, but copy structure for completeness)
# Copy packages directory (contains shared/package.json if it exists)
COPY packages ./packages
# Copy apps workspace so npm ci can resolve workspace package.json files
COPY apps ./apps

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
# Try a clean install using the lockfile first; if that fails (lockfile mismatch in CI), fall back to a full install
RUN npm ci || npm install --legacy-peer-deps --no-audit --no-fund --no-progress

# Build the application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app /app

# Build Admin Web
ENV NEXT_TELEMETRY_DISABLED=1
RUN npx nx build admin-web --prod

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001
ENV HOSTNAME=0.0.0.0
ENV NEXT_TELEMETRY_DISABLED=1

# Copy built application (standalone output)
COPY --from=builder /app/apps/admin-web/.next/standalone ./
COPY --from=builder /app/apps/admin-web/.next/static ./apps/admin-web/.next/static
COPY --from=builder /app/apps/admin-web/public ./apps/admin-web/public

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

USER nextjs

EXPOSE 3001

# Next.js standalone server location
CMD ["node", "apps/admin-web/server.js"]


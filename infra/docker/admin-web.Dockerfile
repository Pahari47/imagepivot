# Admin Web Dockerfile (Next.js)
FROM node:22-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app
# Copy workspace files required by Nx
COPY package.json package-lock.json nx.json tsconfig.base.json ./
# Copy Nx workspace projects
COPY apps ./apps
COPY packages ./packages
RUN npm ci

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


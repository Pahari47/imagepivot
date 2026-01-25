# User Web Dockerfile (Next.js)
FROM node:22-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Build the application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build User Web
ENV NEXT_TELEMETRY_DISABLED=1
RUN npx nx build user-web --prod

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV NEXT_TELEMETRY_DISABLED=1

# Copy built application (standalone output)
COPY --from=builder /app/apps/user-web/.next/standalone ./
COPY --from=builder /app/apps/user-web/.next/static ./apps/user-web/.next/static
COPY --from=builder /app/apps/user-web/public ./apps/user-web/public

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

USER nextjs

EXPOSE 3000

# Next.js standalone server location
CMD ["node", "apps/user-web/server.js"]


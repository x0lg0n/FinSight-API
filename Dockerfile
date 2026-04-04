# ==================== BUILD STAGE ====================
FROM node:24-alpine AS builder

WORKDIR /app

# Prisma 7 loads prisma.config.ts during generate and requires DATABASE_URL.
# The actual runtime database URL is injected by the deployment environment.
ARG DATABASE_URL=postgresql://placeholder:placeholder@localhost:5432/placeholder
ENV DATABASE_URL=${DATABASE_URL}

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml /app/

# Install dependencies
RUN pnpm install --frozen-lockfile --prod=false

# Copy source code
COPY . /app/

# tsconfig.json is excluded by .dockerignore, but the builder needs it for tsc.
COPY tsconfig.json /app/

# Generate Prisma client
RUN pnpm run prisma:generate

# Build TypeScript
RUN pnpm run build

# ==================== RUNTIME STAGE ====================
FROM node:24-alpine

WORKDIR /app

# Prisma 7 config requires DATABASE_URL at generate time.
ARG DATABASE_URL=postgresql://placeholder:placeholder@localhost:5432/placeholder
ENV DATABASE_URL=${DATABASE_URL}

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml /app/

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod=true

# Copy Prisma files
COPY prisma/ /app/prisma/
COPY prisma.config.ts /app/

# Ensure generated runtime client exists inside the production node_modules tree.
RUN pnpm dlx prisma generate

# Copy built application from builder stage
COPY --from=builder /app/src /app/src/
COPY --from=builder /app/dist /app/dist/

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})" || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start server
CMD ["node", "dist/server.js"]

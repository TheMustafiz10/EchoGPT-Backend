
# Build
FROM node:22-alpine AS builder

WORKDIR /app

# Install build tools for native modules (bcrypt)
RUN apk add --no-cache python3 make g++



# Copy dependency manifests first (better layer caching)
COPY package*.json ./
COPY prisma ./prisma/



# Install ALL deps (including dev) for the build
RUN npm ci

# Generate Prisma Client (needs the schema)
RUN npx prisma generate


# Copy the rest of the source
COPY . .


# Compile TypeScript → dist/
RUN npm run build





# Production runtime
FROM node:22-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

# Install build tools so bcrypt can compile at install time
RUN apk add --no-cache python3 make g++

# Copy manifests + Prisma schema
COPY package*.json ./
COPY prisma ./prisma/

# Install only production deps
RUN npm ci --omit=dev && \
    npx prisma generate && \
    npm cache clean --force && \
    apk del python3 make g++

# Copy the compiled app from the builder
COPY --from=builder /app/dist ./dist

# Non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 && \
    chown -R nestjs:nodejs /app
USER nestjs

EXPOSE 3000

# Run pending migrations, then start the app
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]

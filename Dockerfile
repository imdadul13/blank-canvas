# Multi-stage Docker build for ONE SHOT FMGE & Cloud Telegram Worker
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package configuration
COPY package*.json ./
RUN npm ci

# Copy source code and assets
COPY . .

# Build Vite frontend and Express server bundle
RUN npm run build

# Production runtime stage
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --only=production

# Copy compiled bundles and static assets
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/worker.ts ./worker.ts
COPY --from=builder /app/server.ts ./server.ts
COPY --from=builder /app/public ./public

# Ensure uploads directory exists
RUN mkdir -p /app/public/uploads/telegram/media /app/data

EXPOSE 3000

CMD ["node", "dist/server.cjs"]

# Multi-stage Docker build for ONE SHOT FMGE & Cloud Telegram Worker
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package configuration
COPY package*.json ./
RUN npm ci

# Copy source code and assets
COPY . .

# Build Vite frontend, server bundle, and worker bundle
RUN npm run build

# Production runtime stage
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled bundles and static assets
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/public ./public

# Ensure uploads and data directories exist
RUN mkdir -p /app/public/uploads/telegram/media /app/data /app/server/db /app/server/data

EXPOSE 3000

CMD ["node", "dist/server.cjs"]

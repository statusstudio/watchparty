# --- Stage 1: Build Frontend ---
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json tsconfig*.json vite.config.ts tailwind.config.js postcss.config.js index.html ./
COPY src ./src
COPY server ./server

RUN npm install
RUN npm run build

# --- Stage 2: Production Runner ---
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8000

COPY package*.json tsconfig*.json ./
RUN npm install --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/src/types ./src/types

EXPOSE 8000

CMD ["npx", "tsx", "server/index.ts"]

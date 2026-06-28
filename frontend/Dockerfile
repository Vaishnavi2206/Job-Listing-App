# ---------- Stage 1 : Build ----------
FROM node:22-bookworm-slim AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

# ---------- Stage 2 : Runtime ----------
FROM nginx:1.28-alpine

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
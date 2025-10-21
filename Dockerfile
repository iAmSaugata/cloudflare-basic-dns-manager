FROM node:20-alpine AS builder
WORKDIR /app

ARG CF_API_TOKEN
ARG CF_API_BASE=https://api.cloudflare.com/client/v4
ARG AUTH_BCRYPT_HASH
ARG SESSION_SECRET
ENV CF_API_TOKEN=$CF_API_TOKEN
ENV CF_API_BASE=$CF_API_BASE
ENV AUTH_BCRYPT_HASH=$AUTH_BCRYPT_HASH
ENV SESSION_SECRET=$SESSION_SECRET

COPY frontend/package*.json ./frontend/
RUN cd frontend && npm install
COPY frontend ./frontend
RUN cd frontend && npm run build

FROM node:20-alpine AS runner
WORKDIR /app
RUN npm install -g serve
COPY --from=builder /app/frontend/dist ./dist
EXPOSE 4173
CMD ["serve", "-s", "dist", "-l", "4173"]

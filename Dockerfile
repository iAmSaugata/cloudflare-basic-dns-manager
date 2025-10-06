FROM node:20-alpine AS builder
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json* ./frontend/
RUN cd frontend && npm install
COPY frontend ./frontend
RUN cd frontend && npm run build

FROM node:20-alpine AS runtime
WORKDIR /app
COPY backend/package.json ./backend/package.json
RUN cd backend && npm install --omit=dev
COPY backend ./backend
COPY --from=builder /app/frontend/dist ./frontend/dist
ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080
COPY .env.example .env
WORKDIR /app/backend
CMD ["npm", "start"]

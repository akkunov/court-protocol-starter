FROM node:24-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY apps/api/package.json ./apps/api/package.json
RUN npm install
COPY . .
RUN npm run build --workspace @court-protocol/api

FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/node_modules ./node_modules
WORKDIR /app/apps/api
EXPOSE 3000
CMD ["node", "dist/main.js"]


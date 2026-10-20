FROM node:24-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY apps/web/package.json ./apps/web/package.json
COPY apps/api/package.json ./apps/api/package.json
RUN npm install
COPY . .
RUN npm run build --workspace @court-protocol/web

FROM nginx:alpine
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]


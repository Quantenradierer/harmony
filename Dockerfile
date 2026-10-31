# syntax=docker/dockerfile:1

# --- build stage: install all workspaces and build web + server ---
FROM node:24-alpine AS build
WORKDIR /src
COPY package.json package-lock.json ./
COPY shared/package.json shared/
COPY web/package.json web/
COPY server/package.json server/
RUN npm ci
COPY . .
RUN npm run build

# --- runtime stage: bundled server plus static PWA, no node_modules ---
FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000 \
    STATIC_DIR=/app/web \
    DATA_DIR=/data
COPY --from=build /src/server/dist/ ./server/
COPY --from=build /src/web/dist/ ./web/
RUN mkdir -p /data && chown node:node /data
VOLUME /data
USER node
EXPOSE 3000
CMD ["node", "server/main.js"]

FROM node:22.22.0-bookworm-slim AS build

WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/api-client/package.json packages/api-client/package.json
COPY contracts/package.json contracts/package.json
RUN npm ci

COPY . .
RUN npm run generate && npm run build

FROM node:22.22.0-bookworm-slim AS runtime

ENV NODE_ENV=production
ENV PORT=3000
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/api-client/package.json packages/api-client/package.json
COPY contracts/package.json contracts/package.json
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/web/dist ./apps/web/dist

USER node
EXPOSE 3000
CMD ["node", "apps/api/dist/server.js"]

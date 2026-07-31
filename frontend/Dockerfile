# Multi-stage: build the Vite bundle, then serve with a tiny node server
# (vite preview). For production behind a reverse proxy, swap preview
# for nginx or a CDN.
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
# Design system is expected to be bind-mounted at /ds during build and runtime.
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
EXPOSE 3400
CMD ["npm", "run", "preview"]

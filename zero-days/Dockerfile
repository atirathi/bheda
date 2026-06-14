FROM node:22-alpine

WORKDIR /app

# Create a non-root user for runtime.
RUN addgroup -g 1001 -S bheda && adduser -u 1001 -G bheda -S bheda -h /app

COPY package.json tsconfig.json ./
# Install all deps (incl. typescript devDep) to build, then prune dev deps.
RUN npm install && npm cache clean --force

COPY src ./src
RUN npm run build && npm prune --omit=dev

# Secrets MUST be provided at runtime (docker-compose, k8s, or runtime env).
# Never bake API_KEY or any credential into the image.
ENV NODE_ENV=production
ENV VULN_APP_URL=http://vuln-app:3001
ENV BACKEND_URL=http://backend:8000
ENV REDIS_URL=redis://localhost:6379

EXPOSE 3003

USER bheda

CMD ["node", "dist/app.js"]

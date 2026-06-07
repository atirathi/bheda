FROM node:22-alpine

WORKDIR /app

# Create the same UID/GID the compose file requests (`user: "1000:1000"`).
# Without this the container fails to start with "no matching entries
# in passwd file" because alpine's default `node` user is UID 1000
# already, but the explicit numeric form requires the group to exist.
RUN addgroup -g 1000 -S bheda && adduser -u 1000 -G bheda -S bheda -h /app

COPY package.json tsconfig.json ./
RUN npm install --omit=dev && npm cache clean --force

COPY src ./src
RUN npm run build

# Secrets MUST be provided at runtime (docker-compose, k8s, or runtime env).
# Never bake API_KEY or any credential into the image.
ENV NODE_ENV=production
ENV REDIS_URL=redis://localhost:6379
ENV BACKEND_URL=http://backend:8000
# Default image digest.  Operators can pin to a specific digest via
# `DEFAULT_CHALLENGE_IMAGE=sha256:...` at runtime.  We refuse to use
# `:latest` even as a default; the build must fail until the
# operator has set up a pinned registry.
ENV DEFAULT_CHALLENGE_IMAGE=__MUST_BE_SET__

EXPOSE 3004

USER bheda

CMD ["node", "dist/orchestrator.js"]

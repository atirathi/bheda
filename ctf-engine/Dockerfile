FROM node:22-alpine

WORKDIR /app

# A non-root build/default user. We do NOT pin uid/gid 1000 — alpine's
# base `node` user already occupies it, so pinning collides at build time
# ("gid 1000 in use"). The compose file pins `user: "1000:1000"` at
# runtime regardless, and uid 1000 (node) already exists for that.
RUN addgroup -S bheda && adduser -S bheda -G bheda -h /app

COPY package.json tsconfig.json ./
# Install all deps (incl. typescript devDep) to build, then prune dev deps.
RUN npm install && npm cache clean --force

COPY src ./src
RUN npm run build && npm prune --omit=dev

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

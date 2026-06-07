FROM node:22-alpine

WORKDIR /app

# Create a non-root user for runtime.
RUN addgroup -g 1002 -S bheda && adduser -u 1002 -G bheda -S bheda -h /app

COPY package.json tsconfig.json ./
RUN npm install --omit=dev && npm cache clean --force

COPY src ./src
RUN npm run build

# Secrets MUST be provided at runtime.
ENV NODE_ENV=production
ENV REDIS_URL=redis://localhost:6379
ENV HONEYPOT_ROLE=

EXPOSE 3002

USER bheda

CMD ["node", "dist/app.js"]

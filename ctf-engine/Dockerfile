FROM node:22-alpine

WORKDIR /app

COPY package.json tsconfig.json ./
RUN npm install

COPY src ./src
RUN npm run build

EXPOSE 3004

ENV NODE_ENV=development
ENV REDIS_URL=redis://localhost:6379
ENV BACKEND_URL=http://backend:8000
ENV API_KEY=bheda-internal-api-key-2026

CMD ["node", "dist/orchestrator.js"]

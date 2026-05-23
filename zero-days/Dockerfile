FROM node:22-alpine

WORKDIR /app

COPY package.json tsconfig.json ./
RUN npm install

COPY src ./src
RUN npm run build

EXPOSE 3003

ENV NODE_ENV=development
ENV VULN_APP_URL=http://vuln-app:3001
ENV BACKEND_URL=http://backend:8000
ENV REDIS_URL=redis://localhost:6379
ENV API_KEY=bheda-internal-api-key-2026

CMD ["node", "dist/app.js"]

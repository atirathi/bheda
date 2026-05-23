FROM node:22-alpine

WORKDIR /app

COPY package.json tsconfig.json ./
RUN npm install

COPY src ./src
RUN npm run build

EXPOSE 3002

ENV NODE_ENV=development
ENV REDIS_URL=redis://localhost:6379
ENV HONEYPOT_ROLE=

CMD ["node", "dist/app.js"]

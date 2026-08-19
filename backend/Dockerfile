FROM node:22-alpine

WORKDIR /app

RUN apk add --no-cache python3 make g++

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY src ./src

ENV NODE_ENV=production
ENV PORT=3001
ENV DB_PATH=/app/data/finanzas.db

EXPOSE 3001

CMD ["npm", "start"]
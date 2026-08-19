FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY index.html ./
COPY vite.config.js ./
COPY postcss.config.js ./
COPY eslint.config.js ./
COPY src ./src

EXPOSE 5173

CMD ["npm", "run", "dev"]
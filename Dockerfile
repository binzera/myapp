# Dockerfile para aplicação Node.js Express
FROM node:20-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install --production

COPY . .

ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", "bin/www"]

FROM node:23-alpine3.20
WORKDIR /app

COPY package.json .* ./
RUN pnpm install

COPY . .
EXPOSE 3000
CMD ["pnpm", "start"]
FROM oven/bun:1-alpine

WORKDIR /app

COPY package.json bun.lock ./
COPY packages ./packages
COPY frontend/package.json ./frontend/package.json
COPY services/wallets/package.json ./services/wallets/package.json

RUN bun install

COPY services/wallets ./services/wallets

WORKDIR /app/services/wallets

EXPOSE 4002

CMD ["bun", "run", "src/main.ts"]

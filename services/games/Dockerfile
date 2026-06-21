FROM oven/bun:1-alpine

WORKDIR /app

COPY package.json bun.lock ./
COPY packages ./packages
COPY frontend/package.json ./frontend/package.json
COPY services/games/package.json ./services/games/package.json

RUN bun install

COPY services/games ./services/games

WORKDIR /app/services/games

EXPOSE 4001

CMD ["bun", "run", "src/main.ts"]

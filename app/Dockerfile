# Estágio 1 - Dependências
FROM node:20-alpine AS deps

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev


# Estágio 2 - Aplicação
FROM node:20-alpine AS runner

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY src ./src

USER node

EXPOSE 3000

CMD ["node", "src/index.js"]
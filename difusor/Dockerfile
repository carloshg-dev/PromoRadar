# Imagem enxuta; roda direto com tsx (sem etapa de build).
FROM node:20-slim
WORKDIR /app

# Dependencias primeiro (cache de camada). Instala dev+prod p/ ter o tsx.
COPY package.json ./
RUN npm install --no-audit --no-fund

# Codigo
COPY tsconfig.json ./
COPY src ./src

# Estado de dedup persiste aqui (monte um volume no docker-compose)
RUN mkdir -p /app/data
ENV NODE_ENV=production

CMD ["npm", "run", "start"]

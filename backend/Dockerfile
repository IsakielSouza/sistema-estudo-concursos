# Dockerfile para Sistema de Estudo para Concursos Públicos

# Estágio de build
FROM node:18-alpine AS builder

WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências
RUN npm ci --only=production

# Copiar código fonte
COPY . .

# Compilar a aplicação
RUN npm run build

# Estágio de produção
FROM node:18-alpine AS production

WORKDIR /app

# Criar usuário não-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

# Copiar arquivos compilados do estágio de build
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/package*.json ./

# Mudar para usuário não-root
USER nestjs

# Expor porta
EXPOSE 3000

# Comando para iniciar a aplicação
CMD ["node", "dist/main"] 
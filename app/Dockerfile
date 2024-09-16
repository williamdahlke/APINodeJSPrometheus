# Use a imagem oficial do Node.js como base
FROM node:16

# Defina o diretório de trabalho dentro do container
WORKDIR /app

# Copie o package.json e o package-lock.json para o diretório de trabalho
COPY package*.json ./

# Instale as dependências
RUN npm install

# Copie o restante do código da aplicação para o diretório de trabalho
COPY . .

RUN npx tsc

# Exponha a porta em que a aplicação irá rodar
EXPOSE 3031

# Comando para rodar a aplicação
CMD ["node", "dist/src/index.js"]

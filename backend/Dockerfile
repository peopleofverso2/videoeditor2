FROM node:18-alpine

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances
RUN npm ci

# Copier le reste des fichiers
COPY . .

# Créer le dossier uploads
RUN mkdir -p uploads && chmod 777 uploads

EXPOSE 4000

CMD ["npm", "run", "start"]

#!/bin/bash

# Couleurs pour les messages
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}Démarrage du déploiement Docker${NC}"

# Arrêter les conteneurs existants
echo -e "\n${GREEN}Arrêt des conteneurs existants...${NC}"
docker-compose down

# Construire les images
echo -e "\n${GREEN}Construction des images Docker...${NC}"
docker-compose build

# Démarrer les conteneurs
echo -e "\n${GREEN}Démarrage des conteneurs...${NC}"
docker-compose up -d

# Vérifier le statut
echo -e "\n${GREEN}Statut des conteneurs :${NC}"
docker-compose ps

echo -e "\n${GREEN}Déploiement terminé !${NC}"
echo -e "Frontend: http://localhost:3000"
echo -e "Backend: http://localhost:4000"

#!/bin/bash

# Couleurs pour les messages
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# Créer le dossier de sauvegarde avec la date
BACKUP_DIR="backups/backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Liste des éléments à sauvegarder
ITEMS_TO_BACKUP=(
    "backend"
    "frontend"
    "package.json"
    "package-lock.json"
)

# Faire la sauvegarde
echo -e "${GREEN}Création de la sauvegarde dans $BACKUP_DIR${NC}"

for item in "${ITEMS_TO_BACKUP[@]}"; do
    if [ -e "$item" ]; then
        cp -r "$item" "$BACKUP_DIR/"
        echo -e "${GREEN}✓ Sauvegarde de $item${NC}"
    else
        echo -e "${RED}✗ $item non trouvé${NC}"
    fi
done

# Créer un fichier info.txt avec des informations sur la sauvegarde
echo "Sauvegarde créée le $(date)" > "$BACKUP_DIR/info.txt"
echo "Git commit: $(git rev-parse HEAD)" >> "$BACKUP_DIR/info.txt"
echo "Git branch: $(git branch --show-current)" >> "$BACKUP_DIR/info.txt"

echo -e "\n${GREEN}Sauvegarde terminée !${NC}"
echo -e "Localisation: $BACKUP_DIR"

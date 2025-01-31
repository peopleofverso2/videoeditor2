# Guide de déploiement

Ce guide explique comment déployer l'application pour que l'intégration des projets fonctionne correctement.

## 1. 🌐 Prérequis

- Un serveur (VPS) avec :
  - Ubuntu 20.04 ou plus récent
  - Node.js 18+
  - Nginx
  - PM2 (pour gérer les processus Node.js)
- Un nom de domaine
- Un certificat SSL (Let's Encrypt)

## 2. 📦 Installation sur le serveur

```bash
# Installer les dépendances
sudo apt update
sudo apt install nginx nodejs npm
npm install -g pm2

# Cloner le projet
git clone [votre-repo]
cd video-editor-v2

# Installer les dépendances du projet
cd backend && npm install
cd ../frontend && npm install
```

## 3. 🔧 Configuration Nginx

```nginx
# /etc/nginx/sites-available/video-editor.conf

server {
    listen 80;
    server_name votre-domaine.com;

    # Redirection vers HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name votre-domaine.com;

    ssl_certificate /etc/letsencrypt/live/votre-domaine.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/votre-domaine.com/privkey.pem;

    # Frontend
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket
    location /presence {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }
}
```

## 4. 🚀 Démarrage des services

```bash
# Backend
cd backend
pm2 start npm --name "video-editor-backend" -- run dev

# Frontend
cd frontend
pm2 start npm --name "video-editor-frontend" -- run start

# Sauvegarder la configuration PM2
pm2 save

# Démarrer PM2 au boot
pm2 startup
```

## 5. 🔒 SSL avec Let's Encrypt

```bash
# Installer Certbot
sudo apt install certbot python3-certbot-nginx

# Obtenir un certificat
sudo certbot --nginx -d votre-domaine.com

# Renouvellement automatique
sudo certbot renew --dry-run
```

## 6. 🌍 Variables d'environnement

### Frontend (.env)
```bash
VITE_PUBLIC_URL=https://votre-domaine.com
VITE_API_URL=https://votre-domaine.com
```

### Backend (.env)
```bash
PORT=4000
MONGODB_URI=mongodb://localhost:27017/video-editor
CORS_ORIGIN=https://votre-domaine.com
```

## 7. 🔍 Vérification

1. Ouvrir https://votre-domaine.com
2. Créer un projet
3. Tester le partage et l'intégration :
   - Générer une URL d'intégration
   - Tester dans Notion
   - Vérifier que le projet s'affiche correctement

## 8. 📝 Logs et monitoring

```bash
# Voir les logs
pm2 logs

# Monitorer les processus
pm2 monit

# Status des processus
pm2 status
```

## 9. 🔄 Mise à jour

```bash
# Arrêter les services
pm2 stop all

# Pull les changements
git pull

# Installer les dépendances
cd backend && npm install
cd frontend && npm install

# Redémarrer les services
pm2 restart all
```

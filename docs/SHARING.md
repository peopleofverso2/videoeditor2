# Guide d'intégration des projets

Ce guide explique comment utiliser la fonctionnalité de partage et d'intégration des projets.

## 🔍 Retrouver le code

Le code de la fonctionnalité se trouve sur la branche `feature/project-sharing`. Pour y accéder :

```bash
cd video-editor-v2
git checkout feature/project-sharing
```

## 🛠 Composants principaux

1. **Bouton de partage** : Dans la barre d'outils (`Toolbar.jsx`)
2. **Dialogue de partage** : `ShareDialog.jsx` avec deux modes :
   - Code HTML (iframe)
   - URL pour Notion

## 📋 Comment utiliser

1. Ouvrir un projet
2. Cliquer sur le bouton de partage (icône Share) dans la barre d'outils
3. Choisir le mode d'intégration :
   - 🔤 **Code HTML** : Pour intégrer dans un site web
   - 📄 **URL Notion** : Pour intégrer dans Notion

### 🔒 Protection par token (optionnel)
- Activer le switch "Protéger l'accès avec un token"
- Un token unique sera généré
- L'accès au projet intégré nécessitera ce token

## 🌐 Déploiement

Pour que l'intégration fonctionne dans Notion, l'application doit être déployée sur un serveur public :

1. **Configuration requise** :
   - Serveur (ex: DigitalOcean, AWS)
   - Nom de domaine
   - Certificat SSL (https)

2. **Variables d'environnement** :
   ```bash
   # Frontend (.env)
   VITE_PUBLIC_URL=https://votre-domaine.com
   VITE_API_URL=https://votre-domaine.com
   ```

## 🔗 URLs d'intégration

Format des URLs :
- Sans token : `https://votre-domaine.com/embed/projects/ID_PROJET`
- Avec token : `https://votre-domaine.com/embed/projects/ID_PROJET?token=TOKEN`

## 💡 Intégration dans Notion

1. Dans le dialogue de partage, sélectionner le mode "URL pour Notion"
2. Copier l'URL générée
3. Dans Notion :
   - Taper `/embed`
   - Coller l'URL
   - Ajuster la taille selon vos besoins

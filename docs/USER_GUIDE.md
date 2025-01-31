# Guide utilisateur - Video Editor

## 📋 Table des matières
1. [Démarrage](#démarrage)
2. [Gestion des projets](#gestion-des-projets)
3. [Éditeur](#éditeur)
4. [Bibliothèque média](#bibliothèque-média)
5. [Partage et intégration](#partage-et-intégration)

## 🚀 Démarrage

### Lancer l'application
1. Ouvrir http://localhost:3001
2. L'écran d'accueil affiche la liste de vos projets

### Interface principale
- **Barre d'outils supérieure** : Actions principales (nouveau, ouvrir, sauvegarder)
- **Liste des projets** : Vue d'ensemble de tous vos projets
- **Boutons d'action** : Sur chaque projet (ouvrir, supprimer)

## 📁 Gestion des projets

### Créer un nouveau projet
1. Cliquer sur le bouton "+" en haut à droite
2. Donner un nom au projet
3. Choisir "Créer"

### Ouvrir un projet existant
- Cliquer sur le projet dans la liste
- Ou utiliser le bouton "Ouvrir" (icône dossier) dans la barre d'outils

### Sauvegarder un projet
- Automatique à chaque modification
- Manuellement avec le bouton "Sauvegarder" (icône disquette)
- Raccourci : Ctrl/Cmd + S

## ✏️ Éditeur

### Zone de travail
- **Canvas central** : Zone d'édition principale
- **Barre d'outils** : Actions disponibles
- **Panneau latéral** : Propriétés et paramètres

### Ajouter des éléments
1. Glisser-déposer depuis la barre d'outils :
   - Boutons
   - Zones de texte
   - Images
   - Vidéos
2. Ou double-cliquer sur un élément de la barre d'outils

### Manipuler les éléments
- **Déplacer** : Glisser-déposer
- **Redimensionner** : Poignées aux coins
- **Supprimer** : Touche Suppr ou bouton supprimer
- **Copier/Coller** : Ctrl/Cmd + C, Ctrl/Cmd + V

### Annuler/Rétablir
- **Annuler** : Ctrl/Cmd + Z
- **Rétablir** : Ctrl/Cmd + Shift + Z
- Ou utiliser les boutons dans la barre d'outils

## 📚 Bibliothèque média

### Accéder à la bibliothèque
- Cliquer sur l'icône "Bibliothèque" dans la barre d'outils
- Ou utiliser le raccourci Ctrl/Cmd + B

### Gérer les médias
1. **Ajouter** :
   - Glisser-déposer des fichiers
   - Ou cliquer sur "Importer"
2. **Utiliser** :
   - Glisser vers le canvas
   - Ou double-cliquer pour insérer
3. **Supprimer** :
   - Sélectionner et appuyer sur Suppr
   - Ou cliquer sur l'icône corbeille

### Types de fichiers supportés
- Images : JPG, PNG, GIF
- Vidéos : MP4, WebM
- Audio : MP3, WAV

## 🔗 Partage et intégration

### Partager un projet
1. Cliquer sur l'icône "Partager" dans la barre d'outils
2. Choisir le mode de partage :
   - Code HTML (iframe)
   - URL pour Notion

### Protection par token
1. Dans le dialogue de partage, activer "Protéger l'accès"
2. Un token unique est généré
3. Seuls les utilisateurs avec le token peuvent voir le projet

### Intégrer dans Notion
1. Dans le dialogue de partage :
   - Sélectionner "URL pour Notion"
   - Copier l'URL générée
2. Dans Notion :
   - Taper `/embed`
   - Coller l'URL
   - Ajuster la taille

### Intégrer dans un site web
1. Dans le dialogue de partage :
   - Sélectionner "Code HTML"
   - Copier le code d'intégration
2. Coller le code dans votre site web

## ⌨️ Raccourcis clavier

### Général
- `Ctrl/Cmd + S` : Sauvegarder
- `Ctrl/Cmd + O` : Ouvrir
- `Ctrl/Cmd + N` : Nouveau projet
- `Ctrl/Cmd + B` : Bibliothèque média

### Édition
- `Ctrl/Cmd + Z` : Annuler
- `Ctrl/Cmd + Shift + Z` : Rétablir
- `Ctrl/Cmd + C` : Copier
- `Ctrl/Cmd + V` : Coller
- `Suppr` : Supprimer l'élément sélectionné
- `Échap` : Désélectionner

### Navigation
- `Espace + Glisser` : Déplacer le canvas
- `+/-` : Zoom avant/arrière
- `0` : Réinitialiser le zoom

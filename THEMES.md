# Instructions pour les logos des thèmes

## Logos requis

Pour que le système de thèmes fonctionne correctement, vous devez placer les images suivantes dans le dossier `public/` :

### 1. Logo FFBillard (FFB)
- **Nom du fichier :** `FFBillard_logo.png`
- **Chemin dans le code :** `/FFBillard_logo.png` (les fichiers de `public/` sont servis à la racine)
- **Description :** Logo de la Fédération Française de Billard
- **Format recommandé :** PNG avec fond transparent
- **Taille recommandée :** 200x200px minimum

### 2. Logo Ultimate Pool FR
- **Nom du fichier :** `ultimate_pool_fr.png`
- **Chemin dans le code :** `/ultimate_pool_fr.png` (les fichiers de `public/` sont servis à la racine)
- **Description :** Logo d'Ultimate Pool France
- **Format recommandé :** PNG avec fond transparent
- **Taille recommandée :** 200x200px minimum

## Fonctionnalités du système de thèmes

- **Changement automatique du logo** selon le thème sélectionné
- **Fallback automatique** vers le logo FFB si une image ne charge pas
- **Couleurs dynamiques** qui s'adaptent au thème
- **Sauvegarde des préférences** dans localStorage

## Comment ajouter un nouveau thème

1. Modifier `src/hooks/useTheme.js`
2. Ajouter le nouveau thème dans l'objet `THEMES`
3. Définir les couleurs et le chemin du logo
4. Ajouter les variables CSS correspondantes dans `src/index.css`
5. Placer le logo dans le dossier `public/`

Le système est extensible et permet d'ajouter facilement de nouveaux thèmes !
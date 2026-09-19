# Pool Matchs Viewer

Affichage TV des matchs de billard en cours, avec compte à rebours par table et
récupération automatique des scores depuis [CueScore](https://cuescore.com).

- **`/`** — écran TV : une carte par match, minuteur et scores.
- **`/admin`** — administration : configuration des tables, ajout des matchs,
  démarrage / pause / fin des minuteurs, choix du thème.

Les données (matchs, tables, thème, titres) vivent dans le `localStorage` du
navigateur qui affiche la page. Il n'y a pas de base de données ni de compte
utilisateur : **toute personne ayant l'URL peut accéder à `/admin`.**

## Démarrage

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # bundle de production dans dist/
npm run lint
```

## Accès à CueScore

CueScore expose le tableau de marque d'une table à cette adresse :

```
https://cuescore.com/ajax/scoreboard-v2/?tableCode=<CODE>
```

La barre oblique finale est obligatoire (sinon CueScore répond `301`), et la
réponse ne comporte **aucun en-tête CORS** : un appel direct depuis le
navigateur est donc bloqué.

L'application passe pour cette raison par son propre relais, toujours à la même
adresse côté client :

```
/api/cuescore?tableCode=<CODE>
```

| Environnement | Implémentation |
| --- | --- |
| `npm run dev` | proxy Vite, configuré dans [`vite.config.js`](vite.config.js) |
| Vercel | fonction serverless [`api/cuescore.js`](api/cuescore.js) |

Aucun proxy CORS public n'est utilisé : les services `api.codetabs.com` et
`cors-anywhere.herokuapp.com` employés auparavant sont hors service et
rendaient l'application inopérante en production.

### Rafraîchissement des scores

Tant qu'au moins un match est « en cours », l'écran TV réinterroge CueScore
toutes les **5 secondes** (`appConfig.api.cueScore.pollInterval`). Les tables
sont appelées en parallèle par groupes de 4, et l'écran se resynchronise
immédiatement quand l'onglet redevient visible.

Un point marqué apparaît donc à l'écran en 5 secondes au pire. Coût mesuré :
**12 requêtes par minute et par table active** (72/min pour 6 tables). Le relais
applique un cache edge de 2 s, qui mutualise les appels lorsque plusieurs
écrans suivent les mêmes tables.

Pour privilégier la sobriété plutôt que la réactivité, augmentez `pollInterval`
dans [`src/utils/config.js`](src/utils/config.js).

### Fin de match

Lorsqu'une rencontre se termine, CueScore remet la table en `NOMATCH`. L'écran
clôt alors le match automatiquement : le score final reste affiché, le chrono
s'arrête et la carte passe en « TERMINÉ » (et non « TEMPS ÉCOULÉ », réservé au
dépassement de la durée impartie).

La clôture exige `missingMatchConfirmations` lectures `NOMATCH` consécutives
(3 par défaut, soit ~15 s) : une coupure réseau passagère ne termine pas une
rencontre encore en cours.

### Codes d'erreur renvoyés par CueScore

| Code | Signification |
| --- | --- |
| `NOCODE` | code de table absent ou mal formé |
| `NOTABLE` | aucune table ne correspond à ce code |
| `NOMATCH` | la table existe mais aucun match n'est lancé |

`NOMATCH` est un état normal : l'écran attend simplement que l'arbitre démarre
le match.

## Configuration des tables

Chaque table est décrite par un identifiant, un nom d'affichage et son code
CueScore (alphanumérique). La saisie se fait dans **Admin → Configurer les
tables de jeux** ; aucune table n'est fournie par défaut, il faut donc en créer
au moins une avant de pouvoir ajouter un match.

## Déploiement Vercel

Le dépôt contient un [`vercel.json`](vercel.json) qui réécrit toutes les routes
non-`/api` vers `index.html`, sans quoi un rechargement direct de `/admin`
renverrait une 404. La fonction `api/cuescore.js` est déployée automatiquement.

## Thèmes

Deux thèmes sont fournis (FFBillard et Ultimate Pool FR). Les couleurs sont
définies dans [`src/hooks/useTheme.js`](src/hooks/useTheme.js) et appliquées
sous forme de variables CSS sur `:root`. Voir [THEMES.md](THEMES.md) pour en
ajouter un.

/**
 * Configuration de l'application et accès à la configuration des tables.
 *
 * Ce module est la source de vérité unique pour la liste des tables : tout
 * lecteur doit appeler getTables() au moment où il en a besoin. Un export
 * "figé" au chargement du module renverrait une liste périmée dès la première
 * modification faite dans l'écran de configuration.
 */

export const TABLES_STORAGE_KEY = 'clubTables';
export const TABLES_UPDATED_EVENT = 'tablesUpdated';

/** Lit la configuration des tables depuis localStorage. */
export function getTables() {
  try {
    const saved = localStorage.getItem(TABLES_STORAGE_KEY);
    if (!saved) return [];

    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) return [];

    // On ne garde que les entrées exploitables : une table sans code CueScore
    // ne sert à rien et ferait échouer la récupération du match.
    return parsed.filter(
      (table) =>
        table &&
        Number.isInteger(table.id) &&
        typeof table.name === 'string' &&
        table.name.trim() !== '' &&
        typeof table.code === 'string' &&
        table.code.trim() !== ''
    );
  } catch (error) {
    console.warn('Erreur lors du chargement des tables:', error);
    return [];
  }
}

/** Retrouve une table par son id (accepte un id numérique ou sa forme texte). */
export function findTableById(tableId) {
  const id = Number.parseInt(tableId, 10);
  if (Number.isNaN(id)) return null;
  return getTables().find((table) => table.id === id) || null;
}

export const appConfig = {
  // Paramètres des matchs
  match: {
    minDuration: 5, // minutes
    maxDuration: 300, // minutes (5h)
    defaultDuration: 30, // minutes
    warningThreshold: 300, // secondes (5min)
    criticalThreshold: 60, // secondes (1min)
  },

  // Paramètres UI
  ui: {
    timerTickInterval: 1000, // ms — rafraîchissement du compte à rebours
    toastDuration: 5000, // ms
  },

  // Paramètres de stockage
  storage: {
    matchesKey: 'poolMatches',
    maxPayloadBytes: 5_000_000, // garde-fou avant écriture localStorage
  },

  // Validation
  validation: {
    playerNameMinLength: 2,
    playerNameMaxLength: 50,
  },

  // API CueScore
  api: {
    cueScore: {
      // Passe par notre propre proxy : CueScore ne renvoie pas de header CORS.
      // En prod → fonction serverless Vercel (api/cuescore.js).
      // En dev  → proxy Vite (voir vite.config.js).
      proxyPath: '/api/cuescore',
      // URL amont, utilisée uniquement côté serveur.
      upstreamUrl: 'https://cuescore.com/ajax/scoreboard-v2/',
      timeout: 15000, // ms
      // Fréquence de relecture des scores. Un point marqué doit apparaître à
      // l'écran en quelques secondes : c'est ce délai qui fixe la latence
      // perçue, pas le rendu.
      pollInterval: 5000, // ms
      // Les tables sont interrogées en parallèle, par petits groupes, pour que
      // le nombre de tables n'allonge pas le temps de cycle.
      maxConcurrentRequests: 4,
      // Quand un match se termine, CueScore repasse la table en NOMATCH. On
      // exige plusieurs lectures concordantes avant de clore le match : une
      // coupure réseau ou un aléa serveur ne doit pas terminer une rencontre
      // encore en cours.
      missingMatchConfirmations: 3,
    },
  },
};

import { matchValidators, MatchError, errorCodes } from '../utils/validation';
import { appConfig, findTableById } from '../utils/config';

const SAVE_DEBOUNCE_MS = 100;

/**
 * Store des matchs.
 *
 * La liste est tenue en mémoire et fait autorité ; localStorage n'est qu'un
 * miroir persistant écrit en différé. Relire localStorage à chaque mutation
 * ferait perdre toute modification encore en attente d'écriture (deux matchs
 * terminés dans la même seconde, par exemple).
 */
class MatchStore {
  constructor() {
    this.listeners = new Set();
    this.storageKey = appConfig.storage.matchesKey;
    this.saveTimeout = null;
    this.hasPendingWrite = false;
    this.storageAvailable = this.isStorageAvailable();
    this.matches = this.readFromStorage();

    this.init();
  }

  init() {
    if (typeof window === 'undefined') return;

    // Synchronisation entre onglets : un autre onglet a écrit, on recharge.
    window.addEventListener('storage', (e) => {
      if (e.key !== this.storageKey) return;
      this.matches = this.readFromStorage();
      this.notifyListeners();
    });

    // Garantit que la dernière écriture différée part avant la fermeture
    // ou la mise en arrière-plan de l'onglet.
    window.addEventListener('pagehide', () => this.flush());
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') this.flush();
    });
  }

  isStorageAvailable() {
    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, testKey);
      localStorage.removeItem(testKey);
      return true;
    } catch {
      console.warn('localStorage non disponible : les matchs ne seront pas persistés');
      return false;
    }
  }

  readFromStorage() {
    if (!this.storageAvailable) return [];
    try {
      const stored = localStorage.getItem(this.storageKey);
      const parsed = stored ? JSON.parse(stored) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error('Erreur lors de la lecture des matchs:', error);
      return [];
    }
  }

  /** Renvoie la liste courante (référence stable tant qu'elle n'a pas changé). */
  getMatches() {
    return this.matches;
  }

  /**
   * Applique une nouvelle liste : mise à jour immédiate en mémoire +
   * notification, écriture localStorage regroupée.
   */
  commit(matches) {
    this.matches = matches;
    this.notifyListeners();
    this.schedulePersist();
  }

  schedulePersist() {
    if (!this.storageAvailable) return;
    this.hasPendingWrite = true;
    clearTimeout(this.saveTimeout);
    this.saveTimeout = setTimeout(() => this.flush(), SAVE_DEBOUNCE_MS);
  }

  flush() {
    // Sans écriture en attente, ne rien réécrire : un onglet resté inactif
    // écraserait sinon, en se fermant, les données saisies dans un autre.
    if (!this.storageAvailable || !this.hasPendingWrite) return;
    clearTimeout(this.saveTimeout);
    this.saveTimeout = null;
    this.hasPendingWrite = false;
    try {
      const payload = JSON.stringify(this.matches);
      if (payload.length > appConfig.storage.maxPayloadBytes) {
        console.warn('Données trop volumineuses pour localStorage, écriture ignorée');
        return;
      }
      localStorage.setItem(this.storageKey, payload);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des matchs:', error);
    }
  }

  // Ajouter un match
  addMatch(player1, player2, table, maxDurationMinutes, additionalData = {}) {
    const sanitized = matchValidators.sanitizeInputs(player1, player2, table);
    const validation = matchValidators.validateNewMatch(
      sanitized.player1,
      sanitized.player2,
      sanitized.table,
      maxDurationMinutes
    );

    if (!validation.isValid) {
      throw new MatchError(validation.errors[0], errorCodes.VALIDATION_ERROR, validation.errors);
    }

    const tableCheck = matchValidators.checkTableAvailability(sanitized.table, this.matches);
    if (!tableCheck.isAvailable) {
      throw new MatchError(
        `La table ${sanitized.table} est déjà occupée par ${tableCheck.occupiedBy.player1} vs ${tableCheck.occupiedBy.player2}`,
        errorCodes.TABLE_OCCUPIED,
        tableCheck.occupiedBy
      );
    }

    const tableConfig = findTableById(sanitized.table);
    if (!tableConfig) {
      throw new MatchError(
        `Table ${sanitized.table} non trouvée dans la configuration`,
        errorCodes.VALIDATION_ERROR
      );
    }

    const newMatch = {
      id: this.generateId(),
      player1: sanitized.player1,
      player2: sanitized.player2,
      table: sanitized.table,
      tableCode: tableConfig.code,
      tableName: tableConfig.name,
      startTime: new Date().toISOString(),
      status: 'waiting',
      actualStartTime: null,
      maxDurationMinutes: Number.parseInt(maxDurationMinutes, 10),
      autoFinished: false,
      totalPausedTime: 0,
      ...additionalData,
    };

    this.commit([...this.matches, newMatch]);
    return newMatch;
  }

  /** Identifiant unique même si deux matchs sont créés dans la même milliseconde. */
  generateId() {
    let id = Date.now();
    while (this.matches.some((match) => match.id === id)) id += 1;
    return id;
  }

  removeMatch(matchId) {
    this.commit(this.matches.filter((match) => match.id !== matchId));
  }

  /** Applique une transformation à un match et ne commit que s'il a changé. */
  mutate(matchId, transform) {
    let changed = false;
    const updated = this.matches.map((match) => {
      if (match.id !== matchId) return match;
      const next = transform(match);
      if (next === match) return match;
      changed = true;
      return next;
    });
    if (changed) this.commit(updated);
  }

  updateMatchStatus(matchId, status) {
    if (!matchValidators.validateMatchStatus(status)) {
      throw new MatchError(`Statut invalide: ${status}`, errorCodes.INVALID_STATUS);
    }

    this.mutate(matchId, (match) => {
      const now = new Date().toISOString();
      const updated = { ...match, status };
      const pausedSince = (from) => (from ? new Date(now) - new Date(from) : 0);

      if (status === 'paused') {
        updated.pausedAt = now;
      } else if (status === 'active' && match.status === 'paused') {
        updated.totalPausedTime = (match.totalPausedTime || 0) + pausedSince(match.pausedAt);
        updated.pausedAt = null;
      } else if (status === 'active' && match.status === 'waiting') {
        // Passer un match "en attente" à "en cours" doit démarrer son
        // chronomètre, sinon le temps se compterait depuis sa création.
        updated.actualStartTime = now;
      } else if (status === 'finished') {
        updated.finishedAt = now;
        if (match.status === 'paused' && match.pausedAt) {
          updated.totalPausedTime = (match.totalPausedTime || 0) + pausedSince(match.pausedAt);
          updated.pausedAt = null;
        }
      }

      return updated;
    });
  }

  /**
   * Clôture un match que CueScore ne diffuse plus.
   *
   * La rencontre est allée à son terme : `autoFinished` reste à false pour que
   * la carte affiche « TERMINÉ » et non « TEMPS ÉCOULÉ ».
   */
  finishMatchFromCueScore(matchId) {
    this.mutate(matchId, (match) =>
      match.status === 'finished'
        ? match
        : {
            ...match,
            status: 'finished',
            finishedAt: new Date().toISOString(),
            autoFinished: false,
            finishedBy: 'cuescore',
          }
    );
  }

  // Terminer automatiquement un match quand le temps est écoulé
  autoFinishMatch(matchId) {
    this.mutate(matchId, (match) =>
      match.status === 'finished'
        ? match
        : {
            ...match,
            status: 'finished',
            finishedAt: new Date().toISOString(),
            autoFinished: true,
          }
    );
  }

  updateMatch(matchId, updates) {
    this.mutate(matchId, (match) => ({ ...match, ...updates }));
  }

  startMatchTimer(matchId) {
    this.mutate(matchId, (match) =>
      match.status === 'waiting'
        ? { ...match, status: 'active', actualStartTime: new Date().toISOString() }
        : match
    );
  }

  startAllTimers() {
    if (!this.matches.some((match) => match.status === 'waiting')) return;

    const now = new Date().toISOString();
    this.commit(
      this.matches.map((match) =>
        match.status === 'waiting' ? { ...match, status: 'active', actualStartTime: now } : match
      )
    );
  }

  clearAllMatches() {
    this.commit([]);
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notifyListeners() {
    this.listeners.forEach((listener) => {
      try {
        listener(this.matches);
      } catch (error) {
        console.error('Erreur dans un listener du store:', error);
      }
    });
  }
}

// Instance singleton
export const matchStore = new MatchStore();

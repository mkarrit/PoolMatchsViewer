import { matchValidators, MatchError, errorCodes } from '../utils/validation';
import { getTables } from '../utils/config';

class MatchStore {
  constructor() {
    this.listeners = new Set();
    this.storageKey = 'poolMatches';
    this.isInitialized = false;
    
    // Initialiser le store
    this.init();
  }

  async init() {
    try {
      // Vérifier si localStorage est disponible
      if (!this.isStorageAvailable()) {
        console.warn('localStorage non disponible, utilisation de la mémoire');
        this.fallbackStorage = [];
      }

      // Écouter les changements de localStorage (synchronisation cross-tab)
      window.addEventListener('storage', (e) => {
        if (e.key === this.storageKey) {
          this.notifyListeners();
        }
      });
      
      // Écouter les changements dans le même onglet
      window.addEventListener('matchesUpdated', () => {
        this.notifyListeners();
      });

      this.isInitialized = true;
    } catch (error) {
      console.error('Erreur lors de l\'initialisation du store:', error);
      this.fallbackStorage = [];
    }
  }

  isStorageAvailable() {
    try {
      const test = 'test';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  // Récupérer tous les matchs
  getMatches() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Erreur lors de la lecture des matchs:', error);
      return [];
    }
  }

  // Sauvegarder les matchs avec optimisations
  saveMatches(matches) {
    // Debounce pour éviter trop d'écritures
    clearTimeout(this.saveTimeout);
    this.saveTimeout = setTimeout(() => {
      try {
        const dataToSave = JSON.stringify(matches);
        // Vérifier la taille des données (limite typique 5-10MB)
        if (dataToSave.length > 5000000) { // 5MB
          console.warn('Données trop volumineuses pour localStorage');
          return;
        }
        localStorage.setItem(this.storageKey, dataToSave);
        // Déclencher un événement pour synchroniser le même onglet avec timestamp
        window.dispatchEvent(new CustomEvent('matchesUpdated', { 
          detail: { timestamp: Date.now() } 
        }));
      } catch (error) {
        console.error('Erreur lors de la sauvegarde des matchs:', error);
      }
    }, 100); // Debounce de 100ms
  }

  // Ajouter un match
  addMatch(player1, player2, table, maxDurationMinutes, additionalData = {}) {
    try {
      const matches = this.getMatches();
      
      // Nettoyer et valider les entrées
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

      // Vérifier la disponibilité de la table
      const tableCheck = matchValidators.checkTableAvailability(sanitized.table, matches);
      if (!tableCheck.isAvailable) {
        throw new MatchError(
          `La table ${sanitized.table} est déjà occupée par ${tableCheck.occupiedBy.player1} vs ${tableCheck.occupiedBy.player2}`,
          errorCodes.TABLE_OCCUPIED,
          tableCheck.occupiedBy
        );
      }

      // Trouver la configuration de la table depuis les tables dynamiques
      const availableTables = getTables();
      const tableConfig = availableTables.find(t => t.id === parseInt(sanitized.table));
      if (!tableConfig) {
        throw new MatchError(
          `Table ${sanitized.table} non trouvée dans la configuration`,
          errorCodes.VALIDATION_ERROR
        );
      }

      const newMatch = {
        id: Date.now(),
        player1: sanitized.player1,
        player2: sanitized.player2,
        table: sanitized.table,
        tableCode: tableConfig.code, // Ajouter le code CueScore
        tableName: tableConfig.name, // Ajouter le nom de la table
        startTime: new Date().toISOString(),
        status: 'waiting', // Nouveau statut par défaut
        actualStartTime: null, // Temps de démarrage réel du timer
        maxDurationMinutes: parseInt(maxDurationMinutes),
        autoFinished: false,
        totalPausedTime: 0,
        // Ajouter les données supplémentaires (scores CueScore, etc.)
        ...additionalData
      };

      const updatedMatches = [...matches, newMatch];
      this.saveMatches(updatedMatches);
      return newMatch;
    } catch (error) {
      if (error instanceof MatchError) {
        throw error;
      }
      throw new MatchError('Erreur lors de l\'ajout du match', errorCodes.STORAGE_ERROR, error);
    }
  }

  // Supprimer un match
  removeMatch(matchId) {
    const matches = this.getMatches();
    const updatedMatches = matches.filter(match => match.id !== matchId);
    this.saveMatches(updatedMatches);
  }

  // Modifier le statut d'un match
  updateMatchStatus(matchId, status) {
    const matches = this.getMatches();
    const updatedMatches = matches.map(match => {
      if (match.id === matchId) {
        const now = new Date().toISOString();
        const updatedMatch = { ...match, status };
        
        // Gérer les timestamps pour le calcul du temps de pause
        if (status === 'paused') {
          updatedMatch.pausedAt = now;
        } else if (status === 'active' && match.status === 'paused') {
          // Calculer le temps total de pause
          const pausedDuration = match.pausedAt ? 
            (new Date(now) - new Date(match.pausedAt)) : 0;
          
          updatedMatch.totalPausedTime = (match.totalPausedTime || 0) + pausedDuration;
          updatedMatch.pausedAt = null;
        } else if (status === 'finished') {
          updatedMatch.finishedAt = now;
          // Si le match était en pause quand il s'est terminé
          if (match.status === 'paused' && match.pausedAt) {
            const pausedDuration = new Date(now) - new Date(match.pausedAt);
            updatedMatch.totalPausedTime = (match.totalPausedTime || 0) + pausedDuration;
          }
        }
        
        return updatedMatch;
      }
      return match;
    });
    this.saveMatches(updatedMatches);
  }

  // Terminer automatiquement un match quand le temps est écoulé
  autoFinishMatch(matchId) {
    const matches = this.getMatches();
    const updatedMatches = matches.map(match => {
      if (match.id === matchId && match.status !== 'finished') {
        return { 
          ...match, 
          status: 'finished', 
          finishedAt: new Date().toISOString(),
          autoFinished: true 
        };
      }
      return match;
    });
    this.saveMatches(updatedMatches);
  }

  // Modifier un match
  updateMatch(matchId, updates) {
    const matches = this.getMatches();
    const updatedMatches = matches.map(match => 
      match.id === matchId ? { ...match, ...updates } : match
    );
    this.saveMatches(updatedMatches);
  }

  // Démarrer le timer d'un match spécifique
  startMatchTimer(matchId) {
    const matches = this.getMatches();
    const updatedMatches = matches.map(match => {
      if (match.id === matchId && match.status === 'waiting') {
        return { 
          ...match, 
          status: 'active',
          actualStartTime: new Date().toISOString()
        };
      }
      return match;
    });
    this.saveMatches(updatedMatches);
  }

  // Démarrer tous les timers des matchs en attente
  startAllTimers() {
    const matches = this.getMatches();
    const now = new Date().toISOString();
    const updatedMatches = matches.map(match => {
      if (match.status === 'waiting') {
        return { 
          ...match, 
          status: 'active',
          actualStartTime: now
        };
      }
      return match;
    });
    this.saveMatches(updatedMatches);
  }

  // S'abonner aux changements
  subscribe(listener) {
    this.listeners.add(listener);
    
    // Retourner une fonction de désabonnement
    return () => {
      this.listeners.delete(listener);
    };
  }

  // Notifier tous les listeners
  notifyListeners() {
    const matches = this.getMatches();
    this.listeners.forEach(listener => listener(matches));
  }

  // Vider tous les matchs
  clearAllMatches() {
    this.saveMatches([]);
  }
}

// Instance singleton
export const matchStore = new MatchStore();

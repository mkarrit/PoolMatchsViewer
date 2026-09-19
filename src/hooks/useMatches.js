import { useCallback, useState, useSyncExternalStore } from 'react';
import { matchStore } from '../store/matchStore';

const subscribe = (listener) => matchStore.subscribe(listener);
const getSnapshot = () => matchStore.getMatches();

/**
 * Actions du store.
 *
 * Elles sont définies une fois pour toutes, hors du hook : leur identité est
 * donc stable d'un rendu à l'autre, ce qui évite de relancer les effets qui
 * les prennent en dépendance (timers, rafraîchissement des scores).
 */
export const matchActions = {
  addMatch: (player1, player2, table, maxDurationMinutes, additionalData = {}) =>
    matchStore.addMatch(player1, player2, table, maxDurationMinutes, additionalData),
  removeMatch: (matchId) => matchStore.removeMatch(matchId),
  updateMatchStatus: (matchId, status) => matchStore.updateMatchStatus(matchId, status),
  updateMatch: (matchId, updates) => matchStore.updateMatch(matchId, updates),
  updateMatchScores: (matchId, scoreUpdates) => matchStore.updateMatch(matchId, scoreUpdates),
  clearAllMatches: () => matchStore.clearAllMatches(),
  autoFinishMatch: (matchId) => matchStore.autoFinishMatch(matchId),
  finishMatchFromCueScore: (matchId) => matchStore.finishMatchFromCueScore(matchId),
  startMatchTimer: (matchId) => matchStore.startMatchTimer(matchId),
  startAllTimers: () => matchStore.startAllTimers(),
};

export function useMatches() {
  const matches = useSyncExternalStore(subscribe, getSnapshot);
  const [error, setError] = useState(null);

  // Enveloppe commune : toutes les actions renvoient { success, error } et
  // publient le message d'erreur dans l'état du hook.
  const run = useCallback((action, ...args) => {
    try {
      setError(null);
      const result = action(...args);
      return { success: true, ...(result ? { match: result } : {}) };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, []);

  return {
    matches,
    error,
    addMatch: useCallback(
      (p1, p2, table, duration, extra) =>
        run(matchActions.addMatch, p1, p2, table, duration, extra),
      [run]
    ),
    removeMatch: useCallback((id) => run(matchActions.removeMatch, id), [run]),
    updateMatchStatus: useCallback(
      (id, status) => run(matchActions.updateMatchStatus, id, status),
      [run]
    ),
    updateMatch: useCallback((id, updates) => run(matchActions.updateMatch, id, updates), [run]),
    updateMatchScores: useCallback(
      (id, updates) => run(matchActions.updateMatchScores, id, updates),
      [run]
    ),
    clearAllMatches: useCallback(() => run(matchActions.clearAllMatches), [run]),
    autoFinishMatch: useCallback((id) => run(matchActions.autoFinishMatch, id), [run]),
    finishMatchFromCueScore: useCallback(
      (id) => run(matchActions.finishMatchFromCueScore, id),
      [run]
    ),
    startMatchTimer: useCallback((id) => run(matchActions.startMatchTimer, id), [run]),
    startAllTimers: useCallback(() => run(matchActions.startAllTimers), [run]),
  };
}

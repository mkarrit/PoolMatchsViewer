import { useState, useEffect } from 'react';
import { matchStore } from '../store/matchStore';

export function useMatches() {
  const [matches, setMatches] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Charger les matchs initiaux
    setMatches(matchStore.getMatches());

    // S'abonner aux changements
    const unsubscribe = matchStore.subscribe((updatedMatches) => {
      setMatches(updatedMatches);
    });

    // Nettoyer l'abonnement
    return unsubscribe;
  }, []);

  const addMatch = async (player1, player2, table, maxDurationMinutes, additionalData = {}) => {
    try {
      setError(null);
      
      // Validation des entrées
      if (!player1?.trim() || !player2?.trim() || !table?.trim()) {
        throw new Error('Tous les champs sont obligatoires');
      }

      if (!maxDurationMinutes || isNaN(maxDurationMinutes) || maxDurationMinutes <= 0) {
        throw new Error('La durée doit être un nombre positif');
      }

      const newMatch = matchStore.addMatch(player1, player2, table, maxDurationMinutes, additionalData);
      return { success: true, match: newMatch };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  const removeMatch = (matchId) => {
    try {
      setError(null);
      matchStore.removeMatch(matchId);
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  const updateMatchStatus = (matchId, status) => {
    try {
      setError(null);
      matchStore.updateMatchStatus(matchId, status);
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  const updateMatch = (matchId, updates) => {
    try {
      setError(null);
      matchStore.updateMatch(matchId, updates);
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  const clearAllMatches = () => {
    try {
      setError(null);
      matchStore.clearAllMatches();
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  const autoFinishMatch = (matchId) => {
    try {
      setError(null);
      matchStore.autoFinishMatch(matchId);
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  const updateMatchScores = (matchId, scoreUpdates) => {
    try {
      setError(null);
      matchStore.updateMatch(matchId, scoreUpdates);
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  return {
    matches,
    error,
    addMatch,
    removeMatch,
    updateMatchStatus,
    updateMatch,
    updateMatchScores,
    clearAllMatches,
    autoFinishMatch
  };
}

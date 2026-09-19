import { useCallback, useEffect, useRef } from 'react';
import { useCueScore } from './useCueScore';
import { appConfig } from '../utils/config';

const { pollInterval, maxConcurrentRequests, missingMatchConfirmations } = appConfig.api.cueScore;

/** Exécute les tâches par groupes, pour ne pas ouvrir N requêtes d'un coup. */
async function runBatched(items, task, batchSize) {
  for (let i = 0; i < items.length; i += batchSize) {
    await Promise.all(items.slice(i, i + batchSize).map(task));
  }
}

/**
 * Met à jour automatiquement les scores des matchs actifs depuis CueScore et
 * clôt ceux que CueScore ne diffuse plus.
 *
 * Les tables sont interrogées en parallèle et le cycle est court : un point
 * marqué sur CueScore apparaît à l'écran en quelques secondes.
 *
 * La liste des matchs est lue dans une ref plutôt que prise en dépendance :
 * sinon chaque mise à jour de score relancerait l'effet, qui reprogrammerait
 * un intervalle supplémentaire — les appels réseau doublaient à chaque cycle.
 */
export function useScoreUpdater(matches, updateMatchScores, finishMatch) {
  const { fetchMatchData } = useCueScore();

  const matchesRef = useRef(matches);
  const updateScoresRef = useRef(updateMatchScores);
  const finishMatchRef = useRef(finishMatch);
  const isUpdatingRef = useRef(false);
  const isMountedRef = useRef(true);
  // Nombre de lectures NOMATCH consécutives, par identifiant de match.
  const missingCountRef = useRef(new Map());

  matchesRef.current = matches;
  updateScoresRef.current = updateMatchScores;
  finishMatchRef.current = finishMatch;

  const hasActiveMatches = matches.some((match) => match.status === 'active' && match.tableCode);

  const updateScores = useCallback(async () => {
    // Un cycle précédent est encore en cours : on ne l'empile pas.
    if (isUpdatingRef.current) return;
    isUpdatingRef.current = true;

    try {
      const activeMatches = matchesRef.current.filter(
        (match) => match.status === 'active' && match.tableCode
      );
      if (activeMatches.length === 0) return;

      // Purge des compteurs des matchs qui ne sont plus suivis.
      const activeIds = new Set(activeMatches.map((match) => match.id));
      missingCountRef.current.forEach((_, id) => {
        if (!activeIds.has(id)) missingCountRef.current.delete(id);
      });

      await runBatched(
        activeMatches,
        async (match) => {
          const result = await fetchMatchData(match.tableCode);
          if (!isMountedRef.current) return;

          // Relire le match : il a pu être terminé, mis en pause ou supprimé
          // pendant l'appel réseau.
          const current = matchesRef.current.find((m) => m.id === match.id);
          if (!current || current.status !== 'active') return;

          if (!result.success) {
            if (result.error === 'NOMATCH') {
              // CueScore ne diffuse plus ce match : il vient probablement de
              // se terminer. On attend plusieurs confirmations avant de clore.
              const seen = (missingCountRef.current.get(match.id) || 0) + 1;
              missingCountRef.current.set(match.id, seen);

              if (seen >= missingMatchConfirmations) {
                missingCountRef.current.delete(match.id);
                finishMatchRef.current?.(match.id);
              }
            } else {
              console.warn(
                `Scores non mis à jour pour ${match.tableName || match.table}: ${result.message}`
              );
            }
            return;
          }

          // Lecture réussie : le match est bien toujours diffusé.
          missingCountRef.current.delete(match.id);

          const scoreA = Number(result.data.scoreA) || 0;
          const scoreB = Number(result.data.scoreB) || 0;
          const raceTo = Number(result.data.raceTo) || null;

          const updates = {};
          if (scoreA !== current.scoreA || scoreB !== current.scoreB) {
            updates.scoreA = scoreA;
            updates.scoreB = scoreB;
            updates.lastScoreUpdate = new Date().toISOString();
          }
          // Le format peut être ajusté par l'organisateur en cours d'épreuve.
          if (raceTo !== (current.raceTo ?? null)) {
            updates.raceTo = raceTo;
          }

          if (Object.keys(updates).length > 0) {
            updateScoresRef.current(match.id, updates);
          }
        },
        maxConcurrentRequests
      );
    } catch (error) {
      console.error('Erreur lors de la mise à jour des scores:', error);
    } finally {
      isUpdatingRef.current = false;
    }
  }, [fetchMatchData]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!hasActiveMatches) return undefined;

    // Relecture immédiate, puis à intervalle régulier.
    updateScores();
    const intervalId = setInterval(updateScores, pollInterval);

    // Un onglet en arrière-plan voit ses minuteries fortement ralenties par le
    // navigateur : on resynchronise dès qu'il redevient visible, sans quoi
    // l'écran afficherait un score figé au retour.
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') updateScores();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [hasActiveMatches, updateScores]);

  return { manualUpdate: updateScores };
}

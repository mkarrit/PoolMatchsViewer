import { useState, useCallback, useRef, useEffect } from 'react';
import { appConfig } from '../utils/config';

/**
 * Codes d'erreur métier renvoyés par CueScore.
 * Ce ne sont pas des pannes : ils décrivent l'état de la table.
 */
export const CUESCORE_ERRORS = {
  NOMATCH: 'Aucun match lancé sur cette table',
  NOTABLE: 'Table inconnue côté CueScore (vérifiez le code)',
  NOCODE: 'Code de table invalide',
};

/**
 * Hook pour récupérer les données depuis l'API CueScore.
 *
 * L'appel passe par /api/cuescore (fonction serverless en prod, proxy Vite en
 * dev) car CueScore ne renvoie aucun header CORS.
 */
export function useCueScore() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchMatchData = useCallback(async (tableCode) => {
    if (!tableCode) {
      return { success: false, error: 'NOCODE', message: CUESCORE_ERRORS.NOCODE };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), appConfig.api.cueScore.timeout);

    if (isMountedRef.current) {
      setLoading(true);
      setError(null);
    }

    try {
      const response = await fetch(
        `${appConfig.api.cueScore.proxyPath}?tableCode=${encodeURIComponent(tableCode)}`,
        { signal: controller.signal, headers: { Accept: 'application/json' } }
      );

      const data = await response.json().catch(() => null);

      // Erreurs métier CueScore : on les remonte telles quelles, sans lever
      // d'exception — l'appelant décide quoi en faire. En cas de succès le
      // champ vaut la chaîne vide, pas `undefined`.
      if (data?.error && CUESCORE_ERRORS[data.error]) {
        return {
          success: false,
          error: data.error,
          message: CUESCORE_ERRORS[data.error],
          // Sur une table libre, CueScore annonce déjà la rencontre suivante :
          // de quoi préparer l'affichage avant le lancement du match.
          nextMatch: data.nextMatch ?? null,
        };
      }

      if (!response.ok) {
        throw new Error(`Service CueScore indisponible (HTTP ${response.status})`);
      }

      // Hors match, CueScore renvoie `"match": []` — un tableau vide, donc
      // truthy : un simple test de présence laisserait passer un non-match.
      const match = data?.match;
      if (!match || Array.isArray(match) || !match.playerA || !match.playerB) {
        return {
          success: false,
          error: 'NOMATCH',
          message: CUESCORE_ERRORS.NOMATCH,
          nextMatch: data?.nextMatch ?? null,
        };
      }

      return { success: true, data: match };
    } catch (err) {
      const message =
        err.name === 'AbortError'
          ? 'Délai dépassé lors de l\'appel à CueScore'
          : err.message;

      if (isMountedRef.current) setError(message);
      return { success: false, error: 'NETWORK_ERROR', message };
    } finally {
      clearTimeout(timeoutId);
      if (isMountedRef.current) setLoading(false);
    }
  }, []);

  return { fetchMatchData, loading, error };
}

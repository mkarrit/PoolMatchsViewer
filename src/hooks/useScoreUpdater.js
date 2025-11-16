import { useEffect, useRef, useCallback } from 'react';
import { useCueScore } from './useCueScore';

/**
 * Hook pour mettre à jour automatiquement les scores des matchs actifs
 */
export function useScoreUpdater(matches, updateMatchScores) {
  const { fetchMatchData } = useCueScore();
  const intervalRef = useRef(null);
  const isUpdatingRef = useRef(false);

  // Fonction pour mettre à jour les scores (mémorisée avec useCallback)
  const updateScores = useCallback(async () => {
    // Éviter les appels simultanés
    if (isUpdatingRef.current) return;
    
    try {
      isUpdatingRef.current = true;
      
      // Filtrer les matchs actifs qui ont un code de table
      const activeMatches = matches.filter(match => 
        match.status === 'active' && 
        match.tableCode
      );

      if (activeMatches.length === 0) {
        return;
      }

      // Mettre à jour les scores de tous les matchs actifs
      for (const match of activeMatches) {
        try {
          const result = await fetchMatchData(match.tableCode);
          
          if (result.success && result.data) {
            const newScoreA = result.data.scoreA || 0;
            const newScoreB = result.data.scoreB || 0;
            
            // Mettre à jour seulement si les scores ont changé
            if (newScoreA !== match.scoreA || newScoreB !== match.scoreB) {
              await updateMatchScores(match.id, {
                scoreA: newScoreA,
                scoreB: newScoreB,
                lastScoreUpdate: new Date().toISOString()
              });
            }
          } else if (result.error !== 'NOMATCH') {
            // Ignorer silencieusement NOMATCH (match pas encore lancé)
            console.warn(`Aucune donnée valide pour ${match.tableName || match.table}`);
          }
        } catch (err) {
          console.warn(`Erreur mise à jour ${match.tableName || match.table}:`, err.message);
        }
        
        // Pause de 500ms entre chaque appel pour éviter la surcharge
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
    } catch (error) {
      console.error('Erreur lors de la mise à jour des scores:', error);
    } finally {
      isUpdatingRef.current = false;
    }
  }, [matches, fetchMatchData, updateMatchScores]);

  useEffect(() => {
    const startAutoUpdate = () => {
      // Première mise à jour après 5 secondes (réduit de 10s)
      setTimeout(() => {
        updateScores();
      }, 5000);

      // Puis toutes les 30 secondes (plus fréquent pour de meilleures performances)
      intervalRef.current = setInterval(() => {
        updateScores();
      }, 30000); // 30 secondes au lieu de 60
      
      console.log('🚀 Mise à jour automatique des scores démarrée (toutes les 30 secondes)');
    };

    const activeMatchesCount = matches.filter(m => m.status === 'active').length;
    
    if (activeMatchesCount > 0) {
      startAutoUpdate();
    } else {
      // Arrêter la mise à jour s'il n'y a pas de matchs actifs
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        console.log('⏹️ Mise à jour automatique arrêtée (aucun match actif)');
      }
    }

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [matches, updateScores]);

  // Fonction pour mise à jour manuelle
  const manualUpdate = async () => {
    await updateScores();
  };

  return {
    manualUpdate,
    isUpdating: isUpdatingRef.current
  };
}

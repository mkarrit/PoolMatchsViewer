import { useState, useEffect, useRef } from 'react';

/**
 * Hook optimisé pour la gestion des timers de match
 * Évite les re-calculs inutiles et optimise les performances
 */
export function useMatchTimer(match, onTimeExpired) {
  const [remainingTime, setRemainingTime] = useState(0);
  const intervalRef = useRef(null);
  const lastCalculatedTimeRef = useRef(0);

  useEffect(() => {
    const calculateRemainingTime = () => {
      // Si le match n'a pas encore démarré (status waiting), retourner le temps max
      if (match.status === 'waiting') {
        return match.maxDurationMinutes * 60;
      }

      // Utiliser actualStartTime si disponible, sinon startTime
      const startTime = new Date(match.actualStartTime || match.startTime);
      const now = Date.now();
      const maxDurationMs = match.maxDurationMinutes * 60 * 1000;
      
      // Calculer le temps effectif écoulé (en excluant les pauses)
      let effectiveElapsedMs = now - startTime.getTime();
      
      // Soustraire le temps total de pause
      if (match.totalPausedTime) {
        effectiveElapsedMs -= match.totalPausedTime;
      }
      
      // Si actuellement en pause, ne pas compter le temps depuis la pause
      if (match.status === 'paused' && match.pausedAt) {
        const currentPauseMs = now - new Date(match.pausedAt).getTime();
        effectiveElapsedMs -= currentPauseMs;
      }
      
      // Si le match est terminé, utiliser le temps de fin
      if (match.status === 'finished' && match.finishedAt) {
        const finishTime = new Date(match.finishedAt).getTime();
        effectiveElapsedMs = finishTime - startTime.getTime();
        if (match.totalPausedTime) {
          effectiveElapsedMs -= match.totalPausedTime;
        }
      }
      
      const remainingMs = Math.max(0, maxDurationMs - effectiveElapsedMs);
      return Math.floor(remainingMs / 1000);
    };
    const updateTimer = () => {
      const newTime = calculateRemainingTime();
      
      // Optimisation : ne mettre à jour que si le temps a changé
      if (newTime !== lastCalculatedTimeRef.current) {
        lastCalculatedTimeRef.current = newTime;
        setRemainingTime(newTime);
        
        // Vérifier si le temps est écoulé (seulement pour les matchs actifs)
        if (newTime === 0 && match.status === 'active' && onTimeExpired) {
          onTimeExpired(match.id);
        }
      }
    };

    // Calcul initial
    updateTimer();

    // Démarrer l'intervalle seulement si le match est actif
    if (match.status === 'active') {
      intervalRef.current = setInterval(updateTimer, 1000);
    }

    // Nettoyer l'intervalle
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [
    match.startTime,
    match.actualStartTime,
    match.status,
    match.totalPausedTime,
    match.pausedAt,
    match.finishedAt,
    match.maxDurationMinutes,
    match.id,
    onTimeExpired
  ]);

  return remainingTime;
}

import { useState, useEffect, useMemo, useRef } from 'react';
import { appConfig } from '../utils/config';

/**
 * Calcule le temps restant d'un match, en secondes.
 *
 * Le calcul repose sur des horodatages absolus : il reste donc juste même si
 * l'onglet a été mis en arrière-plan et que les ticks ont été ralentis par le
 * navigateur.
 */
export function computeRemainingSeconds(match, now = Date.now()) {
  const maxDurationMs = (Number(match.maxDurationMinutes) || 0) * 60 * 1000;

  // Tant que le match n'a pas démarré, il dispose de la totalité de son temps.
  if (match.status === 'waiting' || !(match.actualStartTime || match.startTime)) {
    return Math.floor(maxDurationMs / 1000);
  }

  const startMs = new Date(match.actualStartTime || match.startTime).getTime();
  if (Number.isNaN(startMs)) return Math.floor(maxDurationMs / 1000);

  // Un match terminé est figé sur son heure de fin.
  const referenceMs =
    match.status === 'finished' && match.finishedAt ? new Date(match.finishedAt).getTime() : now;

  let elapsedMs = referenceMs - startMs - (match.totalPausedTime || 0);

  // En pause : le temps écoulé depuis la mise en pause ne compte pas.
  if (match.status === 'paused' && match.pausedAt) {
    elapsedMs -= now - new Date(match.pausedAt).getTime();
  }

  return Math.floor(Math.max(0, maxDurationMs - elapsedMs) / 1000);
}

/**
 * Hook de compte à rebours d'un match.
 *
 * Seuls les champs liés au temps sont observés : une simple mise à jour de
 * score ne relance pas l'intervalle. onTimeExpired est lu via une ref, son
 * identité n'a donc pas d'incidence.
 */
export function useMatchTimer(match, onTimeExpired) {
  const {
    id,
    status,
    startTime,
    actualStartTime,
    totalPausedTime,
    pausedAt,
    finishedAt,
    maxDurationMinutes,
  } = match;

  const timerState = useMemo(
    () => ({
      id,
      status,
      startTime,
      actualStartTime,
      totalPausedTime,
      pausedAt,
      finishedAt,
      maxDurationMinutes,
    }),
    [id, status, startTime, actualStartTime, totalPausedTime, pausedAt, finishedAt, maxDurationMinutes]
  );

  const [remainingTime, setRemainingTime] = useState(() => computeRemainingSeconds(timerState));
  const onTimeExpiredRef = useRef(onTimeExpired);
  const expiredNotifiedRef = useRef(false);

  useEffect(() => {
    onTimeExpiredRef.current = onTimeExpired;
  }, [onTimeExpired]);

  useEffect(() => {
    // Un changement d'état temporel (démarrage, reprise…) réarme la
    // notification de fin de temps.
    expiredNotifiedRef.current = false;

    const tick = () => {
      const seconds = computeRemainingSeconds(timerState);
      setRemainingTime(seconds);

      // Déclenché y compris si le temps était déjà écoulé au montage :
      // typiquement un écran TV rouvert après l'expiration d'un match.
      if (seconds === 0 && timerState.status === 'active' && !expiredNotifiedRef.current) {
        expiredNotifiedRef.current = true;
        onTimeExpiredRef.current?.(timerState.id);
      }
    };

    tick();

    if (timerState.status !== 'active') return undefined;

    const intervalId = setInterval(tick, appConfig.ui.timerTickInterval);
    return () => clearInterval(intervalId);
  }, [timerState]);

  return remainingTime;
}

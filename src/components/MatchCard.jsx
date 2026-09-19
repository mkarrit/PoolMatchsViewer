import React, { useMemo, memo } from "react";
import { formatCountdownTime } from "../utils/formatTime";
import { matchActions } from "../hooks/useMatches";
import { useMatchTimer } from "../hooks/useMatchTimer";
import { appConfig } from "../utils/config";

// Taille de police du nom : tous les paliers desktop rendaient la même
// valeur, seule la version mobile a réellement besoin de s'adapter.
const DESKTOP_NAME_TEXT_SIZE = 'text-xs sm:text-sm xs:text-base';

const getMobileNameTextSize = (name) => {
  const length = name?.length || 0;
  if (length <= 15) return 'text-base';
  if (length <= 22) return 'text-sm';
  return 'text-xs';
};

const getTableTextSize = (tableName) => {
  const length = tableName?.length || 0;
  return length <= 10 ? 'text-xl xl:text-xl' : 'text-xs';
};

export default memo(function MatchCard({ match }) {
  // matchActions est une référence stable : la carte n'a pas besoin de
  // s'abonner au store, ce qui évite de re-rendre toutes les cartes à chaque
  // mise à jour de score d'une seule d'entre elles.
  const remainingTime = useMatchTimer(match, matchActions.autoFinishMatch);
  const isCritical =
    remainingTime < appConfig.match.warningThreshold && match.status === 'active';

  // Utiliser les scores stockés dans le match (venant de l'API lors de l'ajout)
  const currentScoreA = match.scoreA ?? 0;
  const currentScoreB = match.scoreB ?? 0;
  // Format de la rencontre : le `raceTo` varie d'un match à l'autre, un score
  // seul ne dit pas combien de manches restent à jouer.
  const raceTo = Number(match.raceTo) || null;

  // Mémoriser tous les calculs coûteux en une seule fois
  const computedStyles = useMemo(() => ({
    player1MobileTextSize: getMobileNameTextSize(match.player1),
    player2MobileTextSize: getMobileNameTextSize(match.player2),
    // La puce affiche tableName en priorité : c'est sa longueur qui doit
    // piloter la taille du texte, pas l'identifiant numérique.
    tableTextSize: getTableTextSize(match.tableName || `TABLE ${match.table}`)
  }), [match.player1, match.player2, match.tableName, match.table]);

  // Mémoriser les calculs de statut
  const matchStatus = useMemo(() => {
    const getStatusColor = () => {
      switch (match.status) {
        case 'waiting':
          return 'text-text-muted';
        case 'paused':
          return 'text-warning';
        case 'finished':
          return match.autoFinished ? 'text-error' : 'text-success';
        default:
          return remainingTime < appConfig.match.warningThreshold ? 'text-error' : 'text-accent';
      }
    };

    const getStatusIcon = () => {
      switch (match.status) {
        case 'waiting':
          return '⏳';
        case 'paused':
          return '⏸️';
        case 'finished':
          return '🏁';
        default:
          return '⏱️';
      }
    };

    const getCardBorderClass = () => {
      switch (match.status) {
        case 'waiting':
          return 'border border-text-muted/40 shadow-lg shadow-text-muted/10';
        case 'paused':
          return 'border border-warning/40 shadow-lg shadow-warning/10';
        case 'finished':
          return 'border border-success/40 shadow-lg shadow-success/10';
        default:
          return 'border border-white/20 shadow-lg shadow-accent/5';
      }
    };

    const getBackgroundClass = () => {
      switch (match.status) {
        case 'waiting':
          return 'bg-gradient-to-br from-text-muted/8 via-glass-medium to-primary/80 backdrop-blur-xl';
        case 'paused':
          return 'bg-gradient-to-br from-warning/8 via-glass-medium to-primary/80 backdrop-blur-xl';
        case 'finished':
          return 'bg-gradient-to-br from-success/8 via-glass-medium to-primary/80 backdrop-blur-xl';
        default:
          return 'bg-gradient-to-br from-accent/5 via-glass-light to-secondary/60 backdrop-blur-xl';
      }
    };

    return {
      color: getStatusColor(),
      icon: getStatusIcon(),
      borderClass: getCardBorderClass(),
      backgroundClass: getBackgroundClass()
    };
  }, [match.status, match.autoFinished, remainingTime]);

  return (
    <div className={`${matchStatus.backgroundClass} ${matchStatus.borderClass} text-text-primary p-2 sm:p-4 rounded-2xl w-full max-w-[380px] transition-all duration-300`}>
      {/* En-tête avec numéro de table */}
      <div className="text-center mb-2 sm:mb-3">
        <div className="inline-flex items-center bg-glass-strong backdrop-blur-md border border-accent/40 text-accent px-2 sm:px-3 py-1 rounded-full font-semibold tracking-wide shadow-sm">
          <div className="w-1 sm:w-1.5 h-1 sm:h-1.5 bg-accent rounded-full mr-1 sm:mr-2 animate-pulse shadow-sm shadow-accent/50"></div>
          <span className={`${computedStyles.tableTextSize} leading-tight`}>
            {match.tableName || `TABLE ${match.table}`}
          </span>
        </div>
      </div>

      {/* Noms des joueurs avec scores - RESPONSIVE */}
      <div className="bg-glass-medium backdrop-blur-lg rounded-xl p-2 sm:p-4 mb-3 sm:mb-4 border border-white/10 shadow-inner">
        {/* Version mobile - verticale */}
        <div className="flex flex-col sm:hidden space-y-3">
          {/* Joueur 1 */}
          <div className="text-center">
            <div className={`${computedStyles.player1MobileTextSize} font-black text-text-primary bg-glass-light px-2 py-1 rounded-lg border border-white/20 shadow-md mb-1 leading-tight`}>
              {match.player1}
            </div>
            <div className="text-2xl font-bold text-accent">
              {currentScoreA}
            </div>
          </div>

          {/* VS Mobile */}
          <div className="flex justify-center">
            <div className="relative bg-gradient-to-r from-accent-dark via-accent to-accent-light text-white px-3 py-1 rounded-lg font-bold text-sm shadow-md shadow-accent/20">
              <div className="absolute inset-0 bg-white/20 rounded-lg backdrop-blur-sm"></div>
              <span className="relative">VS</span>
            </div>
          </div>

          {/* Joueur 2 */}
          <div className="text-center">
            <div className={`${computedStyles.player2MobileTextSize} font-black text-text-primary bg-glass-light px-2 py-1 rounded-lg border border-white/20 shadow-md mb-1 leading-tight`}>
              {match.player2}
            </div>
            <div className="text-2xl font-bold text-accent">
              {currentScoreB}
            </div>
          </div>

          {raceTo && (
            <div className="text-center text-[11px] font-semibold tracking-wide text-text-muted uppercase">
              Course en {raceTo}
            </div>
          )}
        </div>

        {/* Version desktop - horizontale */}
        <div className="hidden sm:flex items-center justify-between">
          <div className="flex-1 text-center space-y-2 min-w-0 px-1">
            <div className={`${DESKTOP_NAME_TEXT_SIZE} font-black text-text-primary px-2 leading-tight`}>
              {match.player1}
            </div>
            <div className="text-2xl xl:text-3xl font-bold text-accent">
              {currentScoreA}
            </div>
          </div>
          
          <div className="mx-2 xl:mx-3 flex-shrink-0">
            <div className="relative bg-gradient-to-r from-accent-dark via-accent to-accent-light text-white px-2 xl:px-3 py-1.5 rounded-lg font-bold text-sm shadow-md shadow-accent/20">
              <div className="absolute inset-0 bg-white/20 rounded-lg backdrop-blur-sm"></div>
              <span className="relative">VS</span>
            </div>
          </div>
          
          <div className="flex-1 text-center space-y-2 min-w-0 px-1">
            <div className={`${DESKTOP_NAME_TEXT_SIZE} font-black text-text-primary px-2 leading-tight`}>
              {match.player2}
            </div>
            <div className="text-2xl xl:text-3xl font-bold text-accent">
              {currentScoreB}
            </div>
          </div>
        </div>

        {raceTo && (
          <div className="hidden sm:block text-center text-xs font-semibold tracking-wide text-text-muted uppercase mt-2">
            Course en {raceTo}
          </div>
        )}
      </div>

      {/* Timer - RESPONSIVE */}
      <div className="text-center mb-2 sm:mb-3">
        <div className={`text-2xl sm:text-3xl font-mono font-black ${matchStatus.color} mb-1 drop-shadow-md`}>
          {matchStatus.icon} {formatCountdownTime(remainingTime)}
        </div>
        <div className="text-xs sm:text-sm text-text-muted font-semibold">
          / {match.maxDurationMinutes} min
        </div>
        
        {isCritical && remainingTime > 0 && (
          <div className="mt-2 flex items-center justify-center gap-1 sm:gap-2 text-error">
            <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 bg-error rounded-full animate-pulse"></div>
            <span className="text-xs sm:text-sm font-bold tracking-wide">TEMPS CRITIQUE</span>
            <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 bg-error rounded-full animate-pulse"></div>
          </div>
        )}
      </div>
        
      {/* Statuts - RESPONSIVE */}
      {match.status === 'waiting' && (
        <div className="bg-glass-medium backdrop-blur-lg border border-text-muted/30 rounded-lg p-1.5 sm:p-2 shadow-sm">
          <div className="flex items-center justify-center gap-1 sm:gap-2">
            <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 bg-text-muted rounded-full animate-pulse"></div>
            <span className="text-text-muted font-semibold text-xs sm:text-sm tracking-wide">EN ATTENTE</span>
          </div>
        </div>
      )}
      
      {match.status === 'paused' && (
        <div className="bg-glass-medium backdrop-blur-lg border border-warning/30 rounded-lg p-1.5 sm:p-2 shadow-sm">
          <div className="flex items-center justify-center gap-1 sm:gap-2">
            <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 bg-warning rounded-full animate-pulse"></div>
            <span className="text-warning font-semibold text-xs sm:text-sm tracking-wide">EN PAUSE</span>
          </div>
        </div>
      )}
      
      {match.status === 'finished' && (
        <div className={`bg-glass-medium backdrop-blur-lg rounded-lg p-1.5 sm:p-2 shadow-sm border ${match.autoFinished ? 'border-error/30' : 'border-success/30'}`}>
          <div className="flex items-center justify-center gap-1 sm:gap-2">
            <div className={`w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full ${match.autoFinished ? 'bg-error' : 'bg-success'}`}></div>
            <span className={`font-semibold text-xs sm:text-sm tracking-wide ${match.autoFinished ? 'text-error' : 'text-success'}`}>
              {match.autoFinished ? 'TEMPS ÉCOULÉ' : 'TERMINÉ'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
});

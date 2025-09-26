import React, { useMemo, memo } from "react";
import { formatCountdownTime } from "../utils/formatTime";
import { useMatches } from "../hooks/useMatches";
import { useMatchTimer } from "../hooks/useMatchTimer";

// Fonctions pures pour les calculs de taille de texte (optimisées)
const getNameTextSize = (name) => {
  const length = name?.length || 0;
  if (length <= 12) return 'text-lg sm:text-xl xl:text-xl';
  if (length <= 18) return 'text-base sm:text-lg xl:text-xl';
  if (length <= 25) return 'text-sm sm:text-base xl:text-lg';
  return 'text-xs sm:text-sm xl:text-base';
};

const getMobileNameTextSize = (name) => {
  const length = name?.length || 0;
  if (length <= 15) return 'text-base';
  if (length <= 22) return 'text-sm';
  return 'text-xs';
};

const getTableTextSize = (tableName) => {
  const length = tableName?.length || 0;
  return length <= 10 ? 'text-xs sm:text-sm' : 'text-xs';
};

export default memo(function MatchCard({ match }) {
  const { autoFinishMatch } = useMatches();
  
  // Utiliser le hook optimisé pour le timer
  const remainingTime = useMatchTimer(match, autoFinishMatch);

  // Utiliser les scores stockés dans le match (venant de l'API lors de l'ajout)
  const currentScoreA = match.scoreA ?? 0;
  const currentScoreB = match.scoreB ?? 0;

  // Mémoriser tous les calculs coûteux en une seule fois
  const computedStyles = useMemo(() => ({
    player1TextSize: getNameTextSize(match.player1),
    player2TextSize: getNameTextSize(match.player2),
    player1MobileTextSize: getMobileNameTextSize(match.player1),
    player2MobileTextSize: getMobileNameTextSize(match.player2),
    tableTextSize: getTableTextSize(match.table)
  }), [match.player1, match.player2, match.table]);

  // Mémoriser les calculs de statut
  const matchStatus = useMemo(() => {
    const getStatusColor = () => {
      switch (match.status) {
        case 'paused':
          return 'text-warning';
        case 'finished':
          return match.autoFinished ? 'text-error' : 'text-success';
        default:
          return remainingTime < 300 ? 'text-error' : 'text-accent';
      }
    };

    const getStatusIcon = () => {
      switch (match.status) {
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
    <div className={`${matchStatus.backgroundClass} ${matchStatus.borderClass} text-text-primary p-3 sm:p-4 rounded-2xl w-full max-w-[380px] transition-all duration-300`}>
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
        </div>

        {/* Version desktop - horizontale */}
        <div className="hidden sm:flex items-center justify-between">
          <div className="flex-1 text-center space-y-2 min-w-0 px-1">
            <div className={`${computedStyles.player1TextSize} font-black text-text-primary bg-glass-light px-2 py-1.5 rounded-lg border border-white/20 shadow-md leading-tight`}>
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
            <div className={`${computedStyles.player2TextSize} font-black text-text-primary bg-glass-light px-2 py-1.5 rounded-lg border border-white/20 shadow-md leading-tight`}>
              {match.player2}
            </div>
            <div className="text-2xl xl:text-3xl font-bold text-accent">
              {currentScoreB}
            </div>
          </div>
        </div>
      </div>

      {/* Timer - RESPONSIVE */}
      <div className="text-center mb-2 sm:mb-3">
        <div className={`text-2xl sm:text-3xl font-mono font-black ${matchStatus.color} mb-1 drop-shadow-md`}>
          {matchStatus.icon} {formatCountdownTime(remainingTime)}
        </div>
        <div className="text-xs sm:text-sm text-text-muted font-semibold">
          / {match.maxDurationMinutes} min
        </div>
        
        {remainingTime < 300 && remainingTime > 0 && match.status === 'active' && (
          <div className="mt-2 flex items-center justify-center gap-1 sm:gap-2 text-error">
            <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 bg-error rounded-full animate-pulse"></div>
            <span className="text-xs sm:text-sm font-bold tracking-wide">TEMPS CRITIQUE</span>
            <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 bg-error rounded-full animate-pulse"></div>
          </div>
        )}
      </div>
        
      {/* Statuts - RESPONSIVE */}
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

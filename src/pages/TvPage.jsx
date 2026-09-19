import React, { memo } from "react";
import MatchCard from "../components/MatchCard";
import EditableTitle from "../components/EditableTitle";
import { useMatches } from "../hooks/useMatches";
import { useScoreUpdater } from "../hooks/useScoreUpdater";
import { useTheme } from "../hooks/useTheme";

const TvHeader = memo(function TvHeader({ logo, themeName }) {
  return (
    <div className="bg-glass-medium backdrop-blur-xl rounded-2xl p-4 mb-8 border border-white/10 shadow-xl shadow-accent/5">
      <div className="flex items-center gap-4">
        <div className="relative">
          <img
            src={logo}
            alt={`Logo ${themeName}`}
            className="h-12 w-auto drop-shadow-lg"
            onError={(e) => {
              // Éviter la boucle infinie si le logo de repli est lui aussi absent.
              if (e.target.dataset.fallbackApplied) return;
              e.target.dataset.fallbackApplied = "true";
              e.target.src = "/FFBillard_logo.png";
            }}
          />
          <div className="absolute inset-0 bg-accent/10 rounded-full blur-lg pointer-events-none"></div>
        </div>
        <div>
          <EditableTitle />
        </div>
      </div>
    </div>
  );
});

const NoMatchesMessage = memo(function NoMatchesMessage() {
  return (
    <div className="bg-glass-light backdrop-blur-lg rounded-3xl p-8 sm:p-12 border border-white/10 shadow-xl max-w-md mx-auto">
      <div className="text-center text-text-muted space-y-4">
        <div className="text-4xl sm:text-6xl mb-4 sm:mb-6 opacity-50">🎱</div>
        <p className="text-xl sm:text-2xl font-bold">Aucun match en cours</p>
        <p className="text-sm sm:text-base text-text-faint">
          Allez en mode Admin pour ajouter des matchs
        </p>
      </div>
    </div>
  );
});

export default function TvPage() {
  const { matches, updateMatchScores, finishMatchFromCueScore } = useMatches();
  const { currentTheme } = useTheme();

  // Mise à jour automatique des scores, et clôture des matchs que CueScore
  // ne diffuse plus.
  useScoreUpdater(matches, updateMatchScores, finishMatchFromCueScore);

  return (
    // pb-14 : réserve la hauteur du pied de page fixe, sinon la dernière
    // rangée de cartes passe dessous sur un écran rempli.
    <div className="flex flex-col items-center p-6 pb-14">
      <TvHeader
        logo={currentTheme.logo}
        themeName={currentTheme.name}
      />

      {matches.length === 0 ? (
        <NoMatchesMessage />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6 w-full max-w-[2000px] px-2 sm:px-4 justify-items-center">
          {matches.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      )}
    </div>
  );
}

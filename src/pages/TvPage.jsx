import React, { memo, useMemo } from "react";
import MatchCard from "../components/MatchCard";
import { useMatches } from "../hooks/useMatches";
import { useScoreUpdater } from "../hooks/useScoreUpdater";

// Mémoriser le header pour éviter les re-renders
const TvHeader = memo(() => (
  <div className="bg-glass-medium backdrop-blur-xl rounded-2xl p-4 mb-8 border border-white/10 shadow-xl shadow-accent/5">
    <div className="flex items-center gap-4">
      <div className="relative">
        <img 
          src="/FFBillard_logo.png" 
          alt="FFBillard Logo" 
          className="h-12 w-auto drop-shadow-lg"
        />
        <div className="absolute inset-0 bg-accent/10 rounded-full blur-lg"></div>
      </div>
      <div>
        <h1 className="text-3xl font-black text-text-primary tracking-tight">
          Matches en cours
        </h1>
        <p className="text-accent font-semibold tracking-wide text-sm">TD1 GIRONDE</p>
      </div>
    </div>
  </div>
));

// Mémoriser le message "aucun match"
const NoMatchesMessage = memo(() => (
  <div className="bg-glass-light backdrop-blur-lg rounded-3xl p-8 sm:p-12 border border-white/10 shadow-xl max-w-md mx-auto">
    <div className="text-center text-text-muted space-y-4">
      <div className="text-4xl sm:text-6xl mb-4 sm:mb-6 opacity-50">🎱</div>
      <p className="text-xl sm:text-2xl font-bold">Aucun match en cours</p>
      <p className="text-sm sm:text-base text-text-faint">Allez en mode Admin pour ajouter des matchs</p>
    </div>
  </div>
));

export default function TvPage() {
  const { matches, updateMatchScores } = useMatches();

  // Activer la mise à jour automatique des scores
  useScoreUpdater(matches, updateMatchScores);

  // Mémoriser la grille de matchs pour éviter les re-créations
  const matchesGrid = useMemo(() => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6 w-full max-w-[2000px] px-2 sm:px-4">
      {matches.map((m) => <MatchCard key={m.id} match={m} />)}
    </div>
  ), [matches]);

  return (
    <div className="bg-gradient-to-br from-surface via-primary to-secondary min-h-screen flex flex-col items-center p-6">
      <TvHeader />
      
      {matches.length === 0 ? <NoMatchesMessage /> : matchesGrid}
    </div>
  );
}

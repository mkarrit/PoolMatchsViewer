import React, { useState } from "react";
import { useMatches } from "../hooks/useMatches";
import { useCueScore } from "../hooks/useCueScore";
import { tables } from "../utils/config";

export default function AdminPage({ addToast }) {
  const [tableId, setTableId] = useState("");
  const [maxDuration, setMaxDuration] = useState("");
  const [showConfirmDelete, setShowConfirmDelete] = useState(null);

  const { matches, addMatch, removeMatch, clearAllMatches, updateMatchStatus, error } = useMatches();
  const { fetchMatchData, loading: apiLoading } = useCueScore();

  const handleAdd = async () => {
    const duration = Number(maxDuration);
    if (!duration || duration <= 0) {
      addToast('La durée du match est obligatoire', 'error');
      return;
    }

    if (!tableId) {
      addToast('Veuillez sélectionner une table', 'error');
      return;
    }

    const selectedTable = tables.find(t => t.id === parseInt(tableId));
    if (!selectedTable) {
      addToast('Table invalide', 'error');
      return;
    }

    try {
      // Récupérer les données du match depuis l'API CueScore
      addToast('Récupération des données du match...', 'info');
      const apiResult = await fetchMatchData(selectedTable.code);
      
      if (!apiResult.success) {
        if (apiResult.error === 'NOMATCH') {
          addToast('Aucun match en cours sur cette table. Veuillez attendre que le match soit lancé.', 'warning');
          return;
        } else {
          addToast('Impossible de récupérer les données du match', 'error');
          return;
        }
      }

      const matchData = apiResult.data;
      
      // Vérifier que les noms des joueurs sont disponibles
      if (!matchData.playerA?.name || !matchData.playerB?.name) {
        addToast('Les noms des joueurs ne sont pas encore disponibles. Attendez que le match soit entièrement configuré.', 'warning');
        return;
      }

      const player1Name = matchData.playerA.name;
      const player2Name = matchData.playerB.name;

      // Ajouter le match avec les données de l'API
      const result = await addMatch(player1Name, player2Name, selectedTable.id.toString(), duration, {
        cueScoreData: matchData,
        scoreA: matchData.scoreA || 0,
        scoreB: matchData.scoreB || 0,
        tableCode: selectedTable.code,
        tableName: selectedTable.name
      });
      
      if (result.success) {
        addToast(`Match ajouté: ${player1Name} vs ${player2Name} (${selectedTable.name}) - ${duration} min`, 'success');
        setTableId("");
        setMaxDuration("");
      } else {
        addToast(result.error, 'error');
      }
    } catch (err) {
      addToast(`Erreur API: ${err.message}`, 'error');
    }
  };

  const handleRemove = async (matchId) => {
    const match = matches.find(m => m.id === matchId);
    if (!match) return;

    const result = await removeMatch(matchId);
    
    if (result.success) {
      addToast(`Match supprimé: ${match.player1} vs ${match.player2}`, 'success');
      setShowConfirmDelete(null);
    } else {
      addToast(result.error, 'error');
    }
  };

  const handleStatusChange = async (matchId, newStatus) => {
    const match = matches.find(m => m.id === matchId);
    if (!match) return;

    const result = await updateMatchStatus(matchId, newStatus);
    
    if (result.success) {
      const statusMessages = {
        'active': 'Match repris',
        'paused': 'Match mis en pause',
        'finished': 'Match terminé'
      };
      addToast(`${statusMessages[newStatus]}: ${match.player1} vs ${match.player2}`, 'success');
    } else {
      addToast(result.error, 'error');
    }
  };

  const handleClearAll = async () => {
    if (matches.length === 0) return;
    
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer tous les ${matches.length} matchs ?`)) {
      const result = await clearAllMatches();
      if (result.success) {
        addToast('Tous les matchs ont été supprimés', 'success');
      } else {
        addToast(result.error, 'error');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface via-primary to-secondary p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header Admin */}
        <div className="bg-glass-medium backdrop-blur-xl rounded-2xl p-6 mb-8 border border-white/10 shadow-xl">
          <h1 className="text-3xl font-black text-text-primary tracking-tight">⚙️ Administration</h1>
          <p className="text-text-muted mt-2">Gestion des matchs de billard</p>
        </div>

        {/* Formulaire d'ajout */}
        <div className="bg-glass-medium backdrop-blur-xl rounded-2xl p-6 mb-8 border border-white/10 shadow-xl">
          <h2 className="text-xl font-bold text-text-primary mb-6">Ajouter un nouveau match</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <select 
              className="px-4 py-3 rounded-lg bg-glass-light backdrop-blur-md text-text-primary border border-white/20 focus:border-accent focus:outline-none transition-all duration-300"
              value={tableId} 
              onChange={(e) => setTableId(e.target.value)}
            >
              <option value="" className="bg-primary text-text-muted">Sélectionnez une table</option>
              {tables.map(table => (
                <option key={table.id} value={table.id} className="bg-primary text-text-primary">
                  {table.name}
                </option>
              ))}
            </select>
            <input 
              className="px-4 py-3 rounded-lg bg-glass-light backdrop-blur-md text-text-primary border-2 border-accent/50 focus:border-accent focus:outline-none transition-all duration-300 placeholder-text-muted"
              placeholder="Durée max (min) *" 
              type="number"
              min="1"
              max="180"
              value={maxDuration} 
              onChange={(e) => setMaxDuration(e.target.value)} 
              title="Durée maximale en minutes (obligatoire)"
            />
            <button 
              onClick={handleAdd} 
              disabled={apiLoading}
              className={`px-6 py-3 rounded-lg transition-all duration-300 text-white font-semibold shadow-lg ${
                apiLoading 
                  ? 'bg-gray-500 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-accent-dark to-accent hover:from-accent to-accent-light shadow-accent/30 hover:shadow-accent/50'
              }`}
            >
              {apiLoading ? '⏳ Récupération...' : '➕ Ajouter'}
            </button>
          </div>
          
          <div className="text-sm text-text-muted bg-glass-light rounded-lg p-3 border border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-accent rounded-full"></div>
              <span className="font-medium">Information :</span>
            </div>
            <p>Les noms des joueurs et leurs scores seront automatiquement récupérés depuis CueScore lors de l'ajout du match.</p>
          </div>
          
          {error && (
            <div className="bg-error/10 border border-error/30 rounded-lg p-3 mt-4">
              <div className="flex items-center gap-2 text-error">
                <div className="w-2 h-2 bg-error rounded-full"></div>
                <span className="text-sm font-medium">{error}</span>
              </div>
            </div>
          )}
        </div>

        {/* Liste des matchs */}
        <div className="bg-glass-medium backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-text-primary">Liste des matchs ({matches.length})</h2>
            {matches.length > 0 && (
              <button 
                onClick={handleClearAll}
                className="px-4 py-2 bg-error hover:bg-error/80 rounded-lg text-sm font-medium transition-all duration-300 text-white shadow-lg shadow-error/30"
              >
                🗑️ Tout supprimer
              </button>
            )}
          </div>

          {matches.length === 0 ? (
            <div className="bg-glass-light rounded-xl p-8 border border-white/10">
              <div className="text-center text-text-muted space-y-2">
                <div className="text-4xl mb-4 opacity-50">🎱</div>
                <p className="font-medium">Aucun match en cours</p>
                <p className="text-sm text-text-faint">Ajoutez votre premier match ci-dessus</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {matches.map((match) => (
                <div key={match.id} className="bg-glass-light backdrop-blur-md rounded-lg p-3 border border-white/10 shadow-md">
                  {/* Ligne unique avec toutes les infos */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    {/* Infos du match */}
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="bg-accent text-white px-3 py-1 rounded-md text-sm font-bold">
                        {match.tableName || `Table ${match.table}`}
                      </span>
                      <span className="text-text-primary font-semibold">
                        {match.player1}
                      </span>
                      <span className="text-text-muted text-sm">VS</span>
                      <span className="text-text-primary font-semibold">
                        {match.player2}
                      </span>
                      <span className="bg-accent/20 text-accent px-2 py-1 rounded text-sm font-medium">
                        {match.maxDurationMinutes} min
                      </span>
                      <span className={`px-2 py-1 rounded text-sm font-medium ${
                        match.status === 'active' ? 'bg-success text-white' :
                        match.status === 'paused' ? 'bg-warning text-white' :
                        match.status === 'finished' ? 'bg-gray-500 text-white' :
                        'bg-success text-white'
                      }`}>
                        {match.status === 'active' || !match.status ? 'En cours' :
                         match.status === 'paused' ? 'Pause' :
                         match.autoFinished ? 'Temps écoulé' : 'Terminé'}
                      </span>
                    </div>

                    {/* Boutons d'action - Plus visibles */}
                    <div className="flex gap-2">
                      {(!match.status || match.status === 'active') && (
                        <button onClick={() => handleStatusChange(match.id, 'paused')}
                          className="px-4 py-2 bg-warning text-white hover:bg-warning/80 rounded text-sm font-medium transition-all duration-200"
                          title="Mettre en pause">
                          ⏸️ Pause
                        </button>
                      )}
                      {match.status === 'paused' && (
                        <button onClick={() => handleStatusChange(match.id, 'active')}
                          className="px-4 py-2 bg-success text-white hover:bg-success/80 rounded text-sm font-medium transition-all duration-200"
                          title="Reprendre">
                          ▶️ Reprendre
                        </button>
                      )}
                      {match.status !== 'finished' && (
                        <button onClick={() => handleStatusChange(match.id, 'finished')}
                          className="px-4 py-2 bg-accent text-white hover:bg-accent/80 rounded text-sm font-medium transition-all duration-200"
                          title="Terminer le match">
                          🏁 Terminer
                        </button>
                      )}
                      {showConfirmDelete === match.id ? (
                        <>
                          <button onClick={() => handleRemove(match.id)}
                            className="px-4 py-2 bg-error text-white hover:bg-error/80 rounded text-sm font-medium transition-all duration-200">
                            ✓ Confirmer
                          </button>
                          <button onClick={() => setShowConfirmDelete(null)}
                            className="px-4 py-2 bg-gray-500 text-white hover:bg-gray-600 rounded text-sm font-medium transition-all duration-200">
                            ✗ Annuler
                          </button>
                        </>
                      ) : (
                        <button onClick={() => setShowConfirmDelete(match.id)}
                          className="px-4 py-2 bg-error text-white hover:bg-error/80 rounded text-sm font-medium transition-all duration-200"
                          title="Supprimer le match">
                          🗑️ Supprimer
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Infos temporelles en petite ligne */}
                  <div className="text-xs text-text-muted mt-2 pl-3">
                    Commencé le {new Date(match.startTime).toLocaleString('fr-FR')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

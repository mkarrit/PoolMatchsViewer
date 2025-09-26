import { useState } from 'react';

/**
 * Hook pour récupérer les données depuis l'API CueScore
 */
export function useCueScore() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchMatchData = async (tableCode) => {
    if (!tableCode) {
      throw new Error('Code de table requis');
    }

    try {
      setLoading(true);
      setError(null);

      // Solution simple : utiliser un proxy CORS gratuit
      const proxyUrl = `https://api.codetabs.com/v1/proxy?quest=https://cuescore.com/ajax/scoreboard-v2/?tableCode=${tableCode}`;
      
      console.log(`Appel API via proxy: ${proxyUrl}`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // Augmenter le timeout

      const response = await fetch(proxyUrl, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Vérifier si l'API retourne une erreur NOMATCH (match pas encore lancé)
      if (data && data.error === "NOMATCH") {
        console.log('⏸️ Match pas encore lancé pour cette table');
        return {
          success: false,
          error: 'NOMATCH',
          message: 'Match pas encore lancé'
        };
      }
      
      // Vérifier si les données sont valides et contiennent un match
      if (!data || !data.match) {
        throw new Error('Aucune donnée de match trouvée pour cette table');
      }

      console.log('✅ Données récupérées avec succès:', data.match);

      return {
        success: true,
        data: data.match
      };

    } catch (err) {
      console.error('Erreur lors de l\'appel API:', err);
      
      // Essayer une alternative en cas d'échec
      if (err.name !== 'AbortError') {
        try {
          console.log('Tentative avec un autre proxy...');
          
          const alternativeUrl = `https://cors-anywhere.herokuapp.com/https://cuescore.com/ajax/scoreboard-v2/?tableCode=${tableCode}`;
          
          const altResponse = await fetch(alternativeUrl, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'X-Requested-With': 'XMLHttpRequest'
            }
          });

          if (altResponse.ok) {
            const altData = await altResponse.json();
            
            // Vérifier NOMATCH avec proxy alternatif
            if (altData && altData.error === "NOMATCH") {
              console.log('⏸️ Match pas encore lancé (proxy alternatif)');
              return {
                success: false,
                error: 'NOMATCH',
                message: 'Match pas encore lancé'
              };
            }
            
            if (altData && altData.match) {
              console.log('✅ Données récupérées avec proxy alternatif');
              return {
                success: true,
                data: altData.match
              };
            }
          }
        } catch (altErr) {
          console.warn('Proxy alternatif échoué:', altErr.message);
        }
      }

      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    fetchMatchData,
    loading,
    error
  };
}

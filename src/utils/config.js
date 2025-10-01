/**
 * Configuration de l'application
 */

// Configuration par défaut des tables (fallback)
const defaultTables = [
  { id: 1, name: "Table 1", code: "f8c4bd61" },
  { id: 2, name: "Table 2", code: "a3b9ae98" },
  { id: 3, name: "Table 3", code: "dc64dc33" },
  { id: 4, name: "Table 4", code: "89869242" },
  { id: 5, name: "Table 5", code: "670487c4" },
  { id: 6, name: "Table 6", code: "6caca43c" },
  { id: 7, name: "Table 7", code: "143accfc" },
  { id: 8, name: "Table 8", code: "089ce6b4" },
  { id: 9, name: "Table 9", code: "e3b48627" }
];

// Fonction pour récupérer les tables (depuis localStorage ou par défaut)
export function getTables() {
  try {
    const savedTables = localStorage.getItem('clubTables');
    if (savedTables) {
      const parsed = JSON.parse(savedTables);
      // Validation basique des données
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (error) {
    console.warn('Erreur lors du chargement des tables:', error);
  }
  return defaultTables;
}

// Export des tables (pour compatibilité avec le code existant)
export const tables = getTables();

export const appConfig = {
  // Paramètres des matchs
  match: {
    minDuration: 5,      // minutes
    maxDuration: 300,    // minutes (5h)
    defaultDuration: 30, // minutes
    warningThreshold: 300, // secondes (5min)
    criticalThreshold: 60  // secondes (1min)
  },

  // Paramètres UI
  ui: {
    refreshInterval: 1000,    // ms
    toastDuration: 5000,     // ms
    animationDuration: 300,   // ms
    autoRefreshTv: true,     // Auto-refresh en mode TV
    tvRefreshInterval: 30000  // ms (30s)
  },

  // Paramètres de stockage
  storage: {
    key: 'poolMatches',
    enableCrossTabSync: true,
    enableBackup: true,
    maxBackupCount: 5
  },

  // Paramètres d'export
  export: {
    includeFinishedMatches: true,
    dateFormat: 'YYYY-MM-DD',
    timeFormat: 'HH:mm:ss'
  },

  // Validation
  validation: {
    playerNameMinLength: 2,
    playerNameMaxLength: 50,
    tableNamePattern: /^[0-9A-Za-z]+$/,
    preventDuplicatePlayers: true
  },

  // API CueScore
  api: {
    cueScore: {
      baseUrl: 'https://cuescore.com/ajax/scoreboard-v2/',
      timeout: 10000,
      retryAttempts: 3,
      retryDelay: 1000
    }
  },

  // Fonctionnalités
  features: {
    enableStats: true,
    enableExport: true,
    enableNotifications: true,
    enableAutoFinish: true,
    enablePauseTracking: true
  }
};

/**
 * Hook pour accéder à la configuration
 */
import { useState, useEffect } from 'react';

export function useAppConfig() {
  const [config, setConfig] = useState(appConfig);

  // Charger la configuration personnalisée depuis localStorage
  useEffect(() => {
    try {
      const savedConfig = localStorage.getItem('appConfig');
      if (savedConfig) {
        const parsed = JSON.parse(savedConfig);
        setConfig(prev => ({ ...prev, ...parsed }));
      }
    } catch (error) {
      console.warn('Erreur lors du chargement de la configuration:', error);
    }
  }, []);

  const updateConfig = (newConfig) => {
    try {
      const updatedConfig = { ...config, ...newConfig };
      setConfig(updatedConfig);
      localStorage.setItem('appConfig', JSON.stringify(updatedConfig));
      return true;
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la configuration:', error);
      return false;
    }
  };

  const resetConfig = () => {
    setConfig(appConfig);
    localStorage.removeItem('appConfig');
  };

  return {
    config,
    updateConfig,
    resetConfig
  };
}

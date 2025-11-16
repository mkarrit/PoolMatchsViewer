import { useState, useEffect } from 'react';

/**
 * Thèmes disponibles
 */
export const THEMES = {
  FFB: {
    id: 'ffb',
    name: 'FFBillard (FFB)',
    logo: '/FFBillard_logo.png',
    colors: {
      primary: '#0f172a',      // Couleurs FFB originales
      secondary: '#1e293b',
      accent: '#06b6d4',
      surface: '#020617',
      glass: {
        light: 'rgba(255, 255, 255, 0.08)',
        medium: 'rgba(255, 255, 255, 0.12)',
      },
      text: {
        primary: '#f8fafc',
        muted: '#64748b',
        faint: '#475569'
      },
      success: '#059669',
      warning: '#d97706',
      error: '#dc2626'
    },
    cssVariables: {
      '--color-primary': '#0f172a',
      '--color-secondary': '#1e293b',
      '--color-accent': '#06b6d4',
      '--color-surface': '#020617',
      '--color-glass-light': 'rgba(255, 255, 255, 0.08)',
      '--color-glass-medium': 'rgba(255, 255, 255, 0.12)',
      '--color-text-primary': '#f8fafc',
      '--color-text-muted': '#64748b',
      '--color-text-faint': '#475569',
      '--color-success': '#059669',
      '--color-warning': '#d97706',
      '--color-error': '#dc2626'
    }
  },
  ULTIMATE_POOL: {
    id: 'ultimate_pool',
    name: 'Ultimate Pool FR',
    logo: '/ultimate_pool_fr.png',
    colors: {
      primary: '#0f1419',      // Bleu-noir profond (comme leur site)
      secondary: '#1e2328',    // Bleu-gris foncé
      accent: '#adcbd498',       // Cyan/bleu électrique (couleur signature Ultimate Pool)
      surface: '#080b0f',      // Noir-bleu très profond
      glass: {
        light: 'rgba(0, 212, 255, 0.06)',    // Glass avec teinte cyan subtile
        medium: 'rgba(0, 212, 255, 0.1)',    // Glass cyan plus visible
      },
      text: {
        primary: '#ffffff',     // Blanc pur pour contraste maximal
        muted: '#94a3b8',       // Gris-bleu clair
        faint: '#64748b'        // Gris-bleu moyen
      },
      success: '#10b981',      // Vert moderne
      warning: '#f59e0b',      // Orange moderne
      error: '#ef4444'        // Rouge moderne
    },
    cssVariables: {
      '--color-primary': '#0f1419',
      '--color-secondary': '#1e2328',
      '--color-accent': '#adcbd498',
      '--color-surface': '#080b0f',
      '--color-glass-light': 'rgba(0, 212, 255, 0.06)',
      '--color-glass-medium': 'rgba(0, 212, 255, 0.1)',
      '--color-text-primary': '#ffffff',
      '--color-text-muted': '#94a3b8',
      '--color-text-faint': '#64748b',
      '--color-success': '#10b981',
      '--color-warning': '#f59e0b',
      '--color-error': '#ef4444'
    }
  }
};

/**
 * Hook pour gérer les thèmes
 */
export function useTheme() {
  const [currentTheme, setCurrentTheme] = useState(THEMES.FFB);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Charger le thème au montage
  useEffect(() => {
    const loadInitialTheme = () => {
      try {
        setError(null);
        const savedThemeId = localStorage.getItem('selectedTheme');
        
        // Trouver le thème correspondant
        const theme = Object.values(THEMES).find(t => t.id === savedThemeId) || THEMES.FFB;
        
        setCurrentTheme(theme);
        applyThemeToDOM(theme);
      } catch (err) {
        setError('Erreur lors du chargement du thème');
        console.error('Erreur loadTheme:', err);
      }
    };

    loadInitialTheme();
    
    // Écouter les changements de thème
    const handleThemeUpdate = (event) => {
      const theme = THEMES[event.detail];
      if (theme) {
        setCurrentTheme(theme);
        applyThemeToDOM(theme);
      }
    };
    
    window.addEventListener('themeUpdated', handleThemeUpdate);
    return () => window.removeEventListener('themeUpdated', handleThemeUpdate);
  }, []);

  const loadTheme = () => {
    try {
      setError(null);
      const savedThemeId = localStorage.getItem('selectedTheme');
      
      // Trouver le thème correspondant
      const theme = Object.values(THEMES).find(t => t.id === savedThemeId) || THEMES.FFB;
      
      setCurrentTheme(theme);
      applyThemeToDOM(theme);
    } catch (err) {
      setError('Erreur lors du chargement du thème');
      console.error('Erreur loadTheme:', err);
    }
  };

  const changeTheme = (themeId) => {
    try {
      setError(null);
      setLoading(true);
      
      const theme = Object.values(THEMES).find(t => t.id === themeId);
      if (!theme) {
        throw new Error('Thème non trouvé');
      }
      
      // Sauvegarder le choix
      localStorage.setItem('selectedTheme', themeId);
      
      // Appliquer le thème
      setCurrentTheme(theme);
      applyThemeToDOM(theme);
      
      // Notifier les autres composants
      window.dispatchEvent(new CustomEvent('themeUpdated', { detail: themeId }));
      
      return { success: true };
    } catch (err) {
      const errorMessage = err.message || 'Erreur lors du changement de thème';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const applyThemeToDOM = (theme) => {
    const root = document.documentElement;
    
    // Appliquer les variables CSS
    Object.entries(theme.cssVariables).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });
    
    // Ajouter une classe pour le thème
    root.className = root.className.replace(/theme-\w+/g, '');
    root.classList.add(`theme-${theme.id}`);
  };

  const resetTheme = () => {
    try {
      setError(null);
      localStorage.removeItem('selectedTheme');
      const defaultTheme = THEMES.FFB;
      setCurrentTheme(defaultTheme);
      applyThemeToDOM(defaultTheme);
      return { success: true };
    } catch {
      const errorMessage = 'Erreur lors de la réinitialisation';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  return {
    currentTheme,
    availableThemes: Object.values(THEMES),
    loading,
    error,
    changeTheme,
    resetTheme,
    reloadTheme: loadTheme
  };
}
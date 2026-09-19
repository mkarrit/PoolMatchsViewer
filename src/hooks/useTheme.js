import { useCallback, useEffect, useState } from 'react';

const THEME_STORAGE_KEY = 'selectedTheme';
const THEME_UPDATED_EVENT = 'themeUpdated';

/**
 * Construit les variables CSS à partir de la palette, pour éviter que les deux
 * représentations d'un même thème ne divergent.
 */
function toCssVariables(colors) {
  return {
    '--color-primary': colors.primary,
    '--color-secondary': colors.secondary,
    '--color-accent': colors.accent,
    '--color-surface': colors.surface,
    '--color-glass-light': colors.glass.light,
    '--color-glass-medium': colors.glass.medium,
    '--color-text-primary': colors.text.primary,
    '--color-text-muted': colors.text.muted,
    '--color-text-faint': colors.text.faint,
    '--color-success': colors.success,
    '--color-warning': colors.warning,
    '--color-error': colors.error,
  };
}

function defineTheme({ id, name, logo, colors }) {
  return { id, name, logo, colors, cssVariables: toCssVariables(colors) };
}

/**
 * Thèmes disponibles
 */
export const THEMES = {
  FFB: defineTheme({
    id: 'ffb',
    name: 'FFBillard (FFB)',
    logo: '/FFBillard_logo.png',
    colors: {
      primary: '#0f172a',
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
        faint: '#475569',
      },
      success: '#059669',
      warning: '#d97706',
      error: '#dc2626',
    },
  }),
  ULTIMATE_POOL: defineTheme({
    id: 'ultimate_pool',
    name: 'Ultimate Pool FR',
    logo: '/ultimate_pool_fr.png',
    colors: {
      primary: '#0f1419',
      secondary: '#1e2328',
      accent: '#adcbd498',
      surface: '#080b0f',
      glass: {
        light: 'rgba(0, 212, 255, 0.06)',
        medium: 'rgba(0, 212, 255, 0.1)',
      },
      text: {
        primary: '#ffffff',
        muted: '#94a3b8',
        faint: '#64748b',
      },
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
    },
  }),
};

export const DEFAULT_THEME = THEMES.FFB;

const themeList = Object.values(THEMES);
const findThemeById = (themeId) => themeList.find((theme) => theme.id === themeId) || null;

function applyThemeToDOM(theme) {
  const root = document.documentElement;

  Object.entries(theme.cssVariables).forEach(([property, value]) => {
    root.style.setProperty(property, value);
  });

  themeList.forEach((t) => root.classList.remove(`theme-${t.id}`));
  root.classList.add(`theme-${theme.id}`);
}

function readStoredTheme() {
  try {
    return findThemeById(localStorage.getItem(THEME_STORAGE_KEY)) || DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

/**
 * Hook pour gérer les thèmes.
 *
 * Toutes les instances se resynchronisent sur `themeUpdated` : le logo affiché
 * sur l'écran TV suit donc un changement fait depuis l'administration.
 */
export function useTheme() {
  const [currentTheme, setCurrentTheme] = useState(readStoredTheme);
  const [error, setError] = useState(null);

  useEffect(() => {
    applyThemeToDOM(currentTheme);
  }, [currentTheme]);

  useEffect(() => {
    // event.detail porte l'identifiant du thème ('ffb'), pas la clé de l'objet
    // THEMES ('FFB') : la résolution doit passer par findThemeById.
    const handleThemeUpdate = (event) => {
      const theme = findThemeById(event.detail);
      if (theme) setCurrentTheme(theme);
    };

    const handleStorage = (event) => {
      if (event.key === THEME_STORAGE_KEY) setCurrentTheme(readStoredTheme());
    };

    window.addEventListener(THEME_UPDATED_EVENT, handleThemeUpdate);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener(THEME_UPDATED_EVENT, handleThemeUpdate);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const changeTheme = useCallback((themeId) => {
    const theme = findThemeById(themeId);
    if (!theme) {
      const message = 'Thème non trouvé';
      setError(message);
      return { success: false, error: message };
    }

    setError(null);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, themeId);
    } catch {
      // Le thème s'applique quand même, il ne sera juste pas mémorisé.
      setError('Thème appliqué mais non mémorisé (stockage indisponible)');
    }

    setCurrentTheme(theme);
    window.dispatchEvent(new CustomEvent(THEME_UPDATED_EVENT, { detail: themeId }));
    return { success: true };
  }, []);

  const resetTheme = useCallback(() => changeTheme(DEFAULT_THEME.id), [changeTheme]);

  return {
    currentTheme,
    availableThemes: themeList,
    error,
    changeTheme,
    resetTheme,
  };
}

import React from 'react';
import { useTheme } from '../hooks/useTheme';

export default function ThemeSelector({ addToast }) {
  const { currentTheme, availableThemes, error, changeTheme } = useTheme();

  const handleThemeChange = (themeId) => {
    const result = changeTheme(themeId);
    if (result.success) {
      const theme = availableThemes.find(t => t.id === themeId);
      addToast(`Thème changé vers "${theme?.name ?? themeId}"`, 'success');
    } else {
      addToast(result.error, 'error');
    }
  };

  return (
    <div className="bg-glass-medium backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-xl">
      <h2 className="text-xl font-bold text-text-primary mb-6">🎨 Sélection du thème</h2>
      
      {/* Message d'erreur */}
      {error && (
        <div className="bg-error/10 border border-error/30 rounded-lg p-3 mb-6">
          <div className="flex items-center gap-2 text-error">
            <div className="w-2 h-2 bg-error rounded-full"></div>
            <span className="text-sm font-medium">{error}</span>
          </div>
        </div>
      )}

      {/* Sélection des thèmes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4" role="radiogroup" aria-label="Thème de l'application">
        {availableThemes.map((theme) => (
          <div
            key={theme.id}
            className={`
              relative rounded-lg border-2 transition-all duration-300 cursor-pointer overflow-hidden
              ${currentTheme.id === theme.id 
                ? 'border-accent shadow-lg shadow-accent/30 bg-accent/5' 
                : 'border-white/20 hover:border-white/40 bg-glass-light'
              }
            `}
            role="radio"
            tabIndex={0}
            aria-checked={currentTheme.id === theme.id}
            onClick={() => handleThemeChange(theme.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleThemeChange(theme.id);
              }
            }}
          >
            {/* Badge de sélection */}
            {currentTheme.id === theme.id && (
              <div className="absolute top-3 right-3 bg-accent text-white rounded-full p-1 shadow-lg z-10">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}

            <div className="p-4">
              {/* Logo du thème */}
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <img 
                    src={theme.logo} 
                    alt={`${theme.name} Logo`}
                    className="h-16 w-auto drop-shadow-lg"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextElementSibling.style.display = 'flex';
                    }}
                  />
                  {/* Fallback si l'image ne charge pas */}
                  <div 
                    className="h-16 w-16 bg-glass-medium rounded-lg items-center justify-center text-2xl hidden"
                    style={{ display: 'none' }}
                  >
                    🎱
                  </div>
                  <div className="absolute inset-0 bg-accent/10 rounded-full blur-lg"></div>
                </div>
              </div>

              {/* Nom du thème */}
              <h3 className="text-text-primary font-semibold text-center mb-3">
                {theme.name}
              </h3>

              {/* Palette de couleurs */}
              <div className="flex justify-center gap-2 mb-4">
                <div 
                  className="w-6 h-6 rounded-full border-2 border-white/20"
                  style={{ backgroundColor: theme.colors.primary }}
                  title="Couleur primaire"
                ></div>
                <div 
                  className="w-6 h-6 rounded-full border-2 border-white/20"
                  style={{ backgroundColor: theme.colors.secondary }}
                  title="Couleur secondaire"
                ></div>
                <div 
                  className="w-6 h-6 rounded-full border-2 border-white/20"
                  style={{ backgroundColor: theme.colors.accent }}
                  title="Couleur accent"
                ></div>
              </div>

              {/* Bouton radio personnalisé */}
              <div className="flex items-center justify-center">
                <div className={`
                  w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200
                  ${currentTheme.id === theme.id 
                    ? 'border-accent bg-accent' 
                    : 'border-white/40 bg-transparent'
                  }
                `}>
                  {currentTheme.id === theme.id && (
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  )}
                </div>
              </div>
            </div>

          </div>
        ))}
      </div>

      {/* Informations */}
      <div className="mt-6 bg-glass-light rounded-lg p-4 border border-white/10">
        <h4 className="text-text-primary font-medium mb-2">💡 Information</h4>
        <ul className="text-sm text-text-muted space-y-1">
          <li>• Le thème sélectionné s'appliquera à toute l'application</li>
          <li>• Les logos et couleurs changeront instantanément</li>
          <li>• Votre choix est sauvegardé automatiquement</li>
          <li>• Fonctionne sur l'écran TV et la page d'administration</li>
        </ul>
      </div>
    </div>
  );
}
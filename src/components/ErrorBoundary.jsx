import React from 'react';

/**
 * Filet de sécurité pour l'affichage TV.
 *
 * Une erreur de rendu non interceptée laisserait un écran blanc en salle, sans
 * personne pour ouvrir la console. On affiche à la place un message lisible et
 * un bouton de rechargement.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Erreur de rendu non interceptée:', error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="bg-glass-medium backdrop-blur-xl rounded-2xl p-8 border border-error/30 shadow-xl max-w-lg text-center space-y-4">
          <div className="text-5xl">⚠️</div>
          <h1 className="text-2xl font-bold text-text-primary">Une erreur est survenue</h1>
          <p className="text-text-muted text-sm">{this.state.error.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2 bg-accent hover:bg-accent/80 rounded-lg text-white font-medium transition-all duration-200"
          >
            Recharger la page
          </button>
        </div>
      </div>
    );
  }
}

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Couleurs dynamiques utilisant les variables CSS
        'primary': 'var(--color-primary)',
        'secondary': 'var(--color-secondary)',
        'accent': 'var(--color-accent)',
        'surface': 'var(--color-surface)',
        'glass-light': 'var(--color-glass-light)',
        'glass-medium': 'var(--color-glass-medium)',
        'success': 'var(--color-success)',
        'warning': 'var(--color-warning)',
        'error': 'var(--color-error)',
        'text-primary': 'var(--color-text-primary)',
        'text-muted': 'var(--color-text-muted)',
        'text-faint': 'var(--color-text-faint)',
        
        // Couleurs statiques pour compatibilité
        'tertiary': '#334155',
        'accent-light': '#22d3ee',
        'accent-dark': '#0891b2',
        'glass-strong': 'rgba(255, 255, 255, 0.16)',
        'text-secondary': '#e2e8f0',
      }
    },
  },
  plugins: [],
}

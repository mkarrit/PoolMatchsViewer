/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Palette Glassmorphism raffinée
        'primary': '#0f172a',      // Slate-900 - Base très sombre
        'secondary': '#1e293b',    // Slate-800 - Couche intermédiaire
        'tertiary': '#334155',     // Slate-700 - Surface claire
        'accent': '#06b6d4',       // Cyan-500 - Accent principal moderne
        'accent-light': '#22d3ee', // Cyan-400 - Accent clair
        'accent-dark': '#0891b2',  // Cyan-600 - Accent foncé
        'surface': '#020617',      // Slate-950 - Surface ultra-foncée
        'glass-light': 'rgba(255, 255, 255, 0.08)',  // Verre clair
        'glass-medium': 'rgba(255, 255, 255, 0.12)', // Verre moyen
        'glass-strong': 'rgba(255, 255, 255, 0.16)', // Verre intense
        'success': '#059669',      // Emerald-600 - Plus foncé
        'warning': '#d97706',      // Amber-600 - Plus contrasté
        'error': '#dc2626',        // Red-600 - Plus intense
        'text-primary': '#f8fafc', // Slate-50 - Blanc principal
        'text-secondary': '#e2e8f0', // Slate-200 - Gris très clair
        'text-muted': '#64748b',   // Slate-500 - Gris moyen
        'text-faint': '#475569',   // Slate-600 - Gris foncé
      }
    },
  },
  plugins: [],
}

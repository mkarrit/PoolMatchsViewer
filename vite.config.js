import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Reproduit en développement ce que fait la fonction serverless
      // api/cuescore.js en production : l'application appelle toujours
      // /api/cuescore?tableCode=..., quel que soit l'environnement.
      '/api/cuescore': {
        target: 'https://cuescore.com',
        changeOrigin: true,
        // La barre oblique finale est obligatoire : sans elle CueScore
        // répond 301 et la redirection perd la requête.
        rewrite: (path) => path.replace(/^\/api\/cuescore/, '/ajax/scoreboard-v2/'),
        configure: (proxy) => {
          proxy.on('error', (err) => {
            console.warn('Erreur proxy CueScore:', err.message);
          });
        },
      },
    },
  },
})

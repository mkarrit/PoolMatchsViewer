import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/cuescore': {
        target: 'https://cuescore.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/cuescore/, '/ajax/scoreboard-v2'),
        configure: (proxy) => {
          proxy.on('error', (err) => {
            console.warn('Proxy error:', err.message);
          });
        },
      }
    }
  }
})

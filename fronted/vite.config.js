import { defineConfig } from 'vite';

export default defineConfig({
  appType: 'mpa',
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // Include Service Worker in build
    rollupOptions: {
      input: {
        main: './index.html',
        landing: './landing.html'
      }
    },
    // Copy sw.js to dist root
    copyPublicDir: true
  },
  publicDir: 'public'
});

import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  base: './',
  
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
    
    // Optimizaciones para iPhone 15 A16 Bionic
    target: ['es2022', 'safari16'],
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info'],
        passes: 2
      },
      mangle: {
        safari10: true
      },
      format: {
        comments: false
      }
    },
    
    // Code splitting optimizado
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': [],
          'capacitor': [
            '@capacitor/core',
            '@capacitor/app',
            '@capacitor/haptics',
            '@capacitor/keyboard',
            '@capacitor/status-bar'
          ]
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]'
      }
    },
    
    // Chunk size warnings
    chunkSizeWarningLimit: 500
  },
  
  // Optimizaciones de desarrollo
  server: {
    host: '0.0.0.0',
    port: 5175,
    strictPort: false
  },
  
  // Optimizaciones CSS
  css: {
    devSourcemap: false
  },
  
  // Optimizar dependencias
  optimizeDeps: {
    include: ['@capacitor/core', '@capacitor/app', '@capacitor/haptics']
  }
});

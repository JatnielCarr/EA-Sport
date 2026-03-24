// =====================================================
// CACHE CONSOLE HELPERS
// Utilidades para gestión de cache desde consola
// =====================================================

// Solo disponible en desarrollo
if (window.location.hostname === 'localhost') {
  // Agregar helpers globales
  window.cache = {
    /**
     * Ver estadísticas del cache
     */
    stats: () => {
      const stats = window.CacheManager?.getStats();
      console.table(stats);
      return stats;
    },

    /**
     * Limpiar todo el cache
     */
    clear: () => {
      window.CacheManager?.clearAll();
      console.log('✅ Cache limpiado completamente');
    },

    /**
     * Limpiar solo cache expirado
     */
    clearExpired: () => {
      window.CacheManager?.clearExpired();
      console.log('✅ Cache expirado eliminado');
    },

    /**
     * Invalidar un patrón específico
     */
    invalidate: (pattern) => {
      window.CacheManager?.invalidatePattern(pattern);
      console.log(`✅ Cache invalidado para: ${pattern}`);
    },

    /**
     * Ver todo el cache en localStorage
     */
    view: () => {
      const cacheData = {};
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('ea_cache_')) {
          try {
            const data = JSON.parse(localStorage.getItem(key));
            const endpoint = key.replace('ea_cache_', '').split('_')[0];
            if (!cacheData[endpoint]) {
              cacheData[endpoint] = [];
            }
            cacheData[endpoint].push({
              key: key.substring(10),
              expires: new Date(data.expiry).toLocaleString(),
              size: (JSON.stringify(data.data).length / 1024).toFixed(2) + ' KB'
            });
          } catch (e) {
            // Skip invalid entries
          }
        }
      });
      console.table(cacheData);
      return cacheData;
    },

    /**
     * Ver Service Workers registrados
     */
    sw: async () => {
      if (!('serviceWorker' in navigator)) {
        console.warn('⚠️ Service Workers no soportados');
        return;
      }
      const registrations = await navigator.serviceWorker.getRegistrations();
      console.table(registrations.map(r => ({
        scope: r.scope,
        state: r.active?.state || 'inactive',
        updateViaCache: r.updateViaCache
      })));
      return registrations;
    },

    /**
     * Desregistrar Service Worker
     */
    unregisterSW: async () => {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
      }
      console.log('✅ Service Workers desregistrados');
    },

    /**
     * Ayuda
     */
    help: () => {
      console.log(`
%c📦 Cache Console Helpers

%cComandos disponibles:
  cache.stats()          - Ver estadísticas del cache
  cache.view()           - Ver todo el cache en detalle
  cache.clear()          - Limpiar TODO el cache
  cache.clearExpired()   - Limpiar solo cache expirado
  cache.invalidate(pat)  - Invalidar patrón (ej: 'users')
  cache.sw()             - Ver Service Workers
  cache.unregisterSW()   - Desregistrar Service Workers
  cache.help()           - Ver esta ayuda

%cEjemplos:
  cache.invalidate('tournaments')
  cache.stats()
  cache.view()
      `, 
      'color: #00d4ff; font-size: 16px; font-weight: bold;',
      'color: #94a3b8;',
      'color: #00ff88;'
      );
    }
  };

  // Mensaje de bienvenida
  console.log(
    '%c🎮 EA Sports Cache System',
    'color: #00d4ff; font-size: 20px; font-weight: bold; text-shadow: 0 0 10px rgba(0,212,255,0.5);'
  );
  console.log(
    '%cEscribe cache.help() para ver comandos disponibles',
    'color: #94a3b8; font-style: italic;'
  );
}

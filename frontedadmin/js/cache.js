// =====================================================
// CACHE MANAGER - Advanced Caching System
// =====================================================

class CacheManager {
  constructor() {
    this.memoryCache = new Map();
    this.cachePrefix = 'ea_cache_';
    
    // Cache configuration (in milliseconds)
    this.cacheTTL = {
      users: 5 * 60 * 1000,        // 5 minutes
      tournaments: 2 * 60 * 1000,   // 2 minutes
      teams: 5 * 60 * 1000,         // 5 minutes
      matches: 1 * 60 * 1000,       // 1 minute (live data)
      games: 30 * 60 * 1000,        // 30 minutes (rarely changes)
      default: 3 * 60 * 1000        // 3 minutes default
    };
  }

  /**
   * Generate cache key
   */
  getCacheKey(endpoint, params = {}) {
    const paramString = JSON.stringify(params);
    return `${this.cachePrefix}${endpoint}_${paramString}`;
  }

  /**
   * Get TTL for endpoint
   */
  getTTL(endpoint) {
    const key = endpoint.split('/')[1]?.split('?')[0];
    return this.cacheTTL[key] || this.cacheTTL.default;
  }

  /**
   * Get from memory cache first, then localStorage
   */
  get(endpoint, params = {}) {
    const key = this.getCacheKey(endpoint, params);
    
    // Check memory cache first (fastest)
    if (this.memoryCache.has(key)) {
      const cached = this.memoryCache.get(key);
      if (cached.expiry > Date.now()) {
        console.log(`🚀 Cache HIT (Memory): ${endpoint}`);
        this.showCacheIndicator('memory');
        return cached.data;
      } else {
        this.memoryCache.delete(key);
      }
    }

    // Check localStorage cache
    try {
      const cached = localStorage.getItem(key);
      if (cached) {
        const { data, expiry } = JSON.parse(cached);
        if (expiry > Date.now()) {
          console.log(`💾 Cache HIT (Storage): ${endpoint}`);
          // Promote to memory cache
          this.memoryCache.set(key, { data, expiry });
          this.showCacheIndicator('storage');
          return data;
        } else {
          localStorage.removeItem(key);
        }
      }
    } catch (error) {
      console.warn('Cache read error:', error);
    }

    console.log(`❌ Cache MISS: ${endpoint}`);
    return null;
  }

  /**
   * Set cache in both memory and localStorage
   */
  set(endpoint, data, params = {}) {
    const key = this.getCacheKey(endpoint, params);
    const ttl = this.getTTL(endpoint);
    const expiry = Date.now() + ttl;
    const cacheEntry = { data, expiry };

    // Store in memory cache
    this.memoryCache.set(key, cacheEntry);

    // Store in localStorage
    try {
      localStorage.setItem(key, JSON.stringify(cacheEntry));
      console.log(`✅ Cached: ${endpoint} (TTL: ${ttl / 1000}s)`);
    } catch (error) {
      // If localStorage is full, clear old entries
      if (error.name === 'QuotaExceededError') {
        this.clearExpired();
        try {
          localStorage.setItem(key, JSON.stringify(cacheEntry));
        } catch {
          console.warn('Cache storage failed after cleanup');
        }
      }
    }
  }

  /**
   * Invalidate specific cache
   */
  invalidate(endpoint, params = {}) {
    const key = this.getCacheKey(endpoint, params);
    this.memoryCache.delete(key);
    localStorage.removeItem(key);
    console.log(`🗑️ Cache invalidated: ${endpoint}`);
  }

  /**
   * Invalidate all caches for a resource type
   */
  invalidatePattern(pattern) {
    // Clear memory cache
    for (const key of this.memoryCache.keys()) {
      if (key.includes(pattern)) {
        this.memoryCache.delete(key);
      }
    }

    // Clear localStorage
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.cachePrefix) && key.includes(pattern)) {
          localStorage.removeItem(key);
        }
      });
      console.log(`🗑️ Cache pattern invalidated: ${pattern}`);
    } catch (error) {
      console.warn('Cache invalidation error:', error);
    }
  }

  /**
   * Clear all expired cache entries
   */
  clearExpired() {
    const now = Date.now();
    
    // Clear memory cache
    for (const [key, value] of this.memoryCache.entries()) {
      if (value.expiry <= now) {
        this.memoryCache.delete(key);
      }
    }

    // Clear localStorage
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.cachePrefix)) {
          try {
            const cached = JSON.parse(localStorage.getItem(key));
            if (cached.expiry <= now) {
              localStorage.removeItem(key);
            }
          } catch {
            // Invalid cache entry, remove it
            localStorage.removeItem(key);
          }
        }
      });
      console.log('🧹 Expired cache cleared');
    } catch (error) {
      console.warn('Cache cleanup error:', error);
    }
  }

  /**
   * Clear all cache
   */
  clearAll() {
    // Clear memory
    this.memoryCache.clear();
    
    // Clear localStorage
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.cachePrefix)) {
          localStorage.removeItem(key);
        }
      });
      console.log('🗑️ All cache cleared');
    } catch (error) {
      console.warn('Cache clear error:', error);
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const memorySize = this.memoryCache.size;
    let storageSize = 0;
    let storageBytes = 0;

    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.cachePrefix)) {
          storageSize++;
          storageBytes += localStorage.getItem(key).length;
        }
      });
    } catch (error) {
      console.warn('Cache stats error:', error);
    }

    return {
      memoryEntries: memorySize,
      storageEntries: storageSize,
      storageSizeKB: (storageBytes / 1024).toFixed(2)
    };
  }

  /**
   * Show cache indicator in UI (for development/debugging)
   */
  showCacheIndicator(type) {
    // Only show in development
    if (window.location.hostname !== 'localhost') return;

    const indicator = document.getElementById('cacheIndicator');
    if (!indicator) {
      // Create indicator element
      const div = document.createElement('div');
      div.id = 'cacheIndicator';
      div.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        background: ${type === 'memory' ? 'rgba(0, 255, 136, 0.9)' : 'rgba(0, 212, 255, 0.9)'};
        color: #0a0e17;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 10px;
        font-weight: bold;
        z-index: 10000;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.2s;
      `;
      div.innerHTML = `<i class="fas fa-bolt"></i> ${type === 'memory' ? 'RAM' : 'DISK'}`;
      document.body.appendChild(div);
      
      setTimeout(() => {
        div.style.opacity = '1';
      }, 10);
    } else {
      indicator.style.background = type === 'memory' ? 'rgba(0, 255, 136, 0.9)' : 'rgba(0, 212, 255, 0.9)';
      indicator.innerHTML = `<i class="fas fa-bolt"></i> ${type === 'memory' ? 'RAM' : 'DISK'}`;
      indicator.style.opacity = '1';
    }

    // Hide after 1 second
    setTimeout(() => {
      const ind = document.getElementById('cacheIndicator');
      if (ind) {
        ind.style.opacity = '0';
      }
    }, 1000);
  }
}

// Export singleton instance
export default new CacheManager();

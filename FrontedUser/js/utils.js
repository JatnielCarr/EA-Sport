// =====================================================
// Utility Functions - Cache, Lazy Loading, Scroll Reveal
// =====================================================

// =====================================================
// Cache Manager
// =====================================================

class CacheManager {
    constructor(prefix = 'apex-cache', defaultTTL = 5 * 60 * 1000) {
        this.prefix = prefix;
        this.defaultTTL = defaultTTL;
        this.memoryCache = new Map();
    }

    /**
     * Generate cache key
     */
    getKey(key) {
        return `${this.prefix}:${key}`;
    }

    /**
     * Get item from cache
     */
    get(key) {
        const cacheKey = this.getKey(key);

        // Try memory cache first
        if (this.memoryCache.has(cacheKey)) {
            const item = this.memoryCache.get(cacheKey);
            if (Date.now() < item.expires) {
                return item.data;
            }
            this.memoryCache.delete(cacheKey);
        }

        // Try localStorage
        try {
            const stored = localStorage.getItem(cacheKey);
            if (stored) {
                const item = JSON.parse(stored);
                if (Date.now() < item.expires) {
                    // Restore to memory cache
                    this.memoryCache.set(cacheKey, item);
                    return item.data;
                }
                localStorage.removeItem(cacheKey);
            }
        } catch (e) {
            console.warn('Cache read error:', e);
        }

        return null;
    }

    /**
     * Set item in cache
     */
    set(key, data, ttl = this.defaultTTL) {
        const cacheKey = this.getKey(key);
        const item = {
            data,
            expires: Date.now() + ttl,
            timestamp: Date.now()
        };

        // Store in memory
        this.memoryCache.set(cacheKey, item);

        // Store in localStorage for persistence
        try {
            localStorage.setItem(cacheKey, JSON.stringify(item));
        } catch (e) {
            // localStorage might be full, just use memory
            console.warn('Cache write error:', e);
        }
    }

    /**
     * Remove item from cache
     */
    remove(key) {
        const cacheKey = this.getKey(key);
        this.memoryCache.delete(cacheKey);
        try {
            localStorage.removeItem(cacheKey);
        } catch (e) {
            console.warn('Cache remove error:', e);
        }
    }

    /**
     * Clear all cache items
     */
    clear() {
        this.memoryCache.clear();

        try {
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith(this.prefix)) {
                    localStorage.removeItem(key);
                }
            });
        } catch (e) {
            console.warn('Cache clear error:', e);
        }
    }

    /**
     * Get or fetch with cache
     */
    async getOrFetch(key, fetchFn, ttl = this.defaultTTL) {
        const cached = this.get(key);
        if (cached !== null) {
            return cached;
        }

        const data = await fetchFn();
        this.set(key, data, ttl);
        return data;
    }
}

export const cache = new CacheManager();

// =====================================================
// Lazy Loading Images
// =====================================================

let lazyObserver = null;

/**
 * Initialize lazy loading for images
 */
export function initLazyLoading() {
    if (!('IntersectionObserver' in window)) {
        // Fallback: load all images immediately
        document.querySelectorAll('img[data-src]').forEach(img => {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
        });
        return;
    }

    lazyObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;

                // Load the image
                if (img.dataset.src) {
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                }

                if (img.dataset.srcset) {
                    img.srcset = img.dataset.srcset;
                    img.removeAttribute('data-srcset');
                }

                img.classList.add('lazy-loaded');
                lazyObserver.unobserve(img);
            }
        });
    }, {
        rootMargin: '50px 0px',
        threshold: 0.01
    });
}

/**
 * Observe elements for lazy loading
 */
export function lazyLoadImages(container = document) {
    if (!lazyObserver) {
        initLazyLoading();
    }

    const images = container.querySelectorAll('img[data-src], img[data-srcset]');
    images.forEach(img => {
        if (lazyObserver) {
            lazyObserver.observe(img);
        }
    });
}

/**
 * Create lazy image HTML
 */
export function createLazyImage(src, alt, className = '', placeholder = '') {
    const placeholderSrc = placeholder || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 200"%3E%3Crect fill="%231a1a2e" width="300" height="200"/%3E%3C/svg%3E';
    return `<img src="${placeholderSrc}" data-src="${src}" alt="${alt}" class="lazy-image ${className}" loading="lazy">`;
}

// =====================================================
// Scroll Reveal Animation
// =====================================================

let revealObserver = null;

/**
 * Initialize scroll reveal
 */
export function initScrollReveal() {
    if (!('IntersectionObserver' in window)) {
        // Show all elements immediately as fallback
        document.querySelectorAll('.reveal').forEach(el => {
            el.classList.add('revealed');
        });
        return;
    }

    revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                const delay = el.dataset.revealDelay || 0;

                setTimeout(() => {
                    el.classList.add('revealed');
                }, parseInt(delay));

                revealObserver.unobserve(el);
            }
        });
    }, {
        rootMargin: '-50px 0px',
        threshold: 0.1
    });

    // Observe initial elements
    document.querySelectorAll('.reveal').forEach(el => {
        revealObserver.observe(el);
    });
}

/**
 * Add reveal animation to elements
 */
export function observeRevealElements(container = document) {
    if (!revealObserver) {
        initScrollReveal();
    }

    container.querySelectorAll('.reveal:not(.revealed)').forEach(el => {
        if (revealObserver) {
            revealObserver.observe(el);
        }
    });
}

// =====================================================
// Debounce & Throttle
// =====================================================

/**
 * Debounce function - delays execution until after wait ms have elapsed
 */
export function debounce(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle function - limits execution to once per wait ms
 */
export function throttle(func, wait = 100) {
    let inThrottle;
    return function executedFunction(...args) {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, wait);
        }
    };
}

// =====================================================
// DOM Utilities
// =====================================================

/**
 * Safe querySelector that returns null instead of throwing
 */
export function $(selector, parent = document) {
    return parent.querySelector(selector);
}

/**
 * Safe querySelectorAll that returns array
 */
export function $$(selector, parent = document) {
    return Array.from(parent.querySelectorAll(selector));
}

/**
 * Create element from HTML string
 */
export function createElement(html) {
    const template = document.createElement('template');
    template.innerHTML = html.trim();
    return template.content.firstChild;
}

/**
 * Wait for element to appear in DOM
 */
export function waitForElement(selector, timeout = 5000) {
    return new Promise((resolve, reject) => {
        const element = document.querySelector(selector);
        if (element) {
            resolve(element);
            return;
        }

        const observer = new MutationObserver((mutations, obs) => {
            const el = document.querySelector(selector);
            if (el) {
                obs.disconnect();
                resolve(el);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        setTimeout(() => {
            observer.disconnect();
            reject(new Error(`Element ${selector} not found within ${timeout}ms`));
        }, timeout);
    });
}

// =====================================================
// Format Utilities
// =====================================================

/**
 * Format number with K, M, B suffixes
 */
export function formatNumber(num) {
    if (num >= 1000000000) {
        return (num / 1000000000).toFixed(1).replace(/\.0$/, '') + 'B';
    }
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    }
    return num.toString();
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date) {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now - then;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) {
        return 'hace un momento';
    }
    if (diffMins < 60) {
        return `hace ${diffMins} ${diffMins === 1 ? 'minuto' : 'minutos'}`;
    }
    if (diffHours < 24) {
        return `hace ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`;
    }
    if (diffDays < 7) {
        return `hace ${diffDays} ${diffDays === 1 ? 'día' : 'días'}`;
    }

    return then.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        year: now.getFullYear() !== then.getFullYear() ? 'numeric' : undefined
    });
}

/**
 * Format duration in mm:ss or hh:mm:ss
 */
export function formatDuration(seconds) {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hrs > 0) {
        return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// =====================================================
// URL Utilities
// =====================================================

/**
 * Get URL query parameters as object
 */
export function getQueryParams() {
    const params = {};
    const searchParams = new URLSearchParams(window.location.search);
    for (const [key, value] of searchParams) {
        params[key] = value;
    }
    return params;
}

/**
 * Update URL query parameters without page reload
 */
export function updateQueryParams(params, replace = false) {
    const url = new URL(window.location);

    Object.entries(params).forEach(([key, value]) => {
        if (value === null || value === undefined || value === '') {
            url.searchParams.delete(key);
        } else {
            url.searchParams.set(key, value);
        }
    });

    if (replace) {
        window.history.replaceState({}, '', url);
    } else {
        window.history.pushState({}, '', url);
    }
}

/**
 * Parse hash route parameters
 */
export function parseHashRoute() {
    const hash = window.location.hash.slice(1) || '/';
    const [path, queryString] = hash.split('?');
    const params = {};

    if (queryString) {
        const searchParams = new URLSearchParams(queryString);
        for (const [key, value] of searchParams) {
            params[key] = value;
        }
    }

    return { path, params };
}

// =====================================================
// Storage Utilities
// =====================================================

/**
 * Safe localStorage get with JSON parsing
 */
export function getStorageItem(key, defaultValue = null) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch {
        return defaultValue;
    }
}

/**
 * Safe localStorage set with JSON stringify
 */
export function setStorageItem(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch {
        console.warn('Storage write failed for key:', key);
        return false;
    }
}

// =====================================================
// Export Default
// =====================================================

export default {
    cache,
    initLazyLoading,
    lazyLoadImages,
    createLazyImage,
    initScrollReveal,
    observeRevealElements,
    debounce,
    throttle,
    $,
    $$,
    createElement,
    waitForElement,
    formatNumber,
    formatRelativeTime,
    formatDuration,
    getQueryParams,
    updateQueryParams,
    parseHashRoute,
    getStorageItem,
    setStorageItem
};

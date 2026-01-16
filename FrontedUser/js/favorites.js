// =====================================================
// Favorites / Watchlist Manager
// =====================================================

const FAVORITES_KEY = 'apex-favorites';

/**
 * Get all favorites from storage
 */
function getFavorites() {
    try {
        const stored = localStorage.getItem(FAVORITES_KEY);
        return stored ? JSON.parse(stored) : { tournaments: [], teams: [], matches: [] };
    } catch {
        return { tournaments: [], teams: [], matches: [] };
    }
}

/**
 * Save favorites to storage
 */
function saveFavorites(favorites) {
    try {
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
        window.dispatchEvent(new CustomEvent('favoritesChanged', { detail: favorites }));
    } catch (e) {
        console.warn('Failed to save favorites:', e);
    }
}

/**
 * Add item to favorites
 */
export function addFavorite(type, id, data = {}) {
    const favorites = getFavorites();

    if (!favorites[type]) {
        favorites[type] = [];
    }

    // Don't add duplicate
    if (favorites[type].some(item => item.id === id)) {
        return false;
    }

    favorites[type].push({
        id,
        addedAt: new Date().toISOString(),
        ...data
    });

    saveFavorites(favorites);
    return true;
}

/**
 * Remove item from favorites
 */
export function removeFavorite(type, id) {
    const favorites = getFavorites();

    if (!favorites[type]) {
        return false;
    }

    const index = favorites[type].findIndex(item => item.id === id);
    if (index === -1) {
        return false;
    }

    favorites[type].splice(index, 1);
    saveFavorites(favorites);
    return true;
}

/**
 * Toggle favorite status
 */
export function toggleFavorite(type, id, data = {}) {
    if (isFavorite(type, id)) {
        removeFavorite(type, id);
        return false;
    } else {
        addFavorite(type, id, data);
        return true;
    }
}

/**
 * Check if item is favorited
 */
export function isFavorite(type, id) {
    const favorites = getFavorites();
    return favorites[type]?.some(item => item.id === id) || false;
}

/**
 * Get all favorites of a type
 */
export function getFavoritesByType(type) {
    const favorites = getFavorites();
    return favorites[type] || [];
}

/**
 * Get all favorites
 */
export function getAllFavorites() {
    return getFavorites();
}

/**
 * Get favorites count
 */
export function getFavoritesCount() {
    const favorites = getFavorites();
    return (favorites.tournaments?.length || 0) +
        (favorites.teams?.length || 0) +
        (favorites.matches?.length || 0);
}

/**
 * Clear all favorites
 */
export function clearAllFavorites() {
    localStorage.removeItem(FAVORITES_KEY);
    window.dispatchEvent(new CustomEvent('favoritesChanged', { detail: { tournaments: [], teams: [], matches: [] } }));
}

/**
 * Create favorite button HTML
 */
export function createFavoriteButton(type, id, data = {}, options = {}) {
    const favorited = isFavorite(type, id);
    const size = options.size || 'md';
    const showText = options.showText !== false;

    const icon = favorited ? 'fas fa-heart' : 'far fa-heart';
    const label = favorited ? 'Quitar de favoritos' : 'Añadir a favoritos';
    const activeClass = favorited ? 'active' : '';

    return `
        <button 
            class="favorite-btn ${size} ${activeClass}" 
            data-type="${type}" 
            data-id="${id}"
            data-name="${data.name || ''}"
            aria-label="${label}"
            title="${label}"
        >
            <i class="${icon}"></i>
            ${showText ? `<span>${favorited ? 'Favorito' : 'Favorito'}</span>` : ''}
        </button>
    `;
}

/**
 * Initialize favorite button event listeners
 */
export function initFavoriteButtons(container = document) {
    container.querySelectorAll('.favorite-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();

            const type = btn.dataset.type;
            const id = btn.dataset.id;
            const name = btn.dataset.name;

            const nowFavorited = toggleFavorite(type, id, { name });

            // Update button state
            btn.classList.toggle('active', nowFavorited);
            const icon = btn.querySelector('i');
            icon.className = nowFavorited ? 'fas fa-heart' : 'far fa-heart';

            // Show feedback
            if (window.showToast) {
                window.showToast(
                    'success',
                    nowFavorited ? 'Añadido a favoritos' : 'Eliminado de favoritos',
                    name || ''
                );
            }
        });
    });
}

export default {
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
    getFavoritesByType,
    getAllFavorites,
    getFavoritesCount,
    clearAllFavorites,
    createFavoriteButton,
    initFavoriteButtons
};

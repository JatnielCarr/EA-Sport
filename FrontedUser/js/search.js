// =====================================================
// Global Search Module
// =====================================================

import API from './api.js';
import { debounce } from './utils.js';

let searchModal = null;
let searchInput = null;
let searchResults = null;
let isSearching = false;

/**
 * Initialize search functionality
 */
export function initSearch() {
    createSearchModal();
    setupKeyboardShortcuts();
}

/**
 * Create search modal HTML
 */
function createSearchModal() {
    const modal = document.createElement('div');
    modal.id = 'searchModal';
    modal.className = 'search-modal';
    modal.innerHTML = `
        <div class="search-modal-backdrop"></div>
        <div class="search-modal-content">
            <div class="search-input-wrapper">
                <i class="fas fa-search search-icon"></i>
                <input 
                    type="text" 
                    id="globalSearchInput" 
                    class="search-input" 
                    placeholder="Buscar torneos, equipos, jugadores..."
                    autocomplete="off"
                >
                <div class="search-shortcut">
                    <kbd>ESC</kbd>
                </div>
            </div>
            <div id="searchResults" class="search-results">
                <div class="search-placeholder">
                    <i class="fas fa-search"></i>
                    <p>Escribe para buscar</p>
                </div>
            </div>
            <div class="search-footer">
                <div class="search-tip">
                    <kbd>↑</kbd><kbd>↓</kbd> para navegar • <kbd>Enter</kbd> para seleccionar • <kbd>ESC</kbd> para cerrar
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    searchModal = modal;
    searchInput = document.getElementById('globalSearchInput');
    searchResults = document.getElementById('searchResults');

    // Event listeners
    modal.querySelector('.search-modal-backdrop').addEventListener('click', closeSearch);
    searchInput.addEventListener('input', debounce(handleSearchInput, 300));
    searchInput.addEventListener('keydown', handleSearchKeydown);
}

/**
 * Setup keyboard shortcuts
 */
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ctrl+K or Cmd+K to open search
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            openSearch();
        }

        // Escape to close
        if (e.key === 'Escape' && searchModal.classList.contains('open')) {
            closeSearch();
        }
    });
}

/**
 * Open search modal
 */
export function openSearch() {
    searchModal.classList.add('open');
    document.body.style.overflow = 'hidden';
    setTimeout(() => searchInput.focus(), 100);
}

/**
 * Close search modal
 */
export function closeSearch() {
    searchModal.classList.remove('open');
    document.body.style.overflow = '';
    searchInput.value = '';
    searchResults.innerHTML = `
        <div class="search-placeholder">
            <i class="fas fa-search"></i>
            <p>Escribe para buscar</p>
        </div>
    `;
}

/**
 * Handle search input
 */
async function handleSearchInput(e) {
    const query = e.target.value.trim();

    if (query.length < 2) {
        searchResults.innerHTML = `
            <div class="search-placeholder">
                <i class="fas fa-search"></i>
                <p>Escribe al menos 2 caracteres</p>
            </div>
        `;
        return;
    }

    await performSearch(query);
}

/**
 * Perform search across all entities
 */
async function performSearch(query) {
    if (isSearching) return;
    isSearching = true;

    searchResults.innerHTML = `
        <div class="search-loading">
            <div class="spinner"></div>
            <p>Buscando...</p>
        </div>
    `;

    try {
        const [tournamentsRes, teamsRes] = await Promise.all([
            API.tournaments.getAll(),
            API.teams.getAll()
        ]);

        const tournaments = (tournamentsRes.data || []).filter(t =>
            t.name.toLowerCase().includes(query.toLowerCase())
        );

        const teams = (teamsRes.data || []).filter(t =>
            t.name.toLowerCase().includes(query.toLowerCase())
        );

        renderSearchResults(query, { tournaments, teams });
    } catch (error) {
        searchResults.innerHTML = `
            <div class="search-error">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error al buscar: ${error.message}</p>
            </div>
        `;
    } finally {
        isSearching = false;
    }
}

/**
 * Render search results
 */
function renderSearchResults(query, results) {
    const { tournaments, teams } = results;
    const total = tournaments.length + teams.length;

    if (total === 0) {
        searchResults.innerHTML = `
            <div class="search-empty">
                <i class="fas fa-search"></i>
                <p>No se encontraron resultados para "${query}"</p>
            </div>
        `;
        return;
    }

    let html = '';

    if (tournaments.length > 0) {
        html += `
            <div class="search-group">
                <div class="search-group-title">
                    <i class="fas fa-trophy"></i> Torneos (${tournaments.length})
                </div>
                ${tournaments.slice(0, 5).map(t => `
                    <a href="#/torneo/${t.id}" class="search-result-item" data-type="tournament">
                        <div class="search-result-icon trophy">
                            <i class="fas fa-trophy"></i>
                        </div>
                        <div class="search-result-content">
                            <div class="search-result-title">${highlightMatch(t.name, query)}</div>
                            <div class="search-result-meta">
                                ${t.status || 'Torneo'} • ${t.region || 'Global'}
                            </div>
                        </div>
                    </a>
                `).join('')}
            </div>
        `;
    }

    if (teams.length > 0) {
        html += `
            <div class="search-group">
                <div class="search-group-title">
                    <i class="fas fa-users"></i> Equipos (${teams.length})
                </div>
                ${teams.slice(0, 5).map(t => `
                    <a href="#/equipo/${t.id}" class="search-result-item" data-type="team">
                        <div class="search-result-icon team">
                            <i class="fas fa-users"></i>
                        </div>
                        <div class="search-result-content">
                            <div class="search-result-title">${highlightMatch(t.name, query)}</div>
                            <div class="search-result-meta">
                                Equipo
                            </div>
                        </div>
                    </a>
                `).join('')}
            </div>
        `;
    }

    searchResults.innerHTML = html;

    // Add click handlers to close search on result click
    searchResults.querySelectorAll('.search-result-item').forEach(item => {
        item.addEventListener('click', closeSearch);
    });
}

/**
 * Highlight matching text
 */
function highlightMatch(text, query) {
    const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
}

/**
 * Escape regex special characters
 */
function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Handle keyboard navigation in search results
 */
function handleSearchKeydown(e) {
    const items = searchResults.querySelectorAll('.search-result-item');
    const activeItem = searchResults.querySelector('.search-result-item.active');
    let currentIndex = Array.from(items).indexOf(activeItem);

    switch (e.key) {
        case 'ArrowDown':
            e.preventDefault();
            if (currentIndex < items.length - 1) {
                items[currentIndex]?.classList.remove('active');
                items[currentIndex + 1]?.classList.add('active');
                items[currentIndex + 1]?.scrollIntoView({ block: 'nearest' });
            } else if (currentIndex === -1 && items.length > 0) {
                items[0].classList.add('active');
            }
            break;

        case 'ArrowUp':
            e.preventDefault();
            if (currentIndex > 0) {
                items[currentIndex]?.classList.remove('active');
                items[currentIndex - 1]?.classList.add('active');
                items[currentIndex - 1]?.scrollIntoView({ block: 'nearest' });
            }
            break;

        case 'Enter':
            if (activeItem) {
                activeItem.click();
            }
            break;
    }
}

/**
 * Create search button for navbar
 */
export function createSearchButton() {
    return `
        <button class="search-btn" aria-label="Buscar (Ctrl+K)" title="Buscar (Ctrl+K)">
            <i class="fas fa-search"></i>
        </button>
    `;
}

export default {
    initSearch,
    openSearch,
    closeSearch,
    createSearchButton
};

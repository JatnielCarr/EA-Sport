// =====================================================
// Theme Manager - Dark/Light Mode Toggle
// =====================================================

const THEME_KEY = 'apex-theme';
const THEME_LIGHT = 'light';
const THEME_DARK = 'dark';

/**
 * Get stored theme or detect system preference
 */
function getPreferredTheme() {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored) {
        return stored;
    }

    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
        return THEME_LIGHT;
    }

    return THEME_DARK;
}

/**
 * Apply theme to document
 */
function applyTheme(theme) {
    const html = document.documentElement;

    if (theme === THEME_LIGHT) {
        html.classList.add('theme-light');
    } else {
        html.classList.remove('theme-light');
    }

    // Update meta theme-color
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
        metaTheme.setAttribute('content', theme === THEME_LIGHT ? '#f0f4f8' : '#00d4ff');
    }

    // Dispatch event for components that need to react
    window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme } }));
}

/**
 * Initialize theme on page load
 */
export function initTheme() {
    const theme = getPreferredTheme();
    applyTheme(theme);

    // Listen for system preference changes
    if (window.matchMedia) {
        window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', (e) => {
            if (!localStorage.getItem(THEME_KEY)) {
                applyTheme(e.matches ? THEME_LIGHT : THEME_DARK);
            }
        });
    }
}

/**
 * Toggle between light and dark themes
 */
export function toggleTheme() {
    const current = document.documentElement.classList.contains('theme-light') ? THEME_LIGHT : THEME_DARK;
    const newTheme = current === THEME_LIGHT ? THEME_DARK : THEME_LIGHT;

    localStorage.setItem(THEME_KEY, newTheme);
    applyTheme(newTheme);

    return newTheme;
}

/**
 * Set specific theme
 */
export function setTheme(theme) {
    if (theme !== THEME_LIGHT && theme !== THEME_DARK) {
        console.warn('Invalid theme:', theme);
        return;
    }

    localStorage.setItem(THEME_KEY, theme);
    applyTheme(theme);
}

/**
 * Get current theme
 */
export function getCurrentTheme() {
    return document.documentElement.classList.contains('theme-light') ? THEME_LIGHT : THEME_DARK;
}

/**
 * Create theme toggle button HTML
 */
export function createThemeToggleButton() {
    const currentTheme = getCurrentTheme();
    const icon = currentTheme === THEME_LIGHT ? 'fa-moon' : 'fa-sun';
    const label = currentTheme === THEME_LIGHT ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro';

    return `
        <button class="theme-toggle" aria-label="${label}" title="${label}">
            <i class="fas ${icon}"></i>
        </button>
    `;
}

/**
 * Update theme toggle button icon
 */
export function updateThemeToggleButton() {
    const btn = document.querySelector('.theme-toggle');
    if (!btn) return;

    const currentTheme = getCurrentTheme();
    const icon = btn.querySelector('i');
    const label = currentTheme === THEME_LIGHT ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro';

    if (icon) {
        icon.className = `fas ${currentTheme === THEME_LIGHT ? 'fa-moon' : 'fa-sun'}`;
    }
    btn.setAttribute('aria-label', label);
    btn.setAttribute('title', label);
}

export default {
    initTheme,
    toggleTheme,
    setTheme,
    getCurrentTheme,
    createThemeToggleButton,
    updateThemeToggleButton,
    THEME_LIGHT,
    THEME_DARK
};

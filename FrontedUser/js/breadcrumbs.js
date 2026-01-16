// =====================================================
// Breadcrumbs Navigation System
// =====================================================

// Route to breadcrumb mapping
const routeMap = {
    '#/': [{ label: 'Inicio', href: '#/', icon: 'fas fa-home' }],
    '#/torneos': [
        { label: 'Inicio', href: '#/', icon: 'fas fa-home' },
        { label: 'Torneos', href: '#/torneos', icon: 'fas fa-trophy' }
    ],
    '#/live': [
        { label: 'Inicio', href: '#/', icon: 'fas fa-home' },
        { label: 'En Vivo', href: '#/live', icon: 'fas fa-broadcast-tower' }
    ],
    '#/ranking': [
        { label: 'Inicio', href: '#/', icon: 'fas fa-home' },
        { label: 'Ranking', href: '#/ranking', icon: 'fas fa-medal' }
    ],
    '#/perfil': [
        { label: 'Inicio', href: '#/', icon: 'fas fa-home' },
        { label: 'Mi Perfil', href: '#/perfil', icon: 'fas fa-user' }
    ],
    '#/dashboard': [
        { label: 'Inicio', href: '#/', icon: 'fas fa-home' },
        { label: 'Mis Torneos', href: '#/dashboard', icon: 'fas fa-gamepad' }
    ],
    '#/configuracion': [
        { label: 'Inicio', href: '#/', icon: 'fas fa-home' },
        { label: 'Configuración', href: '#/configuracion', icon: 'fas fa-cog' }
    ],
    '#/favoritos': [
        { label: 'Inicio', href: '#/', icon: 'fas fa-home' },
        { label: 'Favoritos', href: '#/favoritos', icon: 'fas fa-heart' }
    ],
    '#/historial': [
        { label: 'Inicio', href: '#/', icon: 'fas fa-home' },
        { label: 'Mi Perfil', href: '#/perfil', icon: 'fas fa-user' },
        { label: 'Historial', href: '#/historial', icon: 'fas fa-history' }
    ],
    '#/logros': [
        { label: 'Inicio', href: '#/', icon: 'fas fa-home' },
        { label: 'Mi Perfil', href: '#/perfil', icon: 'fas fa-user' },
        { label: 'Logros', href: '#/logros', icon: 'fas fa-award' }
    ],
    '#/login': [
        { label: 'Inicio', href: '#/', icon: 'fas fa-home' },
        { label: 'Iniciar Sesión', href: '#/login', icon: 'fas fa-sign-in-alt' }
    ],
    '#/registro': [
        { label: 'Inicio', href: '#/', icon: 'fas fa-home' },
        { label: 'Registrarse', href: '#/registro', icon: 'fas fa-user-plus' }
    ],
    '#/faq': [
        { label: 'Inicio', href: '#/', icon: 'fas fa-home' },
        { label: 'FAQ', href: '#/faq', icon: 'fas fa-question-circle' }
    ],
    '#/contacto': [
        { label: 'Inicio', href: '#/', icon: 'fas fa-home' },
        { label: 'Contacto', href: '#/contacto', icon: 'fas fa-envelope' }
    ],
    '#/reglas': [
        { label: 'Inicio', href: '#/', icon: 'fas fa-home' },
        { label: 'Reglas', href: '#/reglas', icon: 'fas fa-book' }
    ],
    '#/privacidad': [
        { label: 'Inicio', href: '#/', icon: 'fas fa-home' },
        { label: 'Privacidad', href: '#/privacidad', icon: 'fas fa-shield-alt' }
    ],
    '#/terminos': [
        { label: 'Inicio', href: '#/', icon: 'fas fa-home' },
        { label: 'Términos', href: '#/terminos', icon: 'fas fa-file-contract' }
    ]
};

let breadcrumbContainer = null;

/**
 * Initialize breadcrumbs system
 */
export function initBreadcrumbs() {
    // Create container if needed
    createBreadcrumbContainer();

    // Add styles
    addBreadcrumbStyles();

    // Listen for route changes
    window.addEventListener('hashchange', () => updateBreadcrumbs());

    // Initial update
    updateBreadcrumbs();
}

/**
 * Create breadcrumb container element
 */
function createBreadcrumbContainer() {
    if (document.getElementById('breadcrumb-nav')) {
        breadcrumbContainer = document.getElementById('breadcrumb-nav');
        return;
    }

    breadcrumbContainer = document.createElement('nav');
    breadcrumbContainer.id = 'breadcrumb-nav';
    breadcrumbContainer.className = 'breadcrumb-nav';
    breadcrumbContainer.setAttribute('aria-label', 'Breadcrumb');

    // Insert after navbar
    const navbar = document.querySelector('.navbar');
    if (navbar && navbar.nextSibling) {
        navbar.parentNode.insertBefore(breadcrumbContainer, navbar.nextSibling);
    } else {
        document.body.insertBefore(breadcrumbContainer, document.body.firstChild);
    }
}

/**
 * Add breadcrumb styles
 */
function addBreadcrumbStyles() {
    if (document.getElementById('breadcrumb-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'breadcrumb-styles';
    styles.textContent = `
        .breadcrumb-nav {
            position: fixed;
            top: 70px;
            left: 0;
            right: 0;
            z-index: 999;
            background: var(--bg-card);
            border-bottom: 1px solid var(--border-color);
            padding: 12px 24px;
            opacity: 0;
            transform: translateY(-10px);
            transition: opacity 0.3s ease, transform 0.3s ease;
            pointer-events: none;
        }

        .breadcrumb-nav.visible {
            opacity: 1;
            transform: translateY(0);
            pointer-events: all;
        }

        .breadcrumb-list {
            display: flex;
            align-items: center;
            gap: 8px;
            max-width: 1400px;
            margin: 0 auto;
            padding: 0;
            list-style: none;
            flex-wrap: wrap;
        }

        .breadcrumb-item {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 14px;
        }

        .breadcrumb-link {
            display: flex;
            align-items: center;
            gap: 6px;
            color: var(--text-secondary);
            text-decoration: none;
            padding: 4px 8px;
            border-radius: 6px;
            transition: all 0.2s ease;
        }

        .breadcrumb-link:hover {
            color: var(--primary);
            background: rgba(0, 212, 255, 0.1);
        }

        .breadcrumb-link i {
            font-size: 12px;
        }

        .breadcrumb-separator {
            color: var(--text-muted);
            font-size: 12px;
        }

        .breadcrumb-item.current .breadcrumb-link {
            color: var(--text-primary);
            font-weight: 500;
            cursor: default;
        }

        .breadcrumb-item.current .breadcrumb-link:hover {
            background: transparent;
            color: var(--text-primary);
        }

        /* Adjust main content when breadcrumbs are visible */
        #app.has-breadcrumbs {
            padding-top: 115px !important;
        }

        @media (max-width: 768px) {
            .breadcrumb-nav {
                padding: 10px 16px;
            }

            .breadcrumb-item span {
                display: none;
            }

            .breadcrumb-link {
                padding: 6px;
            }

            .breadcrumb-link i {
                font-size: 14px;
            }
        }
    `;
    document.head.appendChild(styles);
}

/**
 * Update breadcrumbs based on current route
 */
export function updateBreadcrumbs() {
    if (!breadcrumbContainer) return;

    const hash = window.location.hash || '#/';
    let breadcrumbs = routeMap[hash];

    // Handle dynamic routes like #/torneo/:id
    if (!breadcrumbs && hash.startsWith('#/torneo/')) {
        const tournamentId = hash.split('/')[2];
        breadcrumbs = [
            { label: 'Inicio', href: '#/', icon: 'fas fa-home' },
            { label: 'Torneos', href: '#/torneos', icon: 'fas fa-trophy' },
            { label: 'Torneo', href: hash, icon: 'fas fa-gamepad' }
        ];
    }

    // Default to home if no mapping found
    if (!breadcrumbs) {
        breadcrumbs = routeMap['#/'];
    }

    // Don't show breadcrumbs on home page
    if (hash === '#/' || breadcrumbs.length <= 1) {
        breadcrumbContainer.classList.remove('visible');
        document.getElementById('app')?.classList.remove('has-breadcrumbs');
        return;
    }

    // Render breadcrumbs
    renderBreadcrumbs(breadcrumbs);
    breadcrumbContainer.classList.add('visible');
    document.getElementById('app')?.classList.add('has-breadcrumbs');
}

/**
 * Render breadcrumb HTML
 */
function renderBreadcrumbs(items) {
    const html = `
        <ol class="breadcrumb-list">
            ${items.map((item, index) => {
        const isLast = index === items.length - 1;
        return `
                    <li class="breadcrumb-item ${isLast ? 'current' : ''}">
                        <a href="${item.href}" class="breadcrumb-link" ${isLast ? 'aria-current="page"' : ''}>
                            <i class="${item.icon}"></i>
                            <span>${item.label}</span>
                        </a>
                    </li>
                    ${!isLast ? '<li class="breadcrumb-separator" aria-hidden="true"><i class="fas fa-chevron-right"></i></li>' : ''}
                `;
    }).join('')}
        </ol>
    `;
    breadcrumbContainer.innerHTML = html;
}

/**
 * Set custom breadcrumbs for a page
 */
export function setBreadcrumbs(items) {
    if (!breadcrumbContainer) createBreadcrumbContainer();

    if (items.length <= 1) {
        breadcrumbContainer.classList.remove('visible');
        document.getElementById('app')?.classList.remove('has-breadcrumbs');
        return;
    }

    renderBreadcrumbs(items);
    breadcrumbContainer.classList.add('visible');
    document.getElementById('app')?.classList.add('has-breadcrumbs');
}

/**
 * Get breadcrumbs for specific route
 */
export function getBreadcrumbsForRoute(route) {
    return routeMap[route] || routeMap['#/'];
}

/**
 * Add a new route to the breadcrumb map
 */
export function addBreadcrumbRoute(route, items) {
    routeMap[route] = items;
}

// Make functions available globally
window.setBreadcrumbs = setBreadcrumbs;
window.updateBreadcrumbs = updateBreadcrumbs;

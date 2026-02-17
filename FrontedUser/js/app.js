// =====================================================
// EA Sports Tournaments - User Frontend App
// =====================================================

import API from './api.js';
import { isAuthenticated, getStoredUser, logout } from './auth.js';
import { showLoading, showToast, formatDate, formatCurrency } from './ui-helpers.js';
import { renderHome } from './pages/home.js';
import { renderTournaments } from './pages/tournaments.js';
import { renderTournament } from './pages/tournament.js';
import { renderLive } from './pages/live.js';
import { renderRanking } from './pages/ranking.js';
import { renderLogin } from './pages/login.js';
import { renderRegister } from './pages/register.js';
import { renderProfile } from './pages/profile.js';
import { renderDashboard } from './pages/dashboard.js';
import { renderSettings } from './pages/settings.js';
import { renderFaq } from './pages/faq.js';
import { renderContact } from './pages/contact.js';
import { renderRules } from './pages/rules.js';
import { renderPrivacy } from './pages/privacy.js';
import { renderTerms } from './pages/terms.js';
import { initNotifications } from './notifications.js';
import { renderFavorites } from './pages/favorites.js';
import { renderHistory } from './pages/history.js';
import { renderBadges } from './pages/badges.js';
import { initTheme, toggleTheme, updateThemeToggleButton } from './theme.js';
import { initSearch, openSearch } from './search.js';
import { initLazyLoading, initScrollReveal } from './utils.js';
import { initBreadcrumbs } from './breadcrumbs.js';
import { initPageTransitions } from './transitions.js';
import { initSounds, playSuccess, playError } from './sounds.js';
import { launchConfetti, launchConfettiBurst } from './confetti.js';
import { renderClansPage } from './pages/clans.js';
import { renderClanPage } from './pages/clan.js';
import { renderCreateClanPage } from './pages/create-clan.js';
import { renderPayment } from './pages/payment.js';
import { renderSubscription } from './pages/subscription.js';
import { renderPaymentSuccess } from './pages/payment-success.js';
import { renderTournamentInvite } from './pages/tournament-invite.js';

import { initChatbot } from './components/chatbot.js';

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    initRouter();
    initNavigation();
    updateNavbarAuth();
    initNotifications();
    initTheme();
    initSearch();
    initLazyLoading();
    initScrollReveal();
    initThemeToggle();
    initSearchButton();
    initBreadcrumbs();
    initPageTransitions();
    initSounds();

    // Initialize Chatbot AFTER page has fully loaded and rendered
    // Use requestIdleCallback for best performance, fallback to setTimeout
    const initChatbotDeferred = () => {
        if ('requestIdleCallback' in window) {
            requestIdleCallback(() => initChatbot(), { timeout: 2000 });
        } else {
            setTimeout(() => initChatbot(), 1500);
        }
    };

    // Wait for window.load to ensure all resources are ready
    if (document.readyState === 'complete') {
        initChatbotDeferred();
    } else {
        window.addEventListener('load', initChatbotDeferred);
    }

    // Listen for auth changes
    window.addEventListener('authChanged', updateNavbarAuth);
    window.addEventListener('themeChanged', updateThemeToggleButton);
});

// Initialize theme toggle button
function initThemeToggle() {
    const themeBtn = document.getElementById('themeToggle');
    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            toggleTheme();
            updateThemeIcon();
        });
        updateThemeIcon();
    }
}

// Update theme icon based on current theme
function updateThemeIcon() {
    const themeBtn = document.getElementById('themeToggle');
    if (!themeBtn) return;

    const icon = themeBtn.querySelector('i');
    const isLight = document.documentElement.classList.contains('theme-light');
    icon.className = isLight ? 'fas fa-moon' : 'fas fa-sun';
    themeBtn.setAttribute('title', isLight ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro');
}

// Initialize search button in navbar
function initSearchButton() {
    const searchBtn = document.getElementById('navSearchBtn');
    if (searchBtn) {
        searchBtn.addEventListener('click', openSearch);
    }
}

// =====================================================
// Router
// =====================================================
function initRouter() {
    window.addEventListener('hashchange', handleRoute);
    handleRoute();
}

async function handleRoute() {
    const hash = window.location.hash || '#/';
    const app = document.getElementById('app');

    // Handle anchor-only hashes (like #pricing-section) that don't start with #/
    // These are in-page scroll anchors, not SPA routes
    if (hash && !hash.startsWith('#/')) {
        // First ensure home page is loaded
        await renderHome(app);
        updateActiveNav('#/');

        // Then scroll to the anchor element after a brief delay
        setTimeout(() => {
            const anchorId = hash.substring(1);
            const anchorElement = document.getElementById(anchorId);
            if (anchorElement) {
                anchorElement.scrollIntoView({ behavior: 'smooth' });
            }
        }, 100);
        return;
    }

    // Update active nav link
    updateActiveNav(hash);

    // Protected routes that require authentication
    const protectedRoutes = ['#/perfil', '#/dashboard', '#/configuracion', '#/historial', '#/logros'];
    if (protectedRoutes.some(route => hash.startsWith(route)) && !isAuthenticated()) {
        window.showToast('error', 'Acceso denegado', 'Debes iniciar sesión');
        window.location.hash = '#/login';
        return;
    }

    // Redirect if already logged in
    const authRoutes = ['#/login', '#/registro'];
    if (authRoutes.includes(hash) && isAuthenticated()) {
        window.location.hash = '#/';
        return;
    }

    // Route handling
    const routes = {
        '#/': () => renderHome(app),
        '#/torneos': () => renderTournaments(app),
        '#/live': () => renderLive(app),
        '#/ranking': () => renderRanking(app),
        '#/clanes': () => renderClansPage(app),
        '#/crear-clan': () => renderCreateClanPage(app),
        '#/login': () => renderLogin(app),
        '#/registro': () => renderRegister(app),
        '#/perfil': () => renderProfile(app),
        '#/dashboard': () => renderDashboard(app),
        '#/configuracion': () => renderSettings(app),
        '#/faq': () => renderFaq(app),
        '#/contacto': () => renderContact(app),
        '#/reglas': () => renderRules(app),
        '#/privacidad': () => renderPrivacy(app),
        '#/terminos': () => renderTerms(app),
        '#/favoritos': () => renderFavorites(app),
        '#/historial': () => renderHistory(app),
        '#/logros': () => renderBadges(app),
        '#/pagos': () => renderPayment(app),
        '#/pago': () => renderPayment(app),
        '#/pago/exito': () => renderPaymentSuccess(app),
        '#/suscripcion': () => renderSubscription(app)
    };

    // Check for tournament invite route
    if (hash.startsWith('#/tournament/invite/')) {
        const inviteCode = hash.split('/')[3];
        return renderTournamentInvite(app, inviteCode);
    }

    // Check for tournament detail route
    if (hash.startsWith('#/torneo/')) {
        const tournamentId = hash.split('/')[2];
        return renderTournament(app, tournamentId);
    }

    // Check for clan detail route
    if (hash.startsWith('#/clan/')) {
        const clanId = hash.split('/')[2];
        return renderClanPage(app, clanId);
    }

    // Execute route or default to home
    const routeHandler = routes[hash] || routes['#/'];

    try {
        await routeHandler();
    } catch (error) {
        console.error('Route error:', error);
        app.innerHTML = `
      <div class="container">
        <div class="empty-state">
          <i class="fas fa-exclamation-triangle"></i>
          <h3>Error al cargar la página</h3>
          <p>${error.message}</p>
          <a href="#/" class="btn btn-primary mt-3">Volver al inicio</a>
        </div>
      </div>
    `;
    }
}

function updateActiveNav(hash) {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === hash ||
            (hash.startsWith('#/torneo/') && link.getAttribute('href') === '#/torneos')) {
            link.classList.add('active');
        }
    });
}

// =====================================================
// Navigation
// =====================================================
function initNavigation() {
    const toggle = document.querySelector('.nav-toggle');
    const menu = document.querySelector('.nav-menu');

    if (toggle && menu) {
        toggle.addEventListener('click', () => {
            menu.classList.toggle('show');
        });
    }

    // Close mobile menu when clicking a link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            menu?.classList.remove('show');
        });
    });
}

function updateNavbarAuth() {
    const navActions = document.querySelector('.nav-actions');
    if (!navActions) return;

    if (isAuthenticated()) {
        const user = getStoredUser();
        navActions.innerHTML = `
            <div class="user-menu">
                <button class="user-menu-btn" id="userMenuBtn">
                    <div class="user-avatar">
                        <i class="fas fa-user"></i>
                    </div>
                    <span class="user-name">${user?.username || 'Usuario'}</span>
                    <i class="fas fa-chevron-down"></i>
                </button>
                <div class="user-dropdown" id="userDropdown">
                    <a href="#/perfil" class="dropdown-item">
                        <i class="fas fa-user-circle"></i>
                        Mi Perfil
                    </a>
                    <a href="#/dashboard" class="dropdown-item">
                        <i class="fas fa-gamepad"></i>
                        Mis Torneos
                    </a>
                    <a href="#/configuracion" class="dropdown-item">
                        <i class="fas fa-cog"></i>
                        Configuración
                    </a>
                    <div class="dropdown-divider"></div>
                    <button class="dropdown-item logout-btn" id="logoutBtn">
                        <i class="fas fa-sign-out-alt"></i>
                        Cerrar Sesión
                    </button>
                </div>
            </div>
        `;

        // Toggle dropdown
        const userMenuBtn = document.getElementById('userMenuBtn');
        const userDropdown = document.getElementById('userDropdown');

        userMenuBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            userDropdown.classList.toggle('show');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', () => {
            userDropdown?.classList.remove('show');
        });

        // Logout handler
        document.getElementById('logoutBtn')?.addEventListener('click', () => {
            logout();
            window.showToast('success', 'Hasta pronto', 'Has cerrado sesión');
        });
    } else {
        navActions.innerHTML = `
            <a href="#/login" class="btn btn-outline">Iniciar Sesión</a>
            <a href="#/registro" class="btn btn-primary">Registrarse</a>
        `;
    }
}

// =====================================================
// UI Utilities (re-exportadas para compatibilidad)
// =====================================================
export { showLoading, showToast, formatDate, formatCurrency } from './ui-helpers.js';

// =====================================================
// EA Sports Tournaments - User Frontend App
// =====================================================

import API from './api.js';
import { isAuthenticated, getStoredUser, logout } from './auth.js';
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

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    initRouter();
    initNavigation();
    updateNavbarAuth();
    initNotifications();

    // Listen for auth changes
    window.addEventListener('authChanged', updateNavbarAuth);
});

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

    // Update active nav link
    updateActiveNav(hash);

    // Protected routes that require authentication
    const protectedRoutes = ['#/perfil', '#/dashboard', '#/configuracion'];
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
        '#/login': () => renderLogin(app),
        '#/registro': () => renderRegister(app),
        '#/perfil': () => renderProfile(app),
        '#/dashboard': () => renderDashboard(app),
        '#/configuracion': () => renderSettings(app),
        '#/faq': () => renderFaq(app),
        '#/contacto': () => renderContact(app),
        '#/reglas': () => renderRules(app),
        '#/privacidad': () => renderPrivacy(app),
        '#/terminos': () => renderTerms(app)
    };

    // Check for tournament detail route
    if (hash.startsWith('#/torneo/')) {
        const tournamentId = hash.split('/')[2];
        return renderTournament(app, tournamentId);
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
// UI Utilities (exportadas globalmente)
// =====================================================
export function showLoading(container) {
    container.innerHTML = `
    <div class="container">
      <div class="loading">
        <div class="loading-spinner"></div>
        <p>Cargando...</p>
      </div>
    </div>
  `;
}

export function showToast(type, title, message) {
    const container = document.getElementById('toastContainer');
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        info: 'fa-info-circle',
        warning: 'fa-exclamation-triangle'
    };

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
    <i class="fas ${icons[type]} toast-icon"></i>
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      <div class="toast-message">${message}</div>
    </div>
  `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

export function formatDate(dateString) {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
}

export function formatCurrency(amount) {
    if (!amount) return '$0';
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
        minimumFractionDigits: 0
    }).format(amount);
}

// Make utilities available globally
window.showToast = showToast;

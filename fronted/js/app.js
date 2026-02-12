// =====================================================
// APP - Main Application Router & Initialization
// =====================================================

import { renderDashboard } from './pages/dashboard.js';
import { renderUsers } from './pages/users.js';
import { renderTournaments } from './pages/tournaments.js';
import { renderTeams } from './pages/teams.js';
import { renderMatches } from './pages/matches.js';
import { renderGames } from './pages/games.js';
import { renderLeaderboard } from './pages/leaderboard.js';
import { renderBrackets } from './pages/brackets.js';
import { renderLogin, cleanupLogin } from './pages/login.js';
import { renderRegister, cleanupRegister } from './pages/register.js';
import { renderBracket } from './pages/bracket.js';
import { renderMyClan } from './pages/my-clan.js';

import { showToast, initGamingEffects, closeModal, initModalHandlers, cleanupModalHandlers } from './ui.js';
import { getInitials } from './utils.js';
import { API_BASE } from './config.js';
import Auth from './auth.js';
import Sidebar from './components/Sidebar.js';
import { initBotPro } from './botPro.js';
import CacheManager from './cache.js';

// =====================================================
// Router Configuration
// =====================================================

const routes = {
  '/': renderDashboard,
  '/dashboard': renderDashboard,
  '/users': renderUsers,
  '/tournaments': renderTournaments,
  '/teams': renderTeams,
  '/matches': renderMatches,
  '/games': renderGames,
  '/leaderboard': renderLeaderboard,
  '/brackets': renderBrackets,

  // Clan Leader Routes
  '/my-clan': renderMyClan,
  '/my-tournaments': renderTournaments,
  '/my-matches': renderMatches,

  '/login': renderLogin,
  '/register': renderRegister
};

// Dynamic routes patterns
const dynamicRoutes = [
  { pattern: /^\/tournaments\/([^/]+)\/bracket$/, handler: (container, params) => renderBracket(container, params[0]) }
];

// Protected routes that require authentication
const protectedRoutes = ['/', '/dashboard', '/users', '/tournaments', '/teams', '/matches', '/games', '/leaderboard', '/brackets'];

// =====================================================
// Application State
// =====================================================

let currentRoute = '/';

// =====================================================
// Router Functions
// =====================================================

function getRouteFromHash() {
  const hash = window.location.hash;
  return hash ? hash.substring(1) : '/';
}

async function navigateTo(route) {
  const container = document.getElementById('pageContent');

  if (!container) {
    console.error('Page content container not found');
    return;
  }

  // Cleanup previous page (especially login/register)
  if (currentRoute === '/login' && route !== '/login') {
    cleanupLogin();
    // Re-initialize sidebar after successful login
    if (Auth.isLoggedIn()) {
      Sidebar.init();
    }
  }

  if (currentRoute === '/register' && route !== '/register') {
    cleanupRegister();
    // Re-initialize sidebar after successful register (if admin)
    if (Auth.isLoggedIn()) {
      Sidebar.init();
    }
  }

  // Check authentication for protected routes
  const isProtectedRoute = protectedRoutes.includes(route) || route.startsWith('/tournaments/');
  if (isProtectedRoute && !Auth.isLoggedIn()) {
    // Redirect to landing page for non-authenticated users
    window.location.href = '/landing.html';
    return;
  }

  // Redirect to dashboard if already logged in and trying to access login/register
  if ((route === '/login' || route === '/register') && Auth.isLoggedIn()) {
    window.location.hash = '#/dashboard';
    return;
  }

  // Redirect ClanLeaders from admin routes to their equivalent routes
  if (Auth.isClanLeader() && !Auth.isSuperAdmin()) {
    const adminToLeaderRedirects = {
      '/teams': '/my-clan',
      '/users': '/dashboard',
      '/games': '/dashboard',
      '/brackets': '/dashboard'
    };

    if (adminToLeaderRedirects[route]) {
      window.location.hash = '#' + adminToLeaderRedirects[route];
      return;
    }
  }

  // Find matching route handler
  let handler = routes[route];
  let handlerParams = null;

  // Handle dynamic routes
  if (!handler) {
    for (const dynamicRoute of dynamicRoutes) {
      const match = route.match(dynamicRoute.pattern);
      if (match) {
        handler = dynamicRoute.handler;
        handlerParams = match.slice(1); // Extract captured groups
        break;
      }
    }
  }

  // Default to dashboard if route not found
  if (!handler) {
    handler = routes['/'];
    route = '/';
  }

  // Update active nav item
  updateActiveNavItem(route);

  // Update page title
  updatePageTitle(route);

  // Store current route
  currentRoute = route;

  // Execute route handler
  try {
    if (handlerParams) {
      await handler(container, handlerParams);
    } else {
      await handler(container);
    }
  } catch (error) {
    console.error('Error rendering page:', error);
    container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-exclamation-triangle"></i>
        <h3>Error al cargar la página</h3>
        <p>${error.message}</p>
        <button class="btn btn-primary" onclick="window.location.reload()">
          <i class="fas fa-refresh"></i> Recargar
        </button>
      </div>
    `;
  }
}

function updateActiveNavItem(route) {
  // Remove active class from all nav links
  document.querySelectorAll('.nav-link').forEach(item => {
    item.classList.remove('active');
  });

  // Handle root route specially - map to 'dashboard'
  const pageName = route === '/' ? 'dashboard' : route.replace('/', '');

  // Add active class to current route - check for data-page attribute first
  let activeItem = document.querySelector(`.nav-link[data-page="${pageName}"]`);
  if (!activeItem) {
    activeItem = document.querySelector(`.nav-link[href="#${route}"]`);
  }
  // Fallback for '/' route
  if (!activeItem && route === '/') {
    activeItem = document.querySelector('.nav-link[href="#/dashboard"]');
  }
  if (activeItem) {
    activeItem.classList.add('active');
  }
}

function updatePageTitle(route) {
  const titles = {
    '/': 'Dashboard',
    '/dashboard': 'Dashboard',
    '/leaderboard': 'Leaderboard',
    '/brackets': 'Brackets',
    '/users': 'Usuarios',
    '/tournaments': 'Torneos',
    '/teams': 'Equipos',
    '/matches': 'Partidas',
    '/games': 'Juegos',
    '/login': 'Iniciar Sesión'
  };

  document.title = `${titles[route] || 'Admin'} | EA Sports Tournament`;
}

// =====================================================
// Theme Management
// =====================================================

function initTheme() {
  const savedTheme = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
  const icon = document.querySelector('.theme-toggle i');
  if (icon) {
    icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
  }
}

// =====================================================
// Sidebar Management
// =====================================================

function initSidebar() {
  const sidebarState = localStorage.getItem('sidebarCollapsed');
  const sidebar = document.querySelector('.sidebar');
  const mainContent = document.querySelector('.main-content');

  if (sidebarState === 'true') {
    sidebar?.classList.add('collapsed');
    mainContent?.classList.add('sidebar-collapsed');
  }
}

function toggleSidebar() {
  const sidebar = document.querySelector('.sidebar');
  const mainContent = document.querySelector('.main-content');

  if (sidebar) {
    sidebar.classList.toggle('collapsed');
    mainContent?.classList.toggle('sidebar-collapsed');
    localStorage.setItem('sidebarCollapsed', sidebar.classList.contains('collapsed'));
  }
}

// =====================================================
// Mobile Sidebar Management
// =====================================================

function toggleMobileSidebar() {
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.getElementById('sidebarOverlay');

  if (sidebar) {
    sidebar.classList.toggle('mobile-open');
    overlay?.classList.toggle('active');
    document.body.classList.toggle('sidebar-open');
  }
}

function closeMobileSidebar() {
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.getElementById('sidebarOverlay');

  if (sidebar) {
    sidebar.classList.remove('mobile-open');
    overlay?.classList.remove('active');
    document.body.classList.remove('sidebar-open');
  }
}

// =====================================================
// API Health Check
// =====================================================

async function checkAPIHealth() {
  try {
    const response = await fetch(`${API_BASE}/health`, {
      method: 'GET',
      mode: 'cors'
    });
    if (response.ok) {
      console.log('✅ API conectada correctamente');
      return true;
    } else {
      throw new Error('API no disponible');
    }
  } catch (error) {
    console.warn('⚠️ API no disponible:', error.message);
    // Only show toast if not on login page
    if (window.location.hash !== '#/login') {
      showToast('warning', 'Advertencia', 'No se puede conectar con el servidor. Algunas funciones pueden no estar disponibles.');
    }
    return false;
  }
}

// =====================================================
// Event Listeners Setup
// =====================================================

function setupEventListeners() {
  // Hash change for routing
  window.addEventListener('hashchange', () => {
    navigateTo(getRouteFromHash());
    // Close mobile sidebar on navigation
    closeMobileSidebar();
  });

  // Theme toggle
  const themeToggle = document.querySelector('.theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }

  // Sidebar toggle (desktop)
  const sidebarToggle = document.querySelector('.sidebar-toggle');
  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', toggleSidebar);
  }

  // Mobile menu toggle
  const mobileMenuToggle = document.getElementById('mobileMenuToggle');
  const sidebarOverlay = document.getElementById('sidebarOverlay');

  if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', toggleMobileSidebar);
  }

  if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', closeMobileSidebar);
  }

  // Notification button toggle
  const notificationBtn = document.getElementById('notificationBtn');
  const notificationPanel = document.getElementById('notificationPanel');
  if (notificationBtn && notificationPanel) {
    notificationBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      notificationPanel.classList.toggle('show');
    });

    // Close panel when clicking outside
    document.addEventListener('click', (e) => {
      if (!notificationPanel.contains(e.target) && !notificationBtn.contains(e.target)) {
        notificationPanel.classList.remove('show');
      }
    });

    // Mark all as read
    const markAllBtn = document.getElementById('markAllRead');
    if (markAllBtn) {
      markAllBtn.addEventListener('click', () => {
        document.querySelectorAll('.notification-item.unread').forEach(item => {
          item.classList.remove('unread');
        });
        const badge = document.getElementById('notificationBadge');
        if (badge) badge.textContent = '0';
      });
    }
  }

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Ctrl + K for search (future feature)
    if (e.ctrlKey && e.key === 'k') {
      e.preventDefault();
      console.log('Search shortcut triggered');
    }

    // Escape to close modal
    if (e.key === 'Escape') {
      const modal = document.getElementById('modal');
      if (modal && modal.classList.contains('active')) {
        window.closeModal?.();
      }
      // Close notification panel
      notificationPanel?.classList.remove('show');
    }
  });
}

// =====================================================
// User Session Management
// =====================================================

function initUserSession() {
  const user = Auth.getUser();

  if (user) {
    const userNameEl = document.querySelector('.user-name');
    const userRoleEl = document.querySelector('.user-role');
    const avatarEl = document.querySelector('.sidebar-footer .avatar');

    if (userNameEl) userNameEl.textContent = user.username || 'Admin';
    if (userRoleEl) userRoleEl.textContent = getRoleLabel(user.role);
    if (avatarEl) {
      avatarEl.innerHTML = `<span>${getInitials(user.username)}</span>`;
    }
  }
}

function getRoleLabel(role) {
  const labels = {
    'ADMIN': 'Administrador',
    'ORGANIZER': 'Organizador',
    'USER': 'Usuario'
  };
  return labels[role] || role;
}

// Note: getInitials is now imported from utils.js for safety
// Legacy fallback removed - using centralized utility function

// Logout function
function logout() {
  Auth.logout();
}

// =====================================================
// Global Functions (Available in window)
// =====================================================

window.toggleTheme = toggleTheme;
window.toggleSidebar = toggleSidebar;
window.toggleMobileSidebar = toggleMobileSidebar;
window.closeMobileSidebar = closeMobileSidebar;

window.logout = logout;
window.closeModal = closeModal;

// Expose cache manager for debugging
window.CacheManager = CacheManager;

// =====================================================
// Service Worker Registration
// =====================================================

async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      // First, clear all old caches to fix corrupted cache issue
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => {
          console.log('🗑️ Clearing old cache:', cacheName);
          return caches.delete(cacheName);
        })
      );

      // Unregister old service workers
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
        console.log('🗑️ Unregistered old Service Worker');
      }

      // Register fresh service worker
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('✅ Service Worker registered:', registration.scope);

      // Check for updates periodically
      setInterval(() => {
        registration.update();
      }, 60 * 60 * 1000); // Check every hour
    } catch (error) {
      console.warn('⚠️ Service Worker registration failed:', error);
    }
  }
}

// =====================================================
// Cache Maintenance
// =====================================================

function initCacheMaintenance() {
  // Clear expired cache on startup
  CacheManager.clearExpired();

  // Periodic cache cleanup (every 5 minutes)
  setInterval(() => {
    CacheManager.clearExpired();
  }, 5 * 60 * 1000);

  // Log cache stats periodically (development)
  if (window.location.hostname === 'localhost') {
    setInterval(() => {
      const stats = CacheManager.getStats();
      console.log('📊 Cache Stats:', stats);
    }, 30 * 1000); // Every 30 seconds
  }
}

// =====================================================
// Application Initialization
// =====================================================

async function init() {
  console.log('🎮 EA Sports Tournament Admin Panel v1.0');
  console.log('📦 Initializing application...');

  // Register Service Worker for offline support
  registerServiceWorker();

  // Initialize cache maintenance
  initCacheMaintenance();

  // Initialize features
  initTheme();
  initSidebar();

  // initUserSession(); // Replaced by Sidebar.js
  setupEventListeners();
  initModalHandlers();

  // Initialize gaming effects
  initGamingEffects();

  // Check API health
  await checkAPIHealth();

  // Init BotPro Admin Assistant
  initBotPro();

  // Navigate to initial route first (this handles auth redirects)
  const initialRoute = getRouteFromHash();
  await navigateTo(initialRoute);

  // Initialize Dynamic Sidebar AFTER navigation (so we know if user is logged in)
  // This ensures the sidebar is only rendered when we're on a protected route with a logged-in user
  if (Auth.isLoggedIn()) {
    Sidebar.init();
  }

  console.log('✅ Application ready!');
}

// Start application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Export for testing
export { navigateTo, toggleTheme, routes };

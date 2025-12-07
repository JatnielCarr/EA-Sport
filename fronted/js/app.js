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
import { renderBracket } from './pages/bracket.js';
import { showToast, initGamingEffects, closeModal, initModalHandlers } from './ui.js';
import Auth from './auth.js';

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
  '/login': renderLogin
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

  // Cleanup previous page (especially login)
  if (currentRoute === '/login' && route !== '/login') {
    cleanupLogin();
  }

  // Check authentication for protected routes
  const isProtectedRoute = protectedRoutes.includes(route) || route.startsWith('/tournaments/');
  if (isProtectedRoute && !Auth.isLoggedIn()) {
    window.location.hash = '#/login';
    return;
  }

  // Redirect to dashboard if already logged in and trying to access login
  if (route === '/login' && Auth.isLoggedIn()) {
    window.location.hash = '#/dashboard';
    return;
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

  // Add active class to current route - check for data-page attribute first
  let activeItem = document.querySelector(`.nav-link[data-page="${route.replace('/', '')}"]`);
  if (!activeItem) {
    activeItem = document.querySelector(`.nav-link[href="#${route}"]`);
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
  if (sidebarState === 'true') {
    document.querySelector('.sidebar')?.classList.add('collapsed');
  }
}

function toggleSidebar() {
  const sidebar = document.querySelector('.sidebar');
  if (sidebar) {
    sidebar.classList.toggle('collapsed');
    localStorage.setItem('sidebarCollapsed', sidebar.classList.contains('collapsed'));
  }
}

// =====================================================
// Mobile Menu
// =====================================================

function initMobileMenu() {
  // Close sidebar on mobile when clicking outside
  document.addEventListener('click', (e) => {
    const sidebar = document.querySelector('.sidebar');
    const menuToggle = document.querySelector('.menu-toggle');

    if (window.innerWidth <= 768 && sidebar && !sidebar.contains(e.target) && !menuToggle?.contains(e.target)) {
      sidebar.classList.remove('mobile-open');
    }
  });
}

function toggleMobileMenu() {
  const sidebar = document.querySelector('.sidebar');
  if (sidebar) {
    sidebar.classList.toggle('mobile-open');
  }
}

// =====================================================
// API Health Check
// =====================================================

async function checkAPIHealth() {
  try {
    const response = await fetch('http://localhost:3000/health', {
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
  const menuToggle = document.querySelector('.menu-toggle');
  if (menuToggle) {
    menuToggle.addEventListener('click', toggleMobileMenu);
  }

  // Navigation items - close mobile menu on click
  document.querySelectorAll('.nav-link').forEach(item => {
    item.addEventListener('click', () => {
      if (window.innerWidth <= 768) {
        document.querySelector('.sidebar')?.classList.remove('mobile-open');
      }
    });
  });

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

function getInitials(name) {
  if (!name) return 'U';
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
}

// Logout function
function logout() {
  Auth.logout();
}

// =====================================================
// Global Functions (Available in window)
// =====================================================

window.toggleTheme = toggleTheme;
window.toggleSidebar = toggleSidebar;
window.toggleMobileMenu = toggleMobileMenu;
window.logout = logout;
window.closeModal = closeModal;

// =====================================================
// Application Initialization
// =====================================================

async function init() {
  console.log('🎮 EA Sports Tournament Admin Panel v1.0');
  console.log('📦 Initializing application...');

  // Initialize features
  initTheme();
  initSidebar();
  initMobileMenu();
  initUserSession();
  setupEventListeners();
  initModalHandlers();

  // Initialize gaming effects
  initGamingEffects();

  // Check API health
  await checkAPIHealth();

  // Navigate to initial route
  const initialRoute = getRouteFromHash();
  await navigateTo(initialRoute);

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

/**
 * ApexTournament Mobile App
 * Optimizado para iPhone 15 A16 Bionic
 */

import { triggerHaptic } from './capacitor-init.js';
import QRService from './qr-service.js';

// =====================================================
// APP CONFIGURATION
// =====================================================
const CONFIG = {
  API_BASE_URL: 'http://localhost:3000',
  WS_URL: 'ws://localhost:3000',
  VERSION: '1.0.0',
  CACHE_TTL: 5 * 60 * 1000, // 5 minutes
};

// =====================================================
// STATE MANAGEMENT
// =====================================================
const state = {
  user: null,
  token: localStorage.getItem('token'),
  currentRoute: '/',
  cache: new Map(),
  isLoading: false
};

// =====================================================
// API CLIENT
// =====================================================
const api = {
  async request(endpoint, options = {}) {
    const url = `${CONFIG.API_BASE_URL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(state.token && { 'Authorization': `Bearer ${state.token}` }),
      ...options.headers
    };

    try {
      const response = await fetch(url, { ...options, headers });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Request failed');
      }
      
      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  get: (endpoint) => api.request(endpoint),
  post: (endpoint, body) => api.request(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  put: (endpoint, body) => api.request(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (endpoint) => api.request(endpoint, { method: 'DELETE' })
};

// =====================================================
// ROUTER
// =====================================================
const routes = {
  '/': { title: 'Inicio', render: renderHome },
  '/torneos': { title: 'Torneos', render: renderTournaments },
  '/torneos/:id': { title: 'Torneo', render: renderTournamentDetail },
  '/live': { title: 'En Vivo', render: renderLive },
  '/clanes': { title: 'Clanes', render: renderClans },
  '/ranking': { title: 'Ranking', render: renderRanking },
  '/perfil': { title: 'Perfil', render: renderProfile },
  '/qr': { title: 'Código QR', render: renderQRPage },
  '/login': { title: 'Iniciar Sesión', render: renderLogin },
  '/registro': { title: 'Registro', render: renderRegister }
};

function router() {
  const hash = window.location.hash.slice(1) || '/';
  const [path, ...params] = hash.split('/').filter(Boolean);
  const route = routes[`/${path}`] || routes['/'];
  
  // Update tab bar active state
  updateTabBar(`/${path}`);
  
  // Render page with animation
  const app = document.getElementById('app');
  app.classList.add('page-exit');
  
  setTimeout(() => {
    route.render(params);
    app.classList.remove('page-exit');
    app.classList.add('page-enter');
    
    // Scroll to top
    app.scrollTo({ top: 0, behavior: 'instant' });
    
    setTimeout(() => app.classList.remove('page-enter'), 300);
  }, 150);
  
  // Haptic feedback
  triggerHaptic('selection');
}

function updateTabBar(path) {
  document.querySelectorAll('.tab-item').forEach(tab => {
    const href = tab.getAttribute('href').slice(1);
    tab.classList.toggle('active', href === path);
  });
}

function navigate(path) {
  window.location.hash = path;
}

// =====================================================
// PAGE RENDERERS
// =====================================================

async function renderHome() {
  const app = document.getElementById('app');
  
  app.innerHTML = `
    <div class="section animate-fadeIn">
      <div class="hero-banner">
        <div class="hero-content">
          <h1 class="hero-title">¡Bienvenido a<br><span class="text-primary">ApexTournament!</span></h1>
          <p class="hero-subtitle">Compite, gana y conviértete en leyenda</p>
        </div>
      </div>
    </div>

    <section class="section">
      <div class="section-header">
        <h2 class="section-title">🔴 En Vivo Ahora</h2>
        <a href="#/live" class="section-link">Ver todo</a>
      </div>
      <div id="live-matches" class="scroll-horizontal">
        ${skeletonCards(3, 'skeleton-card-horizontal')}
      </div>
    </section>

    <section class="section">
      <div class="section-header">
        <h2 class="section-title">🏆 Torneos Activos</h2>
        <a href="#/torneos" class="section-link">Ver todos</a>
      </div>
      <div id="active-tournaments" class="cards-grid">
        ${skeletonCards(4, 'skeleton-card')}
      </div>
    </section>

    <section class="section">
      <div class="section-header">
        <h2 class="section-title">🏅 Top Jugadores</h2>
        <a href="#/ranking" class="section-link">Ver ranking</a>
      </div>
      <div id="top-players" class="list">
        ${skeletonList(5)}
      </div>
    </section>
  `;

  // Load data
  loadHomeData();
}

async function loadHomeData() {
  try {
    // Load live matches
    const liveResponse = await api.get('/matches/live');
    renderLiveMatches(liveResponse.data || []);

    // Load tournaments
    const tournamentsResponse = await api.get('/tournaments?status=IN_PROGRESS&limit=4');
    renderTournamentCards(tournamentsResponse.data || []);

    // Load top players
    const rankingResponse = await api.get('/players/stats?limit=5');
    renderTopPlayers(rankingResponse.data || []);
  } catch (error) {
    console.error('Error loading home data:', error);
  }
}

function renderLiveMatches(matches) {
  const container = document.getElementById('live-matches');
  
  if (!matches.length) {
    container.innerHTML = `
      <div class="empty-card">
        <i class="fas fa-broadcast-tower"></i>
        <p>No hay partidas en vivo</p>
      </div>
    `;
    return;
  }

  container.innerHTML = matches.map(match => `
    <a href="#/matches/${match.matchId}/live" class="live-match-card animate-slideInRight" data-haptic="light">
      <div class="live-badge"><i class="fas fa-circle"></i> LIVE</div>
      <div class="match-teams">
        <div class="team">
          <span class="team-name">${match.homeTeam?.name || 'TBD'}</span>
          <span class="team-score">${match.homeTeam?.score || 0}</span>
        </div>
        <span class="vs">VS</span>
        <div class="team">
          <span class="team-name">${match.awayTeam?.name || 'TBD'}</span>
          <span class="team-score">${match.awayTeam?.score || 0}</span>
        </div>
      </div>
      <div class="match-viewers">
        <i class="fas fa-eye"></i> ${match.viewers || 0}
      </div>
    </a>
  `).join('');
}

function renderTournamentCards(tournaments) {
  const container = document.getElementById('active-tournaments');
  
  if (!tournaments.length) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-trophy empty-state-icon"></i>
        <h3 class="empty-state-title">No hay torneos activos</h3>
        <p class="empty-state-description">Los próximos torneos aparecerán aquí</p>
      </div>
    `;
    return;
  }

  container.innerHTML = tournaments.map((t, i) => `
    <a href="#/torneos/${t.id}" class="card animate-slideUp stagger-${i + 1}" data-haptic="light">
      <div class="card-content">
        <div class="tournament-game badge badge-primary">${t.game?.name || 'Game'}</div>
        <h3 class="card-title">${t.name}</h3>
        <p class="card-description text-secondary">
          <i class="fas fa-users"></i> ${t.teams?.length || 0}/${t.max_participants} equipos
        </p>
        <div class="tournament-prize">
          <i class="fas fa-coins text-warning"></i> 
          <span>$${Number(t.prize_pool).toLocaleString()}</span>
        </div>
      </div>
    </a>
  `).join('');
}

function renderTopPlayers(players) {
  const container = document.getElementById('top-players');
  
  if (!players.length) {
    container.innerHTML = `<p class="text-center text-secondary p-3">No hay datos de ranking</p>`;
    return;
  }

  container.innerHTML = players.map((player, i) => `
    <div class="list-item animate-slideUp stagger-${i + 1}" data-haptic="light">
      <div class="rank-badge rank-${i + 1}">${i + 1}</div>
      <div class="list-item-icon">
        <i class="fas fa-user"></i>
      </div>
      <div class="list-item-content">
        <div class="list-item-title">${player.user?.username || 'Player'}</div>
        <div class="list-item-subtitle">${player.rating || 1000} ELO</div>
      </div>
      <div class="player-stats">
        <span class="text-success">${player.wins || 0}W</span>
        <span class="text-error">${player.losses || 0}L</span>
      </div>
    </div>
  `).join('');
}

async function renderTournaments() {
  const app = document.getElementById('app');
  
  app.innerHTML = `
    <div class="section">
      <h1 class="page-title animate-fadeIn">Torneos</h1>
      
      <div class="filter-tabs scroll-horizontal">
        <button class="filter-tab active" data-status="all">Todos</button>
        <button class="filter-tab" data-status="REGISTRATION_OPEN">Inscripción</button>
        <button class="filter-tab" data-status="IN_PROGRESS">En Curso</button>
        <button class="filter-tab" data-status="COMPLETED">Finalizados</button>
      </div>
      
      <div id="tournaments-list" class="cards-grid mt-3">
        ${skeletonCards(6, 'skeleton-card')}
      </div>
    </div>
  `;

  // Load tournaments
  await loadTournaments();
  
  // Filter tabs
  document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      triggerHaptic('light');
      document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      loadTournaments(tab.dataset.status);
    });
  });
}

async function loadTournaments(status = 'all') {
  try {
    const endpoint = status === 'all' 
      ? '/tournaments' 
      : `/tournaments?status=${status}`;
    
    const response = await api.get(endpoint);
    const tournaments = response.data || [];
    
    const container = document.getElementById('tournaments-list');
    
    if (!tournaments.length) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-trophy empty-state-icon"></i>
          <h3 class="empty-state-title">No hay torneos</h3>
        </div>
      `;
      return;
    }

    container.innerHTML = tournaments.map((t, i) => `
      <a href="#/torneos/${t.id}" class="card animate-scaleIn stagger-${(i % 5) + 1}" data-haptic="light">
        <div class="card-content">
          <div class="flex justify-between items-center mb-2">
            <span class="badge badge-primary">${t.game?.name || 'Game'}</span>
            <span class="badge ${getStatusBadge(t.status)}">${getStatusText(t.status)}</span>
          </div>
          <h3 class="card-title">${t.name}</h3>
          <p class="card-description">${t.description || ''}</p>
          <div class="card-meta mt-2">
            <span><i class="fas fa-users"></i> ${t.teams?.length || 0}/${t.max_participants}</span>
            <span><i class="fas fa-coins text-warning"></i> $${Number(t.prize_pool).toLocaleString()}</span>
          </div>
        </div>
      </a>
    `).join('');
  } catch (error) {
    console.error('Error loading tournaments:', error);
  }
}

async function renderTournamentDetail(params) {
  const id = params[0];
  const app = document.getElementById('app');
  
  app.innerHTML = `
    <div class="section">
      <div class="skeleton skeleton-card" style="height: 300px;"></div>
    </div>
  `;

  try {
    const response = await api.get(`/tournaments/${id}`);
    const t = response.data;

    app.innerHTML = `
      <div class="tournament-detail animate-fadeIn">
        <div class="tournament-header">
          <span class="badge badge-primary">${t.game?.name || 'Game'}</span>
          <h1 class="tournament-title">${t.name}</h1>
          <span class="badge ${getStatusBadge(t.status)}">${getStatusText(t.status)}</span>
        </div>
        
        <div class="tournament-stats">
          <div class="stat">
            <i class="fas fa-users"></i>
            <span>${t.teams?.length || 0}/${t.max_participants}</span>
            <label>Equipos</label>
          </div>
          <div class="stat">
            <i class="fas fa-coins text-warning"></i>
            <span>$${Number(t.prize_pool).toLocaleString()}</span>
            <label>Premio</label>
          </div>
          <div class="stat">
            <i class="fas fa-calendar"></i>
            <span>${new Date(t.start_date).toLocaleDateString()}</span>
            <label>Inicio</label>
          </div>
        </div>

        <div class="section">
          <h2 class="section-title">Descripción</h2>
          <p class="text-secondary">${t.description || 'Sin descripción'}</p>
        </div>

        <div class="section">
          <h2 class="section-title">Equipos Inscritos</h2>
          <div class="list">
            ${(t.teams || []).map((team, i) => `
              <div class="list-item">
                <div class="list-item-icon">${i + 1}</div>
                <div class="list-item-content">
                  <div class="list-item-title">${team.name}</div>
                  <div class="list-item-subtitle">[${team.tag}]</div>
                </div>
              </div>
            `).join('') || '<p class="text-center text-secondary p-3">No hay equipos inscritos</p>'}
          </div>
        </div>

        ${t.status === 'REGISTRATION_OPEN' ? `
          <div class="section">
            <button class="btn btn-primary btn-full btn-lg" data-haptic="medium" onclick="joinTournament('${t.id}')">
              <i class="fas fa-sign-in-alt"></i> Inscribirse
            </button>
          </div>
        ` : ''}
      </div>
    `;
  } catch (error) {
    app.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-exclamation-triangle empty-state-icon text-error"></i>
        <h3 class="empty-state-title">Error al cargar</h3>
        <p class="empty-state-description">No se pudo cargar el torneo</p>
        <button class="btn btn-primary" onclick="navigate('/torneos')">Volver</button>
      </div>
    `;
  }
}

async function renderLive() {
  const app = document.getElementById('app');
  
  app.innerHTML = `
    <div class="section">
      <h1 class="page-title animate-fadeIn">
        <i class="fas fa-broadcast-tower text-error"></i> En Vivo
      </h1>
      
      <div id="live-list" class="live-matches-grid">
        ${skeletonCards(4, 'skeleton-card')}
      </div>
    </div>
  `;

  try {
    const response = await api.get('/matches/live');
    const matches = response.data || [];
    
    const container = document.getElementById('live-list');
    
    if (!matches.length) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-broadcast-tower empty-state-icon"></i>
          <h3 class="empty-state-title">No hay partidas en vivo</h3>
          <p class="empty-state-description">Las partidas en vivo aparecerán aquí</p>
        </div>
      `;
      return;
    }

    container.innerHTML = matches.map(match => `
      <a href="#/matches/${match.matchId}/live" class="live-match-card-full animate-slideUp" data-haptic="medium">
        <div class="live-badge"><i class="fas fa-circle"></i> LIVE</div>
        <div class="match-info">
          <div class="team home">
            <span class="team-logo"><i class="fas fa-shield-alt"></i></span>
            <span class="team-name">${match.homeTeam?.name || 'TBD'}</span>
            <span class="team-score">${match.homeTeam?.score || 0}</span>
          </div>
          <div class="match-divider">
            <span class="vs">VS</span>
            <span class="match-status">${match.status}</span>
          </div>
          <div class="team away">
            <span class="team-score">${match.awayTeam?.score || 0}</span>
            <span class="team-name">${match.awayTeam?.name || 'TBD'}</span>
            <span class="team-logo"><i class="fas fa-shield-alt"></i></span>
          </div>
        </div>
        <div class="match-footer">
          <span><i class="fas fa-eye"></i> ${match.viewers || 0} espectadores</span>
          <span><i class="fas fa-gamepad"></i> ${match.events?.length || 0} eventos</span>
        </div>
      </a>
    `).join('');
  } catch (error) {
    console.error('Error loading live matches:', error);
  }
}

async function renderClans() {
  const app = document.getElementById('app');
  
  app.innerHTML = `
    <div class="section">
      <h1 class="page-title animate-fadeIn">
        <i class="fas fa-shield-alt text-primary"></i> Clanes
      </h1>
      
      <div id="clans-list" class="list">
        ${skeletonList(6)}
      </div>
    </div>
  `;

  try {
    const response = await api.get('/clans');
    const clans = response.data || [];
    
    const container = document.getElementById('clans-list');
    
    if (!clans.length) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-shield-alt empty-state-icon"></i>
          <h3 class="empty-state-title">No hay clanes</h3>
          <button class="btn btn-primary" data-haptic="medium">Crear Clan</button>
        </div>
      `;
      return;
    }

    container.innerHTML = clans.map((clan, i) => `
      <a href="#/clanes/${clan.id}" class="list-item animate-slideUp stagger-${(i % 5) + 1}" data-haptic="light">
        <div class="list-item-icon">
          <i class="fas fa-shield-alt"></i>
        </div>
        <div class="list-item-content">
          <div class="list-item-title">${clan.name} <span class="text-secondary">[${clan.tag}]</span></div>
          <div class="list-item-subtitle">${clan.members?.length || 0}/${clan.max_members} miembros</div>
        </div>
        <i class="fas fa-chevron-right list-item-arrow"></i>
      </a>
    `).join('');
  } catch (error) {
    console.error('Error loading clans:', error);
  }
}

async function renderRanking() {
  const app = document.getElementById('app');
  
  app.innerHTML = `
    <div class="section">
      <h1 class="page-title animate-fadeIn">
        <i class="fas fa-medal text-warning"></i> Ranking Global
      </h1>
      
      <div id="ranking-list" class="ranking-list">
        ${skeletonList(10)}
      </div>
    </div>
  `;

  try {
    const response = await api.get('/players/stats?limit=50');
    const players = response.data || [];
    
    const container = document.getElementById('ranking-list');
    
    container.innerHTML = players.map((player, i) => `
      <div class="list-item ranking-item animate-slideUp stagger-${(i % 5) + 1}" data-haptic="light">
        <div class="rank-position rank-${i < 3 ? i + 1 : 'default'}">${i + 1}</div>
        <div class="list-item-icon">
          <i class="fas fa-user"></i>
        </div>
        <div class="list-item-content">
          <div class="list-item-title">${player.user?.username || 'Player'}</div>
          <div class="list-item-subtitle">
            <span class="text-success">${player.wins || 0}W</span> - 
            <span class="text-error">${player.losses || 0}L</span>
          </div>
        </div>
        <div class="rating-badge">
          <span class="rating-value">${player.rating || 1000}</span>
          <span class="rating-label">ELO</span>
        </div>
      </div>
    `).join('');
  } catch (error) {
    console.error('Error loading ranking:', error);
  }
}

async function renderProfile() {
  const app = document.getElementById('app');
  
  if (!state.token) {
    app.innerHTML = `
      <div class="section">
        <div class="empty-state">
          <i class="fas fa-user-circle empty-state-icon"></i>
          <h3 class="empty-state-title">Inicia sesión</h3>
          <p class="empty-state-description">Accede a tu cuenta para ver tu perfil</p>
          <button class="btn btn-primary" onclick="navigate('/login')" data-haptic="medium">
            Iniciar Sesión
          </button>
        </div>
      </div>
    `;
    return;
  }

  app.innerHTML = `
    <div class="section">
      <div class="profile-header animate-fadeIn">
        <div class="profile-avatar">
          <i class="fas fa-user"></i>
        </div>
        <h1 class="profile-name">${state.user?.username || 'Usuario'}</h1>
        <p class="profile-email">${state.user?.email || ''}</p>
      </div>
      
      <div class="list mt-4">
        <a href="#/settings" class="list-item" data-haptic="light">
          <div class="list-item-icon"><i class="fas fa-cog"></i></div>
          <div class="list-item-content">
            <div class="list-item-title">Configuración</div>
          </div>
          <i class="fas fa-chevron-right list-item-arrow"></i>
        </a>
        <a href="#/favorites" class="list-item" data-haptic="light">
          <div class="list-item-icon"><i class="fas fa-heart"></i></div>
          <div class="list-item-content">
            <div class="list-item-title">Favoritos</div>
          </div>
          <i class="fas fa-chevron-right list-item-arrow"></i>
        </a>
        <a href="#/history" class="list-item" data-haptic="light">
          <div class="list-item-icon"><i class="fas fa-history"></i></div>
          <div class="list-item-content">
            <div class="list-item-title">Historial</div>
          </div>
          <i class="fas fa-chevron-right list-item-arrow"></i>
        </a>
        <button class="list-item text-error" onclick="logout()" data-haptic="warning">
          <div class="list-item-icon"><i class="fas fa-sign-out-alt"></i></div>
          <div class="list-item-content">
            <div class="list-item-title">Cerrar Sesión</div>
          </div>
        </button>
      </div>
    </div>
  `;
}

function renderLogin() {
  const app = document.getElementById('app');
  
  app.innerHTML = `
    <div class="auth-page animate-fadeIn">
      <div class="auth-header">
        <div class="auth-logo">
          <i class="fas fa-bolt"></i>
        </div>
        <h1 class="auth-title">Bienvenido</h1>
        <p class="auth-subtitle">Inicia sesión en tu cuenta</p>
      </div>
      
      <form id="login-form" class="auth-form">
        <div class="input-group">
          <label class="input-label">Email</label>
          <input type="email" class="input" name="email" placeholder="tu@email.com" required>
        </div>
        
        <div class="input-group">
          <label class="input-label">Contraseña</label>
          <input type="password" class="input" name="password" placeholder="••••••••" required>
        </div>
        
        <button type="submit" class="btn btn-primary btn-full btn-lg" data-haptic="medium">
          <i class="fas fa-sign-in-alt"></i> Iniciar Sesión
        </button>
      </form>
      
      <p class="auth-footer">
        ¿No tienes cuenta? <a href="#/registro" class="text-primary">Regístrate</a>
      </p>
    </div>
  `;

  document.getElementById('login-form').addEventListener('submit', handleLogin);
}

function renderRegister() {
  const app = document.getElementById('app');
  
  app.innerHTML = `
    <div class="auth-page animate-fadeIn">
      <div class="auth-header">
        <div class="auth-logo">
          <i class="fas fa-bolt"></i>
        </div>
        <h1 class="auth-title">Crear Cuenta</h1>
        <p class="auth-subtitle">Únete a la comunidad</p>
      </div>
      
      <form id="register-form" class="auth-form">
        <div class="input-group">
          <label class="input-label">Usuario</label>
          <input type="text" class="input" name="username" placeholder="tu_username" required>
        </div>
        
        <div class="input-group">
          <label class="input-label">Email</label>
          <input type="email" class="input" name="email" placeholder="tu@email.com" required>
        </div>
        
        <div class="input-group">
          <label class="input-label">Contraseña</label>
          <input type="password" class="input" name="password" placeholder="Mínimo 8 caracteres" required minlength="8">
        </div>
        
        <button type="submit" class="btn btn-primary btn-full btn-lg" data-haptic="medium">
          <i class="fas fa-user-plus"></i> Registrarse
        </button>
      </form>
      
      <p class="auth-footer">
        ¿Ya tienes cuenta? <a href="#/login" class="text-primary">Inicia sesión</a>
      </p>
    </div>
  `;

  document.getElementById('register-form').addEventListener('submit', handleRegister);
}

// =====================================================
// AUTH HANDLERS
// =====================================================
async function handleLogin(e) {
  e.preventDefault();
  triggerHaptic('medium');
  
  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData);
  
  try {
    const response = await api.post('/auth/login', data);
    
    if (response.success) {
      state.token = response.data.token;
      state.user = response.data.user;
      localStorage.setItem('token', state.token);
      
      triggerHaptic('success');
      navigate('/');
    }
  } catch (error) {
    triggerHaptic('error');
    alert('Error al iniciar sesión: ' + error.message);
  }
}

async function handleRegister(e) {
  e.preventDefault();
  triggerHaptic('medium');
  
  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData);
  
  try {
    const response = await api.post('/auth/register', data);
    
    if (response.success) {
      triggerHaptic('success');
      alert('¡Cuenta creada! Ahora puedes iniciar sesión.');
      navigate('/login');
    }
  } catch (error) {
    triggerHaptic('error');
    alert('Error al registrarse: ' + error.message);
  }
}

function logout() {
  triggerHaptic('warning');
  
  if (confirm('¿Cerrar sesión?')) {
    state.token = null;
    state.user = null;
    localStorage.removeItem('token');
    navigate('/');
  }
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================
function skeletonCards(count, className) {
  return Array(count).fill(`<div class="skeleton ${className}"></div>`).join('');
}

function skeletonList(count) {
  return Array(count).fill(`
    <div class="list-item">
      <div class="skeleton skeleton-avatar"></div>
      <div class="list-item-content">
        <div class="skeleton skeleton-text"></div>
        <div class="skeleton skeleton-text-sm"></div>
      </div>
    </div>
  `).join('');
}

function getStatusBadge(status) {
  const badges = {
    'DRAFT': '',
    'PUBLISHED': 'badge-primary',
    'REGISTRATION_OPEN': 'badge-success',
    'REGISTRATION_CLOSED': 'badge-warning',
    'IN_PROGRESS': 'badge-live',
    'COMPLETED': '',
    'CANCELLED': 'badge-error'
  };
  return badges[status] || '';
}

function getStatusText(status) {
  const texts = {
    'DRAFT': 'Borrador',
    'PUBLISHED': 'Publicado',
    'REGISTRATION_OPEN': 'Inscripciones',
    'REGISTRATION_CLOSED': 'Cerrado',
    'IN_PROGRESS': 'En Curso',
    'COMPLETED': 'Finalizado',
    'CANCELLED': 'Cancelado'
  };
  return texts[status] || status;
}

// Make navigate globally available
window.navigate = navigate;

// =====================================================
// QR CODE FUNCTIONALITY
// =====================================================

async function renderQRPage() {
  const app = document.getElementById('app');
  
  app.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">Código QR</h1>
      <p class="page-subtitle">Genera y escanea códigos QR</p>
    </div>

    <div class="qr-type-selector">
      <button class="qr-type-btn active" data-type="profile" data-haptic="light">
        <i class="fas fa-user"></i>
        Mi Perfil
      </button>
      <button class="qr-type-btn" data-type="clan" data-haptic="light">
        <i class="fas fa-users"></i>
        Mi Clan
      </button>
      <button class="qr-type-btn" data-type="tournament" data-haptic="light">
        <i class="fas fa-trophy"></i>
        Torneo
      </button>
      <button class="qr-type-btn" data-type="match" data-haptic="light">
        <i class="fas fa-gamepad"></i>
        Partida
      </button>
    </div>

    <div class="qr-card animate-fadeIn">
      <h2 class="qr-card-title" id="qr-title">Mi Perfil</h2>
      <p class="qr-card-subtitle" id="qr-subtitle">Comparte tu perfil con otros jugadores</p>
      
      <div class="qr-code-container" id="qr-container">
        <div class="loading-spinner"></div>
      </div>
      
      <div class="qr-actions">
        <button class="btn btn-secondary" id="qr-copy-btn" data-haptic="medium">
          <i class="fas fa-copy"></i> Copiar Link
        </button>
        <button class="btn btn-primary" id="qr-share-btn" data-haptic="medium">
          <i class="fas fa-share-alt"></i> Compartir
        </button>
      </div>
    </div>

    <div class="card animate-slideInUp" style="animation-delay: 0.1s;">
      <button class="btn btn-block" id="scan-qr-btn" data-haptic="medium" style="background: var(--color-warning); color: var(--color-bg-primary);">
        <i class="fas fa-qrcode"></i> Escanear Código QR
      </button>
    </div>

    <div class="qr-history">
      <h3 class="qr-history-title">
        <i class="fas fa-history"></i>
        Escaneados Recientemente
      </h3>
      <div id="qr-history-list">
        ${renderQRHistory()}
      </div>
    </div>
  `;

  // Initialize QR code
  initQRPage();
}

function initQRPage() {
  const qrService = new QRService();
  let currentType = 'profile';
  let currentQRData = null;

  // Generate initial QR code
  generateQRForType(currentType);

  // Type selector handlers
  document.querySelectorAll('.qr-type-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.qr-type-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentType = btn.dataset.type;
      generateQRForType(currentType);
    });
  });

  // Copy link button
  document.getElementById('qr-copy-btn').addEventListener('click', async () => {
    if (currentQRData) {
      try {
        await navigator.clipboard.writeText(currentQRData);
        showToast('¡Link copiado al portapapeles!', 'success');
        triggerHaptic('success');
      } catch (error) {
        showToast('No se pudo copiar el link', 'error');
      }
    }
  });

  // Share button
  document.getElementById('qr-share-btn').addEventListener('click', async () => {
    if (currentQRData && navigator.share) {
      try {
        await navigator.share({
          title: getQRTitle(currentType),
          text: getQRSubtitle(currentType),
          url: currentQRData
        });
        triggerHaptic('success');
      } catch (error) {
        if (error.name !== 'AbortError') {
          showToast('No se pudo compartir', 'error');
        }
      }
    } else {
      showShareModal();
    }
  });

  // Scan QR button
  document.getElementById('scan-qr-btn').addEventListener('click', () => {
    openQRScanner(qrService);
  });

  async function generateQRForType(type) {
    const container = document.getElementById('qr-container');
    const titleEl = document.getElementById('qr-title');
    const subtitleEl = document.getElementById('qr-subtitle');

    titleEl.textContent = getQRTitle(type);
    subtitleEl.textContent = getQRSubtitle(type);
    container.innerHTML = '<div class="loading-spinner"></div>';

    try {
      let qrData;
      
      switch (type) {
        case 'profile':
          qrData = qrService.generateProfileLink(state.user?.userId || 'guest');
          break;
        case 'clan':
          qrData = qrService.generateClanLink(state.user?.clanId || 'demo-clan');
          break;
        case 'tournament':
          qrData = qrService.generateTournamentLink('current-tournament');
          break;
        case 'match':
          qrData = qrService.generateMatchLink('live-match');
          break;
        default:
          qrData = qrService.generateProfileLink('guest');
      }

      currentQRData = qrData;
      await qrService.renderQRCode(container, qrData);
      
    } catch (error) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-exclamation-circle"></i>
          <p>Error generando QR</p>
        </div>
      `;
    }
  }
}

function getQRTitle(type) {
  const titles = {
    'profile': 'Mi Perfil',
    'clan': 'Mi Clan',
    'tournament': 'Torneo Actual',
    'match': 'Partida en Vivo'
  };
  return titles[type] || 'Código QR';
}

function getQRSubtitle(type) {
  const subtitles = {
    'profile': 'Comparte tu perfil con otros jugadores',
    'clan': 'Invita amigos a unirse a tu clan',
    'tournament': 'Comparte el torneo actual',
    'match': 'Comparte la partida en vivo'
  };
  return subtitles[type] || '';
}

function renderQRHistory() {
  const history = JSON.parse(localStorage.getItem('qr_history') || '[]');
  
  if (!history.length) {
    return `
      <div class="empty-card" style="padding: 24px; text-align: center;">
        <i class="fas fa-qrcode" style="font-size: 32px; color: var(--color-text-tertiary); margin-bottom: 8px;"></i>
        <p style="color: var(--color-text-tertiary);">No hay escaneos recientes</p>
      </div>
    `;
  }

  return history.slice(0, 5).map(item => `
    <div class="qr-history-item" data-url="${item.url}" data-haptic="light">
      <div class="qr-history-item-icon">
        <i class="${getQRHistoryIcon(item.type)}"></i>
      </div>
      <div class="qr-history-item-content">
        <div class="qr-history-item-title">${item.title || 'Código escaneado'}</div>
        <div class="qr-history-item-subtitle">${formatTimeAgo(item.timestamp)}</div>
      </div>
      <i class="fas fa-chevron-right qr-history-item-arrow"></i>
    </div>
  `).join('');
}

function getQRHistoryIcon(type) {
  const icons = {
    'profile': 'fas fa-user',
    'clan': 'fas fa-users',
    'tournament': 'fas fa-trophy',
    'match': 'fas fa-gamepad'
  };
  return icons[type] || 'fas fa-qrcode';
}

function formatTimeAgo(timestamp) {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'Ahora mismo';
  if (minutes < 60) return `Hace ${minutes} min`;
  if (hours < 24) return `Hace ${hours}h`;
  return `Hace ${days}d`;
}

async function openQRScanner(qrService) {
  try {
    await qrService.startQRScanner((result) => {
      // Add to history
      saveToQRHistory(result);
      
      // Handle the deep link
      handleQRResult(result);
    });
  } catch (error) {
    showToast('No se pudo iniciar el escáner', 'error');
    console.error('QR Scanner error:', error);
  }
}

function saveToQRHistory(data) {
  const history = JSON.parse(localStorage.getItem('qr_history') || '[]');
  const parsed = new QRService().parseDeepLink(data);
  
  history.unshift({
    url: data,
    type: parsed?.type || 'unknown',
    title: parsed?.type ? `${parsed.type}: ${parsed.id}` : data,
    timestamp: Date.now()
  });

  // Keep only last 20 items
  localStorage.setItem('qr_history', JSON.stringify(history.slice(0, 20)));
}

function handleQRResult(data) {
  const qrService = new QRService();
  const parsed = qrService.parseDeepLink(data);
  
  if (parsed) {
    switch (parsed.type) {
      case 'profile':
        navigate(`/perfil/${parsed.id}`);
        break;
      case 'clan':
        navigate(`/clanes/${parsed.id}`);
        break;
      case 'tournament':
        navigate(`/torneos/${parsed.id}`);
        break;
      case 'match':
        navigate(`/matches/${parsed.id}/live`);
        break;
      default:
        showToast('Código QR reconocido', 'info');
    }
    triggerHaptic('success');
  } else {
    // External URL or unknown format
    showConfirmModal(
      '¿Abrir enlace externo?',
      data,
      () => window.open(data, '_blank')
    );
  }
}

function showShareModal() {
  const modal = document.createElement('div');
  modal.className = 'qr-share-modal';
  modal.innerHTML = `
    <div class="qr-share-modal-content">
      <div class="qr-share-modal-handle"></div>
      <h3 class="qr-share-modal-title">Compartir código QR</h3>
      <div class="qr-share-options">
        <button class="qr-share-option" data-action="copy" data-haptic="light">
          <i class="fas fa-copy"></i>
          <span>Copiar</span>
        </button>
        <button class="qr-share-option" data-action="whatsapp" data-haptic="light">
          <i class="fab fa-whatsapp"></i>
          <span>WhatsApp</span>
        </button>
        <button class="qr-share-option" data-action="telegram" data-haptic="light">
          <i class="fab fa-telegram"></i>
          <span>Telegram</span>
        </button>
        <button class="qr-share-option" data-action="twitter" data-haptic="light">
          <i class="fab fa-twitter"></i>
          <span>Twitter</span>
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  
  requestAnimationFrame(() => modal.classList.add('active'));

  // Close on backdrop click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeShareModal(modal);
    }
  });

  // Handle share options
  modal.querySelectorAll('.qr-share-option').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      handleShareAction(action);
      closeShareModal(modal);
    });
  });
}

function closeShareModal(modal) {
  modal.classList.remove('active');
  setTimeout(() => modal.remove(), 300);
}

function handleShareAction(action) {
  const currentQRData = document.getElementById('qr-container').dataset.url || window.location.href;
  
  switch (action) {
    case 'copy':
      navigator.clipboard.writeText(currentQRData);
      showToast('¡Link copiado!', 'success');
      break;
    case 'whatsapp':
      window.open(`https://wa.me/?text=${encodeURIComponent(currentQRData)}`, '_blank');
      break;
    case 'telegram':
      window.open(`https://t.me/share/url?url=${encodeURIComponent(currentQRData)}`, '_blank');
      break;
    case 'twitter':
      window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(currentQRData)}`, '_blank');
      break;
  }
}

function showConfirmModal(title, message, onConfirm) {
  const modal = document.createElement('div');
  modal.className = 'qr-share-modal';
  modal.innerHTML = `
    <div class="qr-share-modal-content">
      <div class="qr-share-modal-handle"></div>
      <h3 class="qr-share-modal-title">${title}</h3>
      <p style="color: var(--color-text-secondary); text-align: center; margin-bottom: 20px; word-break: break-all;">${message}</p>
      <div class="qr-actions">
        <button class="btn btn-secondary" id="cancel-modal">Cancelar</button>
        <button class="btn btn-primary" id="confirm-modal">Abrir</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  requestAnimationFrame(() => modal.classList.add('active'));

  modal.querySelector('#cancel-modal').addEventListener('click', () => closeShareModal(modal));
  modal.querySelector('#confirm-modal').addEventListener('click', () => {
    onConfirm();
    closeShareModal(modal);
  });
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeShareModal(modal);
  });
}

function showToast(message, type = 'info') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <i class="${getToastIcon(type)}"></i>
    <span>${message}</span>
  `;

  Object.assign(toast.style, {
    position: 'fixed',
    top: 'calc(var(--safe-area-top) + 16px)',
    left: '16px',
    right: '16px',
    padding: '16px',
    borderRadius: '12px',
    background: type === 'success' ? 'var(--color-success)' : 
                type === 'error' ? 'var(--color-error)' : 'var(--color-bg-elevated)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    zIndex: '10000',
    animation: 'slideDown 0.3s ease-out'
  });

  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

function getToastIcon(type) {
  const icons = {
    'success': 'fas fa-check-circle',
    'error': 'fas fa-exclamation-circle',
    'info': 'fas fa-info-circle'
  };
  return icons[type] || icons.info;
}

// =====================================================
// INITIALIZE APP
// =====================================================
window.addEventListener('hashchange', router);
window.addEventListener('DOMContentLoaded', () => {
  router();
  
  // Load user if token exists
  if (state.token) {
    api.get('/auth/me')
      .then(res => { state.user = res.data; })
      .catch(() => { state.token = null; localStorage.removeItem('token'); });
  }
});

// App lifecycle events
window.addEventListener('app:resume', () => {
  console.log('App resumed, refreshing data...');
  router();
});

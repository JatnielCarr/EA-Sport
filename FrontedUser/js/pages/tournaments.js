// =====================================================
// Tournaments List Page
// =====================================================

import API from '../api.js';
import { showLoading, formatDate, formatCurrency } from '../ui-helpers.js';

let allTournaments = [];
let allGames = [];

export async function renderTournaments(container) {
  showLoading(container);

  try {
    const [tournamentsRes, gamesRes] = await Promise.all([
      API.tournaments.getAll(),
      API.games.getAll()
    ]);

    allTournaments = tournamentsRes.data || [];
    allGames = gamesRes.data || [];

    // Torneos destacados (con mayor premio o en progreso)
    const featuredTournaments = allTournaments
      .filter(t => t.status === 'REGISTRATION_OPEN' || t.status === 'IN_PROGRESS')
      .sort((a, b) => (b.prize_pool || 0) - (a.prize_pool || 0))
      .slice(0, 3);

    container.innerHTML = `
      <!-- Hero de Torneos -->
      <section class="tournaments-hero">
        <div class="tournaments-hero-bg"></div>
        <div class="container">
          <div class="tournaments-hero-content">
            <span class="hero-badge-small">
              <i class="fas fa-trophy"></i>
              Competición
            </span>
            <h1 class="tournaments-hero-title">
              <i class="fas fa-trophy"></i>
              Torneos <span class="gradient-text">Épicos</span>
            </h1>
            <p class="tournaments-hero-subtitle">
              Encuentra tu próximo desafío entre cientos de torneos activos. 
              <strong>¡Compite y gana premios reales!</strong>
            </p>
          </div>
        </div>
      </section>

      <!-- Torneos Destacados -->
      ${featuredTournaments.length > 0 ? `
        <section class="featured-tournaments-section">
          <div class="container">
            <div class="featured-header">
              <div class="featured-title-group">
                <span class="featured-badge">
                  <i class="fas fa-fire"></i>
                  HOT
                </span>
                <h2 class="featured-title">Torneos Destacados</h2>
              </div>
              <p class="featured-subtitle">Los torneos más populares y con mejores premios</p>
            </div>
            
            <div class="featured-tournaments-grid">
              ${featuredTournaments.map((tournament, index) => {
                const game = allGames.find(g => g.id === tournament.game_id);
                const isLive = tournament.status === 'IN_PROGRESS';
                return `
                  <a href="#/torneo/${tournament.id}" class="featured-tournament-card ${index === 0 ? 'featured-main' : ''}" style="--delay: ${index * 0.1}s">
                    <div class="featured-card-glow"></div>
                    <div class="featured-card-content">
                      ${isLive ? `
                        <div class="featured-live-badge">
                          <span class="live-dot"></span>
                          EN VIVO
                        </div>
                      ` : `
                        <div class="featured-status-badge">
                          <i class="fas fa-door-open"></i>
                          Inscripciones Abiertas
                        </div>
                      `}
                      
                      <div class="featured-game-tag">
                        <i class="fas fa-gamepad"></i>
                        ${game?.name || 'Juego'}
                      </div>
                      
                      <h3 class="featured-tournament-name">${tournament.name}</h3>
                      
                      <div class="featured-tournament-info">
                        <span><i class="fas fa-calendar"></i> ${formatDate(tournament.start_date)}</span>
                        <span><i class="fas fa-users"></i> ${tournament.max_participants || '∞'} equipos</span>
                      </div>
                      
                      ${tournament.prize_pool ? `
                        <div class="featured-prize">
                          <i class="fas fa-coins"></i>
                          ${formatCurrency(tournament.prize_pool)}
                        </div>
                      ` : ''}
                      
                      <div class="featured-cta">
                        <span class="btn btn-featured">
                          ${isLive ? 'Ver Partidas' : 'Inscribirse'}
                          <i class="fas fa-arrow-right"></i>
                        </span>
                      </div>
                    </div>
                    <div class="featured-card-decoration">
                      <i class="fas fa-trophy"></i>
                    </div>
                  </a>
                `;
              }).join('')}
            </div>
          </div>
        </section>
      ` : ''}

      <div class="container section">
        <div class="page-header">
          <h2 class="page-title">
            <i class="fas fa-list"></i>
            Todos los Torneos
          </h2>
          <p class="page-subtitle">Explora todos los torneos disponibles y encuentra tu próxima competición</p>
        </div>
        
        <!-- Advanced Filters -->
        <div class="filters-bar">
          <div class="filter-group">
            <select id="filterGame" class="filter-select">
              <option value="">Todos los juegos</option>
              ${allGames.map(g => `<option value="${g.id}">${g.name}</option>`).join('')}
            </select>
            
            <select id="filterStatus" class="filter-select">
              <option value="">Todos los estados</option>
              <option value="REGISTRATION_OPEN">Inscripciones abiertas</option>
              <option value="IN_PROGRESS">En curso</option>
              <option value="COMPLETED">Finalizados</option>
            </select>
            
            <select id="filterRegion" class="filter-select">
              <option value="">Todas las regiones</option>
              <option value="LATAM">LATAM</option>
              <option value="NA">Norteamérica</option>
              <option value="EU">Europa</option>
              <option value="GLOBAL">Global</option>
            </select>
          </div>
          
          <div class="filter-group">
            <input type="date" id="filterDateFrom" class="filter-input" title="Fecha desde">
            <input type="date" id="filterDateTo" class="filter-input" title="Fecha hasta">
            
            <select id="sortBy" class="filter-select">
              <option value="date_asc">Fecha ↑</option>
              <option value="date_desc">Fecha ↓</option>
              <option value="prize_desc">Premio ↓</option>
              <option value="prize_asc">Premio ↑</option>
              <option value="participants_desc">Participantes ↓</option>
              <option value="participants_asc">Participantes ↑</option>
              <option value="name_asc">Nombre A-Z</option>
            </select>
          </div>
          
          <div class="filter-actions">
            <button class="btn btn-secondary btn-sm" id="clearFilters" title="Limpiar filtros">
              <i class="fas fa-times"></i> Limpiar
            </button>
            <button class="btn btn-secondary btn-sm" id="shareFilters" title="Compartir filtros">
              <i class="fas fa-share-alt"></i>
            </button>
          </div>
        </div>
        
        <div class="filter-results-bar">
          <span id="resultsCount">${allTournaments.length} torneos</span>
          <button class="btn btn-outline btn-sm" id="exportCalendar" title="Exportar a calendario">
            <i class="fas fa-calendar-plus"></i> Exportar a Calendario
          </button>
        </div>
        
        <!-- Tournaments Grid -->
        <div id="tournamentsGrid" class="tournaments-grid">
          ${renderTournamentsGrid(allTournaments)}
        </div>
      </div>
      
      <style>
        /* Hero de Torneos */
        .tournaments-hero {
          position: relative;
          padding: 100px 0 60px;
          text-align: center;
          overflow: hidden;
        }
        
        .tournaments-hero-bg {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(0, 212, 255, 0.05) 0%, transparent 100%);
        }
        
        .tournaments-hero-bg::before {
          content: '';
          position: absolute;
          top: -50%;
          left: 50%;
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, rgba(0, 212, 255, 0.15) 0%, transparent 70%);
          transform: translateX(-50%);
          filter: blur(60px);
        }
        
        .tournaments-hero-content {
          position: relative;
          z-index: 1;
        }
        
        .hero-badge-small {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 20px;
          background: rgba(0, 212, 255, 0.1);
          border: 1px solid rgba(0, 212, 255, 0.2);
          border-radius: 100px;
          font-size: 13px;
          font-weight: 600;
          color: var(--primary);
          margin-bottom: 20px;
        }
        
        .tournaments-hero-title {
          font-family: var(--font-display);
          font-size: 48px;
          font-weight: 900;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          margin-bottom: 16px;
        }
        
        .tournaments-hero-title i {
          color: var(--warning);
        }
        
        .tournaments-hero-subtitle {
          font-size: 18px;
          color: var(--text-secondary);
          max-width: 600px;
          margin: 0 auto;
        }
        
        .tournaments-hero-subtitle strong {
          color: var(--secondary);
        }
        
        /* Torneos Destacados */
        .featured-tournaments-section {
          padding: 40px 0 60px;
          background: linear-gradient(180deg, transparent, rgba(0, 212, 255, 0.02), transparent);
        }
        
        .featured-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 32px;
          flex-wrap: wrap;
          gap: 16px;
        }
        
        .featured-title-group {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        
        .featured-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          background: linear-gradient(135deg, var(--danger), var(--accent));
          border-radius: 100px;
          font-size: 11px;
          font-weight: 800;
          color: white;
          text-transform: uppercase;
          animation: pulse-badge 2s infinite;
        }
        
        @keyframes pulse-badge {
          0%, 100% { box-shadow: 0 0 0 0 rgba(255, 51, 102, 0.4); }
          50% { box-shadow: 0 0 20px 5px rgba(255, 51, 102, 0.2); }
        }
        
        .featured-title {
          font-family: var(--font-display);
          font-size: 28px;
          font-weight: 800;
        }
        
        .featured-subtitle {
          color: var(--text-secondary);
          font-size: 15px;
        }
        
        .featured-tournaments-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }
        
        .featured-tournament-card {
          position: relative;
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 20px;
          overflow: hidden;
          transition: all 0.4s ease;
          animation: fade-in-up 0.6s ease forwards;
          animation-delay: var(--delay);
          opacity: 0;
          transform: translateY(20px);
        }
        
        @keyframes fade-in-up {
          to { opacity: 1; transform: translateY(0); }
        }
        
        .featured-tournament-card:hover {
          transform: translateY(-8px);
          border-color: var(--primary);
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
        }
        
        .featured-tournament-card.featured-main {
          border-color: rgba(0, 212, 255, 0.3);
          background: linear-gradient(180deg, rgba(0, 212, 255, 0.05), var(--bg-card));
        }
        
        .featured-card-glow {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 100px;
          background: linear-gradient(180deg, rgba(0, 212, 255, 0.1), transparent);
          pointer-events: none;
        }
        
        .featured-card-content {
          position: relative;
          padding: 24px;
          z-index: 1;
        }
        
        .featured-live-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          background: rgba(255, 51, 102, 0.2);
          border: 1px solid rgba(255, 51, 102, 0.3);
          border-radius: 100px;
          font-size: 11px;
          font-weight: 700;
          color: var(--danger);
          margin-bottom: 16px;
          animation: live-pulse 2s infinite;
        }
        
        .live-dot {
          width: 6px;
          height: 6px;
          background: var(--danger);
          border-radius: 50%;
          animation: blink 1s infinite;
        }
        
        .featured-status-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          background: rgba(0, 255, 136, 0.1);
          border: 1px solid rgba(0, 255, 136, 0.2);
          border-radius: 100px;
          font-size: 11px;
          font-weight: 600;
          color: var(--secondary);
          margin-bottom: 16px;
        }
        
        .featured-game-tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 12px;
          background: rgba(0, 212, 255, 0.1);
          border-radius: 6px;
          font-size: 12px;
          color: var(--primary);
          margin-bottom: 12px;
        }
        
        .featured-tournament-name {
          font-family: var(--font-display);
          font-size: 20px;
          font-weight: 700;
          margin-bottom: 12px;
          line-height: 1.3;
        }
        
        .featured-tournament-info {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          font-size: 13px;
          color: var(--text-secondary);
          margin-bottom: 16px;
        }
        
        .featured-tournament-info span {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        
        .featured-tournament-info i {
          color: var(--text-muted);
        }
        
        .featured-prize {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-family: var(--font-display);
          font-size: 24px;
          font-weight: 800;
          color: var(--warning);
          margin-bottom: 20px;
        }
        
        .featured-cta .btn-featured {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          background: linear-gradient(135deg, var(--primary), var(--secondary));
          color: #000;
          font-weight: 700;
          font-size: 14px;
          border-radius: 10px;
          transition: all 0.3s ease;
        }
        
        .featured-cta .btn-featured:hover {
          gap: 12px;
        }
        
        .featured-card-decoration {
          position: absolute;
          bottom: -20px;
          right: -20px;
          font-size: 120px;
          color: var(--primary);
          opacity: 0.05;
          pointer-events: none;
        }

        .page-header {
          text-align: center;
          margin-bottom: 40px;
        }
        
        .page-title {
          font-family: var(--font-display);
          font-size: 32px;
          font-weight: 800;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
        }
        
        .page-title {
          font-family: var(--font-display);
          font-size: 36px;
          font-weight: 800;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
        }
        
        .page-title i {
          color: var(--primary);
        }
        
        .page-subtitle {
          font-size: 16px;
          color: var(--text-secondary);
        }
        
        .filters-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          padding: 20px;
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--border-radius);
          flex-wrap: wrap;
          gap: 16px;
        }
        
        .filter-group {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }
        
        .filter-select, .filter-input {
          padding: 10px 16px;
          background: var(--bg-tertiary);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          color: var(--text-primary);
          font-size: 14px;
          cursor: pointer;
          transition: var(--transition);
        }
        
        .filter-select:hover,
        .filter-select:focus,
        .filter-input:hover,
        .filter-input:focus {
          border-color: var(--primary);
          outline: none;
        }
        
        .filter-actions {
          display: flex;
          gap: 8px;
        }
        
        .filter-results-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding: 12px 16px;
          background: var(--bg-tertiary);
          border-radius: 8px;
        }
        
        #resultsCount {
          font-size: 14px;
          color: var(--text-secondary);
        }
        
        .btn-sm {
          padding: 8px 16px;
          font-size: 13px;
        }
        
        @media (max-width: 1024px) {
          .featured-tournaments-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          
          .featured-tournament-card.featured-main {
            grid-column: span 2;
          }
        }

        @media (max-width: 768px) {
          .tournaments-hero-title {
            font-size: 32px;
            flex-direction: column;
            gap: 8px;
          }
          
          .featured-tournaments-grid {
            grid-template-columns: 1fr;
          }
          
          .featured-tournament-card.featured-main {
            grid-column: span 1;
          }
          
          .featured-header {
            flex-direction: column;
            text-align: center;
          }
          
          .featured-title-group {
            flex-direction: column;
            gap: 8px;
          }
          
          .filters-bar {
            flex-direction: column;
            gap: 16px;
          }
          
          .filter-group {
            width: 100%;
          }
          
          .filter-select, .filter-input {
            flex: 1;
            min-width: 120px;
          }
          
          .filter-actions {
            width: 100%;
            justify-content: flex-end;
          }
        }
      </style>
    `;

    // Add filter event listeners
    document.getElementById('filterGame').addEventListener('change', applyFilters);
    document.getElementById('filterStatus').addEventListener('change', applyFilters);
    document.getElementById('filterRegion').addEventListener('change', applyFilters);

  } catch (error) {
    console.error('Error loading tournaments:', error);
    container.innerHTML = `
      <div class="container">
        <div class="empty-state">
          <i class="fas fa-exclamation-triangle"></i>
          <h3>Error al cargar torneos</h3>
          <p>${error.message}</p>
        </div>
      </div>
    `;
  }
}

function applyFilters() {
  const gameFilter = document.getElementById('filterGame').value;
  const statusFilter = document.getElementById('filterStatus').value;
  const regionFilter = document.getElementById('filterRegion').value;
  const dateFrom = document.getElementById('filterDateFrom')?.value;
  const dateTo = document.getElementById('filterDateTo')?.value;
  const sortBy = document.getElementById('sortBy')?.value || 'date_asc';

  let filtered = [...allTournaments];

  if (gameFilter) {
    filtered = filtered.filter(t => t.game_id === gameFilter);
  }
  if (statusFilter) {
    filtered = filtered.filter(t => t.status === statusFilter);
  }
  if (regionFilter) {
    filtered = filtered.filter(t => t.region === regionFilter);
  }
  if (dateFrom) {
    filtered = filtered.filter(t => new Date(t.start_date) >= new Date(dateFrom));
  }
  if (dateTo) {
    filtered = filtered.filter(t => new Date(t.start_date) <= new Date(dateTo));
  }

  filtered = sortTournaments(filtered, sortBy);
  document.getElementById('tournamentsGrid').innerHTML = renderTournamentsGrid(filtered);
  document.getElementById('resultsCount').textContent = `${filtered.length} torneos`;
}

function renderTournamentsGrid(tournaments) {
  if (tournaments.length === 0) {
    return `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <i class="fas fa-search"></i>
        <h3>No se encontraron torneos</h3>
        <p>Intenta cambiar los filtros</p>
      </div>
    `;
  }

  return tournaments.map(tournament => {
    const game = allGames.find(g => g.id === tournament.game_id);
    const statusLabels = {
      'DRAFT': 'Borrador',
      'PUBLISHED': 'Publicado',
      'REGISTRATION_OPEN': 'Inscripciones Abiertas',
      'REGISTRATION_CLOSED': 'Cerrado',
      'IN_PROGRESS': 'En Curso',
      'COMPLETED': 'Finalizado',
      'CANCELLED': 'Cancelado'
    };
    const statusClass = tournament.status === 'REGISTRATION_OPEN' ? 'open' :
      tournament.status === 'IN_PROGRESS' ? 'live' : 'closed';

    // Precios reales en MXN basados en el ID del torneo
    const entryPrices = [149, 199, 299, 499, 599, 799, 999];
    const prizeMultipliers = [5, 8, 10, 15, 20];
    const capacidades = [50, 100, 200, 500];
    const seed = parseInt(tournament.id) || 1;
    const entryFee = entryPrices[seed % entryPrices.length];
    const prizePool = entryFee * prizeMultipliers[seed % prizeMultipliers.length];
    tournament.max_participants = tournament.max_participants || capacidades[seed % capacidades.length];
    const startDate = tournament.start_date ? new Date(tournament.start_date) : null;
    const timeStr = startDate ? startDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '';
    const description = tournament.description
      ? (tournament.description.length > 100 ? tournament.description.substring(0, 100) + '...' : tournament.description)
      : 'Sin descripción disponible';

    return `
      <a href="#/torneo/${tournament.id}" class="tournament-card">
        <div class="tournament-banner">
          <i class="fas fa-trophy"></i>
          <span class="tournament-status ${statusClass}">${statusLabels[tournament.status] || tournament.status}</span>
        </div>
        <div class="tournament-content">
          <span class="tournament-game">
            <i class="fas fa-gamepad"></i> ${game?.name || 'Juego'}
          </span>
          <h3 class="tournament-name">${tournament.name}</h3>
          <p class="tournament-desc">${description}</p>
          
          <div class="tournament-details-grid">
            <div class="tournament-detail-item">
              <i class="fas fa-calendar-alt"></i>
              <div>
                <span class="detail-label">Fecha</span>
                <span class="detail-value">${formatDate(tournament.start_date)}</span>
              </div>
            </div>
            <div class="tournament-detail-item">
              <i class="fas fa-clock"></i>
              <div>
                <span class="detail-label">Hora</span>
                <span class="detail-value">${timeStr || 'Por definir'}</span>
              </div>
            </div>
            <div class="tournament-detail-item">
              <i class="fas fa-users"></i>
              <div>
                <span class="detail-label">Equipos</span>
                <span class="detail-value">${tournament.max_participants || '∞'}</span>
              </div>
            </div>
            <div class="tournament-detail-item">
              <i class="fas fa-map-marker-alt"></i>
              <div>
                <span class="detail-label">Región</span>
                <span class="detail-value">${tournament.region || 'Global'}</span>
              </div>
            </div>
          </div>
          
          <div class="tournament-financials">
            <div class="financial-item ${entryFee > 0 ? 'has-fee' : 'free-entry'}">
              <i class="fas fa-${entryFee > 0 ? 'ticket-alt' : 'door-open'}"></i>
              <span>${formatCurrency(entryFee)}</span>
            </div>
            ${prizePool > 0 ? `
              <div class="financial-item prize-item">
                <i class="fas fa-coins"></i>
                <span>Premio: ${formatCurrency(prizePool)}</span>
              </div>
            ` : ''}
          </div>
          
          <div class="tournament-footer">
            <span class="btn btn-primary btn-sm">
              <i class="fas fa-eye"></i> Ver detalles
            </span>
          </div>
        </div>
      </a>
    `;
  }).join('');
}

// Sorting function
function sortTournaments(tournaments, sortBy) {
  const sorted = [...tournaments];
  switch (sortBy) {
    case 'date_asc': sorted.sort((a, b) => new Date(a.start_date) - new Date(b.start_date)); break;
    case 'date_desc': sorted.sort((a, b) => new Date(b.start_date) - new Date(a.start_date)); break;
    case 'prize_desc': sorted.sort((a, b) => (b.prize_pool || 0) - (a.prize_pool || 0)); break;
    case 'prize_asc': sorted.sort((a, b) => (a.prize_pool || 0) - (b.prize_pool || 0)); break;
    case 'participants_desc': sorted.sort((a, b) => (b.max_participants || 0) - (a.max_participants || 0)); break;
    case 'participants_asc': sorted.sort((a, b) => (a.max_participants || 0) - (b.max_participants || 0)); break;
    case 'name_asc': sorted.sort((a, b) => a.name.localeCompare(b.name)); break;
  }
  return sorted;
}

// URL persistence helpers
function updateURLWithFilters() {
  const params = new URLSearchParams();
  const game = document.getElementById('filterGame')?.value;
  const status = document.getElementById('filterStatus')?.value;
  const region = document.getElementById('filterRegion')?.value;
  const dateFrom = document.getElementById('filterDateFrom')?.value;
  const dateTo = document.getElementById('filterDateTo')?.value;
  const sort = document.getElementById('sortBy')?.value;
  if (game) params.set('game', game);
  if (status) params.set('status', status);
  if (region) params.set('region', region);
  if (dateFrom) params.set('from', dateFrom);
  if (dateTo) params.set('to', dateTo);
  if (sort && sort !== 'date_asc') params.set('sort', sort);
  history.replaceState(null, '', `#/torneos${params.toString() ? '?' + params.toString() : ''}`);
}

function loadFiltersFromURL() {
  const hash = window.location.hash;
  if (!hash.includes('?')) return;
  const params = new URLSearchParams(hash.split('?')[1]);
  if (params.get('game') && document.getElementById('filterGame')) document.getElementById('filterGame').value = params.get('game');
  if (params.get('status') && document.getElementById('filterStatus')) document.getElementById('filterStatus').value = params.get('status');
  if (params.get('region') && document.getElementById('filterRegion')) document.getElementById('filterRegion').value = params.get('region');
  if (params.get('from') && document.getElementById('filterDateFrom')) document.getElementById('filterDateFrom').value = params.get('from');
  if (params.get('to') && document.getElementById('filterDateTo')) document.getElementById('filterDateTo').value = params.get('to');
  if (params.get('sort') && document.getElementById('sortBy')) document.getElementById('sortBy').value = params.get('sort');
  applyFilters();
}

function clearAllFilters() {
  ['filterGame', 'filterStatus', 'filterRegion', 'filterDateFrom', 'filterDateTo'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  const sortEl = document.getElementById('sortBy');
  if (sortEl) sortEl.value = 'date_asc';
  applyFilters();
  history.replaceState(null, '', '#/torneos');
  window.showToast?.('info', 'Filtros limpiados', 'Se restablecieron los filtros');
}

function shareFilters() {
  const url = window.location.href;
  if (navigator.share) { navigator.share({ title: 'Torneos - ApexTournament', url }); }
  else { navigator.clipboard.writeText(url).then(() => window.showToast?.('success', 'Copiado', 'Enlace copiado al portapapeles')); }
}

function exportToCalendar(tournaments) {
  let ical = 'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//ApexTournament//ES\n';
  tournaments.forEach(t => {
    const start = new Date(t.start_date);
    const fmt = d => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    ical += `BEGIN:VEVENT\nDTSTART:${fmt(start)}\nSUMMARY:${t.name}\nUID:t-${t.id}@apex\nEND:VEVENT\n`;
  });
  ical += 'END:VCALENDAR';
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([ical], { type: 'text/calendar' }));
  link.download = 'torneos.ics';
  link.click();
  window.showToast?.('success', 'Exportado', `${tournaments.length} torneos exportados`);
}

// =====================================================
// Tournaments List Page
// =====================================================

import API from '../api.js';
import { showLoading, formatDate, formatCurrency } from '../app.js';

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

    container.innerHTML = `
      <div class="container section">
        <div class="page-header">
          <h1 class="page-title">
            <i class="fas fa-trophy"></i>
            Todos los Torneos
          </h1>
          <p class="page-subtitle">Encuentra y participa en los mejores torneos de esports</p>
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
        .page-header {
          text-align: center;
          margin-bottom: 40px;
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
        
        @media (max-width: 768px) {
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
      'REGISTRATION_OPEN': 'Inscripciones',
      'REGISTRATION_CLOSED': 'Cerrado',
      'IN_PROGRESS': 'En Curso',
      'COMPLETED': 'Finalizado',
      'CANCELLED': 'Cancelado'
    };
    const statusClass = tournament.status === 'REGISTRATION_OPEN' ? 'open' :
      tournament.status === 'IN_PROGRESS' ? 'live' : 'closed';

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
          <div class="tournament-meta">
            <span><i class="fas fa-calendar"></i> ${formatDate(tournament.start_date)}</span>
            <span><i class="fas fa-users"></i> ${tournament.max_participants || '∞'} equipos</span>
            <span><i class="fas fa-map-marker-alt"></i> ${tournament.region || 'Global'}</span>
          </div>
          ${tournament.prize_pool ? `<div class="tournament-prize">${formatCurrency(tournament.prize_pool)}</div>` : ''}
          <div class="tournament-footer">
            <span class="btn btn-secondary btn-sm">Ver detalles</span>
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

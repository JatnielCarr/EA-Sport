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
        
        <!-- Filters -->
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
          
          <div class="filter-results">
            <span id="resultsCount">${allTournaments.length} torneos</span>
          </div>
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
          margin-bottom: 32px;
          padding: 20px;
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--border-radius);
        }
        
        .filter-group {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }
        
        .filter-select {
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
        .filter-select:focus {
          border-color: var(--primary);
          outline: none;
        }
        
        .filter-results {
          font-size: 14px;
          color: var(--text-secondary);
        }
        
        @media (max-width: 768px) {
          .filters-bar {
            flex-direction: column;
            gap: 16px;
          }
          
          .filter-group {
            width: 100%;
          }
          
          .filter-select {
            flex: 1;
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

// =====================================================
// PAGES - Dashboard Page
// =====================================================

import API from '../api.js';
import { showLoading, formatCurrency, showToast } from '../ui.js';

export async function renderDashboard(container) {
  showLoading(container);

  try {
    // Fetch all data in parallel
    const [usersRes, tournamentsRes, teamsRes, matchesRes, gamesRes] = await Promise.all([
      API.users.getAll(),
      API.tournaments.getAll(),
      API.teams.getAll(),
      API.matches.getAll(),
      API.games.getAll()
    ]);

    const users = usersRes.data || [];
    const tournaments = tournamentsRes.data || [];
    const teams = teamsRes.data || [];
    const matches = matchesRes.data || [];
    const games = gamesRes.data || [];

    // Calculate stats
    const activeTournaments = tournaments.filter(t => 
      ['REGISTRATION_OPEN', 'IN_PROGRESS'].includes(t.status)
    ).length;
    const liveMatches = matches.filter(m => m.status === 'LIVE').length;
    const totalPrizePool = tournaments.reduce((sum, t) => sum + (parseFloat(t.prize_pool) || 0), 0);

    container.innerHTML = `
      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stat-card primary">
          <div class="stat-header">
            <div class="stat-icon">
              <i class="fas fa-users"></i>
            </div>
            <span class="stat-trend up"><i class="fas fa-arrow-up"></i> Activo</span>
          </div>
          <div class="stat-value">${users.length}</div>
          <p class="stat-label">Usuarios Registrados</p>
        </div>

        <div class="stat-card warning">
          <div class="stat-header">
            <div class="stat-icon">
              <i class="fas fa-trophy"></i>
            </div>
            <span class="stat-trend up"><i class="fas fa-play"></i> ${activeTournaments}</span>
          </div>
          <div class="stat-value">${tournaments.length}</div>
          <p class="stat-label">Torneos Totales</p>
        </div>

        <div class="stat-card accent">
          <div class="stat-header">
            <div class="stat-icon">
              <i class="fas fa-users-cog"></i>
            </div>
            <span class="stat-trend up"><i class="fas fa-check"></i> OK</span>
          </div>
          <div class="stat-value">${teams.length}</div>
          <p class="stat-label">Equipos Registrados</p>
        </div>

        <div class="stat-card success">
          <div class="stat-header">
            <div class="stat-icon">
              <i class="fas fa-gamepad"></i>
            </div>
            <span class="stat-trend ${liveMatches > 0 ? 'up' : ''}"><i class="fas fa-broadcast-tower"></i> ${liveMatches}</span>
          </div>
          <div class="stat-value">${matches.length}</div>
          <p class="stat-label">Partidas Totales</p>
        </div>
      </div>

      <div class="stats-grid" style="grid-template-columns: repeat(2, 1fr);">
        <!-- Prize Pool Card -->
        <div class="stat-card warning">
          <div class="stat-header">
            <div class="stat-icon">
              <i class="fas fa-dollar-sign"></i>
            </div>
          </div>
          <div class="stat-value">${formatCurrency(totalPrizePool)}</div>
          <p class="stat-label">Premio Total en Torneos</p>
        </div>

        <!-- Games Card -->
        <div class="stat-card primary">
          <div class="stat-header">
            <div class="stat-icon">
              <i class="fas fa-dice"></i>
            </div>
          </div>
          <div class="stat-value">${games.length}</div>
          <p class="stat-label">Juegos Disponibles</p>
        </div>
      </div>

      <!-- Recent Tournaments -->
      <div class="data-card mt-3 fade-in">
        <div class="card-header">
          <h2 class="card-title">
            <i class="fas fa-trophy"></i>
            Torneos Recientes
          </h2>
          <a href="#/tournaments" class="btn btn-secondary btn-sm">
            Ver todos <i class="fas fa-arrow-right"></i>
          </a>
        </div>
        <div class="card-body">
          <table class="data-table">
            <thead>
              <tr>
                <th>Torneo</th>
                <th>Juego</th>
                <th>Formato</th>
                <th>Estado</th>
                <th>Premio</th>
                <th>Fecha Inicio</th>
              </tr>
            </thead>
            <tbody>
              ${tournaments.slice(0, 5).map(t => `
                <tr>
                  <td>
                    <strong>${t.name}</strong>
                    <br><small class="text-muted">${t.region || ''}</small>
                  </td>
                  <td>${getGameName(games, t.game_id)}</td>
                  <td><span class="badge badge-info">${formatFormat(t.format)}</span></td>
                  <td>${getStatusBadge(t.status)}</td>
                  <td><strong class="text-warning">${formatCurrency(t.prize_pool)}</strong></td>
                  <td>${formatDateShort(t.start_date)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Recent Users -->
      <div class="data-card mt-3 fade-in">
        <div class="card-header">
          <h2 class="card-title">
            <i class="fas fa-users"></i>
            Usuarios Recientes
          </h2>
          <a href="#/users" class="btn btn-secondary btn-sm">
            Ver todos <i class="fas fa-arrow-right"></i>
          </a>
        </div>
        <div class="card-body">
          <table class="data-table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Verificado</th>
                <th>Registro</th>
              </tr>
            </thead>
            <tbody>
              ${users.slice(0, 5).map(u => `
                <tr>
                  <td>
                    <div class="user-cell">
                      <div class="avatar avatar-sm">
                        <i class="fas fa-user"></i>
                      </div>
                      <span class="user-cell-name">${u.username}</span>
                    </div>
                  </td>
                  <td class="text-muted">${u.email}</td>
                  <td>${getRoleBadge(u.role)}</td>
                  <td>
                    ${u.verified 
                      ? '<span class="badge badge-success"><i class="fas fa-check-circle"></i> Sí</span>' 
                      : '<span class="badge badge-warning"><i class="fas fa-clock"></i> No</span>'}
                  </td>
                  <td>${formatDateShort(u.created_at)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="data-card mt-3 fade-in">
        <div class="card-header">
          <h2 class="card-title">
            <i class="fas fa-bolt"></i>
            Acciones Rápidas
          </h2>
        </div>
        <div class="card-body" style="padding: 24px;">
          <div class="d-flex gap-2" style="flex-wrap: wrap;">
            <a href="#/tournaments" class="btn btn-primary">
              <i class="fas fa-plus"></i> Nuevo Torneo
            </a>
            <a href="#/users" class="btn btn-success">
              <i class="fas fa-user-plus"></i> Nuevo Usuario
            </a>
            <a href="#/games" class="btn btn-secondary">
              <i class="fas fa-gamepad"></i> Agregar Juego
            </a>
            <a href="#/teams" class="btn btn-secondary">
              <i class="fas fa-users"></i> Ver Equipos
            </a>
          </div>
        </div>
      </div>
    `;

  } catch (error) {
    console.error('Error loading dashboard:', error);
    container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-exclamation-triangle"></i>
        <h3>Error al cargar el dashboard</h3>
        <p>${error.message}</p>
        <button class="btn btn-primary mt-2" onclick="location.reload()">
          <i class="fas fa-redo"></i> Reintentar
        </button>
      </div>
    `;
  }
}

// Helper functions
function getGameName(games, gameId) {
  const game = games.find(g => g.id === gameId);
  return game ? game.name : 'N/A';
}

function formatFormat(format) {
  const formats = {
    'SINGLE_ELIMINATION': 'Eliminación Simple',
    'DOUBLE_ELIMINATION': 'Doble Eliminación',
    'ROUND_ROBIN': 'Round Robin',
    'SWISS': 'Suizo'
  };
  return formats[format] || format;
}

function getStatusBadge(status) {
  const statusConfig = {
    'DRAFT': { class: 'badge-warning', label: 'Borrador' },
    'PUBLISHED': { class: 'badge-info', label: 'Publicado' },
    'REGISTRATION_OPEN': { class: 'badge-success', label: 'Inscripciones' },
    'REGISTRATION_CLOSED': { class: 'badge-warning', label: 'Cerrado' },
    'IN_PROGRESS': { class: 'badge-primary', label: 'En Progreso' },
    'COMPLETED': { class: 'badge-success', label: 'Completado' },
    'CANCELLED': { class: 'badge-danger', label: 'Cancelado' }
  };
  const config = statusConfig[status] || { class: 'badge-info', label: status };
  return `<span class="badge ${config.class}">${config.label}</span>`;
}

function getRoleBadge(role) {
  const roleConfig = {
    'ADMIN': { class: 'badge-danger', label: 'Admin' },
    'ORGANIZER': { class: 'badge-warning', label: 'Organizador' },
    'USER': { class: 'badge-info', label: 'Usuario' }
  };
  const config = roleConfig[role] || { class: 'badge-info', label: role };
  return `<span class="badge ${config.class}">${config.label}</span>`;
}

function formatDateShort(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

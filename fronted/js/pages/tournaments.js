// =====================================================
// PAGES - Tournaments Management
// =====================================================

import API from '../api.js';
import Auth from '../auth.js';
import { showLoading, showToast, openModal, closeModal, confirmDialog, formatDate, formatCurrency } from '../ui.js';

let allTournaments = [];
let allGames = [];
let allUsers = [];

export async function renderTournaments(container) {
  showLoading(container);

  try {
    const [tournamentsRes, gamesRes, usersRes] = await Promise.all([
      API.tournaments.getAll(),
      API.games.getAll(),
      API.users.getAll()
    ]);

    allTournaments = tournamentsRes.data || [];
    allGames = gamesRes.data || [];
    allUsers = usersRes.data || [];

    // Filter for Clan Leaders
    if (Auth.isClanLeader()) {
      const userId = Auth.getUser().id;
      allTournaments = allTournaments.filter(t => t.organizer_id === userId);
    }

    container.innerHTML = `
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">
            <i class="fas fa-trophy"></i>
            Gestión de Torneos (${allTournaments.length})
          </h2>
          <div class="card-actions">
            <select class="form-control" id="filterStatus" style="width: 180px;">
              <option value="">Todos los estados</option>
              <option value="DRAFT">Borrador</option>
              <option value="PUBLISHED">Publicado</option>
              <option value="REGISTRATION_OPEN">Inscripciones Abiertas</option>
              <option value="IN_PROGRESS">En Progreso</option>
              <option value="COMPLETED">Completado</option>
            </select>
            <button class="btn btn-primary" id="btnNewTournament">
              <i class="fas fa-plus"></i> Nuevo Torneo
            </button>
          </div>
        </div>
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Torneo</th>
                <th>Juego</th>
                <th>Organizador</th>
                <th>Formato</th>
                <th>Estado</th>
                <th>Premio</th>
                <th>Equipos</th>
                <th>Fecha Inicio</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody id="tournamentsTableBody">
              ${renderTournamentsRows(allTournaments)}
            </tbody>
          </table>
        </div>
      </div>
    `;

    // Event Listeners
    document.getElementById('btnNewTournament').addEventListener('click', () => showTournamentForm());
    document.getElementById('filterStatus').addEventListener('change', handleFilter);
    document.getElementById('tournamentsTableBody').addEventListener('click', handleTableActions);

  } catch (error) {
    console.error('Error loading tournaments:', error);
    container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-exclamation-triangle"></i>
        <h3>Error al cargar torneos</h3>
        <p>${error.message}</p>
      </div>
    `;
  }
}

function renderTournamentsRows(tournaments) {
  if (tournaments.length === 0) {
    return `<tr><td colspan="9" class="text-center text-muted">No hay torneos</td></tr>`;
  }

  return tournaments.map(t => {
    let isExclusive = false;
    try {
      if (t.rules_json) {
        const rules = typeof t.rules_json === 'string' ? JSON.parse(t.rules_json) : t.rules_json;
        isExclusive = !!rules.is_exclusive;
      }
    } catch (e) { }

    return `
    <tr data-id="${t.id}">
      <td>
        <strong>${t.name}</strong> ${isExclusive ? '<i class="fas fa-certificate" style="color: #ffd700;" title="Torneo Oficial"></i>' : ''}
        <br><small class="text-muted">${t.slug}</small>
      </td>
      <td>${getGameName(t.game_id)}</td>
      <td>${getOrganizerName(t.organizer_id)}</td>
      <td>${formatFormat(t.format)}</td>
      <td>${getStatusBadge(t.status)}</td>
      <td>${formatCurrency(t.prize_pool)}</td>
      <td>
        <span class="text-muted">0/${t.max_participants}</span>
      </td>
      <td>${formatDateShort(t.start_date)}</td>
      <td>
        <a href="#/tournaments/${t.id}/bracket" class="btn btn-primary btn-sm btn-icon" title="Ver Bracket">
          <i class="fas fa-sitemap"></i>
        </a>
        <button class="btn btn-secondary btn-sm btn-icon" data-action="view" title="Ver detalles">
          <i class="fas fa-eye"></i>
        </button>
        <button class="btn btn-secondary btn-sm btn-icon" data-action="edit" title="Editar">
          <i class="fas fa-edit"></i>
        </button>
        <button class="btn btn-danger btn-sm btn-icon" data-action="delete" title="Eliminar">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    </tr>
  `}).join('');
}

function getGameName(gameId) {
  const game = allGames.find(g => g.id === gameId);
  return game ? game.name : 'N/A';
}

function getOrganizerName(organizerId) {
  const user = allUsers.find(u => u.id === organizerId);
  return user ? user.username : 'N/A';
}

function formatFormat(format) {
  const formats = {
    'SINGLE_ELIMINATION': 'Elim. Simple',
    'DOUBLE_ELIMINATION': 'Doble Elim.',
    'ROUND_ROBIN': 'Round Robin',
    'SWISS': 'Suizo'
  };
  return formats[format] || format;
}

function getStatusBadge(status) {
  const statusClass = status?.toLowerCase() || 'unknown';
  const labels = {
    'DRAFT': 'Borrador',
    'PUBLISHED': 'Publicado',
    'REGISTRATION_OPEN': 'Inscripciones',
    'REGISTRATION_CLOSED': 'Cerrado',
    'IN_PROGRESS': 'En Progreso',
    'COMPLETED': 'Completado',
    'CANCELLED': 'Cancelado'
  };
  return `<span class="status-badge ${statusClass}">${labels[status] || status}</span>`;
}

function formatDateShort(dateString) {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

function handleFilter(e) {
  const status = e.target.value;
  const filtered = status
    ? allTournaments.filter(t => t.status === status)
    : allTournaments;
  document.getElementById('tournamentsTableBody').innerHTML = renderTournamentsRows(filtered);
}

async function handleTableActions(e) {
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;

  const action = btn.dataset.action;
  const row = btn.closest('tr');
  const tournamentId = row.dataset.id;

  if (action === 'view') {
    const tournament = allTournaments.find(t => t.id === tournamentId);
    showTournamentDetails(tournament);
  } else if (action === 'edit') {
    const tournament = allTournaments.find(t => t.id === tournamentId);
    showTournamentForm(tournament);
  } else if (action === 'delete') {
    if (await confirmDialog('¿Estás seguro de eliminar este torneo?')) {
      try {
        await API.tournaments.delete(tournamentId);
        showToast('success', 'Éxito', 'Torneo eliminado correctamente');
        row.remove();
        allTournaments = allTournaments.filter(t => t.id !== tournamentId);
      } catch (error) {
        showToast('error', 'Error', error.message);
      }
    }
  }
}

function showTournamentDetails(tournament) {
  const game = allGames.find(g => g.id === tournament.game_id);
  const organizer = allUsers.find(u => u.id === tournament.organizer_id);

  const content = `
    <div class="tournament-details">
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Nombre</label>
          <p><strong>${tournament.name}</strong></p>
        </div>
        <div class="form-group">
          <label class="form-label">Estado</label>
          <p>${getStatusBadge(tournament.status)}</p>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Juego</label>
          <p>${game?.name || 'N/A'}</p>
        </div>
        <div class="form-group">
          <label class="form-label">Organizador</label>
          <p>${organizer?.username || 'N/A'}</p>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Formato</label>
          <p>${formatFormat(tournament.format)}</p>
        </div>
        <div class="form-group">
          <label class="form-label">Tamaño de Equipo</label>
          <p>${tournament.team_size} jugadores</p>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Región</label>
          <p>${tournament.region}</p>
        </div>
        <div class="form-group">
          <label class="form-label">Max. Participantes</label>
          <p>${tournament.max_participants} equipos</p>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Cuota de Entrada</label>
          <p>${formatCurrency(tournament.entry_fee)}</p>
        </div>
        <div class="form-group">
          <label class="form-label">Premio Total</label>
          <p><strong>${formatCurrency(tournament.prize_pool)}</strong></p>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Fecha de Inicio</label>
          <p>${formatDate(tournament.start_date)}</p>
        </div>
        <div class="form-group">
          <label class="form-label">Cierre de Inscripciones</label>
          <p>${formatDate(tournament.registration_deadline)}</p>
        </div>
      </div>
      ${tournament.description ? `
        <div class="form-group">
          <label class="form-label">Descripción</label>
          <p>${tournament.description}</p>
        </div>
      ` : ''}
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="window.closeModal()">Cerrar</button>
        <a href="#/tournaments/${tournament.id}/bracket" class="btn btn-primary">
          <i class="fas fa-sitemap"></i> Ver Bracket
        </a>
      </div>
    </div>
  `;

  openModal(`Detalles: ${tournament.name}`, content);
}

function showTournamentForm(tournament = null) {
  const isEdit = !!tournament;
  const title = isEdit ? 'Editar Torneo' : 'Nuevo Torneo';

  const gamesOptions = allGames.map(g =>
    `<option value="${g.id}" ${tournament?.game_id === g.id ? 'selected' : ''}>${g.name}</option>`
  ).join('');

  const organizersOptions = allUsers
    .filter(u => u.role === 'ORGANIZER' || u.role === 'ADMIN')
    .map(u => `<option value="${u.id}" ${tournament?.organizer_id === u.id ? 'selected' : ''}>${u.username}</option>`)
    .join('');

  const isClanLeader = Auth.isClanLeader();
  const currentUserId = Auth.getUser()?.id;

  // If Clan Leader creating new tournament, default to self
  if (isClanLeader && !isEdit) {
    // Logic handled in form render
  }

  const isSuperAdmin = Auth.isSuperAdmin();

  // Parse existing rules_json to check exclusivity
  let isExclusive = false;
  try {
    if (tournament?.rules_json) {
      const rules = typeof tournament.rules_json === 'string' ? JSON.parse(tournament.rules_json) : tournament.rules_json;
      isExclusive = !!rules.is_exclusive;
    }
  } catch (e) { console.warn('Error parsing rules', e); }

  const formHtml = `
    <form id="tournamentForm">
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Nombre *</label>
          <input type="text" class="form-control" name="name" 
                 value="${tournament?.name || ''}" required>
        </div>
        <div class="form-group">
          <label class="form-label">Slug *</label>
          <input type="text" class="form-control" name="slug" 
                 value="${tournament?.slug || ''}" required placeholder="torneo-ejemplo">
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Juego *</label>
          <select class="form-control" name="game_id" required>
            <option value="">Seleccionar juego</option>
            ${gamesOptions}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Organizador *</label>
          ${isClanLeader ?
      `<input type="hidden" name="organizer_id" value="${tournament?.organizer_id || currentUserId}">
             <input type="text" class="form-control" value="${allUsers.find(u => u.id === (tournament?.organizer_id || currentUserId))?.username || 'Yo'}" disabled>`
      :
      `<select class="form-control" name="organizer_id" required>
              <option value="">Seleccionar organizador</option>
              ${organizersOptions}
            </select>`
    }
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Formato *</label>
          <select class="form-control" name="format" required>
            <option value="SINGLE_ELIMINATION" ${tournament?.format === 'SINGLE_ELIMINATION' ? 'selected' : ''}>Eliminación Simple</option>
            <option value="DOUBLE_ELIMINATION" ${tournament?.format === 'DOUBLE_ELIMINATION' ? 'selected' : ''}>Doble Eliminación</option>
            <option value="ROUND_ROBIN" ${tournament?.format === 'ROUND_ROBIN' ? 'selected' : ''}>Round Robin</option>
            <option value="SWISS" ${tournament?.format === 'SWISS' ? 'selected' : ''}>Suizo</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Estado</label>
          <select class="form-control" name="status">
            <option value="DRAFT" ${tournament?.status === 'DRAFT' ? 'selected' : ''}>Borrador</option>
            <option value="PUBLISHED" ${tournament?.status === 'PUBLISHED' ? 'selected' : ''}>Publicado</option>
            <option value="REGISTRATION_OPEN" ${tournament?.status === 'REGISTRATION_OPEN' ? 'selected' : ''}>Inscripciones Abiertas</option>
            <option value="IN_PROGRESS" ${tournament?.status === 'IN_PROGRESS' ? 'selected' : ''}>En Progreso</option>
            <option value="COMPLETED" ${tournament?.status === 'COMPLETED' ? 'selected' : ''}>Completado</option>
           </select>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Tamaño de Equipo *</label>
          <input type="number" class="form-control" name="team_size" 
                 value="${tournament?.team_size || 5}" min="1" max="20" required>
        </div>
        <div class="form-group">
          <label class="form-label">Max. Participantes *</label>
          <input type="number" class="form-control" name="max_participants" 
                 value="${tournament?.max_participants || 16}" min="2" max="128" required>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Región *</label>
          <select class="form-control" name="region" required>
            <option value="NA" ${tournament?.region === 'NA' ? 'selected' : ''}>Norte América</option>
            <option value="EU" ${tournament?.region === 'EU' ? 'selected' : ''}>Europa</option>
            <option value="LATAM" ${tournament?.region === 'LATAM' ? 'selected' : ''}>Latinoamérica</option>
            <option value="GLOBAL" ${tournament?.region === 'GLOBAL' ? 'selected' : ''}>Global</option>
          </select>
        </div>
         <div class="form-group">
            <label class="form-label">Tipo de Torneo</label>
             ${isSuperAdmin ? `
            <div class="custom-control custom-switch" style="margin-top: 10px;">
                <input type="checkbox" class="custom-control-input" id="isExclusive" name="is_exclusive" ${isExclusive ? 'checked' : ''}>
                <label class="custom-control-label" for="isExclusive">
                    <i class="fas fa-star" style="color: gold;"></i> Es Exclusivo (Oficial)
                </label>
            </div>
            ` : `
            <div style="margin-top: 10px; color: var(--text-secondary); font-size: 0.9em;">
                <i class="fas fa-users"></i> Torneo de Comunidad
            </div>
            `}
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Cuota de Entrada (MXN)</label>
          <input type="number" class="form-control" name="entry_fee" 
                 value="${tournament?.entry_fee || 0}" min="0" step="0.01">
          <small class="text-muted">0 para gratuito</small>
        </div>
        <div class="form-group">
          <label class="form-label">Premio Total (MXN)</label>
          <input type="number" class="form-control" name="prize_pool" 
                 value="${tournament?.prize_pool || 0}" min="0" step="0.01">
        </div>
      </div>

      <div class="form-group">
        <div class="row">
             <div class="col-6">
                <label class="form-label">Fecha de Inicio *</label>
                <input type="datetime-local" class="form-control" name="start_date" 
                       value="${tournament?.start_date ? formatForInput(tournament.start_date) : ''}" required>
             </div>
             <div class="col-6">
                <label class="form-label">Cierre de Inscripciones *</label>
                <input type="datetime-local" class="form-control" name="registration_deadline" 
                       value="${tournament?.registration_deadline ? formatForInput(tournament.registration_deadline) : ''}" required>
             </div>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Descripción</label>
        <textarea class="form-control" name="description" rows="3">${tournament?.description || ''}</textarea>
      </div>

      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" onclick="window.closeModal()">Cancelar</button>
        <button type="submit" class="btn btn-primary">
          <i class="fas fa-save"></i> ${isEdit ? 'Actualizar' : 'Crear'}
        </button>
      </div>
    </form>
  `;

  openModal(title, formHtml);

  document.getElementById('tournamentForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    // Check exclusivity manual handling
    const isExclusiveCheck = document.getElementById('isExclusive')?.checked;

    // Preserve existing rules or create new
    let currentRules = {};
    try {
      if (tournament?.rules_json) {
        currentRules = typeof tournament.rules_json === 'string' ? JSON.parse(tournament.rules_json) : tournament.rules_json;
      }
    } catch (e) { }

    data.rules_json = JSON.stringify({
      ...currentRules,
      is_exclusive: !!isExclusiveCheck
    });

    // Convert numeric fields
    data.team_size = parseInt(data.team_size);
    data.max_participants = parseInt(data.max_participants);
    data.entry_fee = parseFloat(data.entry_fee) || 0;
    data.prize_pool = parseFloat(data.prize_pool) || 0;

    // Convert dates to ISO format
    if (data.start_date) {
      data.start_date = new Date(data.start_date).toISOString();
    }
    if (data.registration_deadline) {
      data.registration_deadline = new Date(data.registration_deadline).toISOString();
    }

    try {
      if (isEdit) {
        await API.tournaments.update(tournament.id, data);
        showToast('success', 'Éxito', 'Torneo actualizado correctamente');
      } else {
        await API.tournaments.create(data);
        showToast('success', 'Éxito', 'Torneo creado correctamente');
      }
      closeModal();
      const container = document.getElementById('pageContent');
      renderTournaments(container);
    } catch (error) {
      showToast('error', 'Error', error.message);
    }
  });
}

function formatForInput(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  // Adjust key to local timezone for input
  const localIso = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
  return localIso;
}

window.closeModal = closeModal;

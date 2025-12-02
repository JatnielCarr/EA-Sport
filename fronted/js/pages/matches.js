// =====================================================
// PAGES - Matches Management
// =====================================================

import API from '../api.js';
import { showLoading, showToast, openModal, closeModal, confirmDialog, formatDate } from '../ui.js';

let allMatches = [];
let allTournaments = [];
let allTeams = [];

export async function renderMatches(container) {
  showLoading(container);

  try {
    const [matchesRes, tournamentsRes, teamsRes] = await Promise.all([
      API.matches.getAll(),
      API.tournaments.getAll(),
      API.teams.getAll()
    ]);

    allMatches = matchesRes.data || [];
    allTournaments = tournamentsRes.data || [];
    allTeams = teamsRes.data || [];

    container.innerHTML = `
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">
            <i class="fas fa-gamepad"></i>
            Gestión de Partidas (${allMatches.length})
          </h2>
          <div class="card-actions">
            <select class="form-control" id="filterTournament" style="width: 200px;">
              <option value="">Todos los torneos</option>
              ${allTournaments.map(t => `<option value="${t.id}">${t.name}</option>`).join('')}
            </select>
            <select class="form-control" id="filterStatus" style="width: 150px;">
              <option value="">Todos</option>
              <option value="PENDING">Pendientes</option>
              <option value="SCHEDULED">Programadas</option>
              <option value="IN_PROGRESS">En Curso</option>
              <option value="COMPLETED">Completadas</option>
            </select>
            <button class="btn btn-primary" id="btnNewMatch">
              <i class="fas fa-plus"></i> Nueva Partida
            </button>
          </div>
        </div>
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Partida</th>
                <th>Torneo</th>
                <th>Ronda</th>
                <th>Equipo 1</th>
                <th>vs</th>
                <th>Equipo 2</th>
                <th>Resultado</th>
                <th>Estado</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody id="matchesTableBody">
              ${renderMatchesRows(allMatches)}
            </tbody>
          </table>
        </div>
      </div>
    `;

    // Event Listeners
    document.getElementById('btnNewMatch').addEventListener('click', () => showMatchForm());
    document.getElementById('filterTournament').addEventListener('change', handleFilter);
    document.getElementById('filterStatus').addEventListener('change', handleFilter);
    document.getElementById('matchesTableBody').addEventListener('click', handleTableActions);

  } catch (error) {
    console.error('Error loading matches:', error);
    container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-exclamation-triangle"></i>
        <h3>Error al cargar partidas</h3>
        <p>${error.message}</p>
      </div>
    `;
  }
}

function renderMatchesRows(matches) {
  if (matches.length === 0) {
    return `<tr><td colspan="10" class="text-center text-muted">No hay partidas</td></tr>`;
  }

  return matches.map(m => `
    <tr data-id="${m.id}">
      <td>
        <strong>Match #${m.match_number || m.id.substring(0, 8)}</strong>
      </td>
      <td>${getTournamentName(m.tournament_id)}</td>
      <td>${m.round || '-'}</td>
      <td class="${m.winner_id === m.home_team_id ? 'winner' : ''}">
        ${getTeamName(m.home_team_id)}
      </td>
      <td class="text-center text-muted">VS</td>
      <td class="${m.winner_id === m.away_team_id ? 'winner' : ''}">
        ${getTeamName(m.away_team_id)}
      </td>
      <td class="text-center">
        ${m.status === 'COMPLETED' ? 
          `<span class="score">${m.home_score || 0} - ${m.away_score || 0}</span>` : 
          '-'
        }
      </td>
      <td>${getMatchStatusBadge(m.status)}</td>
      <td>${formatDateShort(m.scheduled_datetime)}</td>
      <td>
        ${m.status !== 'COMPLETED' ? `
          <button class="btn btn-success btn-sm btn-icon" data-action="score" title="Reportar resultado">
            <i class="fas fa-clipboard-check"></i>
          </button>
        ` : ''}
        <button class="btn btn-secondary btn-sm btn-icon" data-action="edit" title="Editar">
          <i class="fas fa-edit"></i>
        </button>
        <button class="btn btn-danger btn-sm btn-icon" data-action="delete" title="Eliminar">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    </tr>
  `).join('');
}

function getTournamentName(tournamentId) {
  const tournament = allTournaments.find(t => t.id === tournamentId);
  return tournament ? tournament.name : 'N/A';
}

function getTeamName(teamId) {
  const team = allTeams.find(t => t.id === teamId);
  return team ? team.name : 'TBD';
}

function getMatchStatusBadge(status) {
  const labels = {
    'PENDING': 'Pendiente',
    'SCHEDULED': 'Programada',
    'IN_PROGRESS': 'En Curso',
    'COMPLETED': 'Completada',
    'CANCELLED': 'Cancelada'
  };
  const statusClass = status?.toLowerCase() || 'pending';
  return `<span class="status-badge ${statusClass}">${labels[status] || status}</span>`;
}

function formatDateShort(dateString) {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function handleFilter() {
  const tournamentFilter = document.getElementById('filterTournament').value;
  const statusFilter = document.getElementById('filterStatus').value;
  
  let filtered = [...allMatches];
  
  if (tournamentFilter) {
    filtered = filtered.filter(m => m.tournament_id === tournamentFilter);
  }
  if (statusFilter) {
    filtered = filtered.filter(m => m.status === statusFilter);
  }
  
  document.getElementById('matchesTableBody').innerHTML = renderMatchesRows(filtered);
}

async function handleTableActions(e) {
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;

  const action = btn.dataset.action;
  const row = btn.closest('tr');
  const matchId = row.dataset.id;

  if (action === 'score') {
    const match = allMatches.find(m => m.id === matchId);
    showScoreModal(match);
  } else if (action === 'edit') {
    const match = allMatches.find(m => m.id === matchId);
    showMatchForm(match);
  } else if (action === 'delete') {
    if (await confirmDialog('¿Estás seguro de eliminar esta partida?')) {
      try {
        await API.matches.delete(matchId);
        showToast('success', 'Éxito', 'Partida eliminada correctamente');
        row.remove();
        allMatches = allMatches.filter(m => m.id !== matchId);
      } catch (error) {
        showToast('error', 'Error', error.message);
      }
    }
  }
}

function showScoreModal(match) {
  const team1 = allTeams.find(t => t.id === match.home_team_id);
  const team2 = allTeams.find(t => t.id === match.away_team_id);

  const content = `
    <form id="scoreForm">
      <div class="score-input">
        <div class="team-score">
          <label class="form-label">${team1?.name || 'Equipo Local'}</label>bel>
          <input type="number" class="form-control score-field" name="home_score" 
                 value="${match.home_score || 0}" min="0" required>
        </div>
        <div class="vs-separator">VS</div>
        <div class="team-score">
          <label class="form-label">${team2?.name || 'Equipo Visitante'}</label>
          <input type="number" class="form-control score-field" name="away_score" 
                 value="${match.away_score || 0}" min="0" required>
        </div>
      </div>

      <div class="form-group" style="margin-top: 20px;">
        <label class="form-label">Ganador</label>
        <select class="form-control" name="winner_id" required>
          <option value="">Seleccionar ganador</option>
          <option value="${match.home_team_id}">${team1?.name || 'Equipo Local'}</option>
          <option value="${match.away_team_id}">${team2?.name || 'Equipo Visitante'}</option>
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">Estado</label>
        <select class="form-control" name="status">
          <option value="COMPLETED" selected>Completada</option>
          <option value="IN_PROGRESS">En Progreso</option>
        </select>
      </div>

      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" onclick="window.closeModal()">Cancelar</button>
        <button type="submit" class="btn btn-success">
          <i class="fas fa-check"></i> Guardar Resultado
        </button>
      </div>
    </form>
    <style>
      .score-input {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 30px;
        padding: 20px 0;
      }
      .team-score {
        text-align: center;
      }
      .score-field {
        font-size: 2rem;
        text-align: center;
        width: 100px;
        padding: 15px;
      }
      .vs-separator {
        font-size: 1.5rem;
        font-weight: bold;
        color: var(--text-secondary);
      }
    </style>
  `;

  openModal('Reportar Resultado', content);

  document.getElementById('scoreForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      home_score: parseInt(formData.get('home_score')),
      away_score: parseInt(formData.get('away_score')),
      winner_id: formData.get('winner_id'),
      status: formData.get('status')
    };

    try {
      await API.matches.update(match.id, data);
      showToast('success', 'Éxito', 'Resultado guardado correctamente');
      closeModal();
      const container = document.getElementById('pageContent');
      renderMatches(container);
    } catch (error) {
      showToast('error', 'Error', error.message);
    }
  });
}

function showMatchForm(match = null) {
  const isEdit = !!match;
  const title = isEdit ? 'Editar Partida' : 'Nueva Partida';

  const tournamentsOptions = allTournaments.map(t => 
    `<option value="${t.id}" ${match?.tournament_id === t.id ? 'selected' : ''}>${t.name}</option>`
  ).join('');

  const teamsOptions = allTeams.map(t => 
    `<option value="${t.id}">${t.name}</option>`
  ).join('');

  const formHtml = `
    <form id="matchForm">
      <div class="form-group">
        <label class="form-label">Torneo *</label>
        <select class="form-control" name="tournament_id" required>
          <option value="">Seleccionar torneo</option>
          ${tournamentsOptions}
        </select>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Equipo Local</label>
          <select class="form-control" name="home_team_id">
            <option value="">Sin asignar</option>
            ${teamsOptions}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Equipo Visitante</label>
          <select class="form-control" name="away_team_id">
            <option value="">Sin asignar</option>
            ${teamsOptions}
          </select>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Ronda *</label>
          <input type="number" class="form-control" name="round" 
                 value="${match?.round || 1}" min="1" required>
        </div>
        <div class="form-group">
          <label class="form-label">Número de Match *</label>
          <input type="number" class="form-control" name="match_number" 
                 value="${match?.match_number || 1}" min="1" required>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Posición en Bracket *</label>
          <input type="number" class="form-control" name="bracket_position" 
                 value="${match?.bracket_position || 1}" min="1" required>
        </div>
        <div class="form-group">
          <label class="form-label">Mejor de (BO)</label>
          <select class="form-control" name="best_of">
            <option value="1" ${match?.best_of === 1 ? 'selected' : ''}>BO1</option>
            <option value="3" ${match?.best_of === 3 ? 'selected' : ''}>BO3</option>
            <option value="5" ${match?.best_of === 5 ? 'selected' : ''}>BO5</option>
          </select>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Estado</label>
          <select class="form-control" name="status">
            <option value="SCHEDULED" ${match?.status === 'SCHEDULED' ? 'selected' : ''}>Programada</option>
            <option value="CHECK_IN" ${match?.status === 'CHECK_IN' ? 'selected' : ''}>Check-in</option>
            <option value="LIVE" ${match?.status === 'LIVE' ? 'selected' : ''}>En Vivo</option>
            <option value="COMPLETED" ${match?.status === 'COMPLETED' ? 'selected' : ''}>Completada</option>
            <option value="CANCELLED" ${match?.status === 'CANCELLED' ? 'selected' : ''}>Cancelada</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Fecha Programada</label>
          <input type="datetime-local" class="form-control" name="scheduled_datetime" 
                 value="${match?.scheduled_datetime ? formatForInput(match.scheduled_datetime) : ''}">
        </div>
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

  // Pre-select teams if editing
  if (isEdit) {
    setTimeout(() => {
      document.querySelector(`select[name="home_team_id"]`).value = match.home_team_id || '';
      document.querySelector(`select[name="away_team_id"]`).value = match.away_team_id || '';
    }, 100);
  }

  document.getElementById('matchForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    
    // Convert numeric fields
    data.round = parseInt(data.round) || 1;
    data.match_number = parseInt(data.match_number) || 1;
    data.bracket_position = parseInt(data.bracket_position) || 1;
    data.best_of = parseInt(data.best_of) || 1;

    // Remove empty optional fields
    if (!data.home_team_id) delete data.home_team_id;
    if (!data.away_team_id) delete data.away_team_id;
    
    // Convert datetime to ISO format if provided
    if (data.scheduled_datetime) {
      data.scheduled_datetime = new Date(data.scheduled_datetime).toISOString();
    } else {
      delete data.scheduled_datetime;
    }

    // Validate teams are different if both provided
    if (data.home_team_id && data.away_team_id && data.home_team_id === data.away_team_id) {
      showToast('error', 'Error', 'Los equipos deben ser diferentes');
      return;
    }

    try {
      if (isEdit) {
        await API.matches.update(match.id, data);
        showToast('success', 'Éxito', 'Partida actualizada correctamente');
      } else {
        await API.matches.create(data);
        showToast('success', 'Éxito', 'Partida creada correctamente');
      }
      closeModal();
      const container = document.getElementById('pageContent');
      renderMatches(container);
    } catch (error) {
      showToast('error', 'Error', error.message);
    }
  });
}

function formatForInput(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toISOString().slice(0, 16);
}

window.closeModal = closeModal;

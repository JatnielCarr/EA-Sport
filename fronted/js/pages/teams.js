// =====================================================
// PAGES - Teams Management
// =====================================================

import API from '../api.js';
import { showLoading, showToast, openModal, closeModal, confirmDialog, formatDate } from '../ui.js';

let allTeams = [];
let allUsers = [];
let allGames = [];

export async function renderTeams(container) {
  showLoading(container);

  try {
    const [teamsRes, usersRes, gamesRes] = await Promise.all([
      API.teams.getAll(),
      API.users.getAll(),
      API.games.getAll()
    ]);

    allTeams = teamsRes.data || [];
    allUsers = usersRes.data || [];
    allGames = gamesRes.data || [];

    container.innerHTML = `
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">
            <i class="fas fa-users"></i>
            Gestión de Equipos (${allTeams.length})
          </h2>
          <div class="card-actions">
            <input type="text" class="form-control" id="searchTeams" 
                   placeholder="Buscar equipos..." style="width: 250px;">
            <button class="btn btn-primary" id="btnNewTeam">
              <i class="fas fa-plus"></i> Nuevo Equipo
            </button>
          </div>
        </div>
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Equipo</th>
                <th>Capitán</th>
                <th>Juego</th>
                <th>Región</th>
                <th>Jugadores</th>
                <th>Rating</th>
                <th>Fecha de Creación</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody id="teamsTableBody">
              ${renderTeamsRows(allTeams)}
            </tbody>
          </table>
        </div>
      </div>
    `;

    // Event Listeners
    document.getElementById('btnNewTeam').addEventListener('click', () => showTeamForm());
    document.getElementById('searchTeams').addEventListener('input', handleSearch);
    document.getElementById('teamsTableBody').addEventListener('click', handleTableActions);

  } catch (error) {
    console.error('Error loading teams:', error);
    container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-exclamation-triangle"></i>
        <h3>Error al cargar equipos</h3>
        <p>${error.message}</p>
      </div>
    `;
  }
}

function renderTeamsRows(teams) {
  if (teams.length === 0) {
    return `<tr><td colspan="8" class="text-center text-muted">No hay equipos</td></tr>`;
  }

  return teams.map(t => `
    <tr data-id="${t.id}">
      <td>
        <div class="team-info">
          ${t.logo_url ? 
            `<img src="${t.logo_url}" alt="${t.name}" class="team-logo">` :
            `<div class="team-logo-placeholder"><i class="fas fa-users"></i></div>`
          }
          <div>
            <strong>${t.name}</strong>
            <br><small class="text-muted">${t.tag}</small>
          </div>
        </div>
      </td>
      <td>${getCaptainName(t.captain_id)}</td>
      <td>${getGameName(t.game_id)}</td>
      <td>${t.region || 'N/A'}</td>
      <td>
        <span class="badge badge-info">${t.players?.length || 0} jugadores</span>
      </td>
      <td>
        <span class="rating">${t.rating || 1500}</span>
      </td>
      <td>${formatDate(t.created_at)}</td>
      <td>
        <button class="btn btn-secondary btn-sm btn-icon" data-action="players" title="Ver jugadores">
          <i class="fas fa-user-friends"></i>
        </button>
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

function getCaptainName(captainId) {
  const user = allUsers.find(u => u.id === captainId);
  return user ? user.username : 'N/A';
}

function getGameName(gameId) {
  const game = allGames.find(g => g.id === gameId);
  return game ? game.name : 'N/A';
}

function handleSearch(e) {
  const query = e.target.value.toLowerCase();
  const filtered = allTeams.filter(t => 
    t.name.toLowerCase().includes(query) ||
    t.tag.toLowerCase().includes(query)
  );
  document.getElementById('teamsTableBody').innerHTML = renderTeamsRows(filtered);
}

async function handleTableActions(e) {
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;

  const action = btn.dataset.action;
  const row = btn.closest('tr');
  const teamId = row.dataset.id;

  if (action === 'players') {
    const team = allTeams.find(t => t.id === teamId);
    showPlayersModal(team);
  } else if (action === 'edit') {
    const team = allTeams.find(t => t.id === teamId);
    showTeamForm(team);
  } else if (action === 'delete') {
    if (await confirmDialog('¿Estás seguro de eliminar este equipo?')) {
      try {
        await API.teams.delete(teamId);
        showToast('success', 'Éxito', 'Equipo eliminado correctamente');
        row.remove();
        allTeams = allTeams.filter(t => t.id !== teamId);
      } catch (error) {
        showToast('error', 'Error', error.message);
      }
    }
  }
}

function showPlayersModal(team) {
  const players = team.players || [];
  
  const content = `
    <div class="players-list">
      ${players.length === 0 ? 
        `<p class="text-muted text-center">No hay jugadores en este equipo</p>` :
        `<table class="data-table">
          <thead>
            <tr>
              <th>Jugador</th>
              <th>Rol</th>
              <th>Unido</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            ${players.map(p => `
              <tr data-player-id="${p.id}">
                <td>${p.user?.username || 'Desconocido'}</td>
                <td><span class="badge badge-secondary">${p.role}</span></td>
                <td>${formatDate(p.joined_at)}</td>
                <td>
                  <button class="btn btn-danger btn-sm" onclick="removePlayerFromTeam('${team.id}', '${p.user_id}')">
                    <i class="fas fa-times"></i>
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>`
      }
      <hr style="border-color: var(--border-color); margin: 20px 0;">
      <h4 style="margin-bottom: 15px;">Añadir Jugador</h4>
      <form id="addPlayerForm" class="form-row" style="align-items: flex-end;">
        <div class="form-group" style="flex: 2;">
          <label class="form-label">Usuario</label>
          <select class="form-control" name="user_id" required>
            <option value="">Seleccionar usuario</option>
            ${allUsers.filter(u => u.role === 'PLAYER').map(u => 
              `<option value="${u.id}">${u.username}</option>`
            ).join('')}
          </select>
        </div>
        <div class="form-group" style="flex: 1;">
          <label class="form-label">Rol</label>
          <input type="text" class="form-control" name="role" placeholder="Top, Mid, etc.">
        </div>
        <div class="form-group" style="flex: 0;">
          <button type="submit" class="btn btn-primary">
            <i class="fas fa-plus"></i> Añadir
          </button>
        </div>
      </form>
      <div class="modal-footer" style="margin-top: 20px;">
        <button class="btn btn-secondary" onclick="window.closeModal()">Cerrar</button>
      </div>
    </div>
  `;

  openModal(`Jugadores: ${team.name}`, content);

  document.getElementById('addPlayerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      team_id: team.id,
      user_id: formData.get('user_id'),
      role: formData.get('role') || 'MEMBER'
    };

    try {
      await API.players.addToTeam(data);
      showToast('success', 'Éxito', 'Jugador añadido al equipo');
      closeModal();
      const container = document.getElementById('pageContent');
      renderTeams(container);
    } catch (error) {
      showToast('error', 'Error', error.message);
    }
  });
}

window.removePlayerFromTeam = async function(teamId, userId) {
  if (await confirmDialog('¿Eliminar este jugador del equipo?')) {
    try {
      await API.players.removeFromTeam(teamId, userId);
      showToast('success', 'Éxito', 'Jugador eliminado del equipo');
      closeModal();
      const container = document.getElementById('pageContent');
      renderTeams(container);
    } catch (error) {
      showToast('error', 'Error', error.message);
    }
  }
};

function showTeamForm(team = null) {
  const isEdit = !!team;
  const title = isEdit ? 'Editar Equipo' : 'Nuevo Equipo';

  const gamesOptions = allGames.map(g => 
    `<option value="${g.id}" ${team?.game_id === g.id ? 'selected' : ''}>${g.name}</option>`
  ).join('');

  const captainsOptions = allUsers.map(u => 
    `<option value="${u.id}" ${team?.captain_id === u.id ? 'selected' : ''}>${u.username}</option>`
  ).join('');

  const formHtml = `
    <form id="teamForm">
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Nombre del Equipo *</label>
          <input type="text" class="form-control" name="name" 
                 value="${team?.name || ''}" required>
        </div>
        <div class="form-group">
          <label class="form-label">Tag (Abreviación) *</label>
          <input type="text" class="form-control" name="tag" 
                 value="${team?.tag || ''}" required maxlength="5" 
                 placeholder="ABC" style="text-transform: uppercase;">
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
          <label class="form-label">Capitán *</label>
          <select class="form-control" name="captain_id" required>
            <option value="">Seleccionar capitán</option>
            ${captainsOptions}
          </select>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Región</label>
          <select class="form-control" name="region">
            <option value="">Sin especificar</option>
            <option value="NA" ${team?.region === 'NA' ? 'selected' : ''}>Norte América</option>
            <option value="EU" ${team?.region === 'EU' ? 'selected' : ''}>Europa</option>
            <option value="LATAM" ${team?.region === 'LATAM' ? 'selected' : ''}>Latinoamérica</option>
            <option value="ASIA" ${team?.region === 'ASIA' ? 'selected' : ''}>Asia</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Rating Inicial</label>
          <input type="number" class="form-control" name="rating" 
                 value="${team?.rating || 1500}" min="0">
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">URL del Logo</label>
        <input type="url" class="form-control" name="logo_url" 
               value="${team?.logo_url || ''}" placeholder="https://...">
      </div>

      <div class="form-group">
        <label class="form-label">Descripción</label>
        <textarea class="form-control" name="description" rows="3">${team?.description || ''}</textarea>
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

  document.getElementById('teamForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    
    // Convert rating to number
    data.rating = parseInt(data.rating) || 1500;

    try {
      if (isEdit) {
        await API.teams.update(team.id, data);
        showToast('success', 'Éxito', 'Equipo actualizado correctamente');
      } else {
        await API.teams.create(data);
        showToast('success', 'Éxito', 'Equipo creado correctamente');
      }
      closeModal();
      const container = document.getElementById('pageContent');
      renderTeams(container);
    } catch (error) {
      showToast('error', 'Error', error.message);
    }
  });
}

window.closeModal = closeModal;

// =====================================================
// PAGES - Gestión de Equipos (Team Management)
// =====================================================

import { API } from '../api.js';
import { showLoading, showToast, openModal, closeModal, confirmDialog, formatDate } from '../ui.js';

let allTeams = [];
let allTournaments = [];
let allUsers = [];

export async function renderTeams(container) {
    showLoading(container);

    try {
        const [teamRes, tourRes, userRes] = await Promise.all([
            API.teams.getAll(),
            API.tournaments.getAll(),
            API.users.getAll()
        ]);
        allTeams = teamRes.data || [];
        allTournaments = tourRes.data || [];
        allUsers = userRes.data || [];

        container.innerHTML = `
      <div class="card">
        <div class="card-header" style="display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:12px;">
          <h2 class="card-title" style="margin:0; font-size:1.25rem; display:flex; align-items:center; gap:8px;">
            <i class="fas fa-shield-halved" style="color:#6f42c1;"></i>
            Gestión de Equipos
            <span class="badge badge-info" style="font-size:0.75rem; margin-left:4px;">${allTeams.length}</span>
          </h2>
          <div class="card-actions" style="display:flex; flex-wrap:wrap; align-items:center; gap:8px;">
            <select class="form-control" id="tournamentFilter" style="width:200px; font-size:0.85rem; padding:6px 10px;">
              <option value="all">Todos los Torneos</option>
              ${allTournaments.map(t => `<option value="${t.id}">${t.name}</option>`).join('')}
            </select>
            <input type="text" class="form-control" placeholder="🔍 Buscar equipo..."
                   id="searchTeams" style="width:200px; font-size:0.85rem; padding:6px 10px;">
            <button class="btn btn-primary btn-sm" id="btnNewTeam" style="white-space:nowrap;">
              <i class="fas fa-plus"></i> Nuevo Equipo
            </button>
          </div>
        </div>
        <div class="table-container" style="overflow-x:auto;">
          <table class="data-table" style="width:100%;">
            <thead>
              <tr>
                <th style="min-width:160px;">Equipo</th>
                <th style="min-width:60px;">Tag</th>
                <th style="min-width:140px;">Torneo</th>
                <th style="min-width:100px;">Capitán</th>
                <th style="min-width:60px;">Jugadores</th>
                <th style="min-width:90px;">Estado</th>
                <th style="min-width:80px;">Creado</th>
                <th style="min-width:90px;">Acciones</th>
              </tr>
            </thead>
            <tbody id="teamsTableBody">
              ${renderTeamsRows(allTeams)}
            </tbody>
          </table>
        </div>
      </div>
    `;

        document.getElementById('btnNewTeam')?.addEventListener('click', () => showTeamForm());
        document.getElementById('searchTeams')?.addEventListener('input', handleFilter);
        document.getElementById('tournamentFilter')?.addEventListener('change', handleFilter);
        document.getElementById('teamsTableBody')?.addEventListener('click', handleTableActions);

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
        return `<tr><td colspan="8" style="text-align:center; padding:40px; color:var(--text-secondary);">
      <i class="fas fa-inbox" style="font-size:2rem; margin-bottom:8px; display:block; opacity:0.4;"></i>
      No se encontraron equipos
    </td></tr>`;
    }

    return teams.map(team => {
        const teamName = team.name || '(sin nombre)';
        const teamTag = team.tag || '???';
        const tournament = allTournaments.find(t => t.id === team.tournament_id);
        const tournamentName = tournament ? tournament.name : 'N/A';
        const captain = team.captain || allUsers.find(u => u.id === team.captain_id);
        const captainName = captain ? (captain.username || captain.name) : 'N/A';
        const playerCount = Array.isArray(team.players) ? team.players.length : 0;
        const createdDate = team.created_at ? new Date(team.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: '2-digit' }) : 'N/A';

        let statusBadge;
        if (team.disqualified) {
            statusBadge = '<span style="background:#dc3545; color:#fff; font-size:0.7rem; padding:3px 10px; border-radius:20px; font-weight:600;">Descalificado</span>';
        } else if (team.approved) {
            statusBadge = '<span style="background:#198754; color:#fff; font-size:0.7rem; padding:3px 10px; border-radius:20px; font-weight:600;">Aprobado</span>';
        } else {
            statusBadge = '<span style="background:#ffc107; color:#000; font-size:0.7rem; padding:3px 10px; border-radius:20px; font-weight:600;">Pendiente</span>';
        }

        return `
    <tr data-id="${team.id}">
      <td>
        <div style="display:flex; align-items:center; gap:10px;">
          <div style="width:32px; height:32px; border-radius:8px; background:linear-gradient(135deg,#6f42c1,#5a32a3); display:flex; align-items:center; justify-content:center; color:#fff; font-size:0.7rem; flex-shrink:0;">
            <i class="fas fa-shield-halved"></i>
          </div>
          <strong style="font-size:0.85rem;">${teamName}</strong>
        </div>
      </td>
      <td style="font-size:0.8rem; color:var(--text-secondary); font-weight:600;">[${teamTag}]</td>
      <td style="font-size:0.8rem; color:var(--text-secondary);">${tournamentName}</td>
      <td>
        <div style="display:flex; align-items:center; gap:6px;">
          <div style="width:22px; height:22px; border-radius:50%; background:linear-gradient(135deg,#6366f1,#8b5cf6); display:flex; align-items:center; justify-content:center; color:#fff; font-size:0.55rem; flex-shrink:0;">
            <i class="fas fa-user"></i>
          </div>
          <span style="font-size:0.8rem;">${captainName}</span>
        </div>
      </td>
      <td style="font-size:0.85rem; font-weight:700;">${playerCount}</td>
      <td>${statusBadge}</td>
      <td style="font-size:0.8rem; color:var(--text-secondary);">${createdDate}</td>
      <td>
        <div style="display:inline-flex; gap:6px;">
          <button class="btn btn-sm btn-icon" data-action="edit" title="Editar" style="background:rgba(111,66,193,0.15); color:#a78bfa; border:1px solid rgba(111,66,193,0.3); padding:5px 8px; border-radius:6px; cursor:pointer;">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn btn-sm btn-icon" data-action="delete" title="Eliminar" style="background:rgba(220,53,69,0.15); color:#f87171; border:1px solid rgba(220,53,69,0.3); padding:5px 8px; border-radius:6px; cursor:pointer;">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </td>
    </tr>
  `;
    }).join('');
}

function handleFilter() {
    const query = document.getElementById('searchTeams').value.toLowerCase();
    const tournamentFilter = document.getElementById('tournamentFilter').value;

    const filtered = allTeams.filter(team => {
        const matchesSearch = team.name.toLowerCase().includes(query) ||
            team.tag.toLowerCase().includes(query);

        let matchesTournament = true;
        if (tournamentFilter !== 'all') matchesTournament = team.tournament_id === tournamentFilter;

        return matchesSearch && matchesTournament;
    });

    document.getElementById('teamsTableBody').innerHTML = renderTeamsRows(filtered);
}

async function handleTableActions(e) {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;

    const action = btn.dataset.action;
    const row = btn.closest('tr');
    const id = row.dataset.id;

    if (action === 'edit') {
        const team = allTeams.find(t => t.id === id);
        showTeamForm(team);
    } else if (action === 'delete') {
        if (await confirmDialog('¿Estás seguro de eliminar este equipo?')) {
            try {
                await API.teams.delete(id);
                showToast('success', 'Éxito', 'Equipo eliminado correctamente');
                row.remove();
                allTeams = allTeams.filter(t => t.id !== id);
            } catch (error) {
                showToast('error', 'Error', error.message);
            }
        }
    }
}

function showTeamForm(team = null) {
    const isEdit = !!team;
    const title = isEdit ? `✏️ Editar: ${team.name}` : '➕ Nuevo Equipo';

    const tournamentOptions = allTournaments.map(t =>
        `<option value="${t.id}" ${team?.tournament_id === t.id ? 'selected' : ''}>${t.name}</option>`
    ).join('');

    const captainOptions = allUsers.map(u =>
        `<option value="${u.id}" ${team?.captain_id === u.id ? 'selected' : ''}>${u.username}</option>`
    ).join('');

    const formHtml = `
    <form id="teamForm" style="display:flex; flex-direction:column; gap:14px;">
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
        <div class="form-group">
          <label class="form-label" style="font-weight:600; margin-bottom:6px; display:block;">Nombre *</label>
          <input type="text" class="form-control" name="name" value="${team?.name || ''}" required style="padding:8px 12px; font-size:0.9rem;">
        </div>
        <div class="form-group">
          <label class="form-label" style="font-weight:600; margin-bottom:6px; display:block;">Tag *</label>
          <input type="text" class="form-control" name="tag" value="${team?.tag || ''}" required maxlength="5" style="padding:8px 12px; font-size:0.9rem;">
        </div>
      </div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
        <div class="form-group">
          <label class="form-label" style="font-weight:600; margin-bottom:6px; display:block;">Torneo *</label>
          <select class="form-control" name="tournament_id" required style="padding:8px 12px; font-size:0.9rem;">
            <option value="">Seleccionar torneo...</option>
            ${tournamentOptions}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" style="font-weight:600; margin-bottom:6px; display:block;">Capitán *</label>
          <select class="form-control" name="captain_id" required style="padding:8px 12px; font-size:0.9rem;">
            <option value="">Seleccionar capitán...</option>
            ${captainOptions}
          </select>
        </div>
      </div>
      <div class="modal-footer" style="display:flex; justify-content:flex-end; gap:8px; padding-top:8px; border-top:1px solid var(--border-color);">
        <button type="button" class="btn btn-secondary" onclick="window.closeModal()" style="padding:8px 16px;">Cancelar</button>
        <button type="submit" class="btn btn-primary" style="padding:8px 20px;">
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

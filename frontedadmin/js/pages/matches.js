// =====================================================
// PAGES - Gestión de Partidas (Match Management)
// =====================================================

import { API } from '../api.js';
import { showLoading, showToast, openModal, closeModal, confirmDialog, formatDate } from '../ui.js';

let allMatches = [];
let allTournaments = [];
let allTeams = [];

export async function renderMatches(container) {
    showLoading(container);

    try {
        const [matchRes, tourRes, teamRes] = await Promise.all([
            API.matches.getAll(),
            API.tournaments.getAll(),
            API.teams.getAll()
        ]);
        allMatches = matchRes.data || [];
        allTournaments = tourRes.data || [];
        allTeams = teamRes.data || [];

        container.innerHTML = `
      <div class="card">
        <div class="card-header" style="display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:12px;">
          <h2 class="card-title" style="margin:0; font-size:1.25rem; display:flex; align-items:center; gap:8px;">
            <i class="fas fa-crosshairs" style="color:#e83e8c;"></i>
            Gestión de Partidas
            <span class="badge badge-info" style="font-size:0.75rem; margin-left:4px;">${allMatches.length}</span>
          </h2>
          <div class="card-actions" style="display:flex; flex-wrap:wrap; align-items:center; gap:8px;">
            <select class="form-control" id="tournamentFilter" style="width:200px; font-size:0.85rem; padding:6px 10px;">
              <option value="all">Todos los Torneos</option>
              ${allTournaments.map(t => `<option value="${t.id}">${t.name}</option>`).join('')}
            </select>
            <select class="form-control" id="statusFilter" style="width:140px; font-size:0.85rem; padding:6px 10px;">
              <option value="all">Todos</option>
              <option value="SCHEDULED">Programado</option>
              <option value="LIVE">En Vivo</option>
              <option value="COMPLETED">Completado</option>
              <option value="CANCELLED">Cancelado</option>
            </select>
            <input type="text" class="form-control" placeholder="🔍 Buscar partida..."
                   id="searchMatches" style="width:180px; font-size:0.85rem; padding:6px 10px;">
          </div>
        </div>
        <div class="table-container" style="overflow-x:auto;">
          <table class="data-table" style="width:100%;">
            <thead>
              <tr>
                <th style="min-width:140px;">Torneo</th>
                <th style="min-width:60px;">Ronda</th>
                <th style="min-width:120px;">Equipo Local</th>
                <th style="min-width:80px;">Marcador</th>
                <th style="min-width:120px;">Equipo Visitante</th>
                <th style="min-width:90px;">Estado</th>
                <th style="min-width:100px;">Fecha</th>
                <th style="min-width:90px;">Acciones</th>
              </tr>
            </thead>
            <tbody id="matchesTableBody">
              ${renderMatchesRows(allMatches)}
            </tbody>
          </table>
        </div>
      </div>
    `;

        document.getElementById('searchMatches')?.addEventListener('input', handleFilter);
        document.getElementById('statusFilter')?.addEventListener('change', handleFilter);
        document.getElementById('tournamentFilter')?.addEventListener('change', handleFilter);
        document.getElementById('matchesTableBody')?.addEventListener('click', handleTableActions);

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

function getMatchStatusBadge(status) {
    const map = {
        SCHEDULED: { label: 'Programado', color: '#6c757d' },
        CHECK_IN: { label: 'Check-in', color: '#fd7e14' },
        LIVE: { label: '🔴 En Vivo', color: '#dc3545' },
        COMPLETED: { label: 'Completado', color: '#198754' },
        DISPUTED: { label: 'Disputado', color: '#ffc107', textColor: '#000' },
        CANCELLED: { label: 'Cancelado', color: '#6c757d' }
    };
    const info = map[status] || { label: status, color: '#6c757d' };
    const textColor = info.textColor || '#fff';
    return `<span style="background:${info.color}; color:${textColor}; font-size:0.7rem; padding:3px 10px; border-radius:20px; font-weight:600;">${info.label}</span>`;
}

function renderMatchesRows(matches) {
    if (matches.length === 0) {
        return `<tr><td colspan="8" style="text-align:center; padding:40px; color:var(--text-secondary);">
      <i class="fas fa-inbox" style="font-size:2rem; margin-bottom:8px; display:block; opacity:0.4;"></i>
      No se encontraron partidas
    </td></tr>`;
    }

    return matches.map(m => {
        const tournament = allTournaments.find(t => t.id === m.tournament_id);
        const homeTeam = allTeams.find(t => t.id === m.home_team_id);
        const awayTeam = allTeams.find(t => t.id === m.away_team_id);
        const scheduledDate = m.scheduled_datetime
            ? new Date(m.scheduled_datetime).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
            : 'TBD';

        const isLive = m.status === 'LIVE';
        const rowStyle = isLive ? 'background:rgba(220,53,69,0.06); border-left:3px solid #dc3545;' : '';
        const scoreColor = isLive ? '#dc3545' : 'var(--text-primary)';

        return `
    <tr data-id="${m.id}" style="${rowStyle}">
      <td>
        <div style="display:flex; align-items:center; gap:8px;">
          <div style="width:28px; height:28px; border-radius:6px; background:linear-gradient(135deg,#ffd700,#ff6b35); display:flex; align-items:center; justify-content:center; color:#fff; font-size:0.65rem; flex-shrink:0;">
            <i class="fas fa-trophy"></i>
          </div>
          <span style="font-weight:600; font-size:0.82rem;">${tournament?.name || 'N/A'}</span>
        </div>
      </td>
      <td>
        <span style="background:rgba(99,102,241,0.15); color:#818cf8; padding:2px 10px; border-radius:12px; font-size:0.75rem; font-weight:700;">R${m.round}</span>
      </td>
      <td style="font-weight:700; font-size:0.85rem;">${homeTeam?.name || 'TBD'}</td>
      <td>
        <div style="display:flex; align-items:center; gap:6px;">
          <span style="font-size:1.1rem; font-weight:800; color:${scoreColor};">${m.home_score}</span>
          <span style="font-size:0.75rem; color:var(--text-muted); font-weight:600;">VS</span>
          <span style="font-size:1.1rem; font-weight:800; color:${scoreColor};">${m.away_score}</span>
        </div>
      </td>
      <td style="font-weight:700; font-size:0.85rem;">${awayTeam?.name || 'TBD'}</td>
      <td>${getMatchStatusBadge(m.status)}</td>
      <td style="font-size:0.78rem; color:var(--text-secondary);">${scheduledDate}</td>
      <td>
        <div style="display:inline-flex; gap:6px;">
          <button class="btn btn-sm btn-icon" data-action="score" title="Reportar marcador" style="background:rgba(25,135,84,0.15); color:#34d399; border:1px solid rgba(25,135,84,0.3); padding:5px 8px; border-radius:6px; cursor:pointer;">
            <i class="fas fa-flag-checkered"></i>
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
    const query = document.getElementById('searchMatches').value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value;
    const tournamentFilter = document.getElementById('tournamentFilter').value;

    const filtered = allMatches.filter(m => {
        const tournament = allTournaments.find(t => t.id === m.tournament_id);
        const homeTeam = allTeams.find(t => t.id === m.home_team_id);
        const awayTeam = allTeams.find(t => t.id === m.away_team_id);

        const matchesSearch = (tournament?.name || '').toLowerCase().includes(query) ||
            (homeTeam?.name || '').toLowerCase().includes(query) ||
            (awayTeam?.name || '').toLowerCase().includes(query);

        let matchesStatus = true;
        if (statusFilter !== 'all') matchesStatus = m.status === statusFilter;

        let matchesTournament = true;
        if (tournamentFilter !== 'all') matchesTournament = m.tournament_id === tournamentFilter;

        return matchesSearch && matchesStatus && matchesTournament;
    });

    document.getElementById('matchesTableBody').innerHTML = renderMatchesRows(filtered);
}

async function handleTableActions(e) {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;

    const action = btn.dataset.action;
    const row = btn.closest('tr');
    const id = row.dataset.id;

    if (action === 'score') {
        const match = allMatches.find(m => m.id === id);
        showScoreModal(match);
    } else if (action === 'delete') {
        if (await confirmDialog('¿Estás seguro de eliminar esta partida?')) {
            try {
                await API.matches.delete(id);
                showToast('success', 'Éxito', 'Partida eliminada correctamente');
                row.remove();
                allMatches = allMatches.filter(m => m.id !== id);
            } catch (error) {
                showToast('error', 'Error', error.message);
            }
        }
    }
}

function showScoreModal(match) {
    const homeTeam = allTeams.find(t => t.id === match.home_team_id);
    const awayTeam = allTeams.find(t => t.id === match.away_team_id);
    const title = '🏆 Reportar Marcador';

    const formHtml = `
    <form id="scoreForm" style="display:flex; flex-direction:column; gap:16px;">
      <div style="display:flex; align-items:center; justify-content:center; gap:20px; padding:16px; background:rgba(255,255,255,0.05); border-radius:8px;">
        <div style="text-align:center;">
          <div style="font-size:1rem; font-weight:700; margin-bottom:6px;">${homeTeam?.name || 'Local'}</div>
          <input type="number" class="form-control" name="home_score" value="${match.home_score || 0}" min="0"
                 style="width:70px; text-align:center; font-size:1.2rem; font-weight:700; padding:8px;">
        </div>
        <div style="font-size:1.5rem; font-weight:700; color:var(--text-secondary);">VS</div>
        <div style="text-align:center;">
          <div style="font-size:1rem; font-weight:700; margin-bottom:6px;">${awayTeam?.name || 'Visitante'}</div>
          <input type="number" class="form-control" name="away_score" value="${match.away_score || 0}" min="0"
                 style="width:70px; text-align:center; font-size:1.2rem; font-weight:700; padding:8px;">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label" style="font-weight:600; margin-bottom:6px; display:block;">Estado</label>
        <select class="form-control" name="status" style="padding:8px 12px; font-size:0.9rem;">
          <option value="SCHEDULED" ${match.status === 'SCHEDULED' ? 'selected' : ''}>Programado</option>
          <option value="LIVE" ${match.status === 'LIVE' ? 'selected' : ''}>En Vivo</option>
          <option value="COMPLETED" ${match.status === 'COMPLETED' ? 'selected' : ''}>Completado</option>
          <option value="CANCELLED" ${match.status === 'CANCELLED' ? 'selected' : ''}>Cancelado</option>
        </select>
      </div>
      <div class="modal-footer" style="display:flex; justify-content:flex-end; gap:8px; padding-top:8px; border-top:1px solid var(--border-color);">
        <button type="button" class="btn btn-secondary" onclick="window.closeModal()" style="padding:8px 16px;">Cancelar</button>
        <button type="submit" class="btn btn-primary" style="padding:8px 20px;">
          <i class="fas fa-save"></i> Guardar
        </button>
      </div>
    </form>
  `;

    openModal(title, formHtml);

    document.getElementById('scoreForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        data.home_score = parseInt(data.home_score) || 0;
        data.away_score = parseInt(data.away_score) || 0;

        try {
            await API.matches.update(match.id, data);
            showToast('success', 'Éxito', 'Marcador actualizado correctamente');
            closeModal();
            const container = document.getElementById('pageContent');
            renderMatches(container);
        } catch (error) {
            showToast('error', 'Error', error.message);
        }
    });
}

window.closeModal = closeModal;

// =====================================================
// PAGES - Gestión de Torneos (Tournament Management)
// =====================================================

import { API } from '../api.js';
import { showLoading, showToast, openModal, closeModal, confirmDialog, formatDate } from '../ui.js';

let allTournaments = [];
let allGames = [];

export async function renderTournaments(container) {
    showLoading(container);

    try {
        const [tourRes, gameRes] = await Promise.all([
            API.tournaments.getAll(),
            API.games.getAll()
        ]);
        allTournaments = tourRes.data || [];
        allGames = gameRes.data || [];

        container.innerHTML = `
      <div class="card">
        <div class="card-header" style="display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:12px;">
          <h2 class="card-title" style="margin:0; font-size:1.25rem; display:flex; align-items:center; gap:8px;">
            <i class="fas fa-trophy" style="color:#ffd700;"></i>
            Gestión de Torneos
            <span class="badge badge-info" style="font-size:0.75rem; margin-left:4px;">${allTournaments.length}</span>
          </h2>
          <div class="card-actions" style="display:flex; flex-wrap:wrap; align-items:center; gap:8px;">
            <select class="form-control" id="statusFilter" style="width:160px; font-size:0.85rem; padding:6px 10px;">
              <option value="all">Todos los Estados</option>
              <option value="DRAFT">Borrador</option>
              <option value="PUBLISHED">Publicado</option>
              <option value="REGISTRATION_OPEN">Registro Abierto</option>
              <option value="IN_PROGRESS">En Progreso</option>
              <option value="COMPLETED">Completado</option>
              <option value="CANCELLED">Cancelado</option>
            </select>
            <input type="text" class="form-control" placeholder="🔍 Buscar torneo..."
                   id="searchTournaments" style="width:220px; font-size:0.85rem; padding:6px 10px;">
            <button class="btn btn-primary btn-sm" id="btnNewTournament" style="white-space:nowrap;">
              <i class="fas fa-plus"></i> + Nuevo Torneo
            </button>
          </div>
        </div>
        <div class="table-container" style="overflow-x:auto;">
          <table class="data-table" style="width:100%;">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Juego</th>
                <th>Formato</th>
                <th>Estado</th>
                <th>Equipos</th>
                <th>Premio</th>
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

        document.getElementById('btnNewTournament')?.addEventListener('click', () => showTournamentForm());
        document.getElementById('searchTournaments')?.addEventListener('input', handleFilter);
        document.getElementById('statusFilter')?.addEventListener('change', handleFilter);
        document.getElementById('tournamentsTableBody')?.addEventListener('click', handleTableActions);

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

function getStatusBadge(status) {
    const map = {
        DRAFT: { label: 'Borrador', color: '#6c757d' },
        PUBLISHED: { label: 'Publicado', color: '#0d6efd' },
        REGISTRATION_OPEN: { label: 'Registro', color: '#198754' },
        REGISTRATION_CLOSED: { label: 'Reg. Cerrado', color: '#fd7e14' },
        IN_PROGRESS: { label: 'En Progreso', color: '#6f42c1' },
        COMPLETED: { label: 'Completado', color: '#20c997' },
        CANCELLED: { label: 'Cancelado', color: '#dc3545' }
    };
    const info = map[status] || { label: status, color: '#6c757d' };
    return `<span style="background:${info.color}; color:#fff; font-size:0.7rem; padding:3px 10px; border-radius:20px; font-weight:600;">${info.label}</span>`;
}

function getFormatLabel(format) {
    const map = {
        SINGLE_ELIMINATION: 'Eliminación',
        DOUBLE_ELIMINATION: 'Doble Elim.',
        ROUND_ROBIN: 'Round Robin',
        SWISS: 'Swiss'
    };
    return map[format] || format;
}

function renderTournamentsRows(tournaments) {
    if (tournaments.length === 0) {
        return `<tr><td colspan="8" style="text-align:center; padding:40px; color:var(--text-secondary);">
      <i class="fas fa-inbox" style="font-size:2rem; margin-bottom:8px; display:block; opacity:0.4;"></i>
      No se encontraron torneos
    </td></tr>`;
    }

    return tournaments.map(t => {
        const game = allGames.find(g => g.id === t.game_id);
        const gameName = game?.name || 'N/A';
        const prizePool = t.prize_pool ? `$${Number(t.prize_pool).toLocaleString()}` : 'Gratis';
        const startDate = t.start_date ? new Date(t.start_date).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: '2-digit' }) : 'N/A';

        return `
    <tr data-id="${t.id}">
      <td>
        <div style="display:flex; align-items:center; gap:8px;">
          <div style="width:30px; height:30px; border-radius:6px; background:linear-gradient(135deg,#ffd700,#ff6b35); display:flex; align-items:center; justify-content:center; color:#fff; font-size:0.7rem; flex-shrink:0;">
            <i class="fas fa-trophy"></i>
          </div>
          <strong style="font-size:0.82rem;">${t.name}</strong>
        </div>
      </td>
      <td style="font-size:0.82rem; color:var(--text-secondary);">${gameName}</td>
      <td style="font-size:0.82rem; color:var(--text-secondary);">${getFormatLabel(t.format)}</td>
      <td>${getStatusBadge(t.status)}</td>
      <td style="font-size:0.85rem; font-weight:600;">${t.max_participants || '-'}</td>
      <td style="font-size:0.85rem; font-weight:700; color:#20c997;">${prizePool}</td>
      <td style="font-size:0.82rem; color:var(--text-secondary);">${startDate}</td>
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
    const query = document.getElementById('searchTournaments').value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value;

    const filtered = allTournaments.filter(t => {
        const game = allGames.find(g => g.id === t.game_id);
        const matchesSearch = t.name.toLowerCase().includes(query) ||
            (game?.name || '').toLowerCase().includes(query);

        let matchesStatus = true;
        if (statusFilter !== 'all') matchesStatus = t.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    document.getElementById('tournamentsTableBody').innerHTML = renderTournamentsRows(filtered);
}

async function handleTableActions(e) {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;

    const action = btn.dataset.action;
    const row = btn.closest('tr');
    const id = row.dataset.id;

    if (action === 'edit') {
        const tournament = allTournaments.find(t => t.id === id);
        showTournamentForm(tournament);
    } else if (action === 'delete') {
        if (await confirmDialog('¿Estás seguro de eliminar este torneo?')) {
            try {
                await API.tournaments.delete(id);
                showToast('success', 'Éxito', 'Torneo eliminado correctamente');
                row.remove();
                allTournaments = allTournaments.filter(t => t.id !== id);
            } catch (error) {
                showToast('error', 'Error', error.message);
            }
        }
    }
}

function showTournamentForm(tournament = null) {
    const isEdit = !!tournament;
    const title = isEdit ? `✏️ Editar: ${tournament.name}` : '➕ Nuevo Torneo';

    const gameOptions = allGames.map(g =>
        `<option value="${g.id}" ${tournament?.game_id === g.id ? 'selected' : ''}>${g.name}</option>`
    ).join('');

    const formatDate2Input = (d) => d ? new Date(d).toISOString().slice(0, 16) : '';

    const formHtml = `
    <form id="tournamentForm" style="display:flex; flex-direction:column; gap:14px;">
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
        <div class="form-group">
          <label class="form-label" style="font-weight:600; margin-bottom:6px; display:block;">Nombre *</label>
          <input type="text" class="form-control" name="name" value="${tournament?.name || ''}" required style="padding:8px 12px; font-size:0.9rem;">
        </div>
        <div class="form-group">
          <label class="form-label" style="font-weight:600; margin-bottom:6px; display:block;">Slug *</label>
          <input type="text" class="form-control" name="slug" value="${tournament?.slug || ''}" required style="padding:8px 12px; font-size:0.9rem;">
        </div>
      </div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
        <div class="form-group">
          <label class="form-label" style="font-weight:600; margin-bottom:6px; display:block;">Juego *</label>
          <select class="form-control" name="game_id" required style="padding:8px 12px; font-size:0.9rem;">
            <option value="">Seleccionar juego...</option>
            ${gameOptions}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" style="font-weight:600; margin-bottom:6px; display:block;">Formato *</label>
          <select class="form-control" name="format" required style="padding:8px 12px; font-size:0.9rem;">
            <option value="SINGLE_ELIMINATION" ${tournament?.format === 'SINGLE_ELIMINATION' ? 'selected' : ''}>Eliminación Simple</option>
            <option value="DOUBLE_ELIMINATION" ${tournament?.format === 'DOUBLE_ELIMINATION' ? 'selected' : ''}>Doble Eliminación</option>
            <option value="ROUND_ROBIN" ${tournament?.format === 'ROUND_ROBIN' ? 'selected' : ''}>Round Robin</option>
            <option value="SWISS" ${tournament?.format === 'SWISS' ? 'selected' : ''}>Swiss</option>
          </select>
        </div>
      </div>
      <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px;">
        <div class="form-group">
          <label class="form-label" style="font-weight:600; margin-bottom:6px; display:block;">Tamaño Equipo *</label>
          <input type="number" class="form-control" name="team_size" value="${tournament?.team_size || 5}" min="1" required style="padding:8px 12px; font-size:0.9rem;">
        </div>
        <div class="form-group">
          <label class="form-label" style="font-weight:600; margin-bottom:6px; display:block;">Max. Participantes</label>
          <input type="number" class="form-control" name="max_participants" value="${tournament?.max_participants || 16}" min="2" style="padding:8px 12px; font-size:0.9rem;">
        </div>
        <div class="form-group">
          <label class="form-label" style="font-weight:600; margin-bottom:6px; display:block;">Premio ($)</label>
          <input type="number" class="form-control" name="prize_pool" value="${tournament?.prize_pool || 0}" min="0" step="0.01" style="padding:8px 12px; font-size:0.9rem;">
        </div>
      </div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
        <div class="form-group">
          <label class="form-label" style="font-weight:600; margin-bottom:6px; display:block;">Fecha Inicio *</label>
          <input type="datetime-local" class="form-control" name="start_date" value="${formatDate2Input(tournament?.start_date)}" required style="padding:8px 12px; font-size:0.9rem;">
        </div>
        <div class="form-group">
          <label class="form-label" style="font-weight:600; margin-bottom:6px; display:block;">Estado</label>
          <select class="form-control" name="status" style="padding:8px 12px; font-size:0.9rem;">
            <option value="DRAFT" ${tournament?.status === 'DRAFT' ? 'selected' : ''}>Borrador</option>
            <option value="PUBLISHED" ${tournament?.status === 'PUBLISHED' ? 'selected' : ''}>Publicado</option>
            <option value="REGISTRATION_OPEN" ${tournament?.status === 'REGISTRATION_OPEN' ? 'selected' : ''}>Registro Abierto</option>
            <option value="IN_PROGRESS" ${tournament?.status === 'IN_PROGRESS' ? 'selected' : ''}>En Progreso</option>
            <option value="COMPLETED" ${tournament?.status === 'COMPLETED' ? 'selected' : ''}>Completado</option>
            <option value="CANCELLED" ${tournament?.status === 'CANCELLED' ? 'selected' : ''}>Cancelado</option>
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

    document.getElementById('tournamentForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());

        data.team_size = parseInt(data.team_size) || 5;
        data.max_participants = parseInt(data.max_participants) || 16;
        data.prize_pool = parseFloat(data.prize_pool) || 0;

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

window.closeModal = closeModal;

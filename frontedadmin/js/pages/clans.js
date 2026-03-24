// =====================================================
// PAGES - Gestión de Clanes (Clans Management)
// =====================================================

import { API } from '../api.js';
import { showLoading, showToast, openModal, closeModal, confirmDialog, formatDate } from '../ui.js';
import Auth from '../auth.js';

let allClans = [];

export async function renderClans(container) {
  showLoading(container);

  try {
    const token = Auth.getToken();
    const response = await fetch(`${API_BASE()}/clans`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const result = await response.json();
    allClans = result.data || [];

    container.innerHTML = `
      <div class="clans-admin-page">
        <div class="card">
          <div class="card-header" style="display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:12px;">
            <h2 class="card-title" style="margin:0; font-size:1.25rem; display:flex; align-items:center; gap:8px;">
              <i class="fas fa-fort-awesome" style="color:var(--primary);"></i>
              Gestión de Clanes
              <span class="badge badge-info" style="font-size:0.75rem; margin-left:4px;">${allClans.length}</span>
            </h2>
            <div class="card-actions" style="display:flex; flex-wrap:wrap; align-items:center; gap:8px;">
              <select class="form-control" id="accessFilter" style="width:150px; font-size:0.85rem; padding:6px 10px;">
                <option value="all">Todos los tipos</option>
                <option value="OPEN">Abiertos</option>
                <option value="INVITE_ONLY">Solo Invitación</option>
                <option value="CLOSED">Cerrados</option>
              </select>
              <input type="text" class="form-control" placeholder="🔍 Buscar clan..." id="searchClans" style="width:200px; font-size:0.85rem; padding:6px 10px;">
            </div>
          </div>

          <!-- Stats Summary -->
          <div class="clans-stats-bar">
            <div class="clan-stat-item">
              <i class="fas fa-fort-awesome" style="color:var(--primary);"></i>
              <span><strong>${allClans.length}</strong> Total</span>
            </div>
            <div class="clan-stat-item">
              <i class="fas fa-door-open" style="color:#00ff88;"></i>
              <span><strong>${allClans.filter(c => c.access_type === 'OPEN').length}</strong> Abiertos</span>
            </div>
            <div class="clan-stat-item">
              <i class="fas fa-envelope" style="color:#ffb800;"></i>
              <span><strong>${allClans.filter(c => c.access_type === 'INVITE_ONLY').length}</strong> Solo Invitación</span>
            </div>
            <div class="clan-stat-item">
              <i class="fas fa-lock" style="color:#ff3366;"></i>
              <span><strong>${allClans.filter(c => c.access_type === 'CLOSED').length}</strong> Cerrados</span>
            </div>
            <div class="clan-stat-item">
              <i class="fas fa-users" style="color:#8a2be2;"></i>
              <span><strong>${allClans.reduce((sum, c) => sum + (c.members?.length || 0), 0)}</strong> Miembros Total</span>
            </div>
          </div>

          <div class="table-container" style="overflow-x:auto;">
            <table class="data-table" style="width:100%; font-size:0.85rem;">
              <thead>
                <tr>
                  <th>Clan</th>
                  <th>Tag</th>
                  <th>Líder</th>
                  <th style="text-align:center;">Miembros</th>
                  <th style="text-align:center;">Acceso</th>
                  <th>Ubicación</th>
                  <th style="text-align:center;">Creado</th>
                  <th style="text-align:center; width:180px;">Acciones</th>
                </tr>
              </thead>
              <tbody id="clansTableBody">
                ${renderClanRows(allClans)}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <style>
        .clans-admin-page { animation: fadeIn 0.3s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

        .clans-stats-bar {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          padding: 16px 20px;
          background: rgba(0,212,255,0.03);
          border-bottom: 1px solid var(--border-color);
        }
        .clan-stat-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.85rem;
          color: var(--text-secondary);
        }
        .clan-stat-item strong { color: var(--text-primary); }

        .clan-name-cell {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .clan-avatar {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: linear-gradient(135deg, var(--primary), var(--accent));
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 700;
          font-size: 0.8rem;
          flex-shrink: 0;
        }
        .clan-avatar img { width: 100%; height: 100%; object-fit: cover; border-radius: 10px; }

        .access-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 3px 10px;
          border-radius: 6px;
          font-size: 0.72rem;
          font-weight: 600;
        }
        .access-badge.open { background: rgba(0,255,136,0.15); color: #00ff88; }
        .access-badge.invite { background: rgba(255,184,0,0.15); color: #ffb800; }
        .access-badge.closed { background: rgba(255,51,102,0.15); color: #ff3366; }

        .members-bar {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .members-progress {
          width: 50px;
          height: 4px;
          background: rgba(255,255,255,0.1);
          border-radius: 2px;
          overflow: hidden;
        }
        .members-progress-fill {
          height: 100%;
          border-radius: 2px;
          background: linear-gradient(90deg, var(--primary), var(--success));
          transition: width 0.5s;
        }
      </style>
    `;

    // Event listeners
    document.getElementById('accessFilter')?.addEventListener('change', handleFilter);
    document.getElementById('searchClans')?.addEventListener('input', handleFilter);
    document.getElementById('clansTableBody')?.addEventListener('click', handleTableActions);

  } catch (error) {
    console.error('Error loading clans:', error);
    container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-exclamation-triangle"></i>
        <h3>Error al cargar clanes</h3>
        <p>${error.message}</p>
      </div>
    `;
  }
}

function API_BASE() {
  return window.__API_BASE || 'http://localhost:3100';
}

function renderClanRows(clans) {
  if (clans.length === 0) {
    return `<tr><td colspan="8" style="text-align:center; padding:40px; color:var(--text-secondary);">No se encontraron clanes</td></tr>`;
  }

  return clans.map(clan => {
    const memberCount = clan.members?.length || 0;
    const maxMembers = clan.max_members || 50;
    const memberPercent = Math.min((memberCount / maxMembers) * 100, 100);
    const accessInfo = getAccessBadge(clan.access_type);
    const leaderName = clan.leader?.username || 'Desconocido';
    const createdDate = clan.created_at ? new Date(clan.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: '2-digit' }) : '-';

    return `
      <tr data-id="${clan.id}">
        <td>
          <div class="clan-name-cell">
            <div class="clan-avatar">
              ${clan.banner_url ? `<img src="${clan.banner_url}" alt="${clan.name}">` : clan.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div>
              <strong style="font-size:0.88rem;">${clan.name}</strong>
              ${clan.description ? `<br><small style="color:var(--text-muted); font-size:0.75rem;">${clan.description.substring(0, 50)}${clan.description.length > 50 ? '...' : ''}</small>` : ''}
            </div>
          </div>
        </td>
        <td><code style="font-size:0.85rem; color:var(--primary); font-weight:700;">[${clan.tag}]</code></td>
        <td style="font-size:0.83rem;">
          <div style="display:flex; align-items:center; gap:6px;">
            <div style="width:22px; height:22px; border-radius:50%; background:linear-gradient(135deg,var(--primary),var(--secondary)); display:flex; align-items:center; justify-content:center; color:#fff; font-size:0.6rem; font-weight:700;">
              ${leaderName.charAt(0).toUpperCase()}
            </div>
            ${leaderName}
          </div>
        </td>
        <td style="text-align:center;">
          <div class="members-bar">
            <span style="font-weight:600; font-size:0.85rem;">${memberCount}/${maxMembers}</span>
            <div class="members-progress">
              <div class="members-progress-fill" style="width:${memberPercent}%"></div>
            </div>
          </div>
        </td>
        <td style="text-align:center;">${accessInfo}</td>
        <td style="font-size:0.8rem; color:var(--text-secondary);"><i class="fas fa-map-marker-alt"></i> ${clan.location || 'Global'}</td>
        <td style="text-align:center; font-size:0.8rem; color:var(--text-secondary);">${createdDate}</td>
        <td style="text-align:center;">
          <div style="display:flex; justify-content:center; gap:4px;">
            <button class="btn btn-sm btn-icon" data-action="view" title="Ver detalles" style="background:var(--primary); color:#fff; border:none; padding:4px 8px; border-radius:4px; cursor:pointer;">
              <i class="fas fa-eye"></i>
            </button>
            <button class="btn btn-sm btn-icon" data-action="edit" title="Editar" style="background:#ffb800; color:#000; border:none; padding:4px 8px; border-radius:4px; cursor:pointer;">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-sm btn-icon" data-action="delete" title="Eliminar" style="background:#dc3545; color:#fff; border:none; padding:4px 8px; border-radius:4px; cursor:pointer;">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function getAccessBadge(type) {
  const badges = {
    OPEN: '<span class="access-badge open"><i class="fas fa-door-open"></i> Abierto</span>',
    INVITE_ONLY: '<span class="access-badge invite"><i class="fas fa-envelope"></i> Invitación</span>',
    CLOSED: '<span class="access-badge closed"><i class="fas fa-lock"></i> Cerrado</span>'
  };
  return badges[type] || badges.OPEN;
}

function handleFilter() {
  const filter = document.getElementById('accessFilter')?.value || 'all';
  const search = (document.getElementById('searchClans')?.value || '').toLowerCase();

  const filtered = allClans.filter(c => {
    const matchesFilter = filter === 'all' || c.access_type === filter;
    const matchesSearch = !search ||
      c.name?.toLowerCase().includes(search) ||
      c.tag?.toLowerCase().includes(search) ||
      c.leader?.username?.toLowerCase().includes(search) ||
      c.location?.toLowerCase().includes(search);
    return matchesFilter && matchesSearch;
  });

  document.getElementById('clansTableBody').innerHTML = renderClanRows(filtered);
}

async function handleTableActions(e) {
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;

  const action = btn.dataset.action;
  const row = btn.closest('tr');
  const clanId = row?.dataset.id;

  if (action === 'view') {
    showClanDetails(clanId);
  } else if (action === 'edit') {
    const clan = allClans.find(c => c.id === clanId);
    showEditClanModal(clan);
  } else if (action === 'delete') {
    const clan = allClans.find(c => c.id === clanId);
    if (await confirmDialog(`¿Eliminar el clan "${clan?.name}"? Esta acción eliminará todos los miembros y mensajes.`)) {
      try {
        const token = Auth.getToken();
        await fetch(`${API_BASE()}/clans/${clanId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        showToast('success', 'Clan eliminado', `"${clan?.name}" ha sido eliminado`);
        const container = document.getElementById('pageContent');
        renderClans(container);
      } catch (error) {
        showToast('error', 'Error', error.message);
      }
    }
  }
}

async function showClanDetails(clanId) {
  try {
    const token = Auth.getToken();
    const res = await fetch(`${API_BASE()}/clans/${clanId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const result = await res.json();
    const clan = result.data || {};
    const members = clan.members || [];
    const requests = clan.requests || [];
    const pendingRequests = requests.filter(r => r.status === 'PENDING');

    const content = `
      <div style="display:flex; flex-direction:column; gap:16px;">
        <!-- Clan Info -->
        <div style="display:flex; align-items:center; gap:16px; padding:16px; background:rgba(0,212,255,0.05); border-radius:10px; border:1px solid rgba(0,212,255,0.1);">
          <div style="width:56px; height:56px; border-radius:14px; background:linear-gradient(135deg,var(--primary),var(--accent)); display:flex; align-items:center; justify-content:center; color:#fff; font-weight:900; font-size:1.4rem;">
            ${clan.banner_url ? `<img src="${clan.banner_url}" style="width:100%;height:100%;object-fit:cover;border-radius:14px;">` : (clan.name?.charAt(0) || '?')}
          </div>
          <div style="flex:1;">
            <div style="font-size:1.1rem; font-weight:700;">${clan.name} <code style="color:var(--primary);">[${clan.tag}]</code></div>
            <div style="font-size:0.8rem; color:var(--text-secondary);">${clan.description || 'Sin descripción'}</div>
            <div style="font-size:0.75rem; color:var(--text-muted); margin-top:4px;">
              <i class="fas fa-map-marker-alt"></i> ${clan.location || 'Global'} · 
              ${getAccessBadge(clan.access_type)} ·
              Creado: ${clan.created_at ? new Date(clan.created_at).toLocaleDateString('es-MX') : '-'}
            </div>
          </div>
        </div>

        <!-- Members -->
        <div>
          <h4 style="margin-bottom:8px; display:flex; align-items:center; gap:6px;">
            <i class="fas fa-users" style="color:var(--primary);"></i> Miembros (${members.length}/${clan.max_members || 50})
          </h4>
          <div style="max-height:200px; overflow-y:auto;">
            ${members.length > 0 ? members.map(m => `
              <div style="display:flex; align-items:center; justify-content:space-between; padding:8px 12px; border-bottom:1px solid var(--border-color);">
                <div style="display:flex; align-items:center; gap:8px;">
                  <div style="width:26px; height:26px; border-radius:50%; background:var(--bg-tertiary); display:flex; align-items:center; justify-content:center; font-size:0.65rem; font-weight:700;">
                    ${m.user?.username?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <span style="font-size:0.85rem;">${m.user?.username || 'Usuario'}</span>
                </div>
                <span style="font-size:0.72rem; padding:2px 8px; border-radius:4px; background:${m.role === 'LEADER' ? 'rgba(255,215,0,0.2)' : m.role === 'OFFICER' ? 'rgba(0,212,255,0.15)' : 'rgba(255,255,255,0.05)'}; color:${m.role === 'LEADER' ? '#ffd700' : m.role === 'OFFICER' ? 'var(--primary)' : 'var(--text-secondary)'}; font-weight:600;">
                  ${m.role === 'LEADER' ? '👑 Líder' : m.role === 'OFFICER' ? '⭐ Oficial' : 'Miembro'}
                </span>
              </div>
            `).join('') : '<p style="color:var(--text-muted); text-align:center; padding:16px;">Sin miembros</p>'}
          </div>
        </div>

        ${pendingRequests.length > 0 ? `
        <!-- Pending Requests -->
        <div>
          <h4 style="margin-bottom:8px; display:flex; align-items:center; gap:6px;">
            <i class="fas fa-inbox" style="color:#ffb800;"></i> Solicitudes Pendientes (${pendingRequests.length})
          </h4>
          ${pendingRequests.map(r => `
            <div style="display:flex; align-items:center; justify-content:space-between; padding:8px 12px; background:rgba(255,184,0,0.05); border-radius:8px; margin-bottom:6px; border:1px solid rgba(255,184,0,0.15);">
              <div>
                <strong style="font-size:0.85rem;">${r.user?.username || 'Usuario'}</strong>
                <div style="font-size:0.75rem; color:var(--text-secondary);">${r.message?.substring(0, 60) || 'Sin mensaje'}${r.message?.length > 60 ? '...' : ''}</div>
              </div>
              <span style="font-size:0.72rem; color:#ffb800;"><i class="fas fa-clock"></i> Pendiente</span>
            </div>
          `).join('')}
        </div>
        ` : ''}
      </div>
    `;

    openModal(`🏰 ${clan.name}`, content);
  } catch (error) {
    showToast('error', 'Error', 'No se pudo cargar los detalles del clan');
  }
}

function showEditClanModal(clan) {
  if (!clan) return;

  const content = `
    <form id="editClanForm" style="display:flex; flex-direction:column; gap:14px;">
      <div class="form-group">
        <label class="form-label" style="font-weight:600;">Nombre</label>
        <input type="text" class="form-control" name="name" value="${clan.name || ''}" required style="padding:8px 12px;">
      </div>
      <div class="form-group">
        <label class="form-label" style="font-weight:600;">Tag</label>
        <input type="text" class="form-control" name="tag" value="${clan.tag || ''}" required maxlength="5" style="padding:8px 12px;">
      </div>
      <div class="form-group">
        <label class="form-label" style="font-weight:600;">Descripción</label>
        <textarea class="form-control" name="description" rows="3" style="padding:8px 12px; resize:vertical;">${clan.description || ''}</textarea>
      </div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
        <div class="form-group">
          <label class="form-label" style="font-weight:600;">Tipo de Acceso</label>
          <select class="form-control" name="access_type" style="padding:8px 12px;">
            <option value="OPEN" ${clan.access_type === 'OPEN' ? 'selected' : ''}>Abierto</option>
            <option value="INVITE_ONLY" ${clan.access_type === 'INVITE_ONLY' ? 'selected' : ''}>Solo Invitación</option>
            <option value="CLOSED" ${clan.access_type === 'CLOSED' ? 'selected' : ''}>Cerrado</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" style="font-weight:600;">Max Miembros</label>
          <input type="number" class="form-control" name="max_members" value="${clan.max_members || 50}" min="2" max="200" style="padding:8px 12px;">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label" style="font-weight:600;">Ubicación</label>
        <input type="text" class="form-control" name="location" value="${clan.location || ''}" placeholder="Ej: México, LATAM" style="padding:8px 12px;">
      </div>
      <div class="modal-footer" style="display:flex; justify-content:flex-end; gap:8px; padding-top:8px; border-top:1px solid var(--border-color);">
        <button type="button" class="btn btn-secondary" onclick="window.closeModal()" style="padding:8px 16px;">Cancelar</button>
        <button type="submit" class="btn btn-primary" style="padding:8px 20px;">
          <i class="fas fa-save"></i> Guardar
        </button>
      </div>
    </form>
  `;

  openModal(`✏️ Editar: ${clan.name}`, content);

  document.getElementById('editClanForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    data.max_members = parseInt(data.max_members);

    try {
      const token = Auth.getToken();
      await fetch(`${API_BASE()}/clans/${clan.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(data)
      });
      showToast('success', 'Clan actualizado', `"${data.name}" ha sido actualizado`);
      closeModal();
      const container = document.getElementById('pageContent');
      renderClans(container);
    } catch (error) {
      showToast('error', 'Error', error.message);
    }
  });
}

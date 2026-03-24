// =====================================================
// PAGES - Gestión de Jugadores (Users Management)
// =====================================================

import { API } from '../api.js';
import { showLoading, showToast, openModal, closeModal, confirmDialog, formatDate } from '../ui.js';

let allUsers = [];

export async function renderUsers(container) {
  showLoading(container);

  try {
    const response = await API.users.getAll();
    allUsers = response.data || [];

    container.innerHTML = `
      <div class="card">
        <div class="card-header" style="display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:12px;">
          <h2 class="card-title" style="margin:0; font-size:1.25rem; display:flex; align-items:center; gap:8px;">
            <i class="fas fa-users" style="color:var(--primary);"></i>
            Gestión de Jugadores
            <span class="badge badge-info" style="font-size:0.75rem; margin-left:4px;">${allUsers.length}</span>
          </h2>
          <div class="card-actions" style="display:flex; flex-wrap:wrap; align-items:center; gap:8px;">
            <select class="form-control" id="roleFilter" style="width:140px; font-size:0.85rem; padding:6px 10px;">
              <option value="all">Todos los Roles</option>
              <option value="USER">Usuarios</option>
              <option value="ORGANIZER">Organizadores</option>
              <option value="ADMIN">Admins</option>
            </select>
            <select class="form-control" id="statusFilter" style="width:140px; font-size:0.85rem; padding:6px 10px;">
              <option value="all">Todos</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
              <option value="banned">Baneados</option>
            </select>
            <input type="text" class="form-control" placeholder="🔍 Buscar jugador..." 
                   id="searchUsers" style="width:220px; font-size:0.85rem; padding:6px 10px;">
            <button class="btn btn-primary btn-sm" id="btnNewUser" style="white-space:nowrap;">
              <i class="fas fa-plus"></i> Nuevo
            </button>
          </div>
        </div>
        <div class="table-container" style="overflow-x:auto;">
          <table class="data-table" style="width:100%; font-size:0.85rem;">
            <thead>
              <tr>
                <th style="width:90px;">ID</th>
                <th>Jugador</th>
                <th>Email</th>
                <th style="width:110px; text-align:center;">Rol</th>
                <th style="width:110px; text-align:center;">Estado</th>
                <th style="width:120px; text-align:center;">Actividad</th>
                <th style="width:180px; text-align:center;">Acciones</th>
              </tr>
            </thead>
            <tbody id="usersTableBody">
              ${renderUsersRows(allUsers)}
            </tbody>
          </table>
        </div>
      </div>
    `;

    // Event Listeners
    document.getElementById('btnNewUser').addEventListener('click', () => showUserForm());
    document.getElementById('searchUsers').addEventListener('input', handleSortAndFilter);
    document.getElementById('statusFilter').addEventListener('change', handleSortAndFilter);
    document.getElementById('roleFilter').addEventListener('change', handleSortAndFilter);

    // Delegate click events for action buttons
    document.getElementById('usersTableBody').addEventListener('click', handleTableActions);

  } catch (error) {
    console.error('Error loading users:', error);
    container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-exclamation-triangle"></i>
        <h3>Error al cargar jugadores</h3>
        <p>${error.message}</p>
      </div>
    `;
  }
}

function getDaysInactive(dateString) {
  if (!dateString) return 999;
  const lastActive = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - lastActive);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function renderUsersRows(users) {
  if (users.length === 0) {
    return `<tr><td colspan="7" style="text-align:center; padding:30px; color:var(--text-secondary);">No se encontraron jugadores</td></tr>`;
  }

  return users.map(user => {
    const daysInactive = getDaysInactive(user.updated_at);
    const isActive = daysInactive <= 30;
    const isBanned = user.banned === true;

    // Status Badge
    let statusBadge = '';
    if (isBanned) {
      statusBadge = '<span class="badge" style="background:linear-gradient(135deg,#dc3545,#a71d2a); color:#fff; font-size:0.7rem; padding:3px 8px; border-radius:4px;"><i class="fas fa-ban"></i> Baneado</span>';
    } else if (isActive) {
      statusBadge = '<span class="badge badge-success" style="font-size:0.7rem; padding:3px 8px;"><i class="fas fa-check-circle"></i> Activo</span>';
    } else {
      statusBadge = '<span class="badge badge-warning" style="font-size:0.7rem; padding:3px 8px;"><i class="fas fa-clock"></i> Inactivo</span>';
    }

    // Activity Text
    let activityText = '';
    if (daysInactive === 0) activityText = 'Hoy';
    else if (daysInactive === 1) activityText = 'Ayer';
    else if (daysInactive > 365) activityText = '> 1 año';
    else activityText = `${daysInactive}d`;

    let activityColor = '#8b95a5';
    if (daysInactive > 21) activityColor = '#dc3545';
    else if (daysInactive > 14) activityColor = '#ffc107';
    else if (daysInactive <= 3) activityColor = '#28a745';

    // Ban/Unban button
    let banBtn = '';
    if (isBanned) {
      banBtn = `<button class="btn btn-sm btn-icon" data-action="unban" title="Desbanear" style="background:#28a745; color:#fff; border:none; padding:4px 8px; border-radius:4px; cursor:pointer;">
        <i class="fas fa-unlock"></i>
      </button>`;
    } else {
      banBtn = `<button class="btn btn-sm btn-icon" data-action="ban" title="Banear" style="background:#dc3545; color:#fff; border:none; padding:4px 8px; border-radius:4px; cursor:pointer;">
        <i class="fas fa-ban"></i>
      </button>`;
    }

    return `
    <tr data-id="${user.id}" style="${isBanned ? 'opacity:0.7; background:rgba(220,53,69,0.05);' : ''}">
      <td><code style="font-size:0.75rem; color:var(--text-secondary);">${user.id.substring(0, 8)}...</code></td>
      <td>
        <div style="display:flex; align-items:center; gap:8px;">
          <div style="width:30px; height:30px; border-radius:50%; background:linear-gradient(135deg,var(--primary),var(--secondary)); display:flex; align-items:center; justify-content:center; color:#fff; font-weight:700; font-size:0.7rem;">
            ${user.username?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <strong style="font-size:0.85rem;">${user.username}</strong>
        </div>
      </td>
      <td style="font-size:0.8rem; color:var(--text-secondary);">${user.email}</td>
      <td style="text-align:center;">${getRoleBadge(user.role)}</td>
      <td style="text-align:center;">${statusBadge}</td>
      <td style="text-align:center;">
        <span style="color:${activityColor}; font-size:0.8rem;">
          <i class="far fa-clock"></i> ${activityText}
        </span>
      </td>
      <td style="text-align:center;">
        <div style="display:flex; justify-content:center; gap:4px;">
          <button class="btn btn-sm btn-icon" data-action="edit" title="Editar" style="background:var(--primary); color:#fff; border:none; padding:4px 8px; border-radius:4px; cursor:pointer;">
            <i class="fas fa-edit"></i>
          </button>
          ${banBtn}
          <button class="btn btn-sm btn-icon" data-action="delete" title="Eliminar" style="background:#6c757d; color:#fff; border:none; padding:4px 8px; border-radius:4px; cursor:pointer;">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </td>
    </tr>
  `;
  }).join('');
}

function getRoleBadge(role) {
  const styles = {
    ADMIN: 'background:linear-gradient(135deg,#ff6b35,#ff3e00); color:#fff;',
    ORGANIZER: 'background:linear-gradient(135deg,#6f42c1,#5a32a3); color:#fff;',
    USER: 'background:linear-gradient(135deg,#0d6efd,#0b5ed7); color:#fff;'
  };
  const labels = { ADMIN: 'Admin', ORGANIZER: 'Organizador', USER: 'Usuario' };
  const style = styles[role] || styles.USER;
  const label = labels[role] || role;
  return `<span style="${style} font-size:0.7rem; padding:3px 10px; border-radius:4px; font-weight:600;">${label}</span>`;
}

function handleSortAndFilter() {
  const query = document.getElementById('searchUsers').value.toLowerCase();
  const statusFilter = document.getElementById('statusFilter').value;
  const roleFilter = document.getElementById('roleFilter').value;

  const filtered = allUsers.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      user.role.toLowerCase().includes(query);

    const daysInactive = getDaysInactive(user.updated_at);
    const isActive = daysInactive <= 30;
    const isBanned = user.banned === true;

    let matchesStatus = true;
    if (statusFilter === 'active') matchesStatus = isActive && !isBanned;
    if (statusFilter === 'inactive') matchesStatus = !isActive && !isBanned;
    if (statusFilter === 'banned') matchesStatus = isBanned;

    let matchesRole = true;
    if (roleFilter !== 'all') matchesRole = user.role === roleFilter;

    return matchesSearch && matchesStatus && matchesRole;
  });

  document.getElementById('usersTableBody').innerHTML = renderUsersRows(filtered);
}

async function handleTableActions(e) {
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;

  const action = btn.dataset.action;
  const row = btn.closest('tr');
  const userId = row.dataset.id;

  if (action === 'edit') {
    const user = allUsers.find(u => u.id === userId);
    showUserForm(user);
  } else if (action === 'ban') {
    const user = allUsers.find(u => u.id === userId);
    showBanModal(user);
  } else if (action === 'unban') {
    const user = allUsers.find(u => u.id === userId);
    if (await confirmDialog(`¿Desbanear a ${user.username}?`)) {
      try {
        await API.users.unban(userId);
        showToast('success', 'Éxito', `${user.username} ha sido desbaneado`);
        const container = document.getElementById('pageContent');
        renderUsers(container);
      } catch (error) {
        showToast('error', 'Error', error.message);
      }
    }
  } else if (action === 'delete') {
    if (await confirmDialog('¿Estás seguro de eliminar este usuario? Esta acción no se puede deshacer.')) {
      try {
        await API.users.delete(userId);
        showToast('success', 'Éxito', 'Usuario eliminado correctamente');
        row.remove();
        allUsers = allUsers.filter(u => u.id !== userId);
      } catch (error) {
        showToast('error', 'Error', error.message);
      }
    }
  }
}

function showBanModal(user) {
  const title = `🚫 Banear a ${user.username}`;

  const formHtml = `
    <form id="banForm" style="display:flex; flex-direction:column; gap:16px;">
      <div style="display:flex; align-items:center; gap:12px; padding:12px; background:rgba(220,53,69,0.1); border-radius:8px; border:1px solid rgba(220,53,69,0.2);">
        <div style="width:40px; height:40px; border-radius:50%; background:linear-gradient(135deg,#dc3545,#a71d2a); display:flex; align-items:center; justify-content:center; color:#fff; font-weight:700; font-size:1rem;">
          ${user.username?.charAt(0)?.toUpperCase() || '?'}
        </div>
        <div>
          <strong style="font-size:1rem;">${user.username}</strong>
          <div style="font-size:0.8rem; color:var(--text-secondary);">${user.email}</div>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label" style="font-weight:600; margin-bottom:6px; display:block;">
          <i class="fas fa-clock" style="color:#dc3545;"></i> Duración del Ban *
        </label>
        <select class="form-control" name="duration" required style="padding:8px 12px; font-size:0.9rem;">
          <option value="">Seleccionar duración...</option>
          <option value="3d">3 Días</option>
          <option value="7d">7 Días</option>
          <option value="14d">14 Días</option>
          <option value="31d">31 Días</option>
          <option value="permanent">🔒 Permanente</option>
        </select>
      </div>

      <div class="form-group">
        <label class="form-label" style="font-weight:600; margin-bottom:6px; display:block;">
          <i class="fas fa-comment-alt" style="color:#dc3545;"></i> Motivo del Ban *
        </label>
        <textarea class="form-control" name="reason" rows="3" required
                  placeholder="Describe el motivo del ban..." 
                  style="padding:8px 12px; font-size:0.9rem; resize:vertical;"></textarea>
      </div>

      <div style="padding:10px; background:rgba(255,193,7,0.1); border-radius:6px; border:1px solid rgba(255,193,7,0.3); font-size:0.8rem; color:#856404;">
        <i class="fas fa-exclamation-triangle"></i>
        <strong>Aviso:</strong> El jugador no podrá iniciar sesión mientras esté baneado y verá el motivo del ban.
      </div>

      <div class="modal-footer" style="display:flex; justify-content:flex-end; gap:8px; padding-top:8px; border-top:1px solid var(--border-color);">
        <button type="button" class="btn btn-secondary" onclick="window.closeModal()" style="padding:8px 16px;">
          Cancelar
        </button>
        <button type="submit" class="btn" style="background:linear-gradient(135deg,#dc3545,#a71d2a); color:#fff; border:none; padding:8px 20px; cursor:pointer; border-radius:6px; font-weight:600;">
          <i class="fas fa-ban"></i> Confirmar Ban
        </button>
      </div>
    </form>
  `;

  openModal(title, formHtml);

  document.getElementById('banForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    if (!data.duration) {
      showToast('error', 'Error', 'Selecciona una duración');
      return;
    }
    if (!data.reason || data.reason.trim().length < 3) {
      showToast('error', 'Error', 'Ingresa un motivo válido (mínimo 3 caracteres)');
      return;
    }

    try {
      await API.users.ban(user.id, { duration: data.duration, reason: data.reason.trim() });

      const durationLabels = { '3d': '3 días', '7d': '7 días', '14d': '14 días', '31d': '31 días', 'permanent': 'permanentemente' };
      showToast('success', 'Ban Aplicado', `${user.username} ha sido baneado por ${durationLabels[data.duration]}`);

      closeModal();
      const container = document.getElementById('pageContent');
      renderUsers(container);
    } catch (error) {
      showToast('error', 'Error', error.message);
    }
  });
}

function showUserForm(user = null) {
  const isEdit = !!user;
  const title = isEdit ? `✏️ Editar: ${user.username}` : '➕ Nuevo Usuario';

  const formHtml = `
    <form id="userForm" style="display:flex; flex-direction:column; gap:14px;">
      <div class="form-group">
        <label class="form-label" style="font-weight:600; margin-bottom:6px; display:block;">Email *</label>
        <input type="email" class="form-control" name="email" 
               value="${user?.email || ''}" required style="padding:8px 12px; font-size:0.9rem;">
      </div>
      <div class="form-group">
        <label class="form-label" style="font-weight:600; margin-bottom:6px; display:block;">Nombre de Usuario *</label>
        <input type="text" class="form-control" name="username" 
               value="${user?.username || ''}" required style="padding:8px 12px; font-size:0.9rem;">
      </div>
      <div class="form-group">
        <label class="form-label" style="font-weight:600; margin-bottom:6px; display:block;">Rol</label>
        <select class="form-control" name="role" style="padding:8px 12px; font-size:0.9rem;">
          <option value="USER" ${user?.role === 'USER' ? 'selected' : ''}>Usuario</option>
          <option value="ORGANIZER" ${user?.role === 'ORGANIZER' ? 'selected' : ''}>Organizador</option>
          <option value="ADMIN" ${user?.role === 'ADMIN' ? 'selected' : ''}>Administrador</option>
        </select>
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

  document.getElementById('userForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    try {
      if (isEdit) {
        await API.users.update(user.id, data);
        showToast('success', 'Éxito', 'Usuario actualizado correctamente');
      } else {
        data.password = "ApexSports2026!";
        await API.users.create(data);
        showToast('success', 'Éxito', 'Usuario creado correctamente');
      }
      closeModal();
      const container = document.getElementById('pageContent');
      renderUsers(container);
    } catch (error) {
      showToast('error', 'Error', error.message);
    }
  });
}

// Make closeModal available globally for the cancel button
window.closeModal = closeModal;

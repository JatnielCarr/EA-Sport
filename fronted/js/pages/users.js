// =====================================================
// PAGES - Users Management
// =====================================================

import API from '../api.js';
import { showLoading, showToast, openModal, closeModal, confirmDialog, formatDate } from '../ui.js';

let allUsers = [];

export async function renderUsers(container) {
  showLoading(container);

  try {
    const response = await API.users.getAll();
    allUsers = response.data || [];

    container.innerHTML = `
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">
            <i class="fas fa-users"></i>
            Gestión de Usuarios (${allUsers.length})
          </h2>
          <div class="card-actions">
            <select class="form-control" id="statusFilter" style="width: 150px; margin-right: 10px;">
              <option value="all">Todos</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
            </select>
            <input type="text" class="form-control" placeholder="Buscar usuarios..." 
                   id="searchUsers" style="width: 250px;">
            <button class="btn btn-primary" id="btnNewUser">
              <i class="fas fa-plus"></i> Nuevo Usuario
            </button>
          </div>
        </div>
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Usuario</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Actividad</th>
                <th>Acciones</th>
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

    // Delegate click events for action buttons
    document.getElementById('usersTableBody').addEventListener('click', handleTableActions);

  } catch (error) {
    console.error('Error loading users:', error);
    container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-exclamation-triangle"></i>
        <h3>Error al cargar usuarios</h3>
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
    return `<tr><td colspan="7" class="text-center text-muted">No hay usuarios</td></tr>`;
  }

  return users.map(user => {
    // Assuming updated_at is the last activity proxy
    const daysInactive = getDaysInactive(user.updated_at);
    const isActive = daysInactive <= 30;

    // Status Badge
    let statusBadge = '';
    if (isActive) {
      statusBadge = '<span class="badge badge-success"><i class="fas fa-check"></i> Activo</span>';
    } else {
      statusBadge = '<span class="badge badge-warning"><i class="fas fa-exclamation-triangle"></i> Inactivo</span>';
    }

    // Activity Text with intervals
    let activityText = '';
    if (daysInactive === 0) activityText = 'Hoy';
    else if (daysInactive === 1) activityText = 'Ayer';
    else activityText = `Hace ${daysInactive} días`;

    // Color code intervals
    let intervalColor = 'text-muted';
    if (daysInactive > 21) intervalColor = 'text-danger';
    else if (daysInactive > 14) intervalColor = 'text-warning';

    return `
    <tr data-id="${user.id}">
      <td><code>${user.id.substring(0, 8)}...</code></td>
      <td>
        <div class="d-flex align-items-center">
             <strong>${user.username}</strong>
        </div>
      </td>
      <td>${user.email}</td>
      <td>${getRoleBadge(user.role)}</td>
      <td>${statusBadge}</td>
      <td>
        <span class="${intervalColor}">
          <i class="far fa-clock"></i> ${activityText}
        </span>
      </td>
      <td>
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

function getRoleBadge(role) {
  const roleClass = role?.toLowerCase() || 'user';
  return `<span class="role-badge ${roleClass}">${role}</span>`;
}

function handleSortAndFilter() {
  const query = document.getElementById('searchUsers').value.toLowerCase();
  const statusFilter = document.getElementById('statusFilter').value; // all, active, inactive

  const filtered = allUsers.filter(user => {
    // Search Text
    const matchesSearch = user.username.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      user.role.toLowerCase().includes(query);

    // Status Filter
    const daysInactive = getDaysInactive(user.updated_at);
    const isActive = daysInactive <= 30;

    let matchesStatus = true;
    if (statusFilter === 'active') matchesStatus = isActive;
    if (statusFilter === 'inactive') matchesStatus = !isActive;

    return matchesSearch && matchesStatus;
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
  } else if (action === 'delete') {
    if (await confirmDialog('¿Estás seguro de eliminar este usuario?')) {
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

function showUserForm(user = null) {
  const isEdit = !!user;
  const title = isEdit ? 'Editar Usuario' : 'Nuevo Usuario';

  const formHtml = `
    <form id="userForm">
      <div class="form-group">
        <label class="form-label">Email *</label>
        <input type="email" class="form-control" name="email" 
               value="${user?.email || ''}" required>
      </div>
      <div class="form-group">
        <label class="form-label">Nombre de Usuario *</label>
        <input type="text" class="form-control" name="username" 
               value="${user?.username || ''}" required>
      </div>
      
      <div class="form-group">
        <label class="form-label">Rol</label>
        <select class="form-control" name="role">
          <option value="USER" ${user?.role === 'USER' ? 'selected' : ''}>Usuario</option>
          <option value="ORGANIZER" ${user?.role === 'ORGANIZER' ? 'selected' : ''}>Organizador</option>
          <option value="ADMIN" ${user?.role === 'ADMIN' ? 'selected' : ''}>Administrador</option>
        </select>
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

  // Form submit handler
  document.getElementById('userForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    try {
      if (isEdit) {
        await API.users.update(user.id, data);
        showToast('success', 'Éxito', 'Usuario actualizado correctamente');
      } else {
        // Inject default password (backend requires it, but user doesn't set it)
        // We use a generic one or random. User implies "Admin sets leader info", likely to invite them.
        data.password = "ApexSports2026!";

        await API.users.create(data);
        showToast('success', 'Éxito', 'Usuario creado correctamente');
      }
      closeModal();
      // Refresh the list
      const container = document.getElementById('pageContent');
      renderUsers(container);
    } catch (error) {
      showToast('error', 'Error', error.message);
    }
  });
}

// Make closeModal available globally for the cancel button
window.closeModal = closeModal;

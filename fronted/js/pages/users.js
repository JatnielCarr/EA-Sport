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
                <th>Verificado</th>
                <th>Fecha Registro</th>
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
    document.getElementById('searchUsers').addEventListener('input', handleSearch);
    
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

function renderUsersRows(users) {
  if (users.length === 0) {
    return `<tr><td colspan="7" class="text-center text-muted">No hay usuarios</td></tr>`;
  }

  return users.map(user => `
    <tr data-id="${user.id}">
      <td><code>${user.id.substring(0, 8)}...</code></td>
      <td><strong>${user.username}</strong></td>
      <td>${user.email}</td>
      <td>${getRoleBadge(user.role)}</td>
      <td>
        ${user.verified 
          ? '<span class="text-success"><i class="fas fa-check-circle"></i></span>' 
          : '<span class="text-muted"><i class="fas fa-times-circle"></i></span>'}
      </td>
      <td>${formatDate(user.created_at)}</td>
      <td>
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

function getRoleBadge(role) {
  const roleClass = role?.toLowerCase() || 'user';
  return `<span class="role-badge ${roleClass}">${role}</span>`;
}

function handleSearch(e) {
  const query = e.target.value.toLowerCase();
  const filtered = allUsers.filter(user => 
    user.username.toLowerCase().includes(query) ||
    user.email.toLowerCase().includes(query) ||
    user.role.toLowerCase().includes(query)
  );
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
      ${!isEdit ? `
        <div class="form-group">
          <label class="form-label">Contraseña *</label>
          <input type="password" class="form-control" name="password_hash" 
                 placeholder="Mínimo 8 caracteres" required>
        </div>
      ` : ''}
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

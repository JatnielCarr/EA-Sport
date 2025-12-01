// =====================================================
// UI UTILITIES - Componentes reutilizables
// =====================================================

// Toast Notifications
export function showToast(type, title, message) {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  const icons = {
    success: 'fa-check-circle',
    error: 'fa-times-circle',
    warning: 'fa-exclamation-triangle',
    info: 'fa-info-circle'
  };

  toast.innerHTML = `
    <div class="toast-icon">
      <i class="fas ${icons[type]}"></i>
    </div>
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      <div class="toast-message">${message}</div>
    </div>
    <button class="toast-close"><i class="fas fa-times"></i></button>
  `;

  container.appendChild(toast);
  
  // Auto remove
  const autoRemove = setTimeout(() => removeToast(toast), 5000);

  // Manual close
  toast.querySelector('.toast-close').addEventListener('click', () => {
    clearTimeout(autoRemove);
    removeToast(toast);
  });
}

function removeToast(toast) {
  toast.style.animation = 'slideIn 0.3s ease reverse';
  setTimeout(() => toast.remove(), 300);
}

// Modal
export function openModal(title, content) {
  const overlay = document.getElementById('modalOverlay');
  const modal = document.getElementById('modal');
  const modalTitle = document.getElementById('modalTitle');
  const modalBody = document.getElementById('modalBody');

  modalTitle.textContent = title;
  modalBody.innerHTML = content;
  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

export function closeModal() {
  const overlay = document.getElementById('modalOverlay');
  overlay.classList.remove('active');
  document.body.style.overflow = '';
}

// Loading State
export function showLoading(container) {
  container.innerHTML = `
    <div class="loading-spinner">
      <div class="spinner"></div>
    </div>
  `;
}

// Empty State
export function showEmptyState(container, icon, title, message) {
  container.innerHTML = `
    <div class="empty-state fade-in">
      <div class="empty-icon">
        <i class="fas ${icon}"></i>
      </div>
      <h3 class="empty-title">${title}</h3>
      <p class="empty-message">${message}</p>
    </div>
  `;
}

// Format Date
export function formatDate(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Format Currency
export function formatCurrency(amount) {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'USD'
  }).format(amount || 0);
}

// Status Badge
export function getStatusBadge(status) {
  const statusLower = status?.toLowerCase().replace(/_/g, '_') || 'unknown';
  return `<span class="status-badge ${statusLower}">${status}</span>`;
}

// Role Badge
export function getRoleBadge(role) {
  const roleLower = role?.toLowerCase() || 'user';
  return `<span class="role-badge ${roleLower}">${role}</span>`;
}

// Confirm Dialog
export function confirmDialog(message) {
  return new Promise((resolve) => {
    const confirmed = window.confirm(message);
    resolve(confirmed);
  });
}

// Debounce
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Initialize modal close handlers
export function initModalHandlers() {
  const overlay = document.getElementById('modalOverlay');
  const closeBtn = document.getElementById('modalClose');

  closeBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });
}

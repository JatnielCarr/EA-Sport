// =====================================================
// UI UTILITIES - Componentes reutilizables
// =====================================================

import { escapeHtml } from './utils.js';
import { APP_CONFIG } from './config.js';

// Toast Notifications - XSS Safe
export function showToast(type, title, message) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${escapeHtml(type)}`;

  const icons = {
    success: 'fa-check-circle',
    error: 'fa-times-circle',
    warning: 'fa-exclamation-triangle',
    info: 'fa-info-circle'
  };

  const iconClass = icons[type] || icons.info;

  // Create elements safely to prevent XSS
  const iconDiv = document.createElement('div');
  iconDiv.className = 'toast-icon';
  iconDiv.innerHTML = `<i class="fas ${iconClass}"></i>`;

  const contentDiv = document.createElement('div');
  contentDiv.className = 'toast-content';

  const titleDiv = document.createElement('div');
  titleDiv.className = 'toast-title';
  titleDiv.textContent = title; // Safe - textContent escapes HTML

  const messageDiv = document.createElement('div');
  messageDiv.className = 'toast-message';
  messageDiv.textContent = message; // Safe - textContent escapes HTML

  contentDiv.appendChild(titleDiv);
  contentDiv.appendChild(messageDiv);

  const closeBtn = document.createElement('button');
  closeBtn.className = 'toast-close';
  closeBtn.innerHTML = '<i class="fas fa-times"></i>';

  toast.appendChild(iconDiv);
  toast.appendChild(contentDiv);
  toast.appendChild(closeBtn);

  container.appendChild(toast);

  // Auto remove using config
  const autoRemove = setTimeout(() => removeToast(toast), APP_CONFIG.toastDuration);

  // Manual close
  closeBtn.addEventListener('click', () => {
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

// Empty State - XSS Safe
export function showEmptyState(container, icon, title, message) {
  // Sanitize icon to only allow valid Font Awesome classes
  const safeIcon = /^fa-[a-z-]+$/.test(icon) ? icon : 'fa-question-circle';

  const wrapper = document.createElement('div');
  wrapper.className = 'empty-state fade-in';

  const iconDiv = document.createElement('div');
  iconDiv.className = 'empty-icon';
  iconDiv.innerHTML = `<i class="fas ${safeIcon}"></i>`;

  const titleEl = document.createElement('h3');
  titleEl.className = 'empty-title';
  titleEl.textContent = title; // Safe

  const messageEl = document.createElement('p');
  messageEl.className = 'empty-message';
  messageEl.textContent = message; // Safe

  wrapper.appendChild(iconDiv);
  wrapper.appendChild(titleEl);
  wrapper.appendChild(messageEl);

  container.innerHTML = '';
  container.appendChild(wrapper);
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

// Confirm Dialog - Custom Modal
export function confirmDialog(message, title = 'Confirmar') {
  return new Promise((resolve) => {
    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'confirm-overlay';
    overlay.innerHTML = `
      <div class="confirm-modal">
        <div class="confirm-header">
          <i class="fas fa-exclamation-triangle" style="color: var(--warning);"></i>
          <h3>${title}</h3>
        </div>
        <div class="confirm-body">
          <p>${message}</p>
        </div>
        <div class="confirm-footer">
          <button class="btn btn-secondary" id="confirmCancel">
            <i class="fas fa-times"></i> Cancelar
          </button>
          <button class="btn btn-danger" id="confirmOk">
            <i class="fas fa-check"></i> Confirmar
          </button>
        </div>
      </div>
    `;

    // Add styles if not exists
    if (!document.getElementById('confirm-dialog-styles')) {
      const style = document.createElement('style');
      style.id = 'confirm-dialog-styles';
      style.textContent = `
        .confirm-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.85);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100001;
          animation: fadeIn 0.2s ease;
        }
        
        .confirm-modal {
          background: var(--bg-secondary);
          border-radius: var(--border-radius);
          border: 1px solid var(--border-color);
          width: 100%;
          max-width: 400px;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5), 0 0 40px rgba(255, 184, 0, 0.2);
          animation: slideUp 0.2s ease;
        }
        
        .confirm-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 20px 24px;
          border-bottom: 1px solid var(--border-color);
          background: var(--bg-tertiary);
        }
        
        .confirm-header i {
          font-size: 24px;
        }
        
        .confirm-header h3 {
          font-size: 18px;
          font-weight: 700;
          margin: 0;
        }
        
        .confirm-body {
          padding: 24px;
        }
        
        .confirm-body p {
          color: var(--text-secondary);
          font-size: 15px;
          line-height: 1.6;
          margin: 0;
        }
        
        .confirm-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding: 16px 24px;
          border-top: 1px solid var(--border-color);
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `;
      document.head.appendChild(style);
    }

    document.body.appendChild(overlay);

    // Focus the confirm button
    const confirmBtn = overlay.querySelector('#confirmOk');
    confirmBtn.focus();

    // Handle clicks
    overlay.querySelector('#confirmCancel').addEventListener('click', () => {
      overlay.remove();
      resolve(false);
    });

    overlay.querySelector('#confirmOk').addEventListener('click', () => {
      overlay.remove();
      resolve(true);
    });

    // Handle escape key
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        overlay.remove();
        resolve(false);
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);

    // Handle click outside
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.remove();
        resolve(false);
      }
    });
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

// Store event listeners for cleanup
let modalEscapeHandler = null;
let modalOverlayHandler = null;
let modalCloseHandler = null;

// Initialize modal close handlers - with proper cleanup
export function initModalHandlers() {
  const overlay = document.getElementById('modalOverlay');
  const closeBtn = document.getElementById('modalClose');

  if (!overlay || !closeBtn) return;

  // Remove existing listeners if any (prevents memory leak)
  cleanupModalHandlers();

  // Create named handlers for cleanup
  modalCloseHandler = () => closeModal();
  modalOverlayHandler = (e) => {
    if (e.target === overlay) closeModal();
  };
  modalEscapeHandler = (e) => {
    if (e.key === 'Escape') closeModal();
  };

  closeBtn.addEventListener('click', modalCloseHandler);
  overlay.addEventListener('click', modalOverlayHandler);
  document.addEventListener('keydown', modalEscapeHandler);
}

// Cleanup modal handlers to prevent memory leaks
export function cleanupModalHandlers() {
  const overlay = document.getElementById('modalOverlay');
  const closeBtn = document.getElementById('modalClose');

  if (closeBtn && modalCloseHandler) {
    closeBtn.removeEventListener('click', modalCloseHandler);
  }
  if (overlay && modalOverlayHandler) {
    overlay.removeEventListener('click', modalOverlayHandler);
  }
  if (modalEscapeHandler) {
    document.removeEventListener('keydown', modalEscapeHandler);
  }
}

// =====================================================
// 🎮 ADVANCED GAMING EFFECTS
// =====================================================

// Mouse Tracking Glow Effect
export function initMouseGlow() {
  const glow = document.createElement('div');
  glow.className = 'mouse-glow';
  glow.style.cssText = `
    position: fixed;
    width: 300px;
    height: 300px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(0, 212, 255, 0.15) 0%, transparent 70%);
    pointer-events: none;
    z-index: 5;
    transform: translate(-50%, -50%);
    transition: opacity 0.3s;
    opacity: 0;
  `;
  document.body.appendChild(glow);

  document.addEventListener('mousemove', (e) => {
    glow.style.left = e.clientX + 'px';
    glow.style.top = e.clientY + 'px';
    glow.style.opacity = '1';
  });

  document.addEventListener('mouseleave', () => {
    glow.style.opacity = '0';
  });
}

// Card Tilt Effect
export function initCardTilt() {
  document.querySelectorAll('.stat-card, .chart-card, .widget-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = (y - centerY) / 15;
      const rotateY = (centerX - x) / 15;

      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
      card.style.transition = 'transform 0.5s ease';
    });

    card.addEventListener('mouseenter', () => {
      card.style.transition = 'none';
    });
  });
}

// Ripple Click Effect
export function initRippleEffect() {
  document.querySelectorAll('.btn, .nav-item, .stat-card').forEach(element => {
    element.addEventListener('click', function (e) {
      const ripple = document.createElement('span');
      const rect = this.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;

      ripple.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        left: ${x}px;
        top: ${y}px;
        background: radial-gradient(circle, rgba(0, 212, 255, 0.4) 0%, transparent 70%);
        border-radius: 50%;
        transform: scale(0);
        animation: ripple-expand 0.6s ease-out;
        pointer-events: none;
      `;

      this.style.position = 'relative';
      this.style.overflow = 'hidden';
      this.appendChild(ripple);

      setTimeout(() => ripple.remove(), 600);
    });
  });

  // Add ripple keyframes
  if (!document.getElementById('ripple-styles')) {
    const style = document.createElement('style');
    style.id = 'ripple-styles';
    style.textContent = `
      @keyframes ripple-expand {
        to {
          transform: scale(4);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }
}

// Particle Explosion on Action
export function createParticleExplosion(x, y, color = '#00d4ff') {
  const particleCount = 20;

  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    const angle = (Math.PI * 2 * i) / particleCount;
    const velocity = 50 + Math.random() * 100;
    const size = 4 + Math.random() * 8;

    particle.style.cssText = `
      position: fixed;
      width: ${size}px;
      height: ${size}px;
      background: ${color};
      border-radius: 50%;
      left: ${x}px;
      top: ${y}px;
      pointer-events: none;
      z-index: 10000;
      box-shadow: 0 0 10px ${color};
    `;

    document.body.appendChild(particle);

    const destX = x + Math.cos(angle) * velocity;
    const destY = y + Math.sin(angle) * velocity;

    particle.animate([
      { transform: 'translate(0, 0) scale(1)', opacity: 1 },
      { transform: `translate(${destX - x}px, ${destY - y}px) scale(0)`, opacity: 0 }
    ], {
      duration: 600 + Math.random() * 400,
      easing: 'cubic-bezier(0, 0.5, 0.5, 1)'
    }).onfinish = () => particle.remove();
  }
}

// Confetti Effect
export function createConfetti(duration = 3000) {
  const colors = ['#00d4ff', '#00ff88', '#ff6b35', '#ff3366', '#ffd700', '#9b59b6'];
  const confettiCount = 100;

  for (let i = 0; i < confettiCount; i++) {
    setTimeout(() => {
      const confetti = document.createElement('div');
      const color = colors[Math.floor(Math.random() * colors.length)];

      confetti.style.cssText = `
        position: fixed;
        width: ${5 + Math.random() * 10}px;
        height: ${5 + Math.random() * 10}px;
        background: ${color};
        left: ${Math.random() * window.innerWidth}px;
        top: -20px;
        pointer-events: none;
        z-index: 10000;
        border-radius: ${Math.random() > 0.5 ? '50%' : '0'};
      `;

      document.body.appendChild(confetti);

      confetti.animate([
        { transform: 'translateY(0) rotate(0deg)', opacity: 1 },
        { transform: `translateY(${window.innerHeight + 50}px) rotate(${720 + Math.random() * 360}deg)`, opacity: 0 }
      ], {
        duration: 2000 + Math.random() * 2000,
        easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
      }).onfinish = () => confetti.remove();
    }, Math.random() * duration / 2);
  }
}

// Typewriter Effect
export function typewriterEffect(element, text, speed = 50) {
  element.textContent = '';
  let i = 0;

  const type = () => {
    if (i < text.length) {
      element.textContent += text.charAt(i);
      i++;
      setTimeout(type, speed);
    }
  };

  type();
}

// Count Up Animation
export function countUp(element, target, duration = 2000) {
  const start = 0;
  const startTime = performance.now();

  const animate = (currentTime) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // Easing function
    const easeOutQuart = 1 - Math.pow(1 - progress, 4);
    const current = Math.floor(easeOutQuart * target);

    element.textContent = current.toLocaleString();

    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  };

  requestAnimationFrame(animate);
}

// Glitch Text Effect
export function glitchText(element) {
  const originalText = element.textContent;
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&*';
  let iterations = 0;

  const interval = setInterval(() => {
    element.textContent = originalText
      .split('')
      .map((char, index) => {
        if (index < iterations) return originalText[index];
        return chars[Math.floor(Math.random() * chars.length)];
      })
      .join('');

    if (iterations >= originalText.length) clearInterval(interval);
    iterations += 1 / 3;
  }, 30);
}

// Intersection Observer for Scroll Animations
export function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animated');

        // Trigger count-up for stat values
        if (entry.target.classList.contains('stat-value')) {
          const value = parseInt(entry.target.dataset.value || entry.target.textContent);
          if (!isNaN(value)) {
            countUp(entry.target, value);
          }
        }
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.stat-card, .chart-card, .widget-card').forEach(el => {
    observer.observe(el);
  });
}

// Electric Border Effect
export function initElectricBorders() {
  document.querySelectorAll('.btn-primary, .stat-card').forEach(el => {
    el.addEventListener('mouseenter', function () {
      this.style.animation = 'electric-spark 0.5s ease-in-out';
    });

    el.addEventListener('animationend', function () {
      this.style.animation = '';
    });
  });
}

// Initialize All Gaming Effects
export function initGamingEffects() {
  initMouseGlow();
  initRippleEffect();
  initScrollAnimations();
  initElectricBorders();

  // Delayed card tilt (after DOM ready)
  setTimeout(initCardTilt, 100);

  console.log('🎮 Gaming effects initialized!');
}

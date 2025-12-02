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
    element.addEventListener('click', function(e) {
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
    iterations += 1/3;
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
    el.addEventListener('mouseenter', function() {
      this.style.animation = 'electric-spark 0.5s ease-in-out';
    });
    
    el.addEventListener('animationend', function() {
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

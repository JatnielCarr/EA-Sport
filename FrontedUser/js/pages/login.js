// =====================================================
// Login Page
// =====================================================

import FirebaseAuth from '../firebase-auth.js';
import { handleLoginSuccess } from '../auth.js';
import { showLoading } from '../ui-helpers.js';

export async function renderLogin(container) {
  container.innerHTML = `
    <div class="auth-page">
      <div class="auth-container">
        <div class="auth-header">
          <div class="auth-logo">
            <i class="fas fa-bolt"></i>
            <span>Apex<span class="logo-accent">Tournament</span></span>
          </div>
          <h1 class="auth-title">Iniciar Sesión</h1>
          <p class="auth-subtitle">Ingresa a tu cuenta para participar en torneos</p>
        </div>

        <form id="loginForm" class="auth-form">
          <div class="form-group">
            <label for="email">
              <i class="fas fa-envelope"></i>
              Correo Electrónico
            </label>
            <input 
              type="email" 
              id="email" 
              name="email" 
              placeholder="tu@email.com"
              required
              autocomplete="email"
            >
            <span class="form-error" id="emailError"></span>
          </div>

          <div class="form-group">
            <label for="password">
              <i class="fas fa-lock"></i>
              Contraseña
            </label>
            <div class="password-input-wrapper">
              <input 
                type="password" 
                id="password" 
                name="password" 
                placeholder="••••••••"
                required
                autocomplete="current-password"
              >
              <button type="button" class="toggle-password" aria-label="Mostrar contraseña">
                <i class="fas fa-eye"></i>
              </button>
            </div>
            <span class="form-error" id="passwordError"></span>
          </div>

          <div class="form-options">
            <label class="checkbox-label">
              <input type="checkbox" id="rememberMe">
              <span class="checkmark"></span>
              Recordarme
            </label>
            <a href="#/forgot-password" class="forgot-link">¿Olvidaste tu contraseña?</a>
          </div>

          <button type="submit" class="btn btn-primary btn-full" id="loginBtn">
            <span class="btn-text">Iniciar Sesión</span>
            <span class="btn-loader" style="display: none;">
              <i class="fas fa-spinner fa-spin"></i>
            </span>
          </button>
        </form>

        <div class="auth-divider">
          <span>o continúa con</span>
        </div>

        <div class="social-login">
          <button class="btn btn-social discord" id="discordBtn" disabled>
            <i class="fab fa-discord"></i>
            Discord
          </button>
          <button class="btn btn-social google" id="googleBtn">
            <i class="fab fa-google"></i>
            Google
          </button>
        </div>

        <div class="auth-footer">
          <p>¿No tienes cuenta? <a href="#/registro">Regístrate aquí</a></p>
        </div>
      </div>

      <div class="auth-decoration">
        <div class="decoration-content">
          <h2>Bienvenido de vuelta</h2>
          <p>Compite en los mejores torneos de esports</p>
          <div class="decoration-stats">
            <div class="deco-stat">
              <i class="fas fa-trophy"></i>
              <span>500+ Torneos</span>
            </div>
            <div class="deco-stat">
              <i class="fas fa-users"></i>
              <span>10K+ Jugadores</span>
            </div>
            <div class="deco-stat">
              <i class="fas fa-gamepad"></i>
              <span>20+ Juegos</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  initLoginForm();
}

function initLoginForm() {
  const form = document.getElementById('loginForm');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const togglePassword = document.querySelector('.toggle-password');
  const googleBtn = document.getElementById('googleBtn');

  // Toggle password visibility
  togglePassword?.addEventListener('click', () => {
    const type = passwordInput.type === 'password' ? 'text' : 'password';
    passwordInput.type = type;
    togglePassword.innerHTML = type === 'password'
      ? '<i class="fas fa-eye"></i>'
      : '<i class="fas fa-eye-slash"></i>';
  });

  // Google login
  googleBtn?.addEventListener('click', async () => {
    googleBtn.disabled = true;
    googleBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Conectando...';

    try {
      const result = await FirebaseAuth.loginWithGoogle();

      if (result.success) {
        handleLoginSuccess({
          user: result.backendUser || result.user,
          token: localStorage.getItem('token')
        });
        window.showToast('success', '¡Bienvenido!', 'Has iniciado sesión con Google');
        window.location.hash = '#/';
      } else if (result.banned) {
        showBanScreen(result.ban_info);
      } else {
        window.showToast('error', 'Error', result.error || 'No se pudo iniciar sesión con Google');
      }
    } catch (error) {
      window.showToast('error', 'Error', 'Error al conectar con Google');
    } finally {
      googleBtn.disabled = false;
      googleBtn.innerHTML = '<i class="fab fa-google"></i> Google';
    }
  });

  // Form submission (Email/Password login with Firebase)
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const loginBtn = document.getElementById('loginBtn');
    const btnText = loginBtn.querySelector('.btn-text');
    const btnLoader = loginBtn.querySelector('.btn-loader');

    // Clear errors
    clearErrors();

    // Validate
    if (!validateEmail(email)) {
      showError('emailError', 'Ingresa un correo válido');
      return;
    }

    if (password.length < 1) {
      showError('passwordError', 'Ingresa tu contraseña');
      return;
    }

    // Show loading
    loginBtn.disabled = true;
    btnText.style.display = 'none';
    btnLoader.style.display = 'inline-block';

    try {
      const result = await FirebaseAuth.loginWithEmail(email, password);

      if (result.success) {
        handleLoginSuccess({
          user: result.backendUser || result.user,
          token: localStorage.getItem('token')
        });
        window.showToast('success', '¡Bienvenido!', 'Has iniciado sesión correctamente');
        window.location.hash = '#/';
      } else if (result.banned) {
        showBanScreen(result.ban_info);
      } else {
        window.showToast('error', 'Error', result.error || 'Credenciales incorrectas');
        showError('passwordError', result.error || 'Credenciales incorrectas');
      }
    } catch (error) {
      window.showToast('error', 'Error', error.message || 'Credenciales incorrectas');
      showError('passwordError', 'Credenciales incorrectas');
    } finally {
      loginBtn.disabled = false;
      btnText.style.display = 'inline';
      btnLoader.style.display = 'none';
    }
  });
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function showError(elementId, message) {
  const element = document.getElementById(elementId);
  if (element) {
    element.textContent = message;
    element.style.display = 'block';
  }
}

function clearErrors() {
  document.querySelectorAll('.form-error').forEach(el => {
    el.textContent = '';
    el.style.display = 'none';
  });
}

function showBanScreen(banInfo) {
  const container = document.querySelector('.auth-page') || document.getElementById('app');
  if (!container) return;

  const durationLabels = {
    '3d': '3 Días', '7d': '7 Días', '14d': '14 Días', '31d': '31 Días', 'permanent': 'Permanente'
  };
  const durationText = durationLabels[banInfo?.duration] || banInfo?.duration || 'Desconocido';
  const reason = banInfo?.reason || 'Violación de las reglas de la comunidad';
  const bannedAt = banInfo?.banned_at ? new Date(banInfo.banned_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A';
  const bannedUntil = banInfo?.banned_until ? new Date(banInfo.banned_until).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : (banInfo?.duration === 'permanent' ? 'Sin fecha de finalización' : 'N/A');
  const username = banInfo?.username || 'Jugador';

  container.innerHTML = `
    <div style="min-height:100vh; display:flex; align-items:center; justify-content:center; background:linear-gradient(135deg,#0a0a0f 0%,#1a0a0f 50%,#0a0a0f 100%); padding:20px;">
      <div style="max-width:500px; width:100%; background:rgba(30,15,20,0.95); border:1px solid rgba(220,53,69,0.3); border-radius:16px; padding:40px; text-align:center; box-shadow:0 20px 60px rgba(220,53,69,0.15);">
        
        <div style="width:80px; height:80px; border-radius:50%; background:linear-gradient(135deg,#dc3545,#a71d2a); margin:0 auto 20px; display:flex; align-items:center; justify-content:center; font-size:2rem; color:#fff; animation:pulse 2s infinite;">
          <i class="fas fa-ban"></i>
        </div>

        <h1 style="color:#dc3545; font-size:1.5rem; margin-bottom:8px; font-weight:700;">Cuenta Suspendida</h1>
        <p style="color:#aaa; font-size:0.9rem; margin-bottom:24px;">Tu cuenta ha sido suspendida por violar las normas de la comunidad.</p>

        <div style="background:rgba(220,53,69,0.08); border:1px solid rgba(220,53,69,0.2); border-radius:10px; padding:20px; margin-bottom:20px; text-align:left;">
          <div style="margin-bottom:14px;">
            <div style="color:#888; font-size:0.75rem; text-transform:uppercase; letter-spacing:1px; margin-bottom:4px;">Jugador</div>
            <div style="color:#fff; font-size:1rem; font-weight:600;">${username}</div>
          </div>
          <div style="margin-bottom:14px;">
            <div style="color:#888; font-size:0.75rem; text-transform:uppercase; letter-spacing:1px; margin-bottom:4px;">Motivo</div>
            <div style="color:#ff6b6b; font-size:0.95rem; line-height:1.4;">${reason}</div>
          </div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px;">
            <div>
              <div style="color:#888; font-size:0.75rem; text-transform:uppercase; letter-spacing:1px; margin-bottom:4px;">Duración</div>
              <div style="color:#ffc107; font-size:0.9rem; font-weight:600;">${durationText}</div>
            </div>
            <div>
              <div style="color:#888; font-size:0.75rem; text-transform:uppercase; letter-spacing:1px; margin-bottom:4px;">Fecha del Ban</div>
              <div style="color:#ccc; font-size:0.85rem;">${bannedAt}</div>
            </div>
          </div>
          ${banInfo?.duration !== 'permanent' ? `
          <div style="margin-top:14px; padding-top:14px; border-top:1px solid rgba(220,53,69,0.15);">
            <div style="color:#888; font-size:0.75rem; text-transform:uppercase; letter-spacing:1px; margin-bottom:4px;">Desbloqueo estimado</div>
            <div style="color:#20c997; font-size:0.9rem; font-weight:600;">${bannedUntil}</div>
          </div>` : `
          <div style="margin-top:14px; padding-top:14px; border-top:1px solid rgba(220,53,69,0.15);">
            <div style="color:#dc3545; font-size:0.85rem; font-weight:600;"><i class="fas fa-lock"></i> Ban permanente — Sin fecha de finalización</div>
          </div>`}
        </div>

        <p style="color:#888; font-size:0.8rem; margin-bottom:20px;">Si crees que esto es un error, contacta al soporte técnico.</p>

        <button onclick="window.location.hash='#/login'; window.location.reload();" 
                style="background:linear-gradient(135deg,#6c757d,#495057); color:#fff; border:none; padding:12px 30px; border-radius:8px; font-size:0.9rem; cursor:pointer; font-weight:600; transition:all 0.3s;">
          <i class="fas fa-arrow-left"></i> Volver al Inicio de Sesión
        </button>
      </div>
    </div>

    <style>
      @keyframes pulse {
        0%, 100% { box-shadow: 0 0 0 0 rgba(220,53,69,0.4); }
        50% { box-shadow: 0 0 0 15px rgba(220,53,69,0); }
      }
    </style>
    `;
}

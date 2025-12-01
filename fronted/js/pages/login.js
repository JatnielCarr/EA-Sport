// =====================================================
// LOGIN PAGE
// =====================================================

import Auth from '../auth.js';
import { showToast } from '../ui.js';

export async function renderLogin(container) {
  // Hide sidebar and header for login page
  document.querySelector('.sidebar')?.classList.add('hidden');
  document.querySelector('.header')?.classList.add('hidden');
  document.querySelector('.main-content')?.classList.add('login-page');

  container.innerHTML = `
    <div class="login-container">
      <div class="login-card">
        <div class="login-header">
          <div class="login-logo">
            <i class="fas fa-gamepad"></i>
          </div>
          <h1>EA Sports Tournament</h1>
          <p>Panel de Administración</p>
        </div>

        <form id="loginForm" class="login-form">
          <div class="form-group">
            <label class="form-label">
              <i class="fas fa-envelope"></i> Email
            </label>
            <input 
              type="email" 
              id="loginEmail" 
              class="form-control" 
              placeholder="admin@easports.com"
              required
              autocomplete="email"
            >
          </div>

          <div class="form-group">
            <label class="form-label">
              <i class="fas fa-lock"></i> Contraseña
            </label>
            <div class="password-input">
              <input 
                type="password" 
                id="loginPassword" 
                class="form-control" 
                placeholder="••••••••"
                required
                autocomplete="current-password"
              >
              <button type="button" class="password-toggle" id="togglePassword">
                <i class="fas fa-eye"></i>
              </button>
            </div>
          </div>

          <div class="form-options">
            <label class="checkbox-label">
              <input type="checkbox" id="rememberMe">
              <span>Recordarme</span>
            </label>
            <a href="#" class="forgot-link">¿Olvidaste tu contraseña?</a>
          </div>

          <button type="submit" class="btn btn-primary btn-block" id="loginBtn">
            <span class="btn-text">Iniciar Sesión</span>
            <span class="btn-loader hidden">
              <i class="fas fa-spinner fa-spin"></i>
            </span>
          </button>
        </form>

        <div class="login-footer">
          <p>¿No tienes cuenta? <a href="#/register" class="register-link">Regístrate</a></p>
        </div>

        <div class="login-demo">
          <p><i class="fas fa-info-circle"></i> Credenciales de prueba:</p>
          <code>admin@esports.com / Admin123!</code>
        </div>
      </div>

      <div class="login-bg">
        <div class="bg-shape shape-1"></div>
        <div class="bg-shape shape-2"></div>
        <div class="bg-shape shape-3"></div>
      </div>
    </div>
  `;

  // Add login styles
  addLoginStyles();

  // Event listeners
  setupLoginEvents();
}

function setupLoginEvents() {
  const form = document.getElementById('loginForm');
  const togglePassword = document.getElementById('togglePassword');
  const passwordInput = document.getElementById('loginPassword');

  // Toggle password visibility
  togglePassword?.addEventListener('click', () => {
    const type = passwordInput.type === 'password' ? 'text' : 'password';
    passwordInput.type = type;
    togglePassword.innerHTML = type === 'password' 
      ? '<i class="fas fa-eye"></i>' 
      : '<i class="fas fa-eye-slash"></i>';
  });

  // Form submit
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const loginBtn = document.getElementById('loginBtn');
    const btnText = loginBtn.querySelector('.btn-text');
    const btnLoader = loginBtn.querySelector('.btn-loader');

    // Show loading
    loginBtn.disabled = true;
    btnText.classList.add('hidden');
    btnLoader.classList.remove('hidden');

    try {
      await Auth.login(email, password);
      showToast('success', '¡Bienvenido!', 'Has iniciado sesión correctamente');
      
      // Redirect to dashboard
      setTimeout(() => {
        window.location.hash = '#/dashboard';
        window.location.reload();
      }, 500);
    } catch (error) {
      showToast('error', 'Error', error.message || 'Credenciales inválidas');
      
      // Reset button
      loginBtn.disabled = false;
      btnText.classList.remove('hidden');
      btnLoader.classList.add('hidden');
    }
  });
}

function addLoginStyles() {
  if (document.getElementById('loginStyles')) return;
  
  const styles = document.createElement('style');
  styles.id = 'loginStyles';
  styles.textContent = `
    .sidebar.hidden,
    .header.hidden {
      display: none !important;
    }

    .main-content.login-page {
      margin-left: 0 !important;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .login-container {
      width: 100%;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      position: relative;
      overflow: hidden;
    }

    .login-card {
      background: var(--bg-secondary);
      border-radius: var(--border-radius);
      border: 1px solid var(--border-color);
      padding: 40px;
      width: 100%;
      max-width: 420px;
      position: relative;
      z-index: 10;
      box-shadow: var(--shadow-lg), 0 0 60px var(--primary-glow);
    }

    .login-header {
      text-align: center;
      margin-bottom: 32px;
    }

    .login-logo {
      width: 80px;
      height: 80px;
      background: linear-gradient(135deg, var(--primary), var(--accent));
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 20px;
      font-size: 36px;
      color: white;
      box-shadow: 0 0 40px var(--primary-glow);
      animation: pulse-glow 2s infinite;
    }

    .login-header h1 {
      font-size: 24px;
      font-weight: 800;
      background: linear-gradient(135deg, var(--primary), var(--primary-light));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 8px;
    }

    .login-header p {
      color: var(--text-muted);
      font-size: 14px;
    }

    .login-form {
      margin-bottom: 24px;
    }

    .login-form .form-group {
      margin-bottom: 20px;
    }

    .login-form .form-label {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
      color: var(--text-secondary);
    }

    .login-form .form-label i {
      color: var(--primary);
    }

    .password-input {
      position: relative;
    }

    .password-toggle {
      position: absolute;
      right: 14px;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      padding: 4px;
    }

    .password-toggle:hover {
      color: var(--primary);
    }

    .form-options {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 24px;
      font-size: 13px;
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--text-secondary);
      cursor: pointer;
    }

    .checkbox-label input {
      accent-color: var(--primary);
    }

    .forgot-link {
      color: var(--primary);
      text-decoration: none;
    }

    .forgot-link:hover {
      text-decoration: underline;
    }

    .btn-block {
      width: 100%;
      padding: 16px;
      font-size: 16px;
    }

    .btn-text,
    .btn-loader {
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }

    .hidden {
      display: none !important;
    }

    .login-footer {
      text-align: center;
      padding-top: 20px;
      border-top: 1px solid var(--border-color);
      color: var(--text-muted);
      font-size: 14px;
    }

    .register-link {
      color: var(--primary);
      font-weight: 600;
      text-decoration: none;
    }

    .register-link:hover {
      text-decoration: underline;
    }

    .login-demo {
      margin-top: 20px;
      padding: 16px;
      background: rgba(0, 212, 255, 0.1);
      border: 1px solid rgba(0, 212, 255, 0.2);
      border-radius: var(--border-radius-sm);
      text-align: center;
      font-size: 13px;
    }

    .login-demo p {
      color: var(--text-secondary);
      margin-bottom: 8px;
    }

    .login-demo code {
      color: var(--primary);
      font-family: monospace;
      background: var(--bg-tertiary);
      padding: 4px 12px;
      border-radius: 6px;
    }

    /* Background shapes */
    .login-bg {
      position: fixed;
      inset: 0;
      overflow: hidden;
      z-index: 1;
    }

    .bg-shape {
      position: absolute;
      border-radius: 50%;
      filter: blur(80px);
      opacity: 0.4;
    }

    .shape-1 {
      width: 600px;
      height: 600px;
      background: var(--primary);
      top: -200px;
      right: -200px;
      animation: float 20s infinite ease-in-out;
    }

    .shape-2 {
      width: 400px;
      height: 400px;
      background: var(--accent);
      bottom: -100px;
      left: -100px;
      animation: float 25s infinite ease-in-out reverse;
    }

    .shape-3 {
      width: 300px;
      height: 300px;
      background: var(--secondary);
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      animation: pulse 10s infinite ease-in-out;
    }

    @keyframes float {
      0%, 100% { transform: translate(0, 0); }
      50% { transform: translate(30px, 30px); }
    }

    @keyframes pulse {
      0%, 100% { opacity: 0.2; transform: translate(-50%, -50%) scale(1); }
      50% { opacity: 0.4; transform: translate(-50%, -50%) scale(1.1); }
    }
  `;
  document.head.appendChild(styles);
}

export function cleanupLogin() {
  // Show sidebar and header when leaving login
  document.querySelector('.sidebar')?.classList.remove('hidden');
  document.querySelector('.header')?.classList.remove('hidden');
  document.querySelector('.main-content')?.classList.remove('login-page');
}

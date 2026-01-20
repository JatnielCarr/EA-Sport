// =====================================================
// Login Page
// =====================================================

import API from '../api.js';
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
          <button class="btn btn-social discord" disabled>
            <i class="fab fa-discord"></i>
            Discord
          </button>
          <button class="btn btn-social google" disabled>
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

    // Toggle password visibility
    togglePassword?.addEventListener('click', () => {
        const type = passwordInput.type === 'password' ? 'text' : 'password';
        passwordInput.type = type;
        togglePassword.innerHTML = type === 'password'
            ? '<i class="fas fa-eye"></i>'
            : '<i class="fas fa-eye-slash"></i>';
    });

    // Form submission
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
            const response = await API.auth.login(email, password);

            if (response.success) {
                handleLoginSuccess(response.data);
                window.showToast('success', '¡Bienvenido!', 'Has iniciado sesión correctamente');
                window.location.hash = '#/';
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

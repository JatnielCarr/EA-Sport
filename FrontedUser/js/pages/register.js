// =====================================================
// Register Page
// =====================================================

import FirebaseAuth from '../firebase-auth.js';
import { handleLoginSuccess } from '../auth.js';

export async function renderRegister(container) {
  container.innerHTML = `
    <div class="auth-page">
      <div class="auth-container register-container">
        <div class="auth-header">
          <div class="auth-logo">
            <i class="fas fa-bolt"></i>
            <span>Apex<span class="logo-accent">Tournament</span></span>
          </div>
          <h1 class="auth-title">Crear Cuenta</h1>
          <p class="auth-subtitle">Únete a la comunidad de esports más grande</p>
        </div>

        <form id="registerForm" class="auth-form">
          <div class="form-group">
            <label for="username">
              <i class="fas fa-user"></i>
              Nombre de Usuario
            </label>
            <input 
              type="text" 
              id="username" 
              name="username" 
              placeholder="TuGamerTag"
              required
              minlength="3"
              maxlength="20"
              autocomplete="username"
            >
            <span class="form-hint">3-20 caracteres, sin espacios</span>
            <span class="form-error" id="usernameError"></span>
          </div>

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
                minlength="6"
                autocomplete="new-password"
              >
              <button type="button" class="toggle-password" aria-label="Mostrar contraseña">
                <i class="fas fa-eye"></i>
              </button>
            </div>
            <div class="password-strength" id="passwordStrength">
              <div class="strength-bar">
                <div class="strength-fill" id="strengthFill"></div>
              </div>
              <span class="strength-text" id="strengthText">Mínimo 6 caracteres</span>
            </div>
            <span class="form-error" id="passwordError"></span>
          </div>

          <div class="form-group">
            <label for="confirmPassword">
              <i class="fas fa-lock"></i>
              Confirmar Contraseña
            </label>
            <div class="password-input-wrapper">
              <input 
                type="password" 
                id="confirmPassword" 
                name="confirmPassword" 
                placeholder="••••••••"
                required
                autocomplete="new-password"
              >
            </div>
            <span class="form-error" id="confirmPasswordError"></span>
          </div>

          <div class="form-group">
            <label class="checkbox-label terms-checkbox">
              <input type="checkbox" id="acceptTerms" required>
              <span class="checkmark"></span>
              Acepto los <a href="#/terminos" target="_blank">Términos de Servicio</a> 
              y la <a href="#/privacidad" target="_blank">Política de Privacidad</a>
            </label>
            <span class="form-error" id="termsError"></span>
          </div>

          <button type="submit" class="btn btn-primary btn-full" id="registerBtn">
            <span class="btn-text">Crear Cuenta</span>
            <span class="btn-loader" style="display: none;">
              <i class="fas fa-spinner fa-spin"></i>
            </span>
          </button>
        </form>

        <div class="auth-divider">
          <span>o regístrate con</span>
        </div>

        <div class="social-login">
          <button class="btn btn-social discord" id="discordBtn">
            <i class="fab fa-discord"></i>
            Discord
          </button>
          <button class="btn btn-social google" id="googleBtn">
            <i class="fab fa-google"></i>
            Google
          </button>
        </div>

        <div class="auth-footer">
          <p>¿Ya tienes cuenta? <a href="#/login">Inicia sesión</a></p>
        </div>
      </div>

      <div class="auth-decoration">
        <div class="decoration-content elite-section">
          <div class="elite-badge">
            <i class="fas fa-crown"></i>
            <span>EXCLUSIVO</span>
          </div>
          <h2 class="elite-title">
            <span class="elite-text-gradient">ÚNETE A LA ÉLITE</span>
            <span class="elite-subtitle">DEL GAMING COMPETITIVO</span>
          </h2>
          <p class="elite-description">Forma parte de la comunidad más épica de esports. Miles de jugadores ya están compitiendo.</p>
          
          <div class="elite-stats">
            <div class="elite-stat">
              <span class="elite-stat-number">10K+</span>
              <span class="elite-stat-label">Jugadores</span>
            </div>
            <div class="elite-stat">
              <span class="elite-stat-number">$50K</span>
              <span class="elite-stat-label">En Premios</span>
            </div>
            <div class="elite-stat">
              <span class="elite-stat-number">500+</span>
              <span class="elite-stat-label">Torneos</span>
            </div>
          </div>

          <ul class="benefits-list elite-benefits">
            <li>
              <div class="benefit-icon"><i class="fas fa-trophy"></i></div>
              <div class="benefit-content">
                <strong>Torneos Exclusivos</strong>
                <span>Compite en eventos premium con grandes premios</span>
              </div>
            </li>
            <li>
              <div class="benefit-icon"><i class="fas fa-users"></i></div>
              <div class="benefit-content">
                <strong>Equipos & Clanes</strong>
                <span>Crea tu equipo o únete a los mejores</span>
              </div>
            </li>
            <li>
              <div class="benefit-icon"><i class="fas fa-medal"></i></div>
              <div class="benefit-content">
                <strong>Sistema de Ranking</strong>
                <span>Escala posiciones y demuestra tu habilidad</span>
              </div>
            </li>
            <li>
              <div class="benefit-icon"><i class="fas fa-bolt"></i></div>
              <div class="benefit-content">
                <strong>Recompensas Épicas</strong>
                <span>Gana premios, badges y reconocimiento</span>
              </div>
            </li>
          </ul>

          <div class="elite-cta">
            <div class="elite-cta-text">
              <i class="fas fa-fire"></i>
              <span>¡El siguiente campeón podrías ser TÚ!</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  initRegisterForm();
}

function initRegisterForm() {
  const form = document.getElementById('registerForm');
  const passwordInput = document.getElementById('password');
  const confirmPasswordInput = document.getElementById('confirmPassword');
  const toggleButtons = document.querySelectorAll('.toggle-password');
  const googleBtn = document.getElementById('googleBtn');

  // Toggle password visibility
  toggleButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const input = btn.previousElementSibling;
      const type = input.type === 'password' ? 'text' : 'password';
      input.type = type;
      btn.innerHTML = type === 'password'
        ? '<i class="fas fa-eye"></i>'
        : '<i class="fas fa-eye-slash"></i>';
    });
  });

  // Password strength indicator
  passwordInput?.addEventListener('input', () => {
    updatePasswordStrength(passwordInput.value);
  });

  // Google registration
  googleBtn?.addEventListener('click', async () => {
    const acceptTerms = document.getElementById('acceptTerms').checked;

    if (!acceptTerms) {
      showError('termsError', 'Debes aceptar los términos para continuar');
      window.showToast('error', 'Error', 'Debes aceptar los términos de servicio');
      return;
    }

    googleBtn.disabled = true;
    googleBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Conectando...';

    try {
      const result = await FirebaseAuth.loginWithGoogle();

      if (result.success) {
        handleLoginSuccess({
          user: result.backendUser || result.user,
          token: localStorage.getItem('token')
        });
        window.showToast('success', '¡Cuenta creada!', 'Bienvenido a ApexTournament');
        window.location.hash = '#/';
      } else {
        window.showToast('error', 'Error', result.error || 'No se pudo registrar con Google');
      }
    } catch (error) {
      window.showToast('error', 'Error', 'Error al conectar con Google');
    } finally {
      googleBtn.disabled = false;
      googleBtn.innerHTML = '<i class="fab fa-google"></i> Google';
    }
  });

  // Discord registration
  const discordBtn = document.getElementById('discordBtn');
  discordBtn?.addEventListener('click', async () => {
    const acceptTerms = document.getElementById('acceptTerms').checked;

    if (!acceptTerms) {
      showError('termsError', 'Debes aceptar los términos para continuar');
      window.showToast('error', 'Error', 'Debes aceptar los términos de servicio');
      return;
    }

    discordBtn.disabled = true;
    discordBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Conectando...';

    try {
      const result = await FirebaseAuth.loginWithDiscord();

      if (result.success) {
        handleLoginSuccess({
          user: result.backendUser || result.user,
          token: localStorage.getItem('token')
        });
        window.showToast('success', '¡Cuenta creada!', 'Bienvenido a ApexTournament');
        window.location.hash = '#/';
      } else {
        window.showToast('error', 'Error', result.error || 'No se pudo registrar con Discord');
      }
    } catch (error) {
      window.showToast('error', 'Error', 'Error al conectar con Discord');
    } finally {
      discordBtn.disabled = false;
      discordBtn.innerHTML = '<i class="fab fa-discord"></i> Discord';
    }
  });

  // Form submission (Email/Password registration with Firebase)
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;
    const acceptTerms = document.getElementById('acceptTerms').checked;
    const registerBtn = document.getElementById('registerBtn');
    const btnText = registerBtn.querySelector('.btn-text');
    const btnLoader = registerBtn.querySelector('.btn-loader');

    // Clear errors
    clearErrors();

    // Validate
    let hasError = false;

    if (username.length < 3) {
      showError('usernameError', 'El nombre debe tener al menos 3 caracteres');
      hasError = true;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      showError('usernameError', 'Solo letras, números y guiones bajos');
      hasError = true;
    }

    if (!validateEmail(email)) {
      showError('emailError', 'Ingresa un correo válido');
      hasError = true;
    }

    if (password.length < 6) {
      showError('passwordError', 'La contraseña debe tener al menos 6 caracteres');
      hasError = true;
    }

    if (password !== confirmPassword) {
      showError('confirmPasswordError', 'Las contraseñas no coinciden');
      hasError = true;
    }

    if (!acceptTerms) {
      showError('termsError', 'Debes aceptar los términos');
      hasError = true;
    }

    if (hasError) return;

    // Show loading
    registerBtn.disabled = true;
    btnText.style.display = 'none';
    btnLoader.style.display = 'inline-block';

    try {
      const result = await FirebaseAuth.registerWithEmail(email, password, username);

      if (result.success) {
        handleLoginSuccess({
          user: result.backendUser || result.user,
          token: localStorage.getItem('token')
        });
        window.showToast('success', '¡Cuenta creada!', 'Bienvenido a ApexTournament');
        window.location.hash = '#/';
      } else {
        window.showToast('error', 'Error', result.error || 'No se pudo crear la cuenta');
        if (result.error && result.error.includes('email')) {
          showError('emailError', result.error);
        }
      }
    } catch (error) {
      window.showToast('error', 'Error', error.message || 'No se pudo crear la cuenta');
      if (error.message.includes('exists')) {
        showError('emailError', 'Este correo ya está registrado');
      }
    } finally {
      registerBtn.disabled = false;
      btnText.style.display = 'inline';
      btnLoader.style.display = 'none';
    }
  });
}

function updatePasswordStrength(password) {
  const fill = document.getElementById('strengthFill');
  const text = document.getElementById('strengthText');

  let strength = 0;
  let label = 'Muy débil';
  let color = '#ff3366';

  if (password.length >= 6) strength++;
  if (password.length >= 8) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^A-Za-z0-9]/.test(password)) strength++;

  switch (strength) {
    case 0:
    case 1:
      label = 'Muy débil';
      color = '#ff3366';
      break;
    case 2:
      label = 'Débil';
      color = '#ff6b35';
      break;
    case 3:
      label = 'Regular';
      color = '#ffb800';
      break;
    case 4:
      label = 'Buena';
      color = '#00d4ff';
      break;
    case 5:
      label = 'Excelente';
      color = '#00ff88';
      break;
  }

  fill.style.width = `${(strength / 5) * 100}%`;
  fill.style.background = color;
  text.textContent = label;
  text.style.color = color;
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

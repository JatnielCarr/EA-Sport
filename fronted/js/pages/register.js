// =====================================================
// REGISTER PAGE - Con Firebase Authentication
// =====================================================

import Auth from '../auth.js';
import { showToast } from '../ui.js';
import { 
  auth,
  createUserWithEmailAndPassword,
  signInWithPopup,
  googleProvider
} from '../firebase-config.js';

export async function renderRegister(container) {
  // Hide sidebar and header for register page
  document.querySelector('.sidebar')?.classList.add('hidden');
  document.querySelector('.header')?.classList.add('hidden');
  document.querySelector('.main-content')?.classList.add('login-page');

  container.innerHTML = `
    <div class="login-container">
      <div class="login-card">
        <div class="login-header">
          <div class="login-logo">
            <i class="fas fa-user-plus"></i>
          </div>
          <h1>Crear Cuenta</h1>
          <p>Únete a EA Sports Tournament</p>
        </div>

        <form id="registerForm" class="login-form">
          <div class="form-group">
            <label class="form-label">
              <i class="fas fa-user"></i> Nombre de Usuario
            </label>
            <input 
              type="text" 
              id="registerUsername" 
              class="form-control" 
              placeholder="Tu nombre de usuario"
              required
              minlength="3"
              autocomplete="username"
            >
          </div>

          <div class="form-group">
            <label class="form-label">
              <i class="fas fa-envelope"></i> Email
            </label>
            <input 
              type="email" 
              id="registerEmail" 
              class="form-control" 
              placeholder="tu@email.com"
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
                id="registerPassword" 
                class="form-control" 
                placeholder="Mínimo 6 caracteres"
                required
                minlength="6"
                autocomplete="new-password"
              >
              <button type="button" class="password-toggle" id="togglePassword">
                <i class="fas fa-eye"></i>
              </button>
            </div>
            <small class="form-hint">La contraseña debe tener al menos 6 caracteres</small>
          </div>

          <div class="form-group">
            <label class="form-label">
              <i class="fas fa-lock"></i> Confirmar Contraseña
            </label>
            <div class="password-input">
              <input 
                type="password" 
                id="registerPasswordConfirm" 
                class="form-control" 
                placeholder="Repite tu contraseña"
                required
                minlength="6"
                autocomplete="new-password"
              >
              <button type="button" class="password-toggle" id="togglePasswordConfirm">
                <i class="fas fa-eye"></i>
              </button>
            </div>
          </div>

          <div class="form-options">
            <label class="checkbox-label">
              <input type="checkbox" id="acceptTerms" required>
              <span>Acepto los <a href="#" class="terms-link">términos y condiciones</a></span>
            </label>
          </div>

          <button type="submit" class="btn btn-primary btn-block" id="registerBtn">
            <span class="btn-text">Crear Cuenta</span>
            <span class="btn-loader hidden">
              <i class="fas fa-spinner fa-spin"></i>
            </span>
          </button>
        </form>

        <div class="divider">
          <span>O regístrate con</span>
        </div>

        <button id="googleSignInBtn" class="btn btn-google btn-block">
          <i class="fab fa-google"></i>
          Continuar con Google
        </button>

        <div class="login-footer">
          <p>¿Ya tienes cuenta? <a href="#/login" class="register-link">Inicia sesión</a></p>
        </div>
      </div>

      <div class="login-bg">
        <div class="bg-shape shape-1"></div>
        <div class="bg-shape shape-2"></div>
        <div class="bg-shape shape-3"></div>
      </div>
    </div>
  `;

  // Add login styles (reusa los del login)
  addRegisterStyles();

  // Event listeners
  setupRegisterEvents();
}

function setupRegisterEvents() {
  const form = document.getElementById('registerForm');
  const togglePassword = document.getElementById('togglePassword');
  const togglePasswordConfirm = document.getElementById('togglePasswordConfirm');
  const passwordInput = document.getElementById('registerPassword');
  const passwordConfirmInput = document.getElementById('registerPasswordConfirm');
  const googleBtn = document.getElementById('googleSignInBtn');

  // Toggle password visibility
  togglePassword?.addEventListener('click', () => {
    const type = passwordInput.type === 'password' ? 'text' : 'password';
    passwordInput.type = type;
    togglePassword.innerHTML = type === 'password' 
      ? '<i class="fas fa-eye"></i>' 
      : '<i class="fas fa-eye-slash"></i>';
  });

  togglePasswordConfirm?.addEventListener('click', () => {
    const type = passwordConfirmInput.type === 'password' ? 'text' : 'password';
    passwordConfirmInput.type = type;
    togglePasswordConfirm.innerHTML = type === 'password' 
      ? '<i class="fas fa-eye"></i>' 
      : '<i class="fas fa-eye-slash"></i>';
  });

  // Google Sign In
  googleBtn?.addEventListener('click', async () => {
    if (!auth || !googleProvider) {
      showToast('error', 'Error', 'Firebase no está configurado correctamente');
      return;
    }

    try {
      googleBtn.disabled = true;
      googleBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Conectando...';
      
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Registrar en el backend
      await registerUserInBackend(user.displayName || user.email.split('@')[0], user.email, null, user.uid);
      
      showToast('success', '¡Bienvenido!', 'Cuenta creada con Google exitosamente');
      
      setTimeout(() => {
        // Los usuarios normales no van al panel de admin, van al panel de usuario
        window.location.href = '/FrontedUser/index.html';
      }, 1000);
    } catch (error) {
      console.error('Error con Google Sign In:', error);
      showToast('error', 'Error', error.message || 'Error al iniciar sesión con Google');
      googleBtn.disabled = false;
      googleBtn.innerHTML = '<i class="fab fa-google"></i> Continuar con Google';
    }
  });

  // Form submit
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('registerUsername').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    const passwordConfirm = document.getElementById('registerPasswordConfirm').value;
    const registerBtn = document.getElementById('registerBtn');
    const btnText = registerBtn.querySelector('.btn-text');
    const btnLoader = registerBtn.querySelector('.btn-loader');

    // Validaciones
    if (password !== passwordConfirm) {
      showToast('error', 'Error', 'Las contraseñas no coinciden');
      return;
    }

    if (password.length < 6) {
      showToast('error', 'Error', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }

    // Show loading
    registerBtn.disabled = true;
    btnText.classList.add('hidden');
    btnLoader.classList.remove('hidden');

    try {
      let firebaseUid = null;
      
      // Registrar en Firebase primero (si está disponible)
      if (auth) {
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          firebaseUid = userCredential.user.uid;
          console.log('✅ Usuario registrado en Firebase:', firebaseUid);
        } catch (firebaseError) {
          console.warn('⚠️ Error en Firebase, continuando con backend:', firebaseError.message);
        }
      }

      // Registrar en el backend
      await registerUserInBackend(username, email, password, firebaseUid);
      
      showToast('success', '¡Cuenta creada!', 'Ahora puedes iniciar sesión');
      
      // Redirigir según el tipo de usuario
      setTimeout(() => {
        // Los usuarios normales no acceden al panel de admin
        // Redirigir al panel de usuario o login
        window.location.href = '/FrontedUser/index.html';
      }, 1500);
      
    } catch (error) {
      console.error('Error en registro:', error);
      showToast('error', 'Error', error.message || 'Error al crear la cuenta');
      
      // Reset button
      registerBtn.disabled = false;
      btnText.classList.remove('hidden');
      btnLoader.classList.add('hidden');
    }
  });
}

async function registerUserInBackend(username, email, password, firebaseUid) {
  try {
    const response = await Auth.register(email, username, password, firebaseUid);
    return response;
  } catch (error) {
    throw new Error(error.message || 'Error al registrar usuario en el servidor');
  }
}

function addRegisterStyles() {
  if (document.getElementById('registerStyles')) return;

  const styles = document.createElement('style');
  styles.id = 'registerStyles';
  styles.textContent = `
    .form-hint {
      display: block;
      font-size: 12px;
      color: var(--text-muted);
      margin-top: 4px;
    }

    .divider {
      display: flex;
      align-items: center;
      text-align: center;
      margin: 20px 0;
      color: var(--text-muted);
      font-size: 13px;
    }

    .divider::before,
    .divider::after {
      content: '';
      flex: 1;
      border-bottom: 1px solid var(--border-color);
    }

    .divider span {
      padding: 0 15px;
    }

    .btn-google {
      background: #fff;
      color: #333;
      border: 1px solid #ddd;
      font-weight: 500;
      transition: var(--transition);
    }

    .btn-google:hover {
      background: #f5f5f5;
      border-color: #ccc;
      transform: translateY(-2px);
    }

    .btn-google i {
      margin-right: 8px;
      color: #4285f4;
    }

    .terms-link {
      color: var(--primary);
      text-decoration: none;
    }

    .terms-link:hover {
      text-decoration: underline;
    }
  `;
  document.head.appendChild(styles);
}

export function cleanupRegister() {
  document.querySelector('.sidebar')?.classList.remove('hidden');
  document.querySelector('.header')?.classList.remove('hidden');
  document.querySelector('.main-content')?.classList.remove('login-page');
  
  const styles = document.getElementById('registerStyles');
  if (styles) {
    styles.remove();
  }
}

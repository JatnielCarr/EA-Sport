// =====================================================
// Settings Page
// =====================================================

import API from '../api.js';
import { getStoredUser, isAuthenticated, logout } from '../auth.js';

export async function renderSettings(container) {
    if (!isAuthenticated()) {
        window.location.hash = '#/login';
        return;
    }

    const user = getStoredUser();

    container.innerHTML = `
    <div class="settings-page">
        <div class="container">
            <div class="page-header">
                <h1 class="page-title">
                    <i class="fas fa-cog"></i>
                    Configuración
                </h1>
                <p class="page-subtitle">Administra tu cuenta y preferencias</p>
            </div>

            <div class="settings-grid">
                <!-- Account Settings -->
                <div class="settings-section">
                    <h2 class="section-title">
                        <i class="fas fa-user-cog"></i>
                        Cuenta
                    </h2>
                    
                    <div class="settings-card">
                        <div class="setting-row">
                            <div class="setting-info">
                                <span class="setting-label">Nombre de usuario</span>
                                <span class="setting-value">${user?.username || 'Usuario'}</span>
                            </div>
                            <a href="#/perfil" class="btn btn-secondary btn-sm">Editar</a>
                        </div>
                        
                        <div class="setting-row">
                            <div class="setting-info">
                                <span class="setting-label">Correo electrónico</span>
                                <span class="setting-value">${user?.email || 'email@ejemplo.com'}</span>
                            </div>
                            <a href="#/perfil" class="btn btn-secondary btn-sm">Editar</a>
                        </div>
                    </div>
                </div>

                <!-- Security Settings -->
                <div class="settings-section">
                    <h2 class="section-title">
                        <i class="fas fa-shield-alt"></i>
                        Seguridad
                    </h2>
                    
                    <div class="settings-card">
                        <form id="changePasswordForm">
                            <div class="form-group">
                                <label for="currentPassword">
                                    <i class="fas fa-lock"></i>
                                    Contraseña actual
                                </label>
                                <input type="password" id="currentPassword" required>
                            </div>
                            
                            <div class="form-group">
                                <label for="newPassword">
                                    <i class="fas fa-key"></i>
                                    Nueva contraseña
                                </label>
                                <input type="password" id="newPassword" required minlength="6">
                                <span class="form-hint">Mínimo 6 caracteres</span>
                            </div>
                            
                            <div class="form-group">
                                <label for="confirmPassword">
                                    <i class="fas fa-check"></i>
                                    Confirmar contraseña
                                </label>
                                <input type="password" id="confirmPassword" required minlength="6">
                            </div>
                            
                            <button type="submit" class="btn btn-primary">
                                <i class="fas fa-save"></i>
                                Cambiar Contraseña
                            </button>
                        </form>
                    </div>
                </div>

                <!-- Notification Settings -->
                <div class="settings-section">
                    <h2 class="section-title">
                        <i class="fas fa-bell"></i>
                        Notificaciones
                    </h2>
                    
                    <div class="settings-card">
                        <div class="setting-row">
                            <div class="setting-info">
                                <span class="setting-label">Recordatorios de partidas</span>
                                <span class="setting-desc">Recibe alertas antes de tus partidas</span>
                            </div>
                            <label class="toggle-switch">
                                <input type="checkbox" id="matchReminders" checked>
                                <span class="toggle-slider"></span>
                            </label>
                        </div>
                        
                        <div class="setting-row">
                            <div class="setting-info">
                                <span class="setting-label">Actualizaciones de torneos</span>
                                <span class="setting-desc">Novedades sobre torneos en los que participas</span>
                            </div>
                            <label class="toggle-switch">
                                <input type="checkbox" id="tournamentUpdates" checked>
                                <span class="toggle-slider"></span>
                            </label>
                        </div>
                        
                        <div class="setting-row">
                            <div class="setting-info">
                                <span class="setting-label">Invitaciones de equipo</span>
                                <span class="setting-desc">Cuando te inviten a un equipo</span>
                            </div>
                            <label class="toggle-switch">
                                <input type="checkbox" id="teamInvites" checked>
                                <span class="toggle-slider"></span>
                            </label>
                        </div>
                    </div>
                </div>

                <!-- Danger Zone -->
                <div class="settings-section danger-zone">
                    <h2 class="section-title">
                        <i class="fas fa-exclamation-triangle"></i>
                        Zona de Peligro
                    </h2>
                    
                    <div class="settings-card">
                        <div class="setting-row">
                            <div class="setting-info">
                                <span class="setting-label">Cerrar sesión</span>
                                <span class="setting-desc">Salir de tu cuenta en este dispositivo</span>
                            </div>
                            <button class="btn btn-outline" id="logoutBtn">
                                <i class="fas fa-sign-out-alt"></i>
                                Cerrar Sesión
                            </button>
                        </div>
                        
                        <div class="setting-row">
                            <div class="setting-info">
                                <span class="setting-label">Eliminar cuenta</span>
                                <span class="setting-desc">Esto eliminará permanentemente tu cuenta y datos</span>
                            </div>
                            <button class="btn btn-danger" id="deleteAccountBtn" disabled>
                                <i class="fas fa-trash"></i>
                                Eliminar Cuenta
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <style>
        .settings-page {
            padding: 40px 0;
        }
        
        .settings-grid {
            display: grid;
            gap: 32px;
            max-width: 800px;
        }
        
        .settings-section .section-title {
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 18px;
            margin-bottom: 16px;
        }
        
        .settings-section .section-title i {
            color: var(--primary);
        }
        
        .settings-card {
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: var(--border-radius);
            padding: 24px;
        }
        
        .setting-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 16px 0;
            border-bottom: 1px solid var(--border-color);
        }
        
        .setting-row:last-child {
            border-bottom: none;
        }
        
        .setting-info {
            display: flex;
            flex-direction: column;
            gap: 4px;
        }
        
        .setting-label {
            font-weight: 500;
        }
        
        .setting-value {
            color: var(--text-secondary);
            font-size: 14px;
        }
        
        .setting-desc {
            color: var(--text-muted);
            font-size: 13px;
        }
        
        /* Toggle Switch */
        .toggle-switch {
            position: relative;
            width: 50px;
            height: 26px;
        }
        
        .toggle-switch input {
            opacity: 0;
            width: 0;
            height: 0;
        }
        
        .toggle-slider {
            position: absolute;
            cursor: pointer;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: var(--bg-tertiary);
            border: 1px solid var(--border-color);
            border-radius: 26px;
            transition: var(--transition);
        }
        
        .toggle-slider::before {
            position: absolute;
            content: "";
            height: 20px;
            width: 20px;
            left: 2px;
            bottom: 2px;
            background: white;
            border-radius: 50%;
            transition: var(--transition);
        }
        
        .toggle-switch input:checked + .toggle-slider {
            background: var(--primary);
            border-color: var(--primary);
        }
        
        .toggle-switch input:checked + .toggle-slider::before {
            transform: translateX(24px);
        }
        
        /* Danger Zone */
        .danger-zone .section-title i {
            color: var(--danger);
        }
        
        .danger-zone .settings-card {
            border-color: rgba(255, 51, 102, 0.3);
        }
        
        .btn-danger {
            background: transparent;
            border: 1px solid var(--danger);
            color: var(--danger);
            padding: 10px 20px;
            border-radius: 8px;
            cursor: pointer;
            transition: var(--transition);
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .btn-danger:hover:not(:disabled) {
            background: var(--danger);
            color: white;
        }
        
        .btn-danger:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        
        @media (max-width: 768px) {
            .setting-row {
                flex-direction: column;
                align-items: flex-start;
                gap: 12px;
            }
        }
    </style>
    `;

    initSettingsEvents();
}

function initSettingsEvents() {
    // Password change form
    const passwordForm = document.getElementById('changePasswordForm');
    passwordForm?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (newPassword !== confirmPassword) {
            window.showToast('error', 'Error', 'Las contraseñas no coinciden');
            return;
        }

        if (newPassword.length < 6) {
            window.showToast('error', 'Error', 'La contraseña debe tener al menos 6 caracteres');
            return;
        }

        try {
            const response = await API.auth.changePassword(currentPassword, newPassword);
            if (response.success) {
                window.showToast('success', '¡Listo!', 'Tu contraseña ha sido cambiada');
                passwordForm.reset();
            }
        } catch (error) {
            window.showToast('error', 'Error', error.message || 'No se pudo cambiar la contraseña');
        }
    });

    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    logoutBtn?.addEventListener('click', () => {
        logout();
        window.showToast('success', 'Sesión cerrada', 'Hasta pronto');
        window.location.hash = '#/';
    });

    // Save notification preferences to localStorage
    const savePrefs = () => {
        const prefs = {
            matchReminders: document.getElementById('matchReminders')?.checked,
            tournamentUpdates: document.getElementById('tournamentUpdates')?.checked,
            teamInvites: document.getElementById('teamInvites')?.checked
        };
        localStorage.setItem('notification_prefs', JSON.stringify(prefs));
    };

    document.getElementById('matchReminders')?.addEventListener('change', savePrefs);
    document.getElementById('tournamentUpdates')?.addEventListener('change', savePrefs);
    document.getElementById('teamInvites')?.addEventListener('change', savePrefs);

    // Load saved preferences
    const savedPrefs = JSON.parse(localStorage.getItem('notification_prefs') || '{}');
    if (savedPrefs.matchReminders !== undefined) {
        document.getElementById('matchReminders').checked = savedPrefs.matchReminders;
    }
    if (savedPrefs.tournamentUpdates !== undefined) {
        document.getElementById('tournamentUpdates').checked = savedPrefs.tournamentUpdates;
    }
    if (savedPrefs.teamInvites !== undefined) {
        document.getElementById('teamInvites').checked = savedPrefs.teamInvites;
    }
}

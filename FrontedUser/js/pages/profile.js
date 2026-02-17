// =====================================================
// User Profile Page
// =====================================================

import API from '../api.js';
import { getStoredUser, isAuthenticated } from '../auth.js';
import { showLoading, formatDate } from '../ui-helpers.js';

// Handle return from Stripe payment for name change
async function handleNameChangeReturn() {
    const urlParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
    const nameChangeStatus = urlParams.get('name_change');
    const sessionId = urlParams.get('session_id');

    if (nameChangeStatus === 'success' && sessionId) {
        // Verify payment with Stripe first
        try {
            await API.payment.verifySession(sessionId);
        } catch (e) {
            console.warn('Could not verify name change payment:', e.message);
        }

        // Get pending profile update from sessionStorage
        const pendingUpdate = sessionStorage.getItem('pendingProfileUpdate');

        if (pendingUpdate) {
            try {
                const { username, description } = JSON.parse(pendingUpdate);

                // Apply the name change using the session ID
                const response = await API.post('/payment/apply-name-change', {
                    session_id: sessionId,
                    new_username: username
                });

                if (response.success) {
                    // Also update description if changed
                    if (description) {
                        await API.users.updateProfile({ description });
                    }

                    window.showToast?.('success', '¡Nombre actualizado!', 'Tu nombre de usuario ha sido cambiado exitosamente.');
                    sessionStorage.removeItem('pendingProfileUpdate');
                } else {
                    throw new Error(response.error || 'Error al aplicar el cambio de nombre');
                }
            } catch (error) {
                console.error('Error applying name change:', error);
                window.showToast?.('error', 'Error', error.message || 'No se pudo aplicar el cambio de nombre');
            }
        }

        // Clean URL
        window.history.replaceState(null, '', window.location.pathname + '#/perfil');
    } else if (nameChangeStatus === 'canceled') {
        window.showToast?.('warning', 'Pago cancelado', 'El cambio de nombre no se realizó');
        sessionStorage.removeItem('pendingProfileUpdate');
        window.history.replaceState(null, '', window.location.pathname + '#/perfil');
    }
}

// Handle return from Stripe subscription checkout
async function handleSubscriptionReturn() {
    const urlParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
    const subscriptionStatus = urlParams.get('subscription');
    const sessionId = urlParams.get('session_id');

    if (subscriptionStatus === 'success' && sessionId) {
        try {
            const result = await API.subscriptions.verifySession(sessionId);
            if (result.success) {
                window.showToast?.('success', '¡Suscripción Activada!', `Tu plan ${result.data?.plan || ''} ha sido activado exitosamente.`);
            } else {
                window.showToast?.('warning', 'Verificación', result.error || 'No se pudo verificar la suscripción');
            }
        } catch (error) {
            console.error('Error verifying subscription:', error);
            window.showToast?.('warning', 'Verificación pendiente', 'Tu suscripción puede tardar unos momentos en activarse.');
        }

        // Clean URL
        window.history.replaceState(null, '', window.location.pathname + '#/perfil');
    } else if (subscriptionStatus === 'canceled') {
        window.showToast?.('warning', 'Suscripción cancelada', 'No se realizó el pago de la suscripción.');
        window.history.replaceState(null, '', window.location.pathname + '#/perfil');
    }
}

// Colores y configuración por plan
const PLAN_CONFIG = {
    FREE: {
        name: 'Gratis',
        color: '#6b7280',
        gradient: 'linear-gradient(135deg, #6b7280, #4b5563)',
        glow: 'none',
        icon: 'fa-user',
        badgeClass: '',
        badgeLabel: null
    },
    STANDARD: {
        name: 'Standard',
        color: '#ffd700',
        gradient: 'linear-gradient(135deg, #b8860b, #ffd700)',
        glow: '0 0 20px rgba(255, 215, 0, 0.5)',
        icon: 'fa-rocket',
        badgeClass: 'standard-badge',
        badgeLabel: 'PRO'
    },
    PREMIUM: {
        name: 'Premium',
        color: '#f093fb',
        gradient: 'linear-gradient(135deg, #f093fb, #f5576c)',
        glow: '0 0 30px rgba(240, 147, 251, 0.6)',
        icon: 'fa-gem',
        badgeClass: 'premium-badge',
        badgeLabel: 'LEGEND'
    }
};

// Get saved profile images from localStorage
function getProfileImages(userId) {
    const saved = localStorage.getItem(`profile_images_${userId}`);
    return saved ? JSON.parse(saved) : { avatar: null, banner: null };
}

// Save profile images to localStorage
function saveProfileImages(userId, images) {
    localStorage.setItem(`profile_images_${userId}`, JSON.stringify(images));
}

export async function renderProfile(container) {
    if (!isAuthenticated()) {
        window.location.hash = '#/login';
        return;
    }

    showLoading(container);

    // Check for name change success from Stripe redirect
    await handleNameChangeReturn();

    // Check for subscription success from Stripe redirect
    await handleSubscriptionReturn();

    try {
        const response = await API.users.getProfile();
        const user = response.data;

        // Obtener suscripción del usuario
        let subscription = { plan: 'FREE', status: 'ACTIVE' };
        try {
            const subResponse = await API.subscriptions.getMySubscription();
            if (subResponse.data) {
                subscription = subResponse.data;
            }
        } catch (e) {
            console.log('No subscription found, using FREE');
        }

        const planConfig = PLAN_CONFIG[subscription.plan] || PLAN_CONFIG.FREE;
        const isPaid = subscription.plan !== 'FREE';
        const profileImages = {
            avatar: user.avatar_url,
            banner: user.banner_url
        };

        container.innerHTML = `
        <div class="profile-page">
            <div class="container">
                <!-- Profile Banner & Avatar Section -->
                <div class="profile-card-main">
                    <div class="profile-banner-wrapper">
                        <div class="profile-banner" style="background-image: ${profileImages.banner ? `url(${profileImages.banner})` : planConfig.gradient}">
                            ${!profileImages.banner ? '<i class="fas fa-image banner-placeholder-icon"></i>' : ''}
                        </div>
                        <button class="edit-banner-btn" id="editBannerBtn" title="Cambiar banner">
                            <i class="fas fa-camera"></i>
                        </button>
                        <input type="file" id="bannerFileInput" class="file-input-hidden" accept="image/*">
                    </div>
                    
                    <div class="profile-main-info">
                        <div class="profile-avatar-wrapper">
                            <div class="profile-avatar-custom ${isPaid ? 'profile-badge-glow ' + subscription.plan.toLowerCase() : ''}">
                                ${profileImages.avatar
                ? `<img src="${profileImages.avatar}" alt="Avatar de ${user.username}">`
                : `<i class="fas ${planConfig.icon}"></i>`
            }
                            </div>
                            <button class="edit-avatar-btn" id="editAvatarBtn" title="Cambiar foto">
                                <i class="fas fa-camera"></i>
                            </button>
                            <input type="file" id="avatarFileInput" class="file-input-hidden" accept="image/*">
                        </div>
                        
                        <div class="profile-details">
                            <h1 class="profile-username ${planConfig.badgeClass}">
                                ${user.username}
                                ${planConfig.badgeLabel ? `<span class="user-badge ${subscription.plan.toLowerCase()}">${planConfig.badgeLabel}</span>` : ''}
                            </h1>
                            <span class="profile-badge ${user.role.toLowerCase()}">${user.role}</span>
                        </div>
                        
                        <button class="btn btn-outline" id="editProfileBtn">
                            <i class="fas fa-edit"></i>
                            Editar Perfil
                        </button>
                    </div>
                    
                    <!-- Subscription Banner Enhanced -->
                    <div class="subscription-banner-enhanced ${subscription.plan.toLowerCase()}">
                        <div class="subscription-banner-inner">
                            <i class="fas ${planConfig.icon}"></i>
                            <div class="subscription-banner-content">
                                <p class="subscription-banner-title">Plan ${planConfig.name}</p>
                                <p class="subscription-banner-status">
                                    ${subscription.status === 'ACTIVE' ? '✓ Activo' : subscription.status}
                                    ${subscription.current_period_end ? ` • Renueva el ${formatDate(subscription.current_period_end)}` : ''}
                                </p>
                            </div>
                            ${isPaid
                ? `<a href="#/suscripcion" class="subscription-banner-action">Administrar</a>`
                : `<a href="#/suscripcion" class="subscription-banner-action">Mejorar Plan ✨</a>`
            }
                        </div>
                    </div>
                </div>

                <div class="profile-grid">
                    <div class="profile-section">
                        <h2 class="section-title">
                            <i class="fas fa-info-circle"></i>
                            Información
                        </h2>
                        <div class="info-card">
                            <div class="info-row">
                                <span class="info-label">Miembro desde</span>
                                <span class="info-value">${formatDate(user.created_at)}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Estado</span>
                                <span class="info-value status-active">
                                    <i class="fas fa-check-circle"></i> Activo
                                </span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Rol</span>
                                <span class="info-value">${user.role}</span>
                            </div>
                        </div>
                    </div>

                    <div class="profile-section">
                        <h2 class="section-title">
                            <i class="fas fa-chart-bar"></i>
                            Estadísticas
                        </h2>
                        <div class="stats-grid">
                            <div class="stat-card">
                                <div class="stat-icon"><i class="fas fa-trophy"></i></div>
                                <div class="stat-value" id="tournamentsPlayed">0</div>
                                <div class="stat-label">Torneos</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-icon win"><i class="fas fa-medal"></i></div>
                                <div class="stat-value" id="matchesWon">0</div>
                                <div class="stat-label">Victorias</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-icon teams"><i class="fas fa-users"></i></div>
                                <div class="stat-value" id="teamsJoined">0</div>
                                <div class="stat-label">Equipos</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-icon rating"><i class="fas fa-star"></i></div>
                                <div class="stat-value" id="rating">1000</div>
                                <div class="stat-label">Rating</div>
                            </div>
                        </div>
                    </div>

                    <div class="profile-section full-width">
                        <h2 class="section-title">
                            <i class="fas fa-gamepad"></i>
                            Cuentas de Juego
                        </h2>
                        <div class="game-accounts empty-state-small">
                            <i class="fas fa-link"></i>
                            <p>No has vinculado ninguna cuenta de juego</p>
                            <button class="btn btn-secondary" disabled>
                                <i class="fas fa-plus"></i>
                                Vincular Cuenta
                            </button>
                        </div>
                    </div>

                    <div class="profile-section full-width">
                        <h2 class="section-title">
                            <i class="fas fa-history"></i>
                            Actividad Reciente
                        </h2>
                        <div class="quick-actions">
                            <a href="#/historial" class="quick-action-card">
                                <div class="quick-action-icon">
                                    <i class="fas fa-history"></i>
                                </div>
                                <div class="quick-action-info">
                                    <h4>Historial de Partidas</h4>
                                    <p>Ver todas tus partidas y estadísticas</p>
                                </div>
                                <i class="fas fa-chevron-right"></i>
                            </a>
                            <a href="#/logros" class="quick-action-card">
                                <div class="quick-action-icon badges">
                                    <i class="fas fa-award"></i>
                                </div>
                                <div class="quick-action-info">
                                    <h4>Logros y Medallas</h4>
                                    <p>Desbloquea logros y colecciona medallas</p>
                                </div>
                                <i class="fas fa-chevron-right"></i>
                            </a>
                            <a href="#/favoritos" class="quick-action-card">
                                <div class="quick-action-icon favorites">
                                    <i class="fas fa-heart"></i>
                                </div>
                                <div class="quick-action-info">
                                    <h4>Mis Favoritos</h4>
                                    <p>Torneos y equipos guardados</p>
                                </div>
                                <i class="fas fa-chevron-right"></i>
                            </a>
                        </div>
                    </div>

                    <!-- Performance Chart Section -->
                    <div class="profile-section full-width">
                        <h2 class="section-title">
                            <i class="fas fa-chart-line"></i>
                            Rendimiento
                        </h2>
                        <div class="chart-container">
                            <div class="chart-card">
                                <h4>Victorias vs Derrotas</h4>
                                <div class="pie-chart" id="winLossChart"></div>
                            </div>
                            <div class="chart-card">
                                <h4>Rendimiento Semanal</h4>
                                <div class="bar-chart" id="weeklyChart"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Edit Profile Modal -->
        <div class="modal" id="editProfileModal">
            <div class="modal-overlay"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Editar Perfil</h3>
                    <button class="modal-close" id="closeModal">&times;</button>
                </div>
                <form id="editProfileForm" class="modal-body">
                    <div class="form-group">
                        <label for="editUsername">Nombre de usuario</label>
                        <input type="text" id="editUsername" value="${user.username}" required>
                        <div class="name-change-warning" id="nameChangeWarning" style="display: none;">
                            <i class="fas fa-exclamation-triangle"></i>
                            <span id="nameChangeMessage"></span>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="editDescription">Descripción</label>
                        <textarea id="editDescription" rows="3" maxlength="500" placeholder="Cuéntanos sobre ti...">${user.description || ''}</textarea>
                        <small class="char-count"><span id="descCharCount">${(user.description || '').length}</span>/500</small>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" id="cancelEdit">Cancelar</button>
                        <button type="submit" class="btn btn-primary" id="saveProfileBtn">Guardar Cambios</button>
                    </div>
                </form>
            </div>
        </div>
        

        `;

        initProfileEvents(user);
    } catch (error) {
        container.innerHTML = `
        <div class="container">
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Error al cargar el perfil</h3>
                <p>${error.message}</p>
                <a href="#/" class="btn btn-primary">Volver al inicio</a>
            </div>
        </div>
        `;
    }
}

function initProfileEvents(user) {
    // Move modal to body to fix z-index/transform issues
    let modal = document.getElementById('editProfileModal');
    if (modal && modal.parentNode !== document.body) {
        // Remove any existing modal first to prevent duplicates
        const existingModal = document.querySelector('body > #editProfileModal');
        if (existingModal) {
            existingModal.remove();
        }
        document.body.appendChild(modal);
    }

    // Re-query elements after moving to be safe
    const editBtn = document.getElementById('editProfileBtn');
    modal = document.getElementById('editProfileModal'); // Re-get just in case
    const closeModal = document.getElementById('closeModal');
    const cancelEdit = document.getElementById('cancelEdit');
    const overlay = modal?.querySelector('.modal-overlay');
    const editForm = document.getElementById('editProfileForm');
    const usernameInput = document.getElementById('editUsername');
    const descriptionInput = document.getElementById('editDescription');
    const nameChangeWarning = document.getElementById('nameChangeWarning');
    const nameChangeMessage = document.getElementById('nameChangeMessage');
    const descCharCount = document.getElementById('descCharCount');
    const saveBtn = document.getElementById('saveProfileBtn');

    const originalUsername = user.username;
    const nameChangeCount = user.name_change_count || 0;

    const openModal = () => {
        modal?.classList.add('show');
        // Reset warning state
        checkNameChangeWarning();
    };
    const closeModalFn = () => modal?.classList.remove('show');

    // Check and show name change warning
    function checkNameChangeWarning() {
        const newUsername = usernameInput?.value?.trim();
        if (newUsername && newUsername !== originalUsername) {
            nameChangeWarning.style.display = 'flex';
            if (nameChangeCount === 0) {
                nameChangeMessage.innerHTML = '<strong>¡Este es tu primer cambio de nombre gratis!</strong> Los siguientes cambios tendrán un costo de $50 MXN.';
                nameChangeWarning.classList.remove('paid');
                nameChangeWarning.classList.add('free');
                saveBtn.textContent = 'Guardar Cambios';
            } else {
                nameChangeMessage.innerHTML = `<strong>Cambiar tu nombre tiene un costo de $50 MXN.</strong> Serás redirigido a Stripe para completar el pago.`;
                nameChangeWarning.classList.remove('free');
                nameChangeWarning.classList.add('paid');
                saveBtn.textContent = 'Continuar al Pago ($50 MXN)';
            }
        } else {
            nameChangeWarning.style.display = 'none';
            saveBtn.textContent = 'Guardar Cambios';
        }
    }

    // Listen for username changes
    usernameInput?.addEventListener('input', checkNameChangeWarning);

    // Description character count
    descriptionInput?.addEventListener('input', () => {
        const count = descriptionInput.value.length;
        descCharCount.textContent = count;
    });

    editBtn?.addEventListener('click', openModal);
    closeModal?.addEventListener('click', closeModalFn);
    cancelEdit?.addEventListener('click', closeModalFn);
    overlay?.addEventListener('click', closeModalFn);

    editForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = usernameInput?.value?.trim();
        const description = descriptionInput?.value?.trim();
        const isNameChanged = username !== originalUsername;

        try {
            // If name is being changed and not the first free change, redirect to payment
            if (isNameChanged && nameChangeCount > 0) {
                // Store pending changes in sessionStorage
                sessionStorage.setItem('pendingProfileUpdate', JSON.stringify({
                    username,
                    description
                }));

                // Create checkout session for name change
                const response = await API.payments.createNameChangeCheckout();
                if (response.url) {
                    window.location.href = response.url;
                } else {
                    throw new Error('No se pudo crear la sesión de pago');
                }
                return;
            }

            // Normal update (first name change is free, or only description changed)
            await API.users.updateProfile({ username, description });
            window.showToast('success', 'Perfil actualizado', 'Los cambios se guardaron correctamente');
            closeModalFn();
            // Refresh the page
            renderProfile(document.getElementById('app'));
        } catch (error) {
            window.showToast('error', 'Error', error.message);
        }
    });

    // Avatar upload handling
    const avatarBtn = document.getElementById('editAvatarBtn');
    const avatarInput = document.getElementById('avatarFileInput');

    avatarBtn?.addEventListener('click', () => {
        avatarInput?.click();
    });

    avatarInput?.addEventListener('change', (e) => {
        const file = e.target.files?.[0];
        if (file) {
            handleImageUpload(file, 'avatar', user.id);
        }
    });

    // Banner upload handling
    const bannerBtn = document.getElementById('editBannerBtn');
    const bannerInput = document.getElementById('bannerFileInput');

    bannerBtn?.addEventListener('click', () => {
        bannerInput?.click();
    });

    bannerInput?.addEventListener('change', (e) => {
        const file = e.target.files?.[0];
        if (file) {
            handleImageUpload(file, 'banner', user.id);
        }
    });
}

// Handle image upload and save to localStorage
function handleImageUpload(file, type, userId) {
    // Validate file size (max 2MB for localStorage)
    if (file.size > 2 * 1024 * 1024) {
        window.showToast?.('error', 'Error', 'La imagen es muy grande. Máximo 2MB.');
        return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
        window.showToast?.('error', 'Error', 'Por favor selecciona una imagen válida.');
        return;
    }

    const reader = new FileReader();

    reader.onload = async (e) => {
        const imageData = e.target.result;

        try {
            // Show loading state
            window.showLoading?.(document.body);

            // Upload to backend
            const updateData = {};
            updateData[type + '_url'] = imageData;

            await API.users.update(updateData);

            // Show success message
            window.hideLoading?.();
            window.showToast?.('success', '¡Listo!', type === 'avatar' ? 'Foto de perfil actualizada' : 'Banner actualizado');

            // Refresh profile to show new image
            renderProfile(document.getElementById('app'));
        } catch (error) {
            window.hideLoading?.();
            console.error('Upload error:', error);
            window.showToast?.('error', 'Error', 'No se pudo guardar la imagen.');
        }
    };

    reader.onerror = () => {
        window.showToast?.('error', 'Error', 'No se pudo cargar la imagen.');
    };

    reader.readAsDataURL(file);
}

// =====================================================
// User Profile Page
// =====================================================

import API from '../api.js';
import { getStoredUser, isAuthenticated } from '../auth.js';
import { showLoading, formatDate } from '../app.js';

export async function renderProfile(container) {
    if (!isAuthenticated()) {
        window.location.hash = '#/login';
        return;
    }

    showLoading(container);

    try {
        const response = await API.auth.me();
        const user = response.data;

        container.innerHTML = `
        <div class="profile-page">
            <div class="container">
                <div class="profile-header">
                    <div class="profile-avatar-large">
                        <i class="fas fa-user"></i>
                    </div>
                    <div class="profile-info">
                        <h1 class="profile-username">${user.username}</h1>
                        <p class="profile-email">${user.email}</p>
                        <span class="profile-badge ${user.role.toLowerCase()}">${user.role}</span>
                    </div>
                    <button class="btn btn-outline" id="editProfileBtn">
                        <i class="fas fa-edit"></i>
                        Editar Perfil
                    </button>
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
                    </div>
                    <div class="form-group">
                        <label for="editEmail">Correo electrónico</label>
                        <input type="email" id="editEmail" value="${user.email}" required>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" id="cancelEdit">Cancelar</button>
                        <button type="submit" class="btn btn-primary">Guardar Cambios</button>
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
    const editBtn = document.getElementById('editProfileBtn');
    const modal = document.getElementById('editProfileModal');
    const closeModal = document.getElementById('closeModal');
    const cancelEdit = document.getElementById('cancelEdit');
    const overlay = modal?.querySelector('.modal-overlay');
    const editForm = document.getElementById('editProfileForm');

    const openModal = () => modal?.classList.add('show');
    const closeModalFn = () => modal?.classList.remove('show');

    editBtn?.addEventListener('click', openModal);
    closeModal?.addEventListener('click', closeModalFn);
    cancelEdit?.addEventListener('click', closeModalFn);
    overlay?.addEventListener('click', closeModalFn);

    editForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('editUsername').value;
        const email = document.getElementById('editEmail').value;

        try {
            await API.users.update(user.id, { username, email });
            window.showToast('success', 'Perfil actualizado', 'Los cambios se guardaron correctamente');
            closeModalFn();
            // Refresh the page
            renderProfile(document.getElementById('app'));
        } catch (error) {
            window.showToast('error', 'Error', error.message);
        }
    });
}

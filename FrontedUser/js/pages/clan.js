// =====================================================
// PAGE - Clan Detail (Ver clan individual)
// =====================================================

import API from '../api.js';
import { getStoredUser, isAuthenticated } from '../auth.js';
import { showToast } from '../ui-helpers.js';

let currentClan = null;
let userMembership = null;
let chatMessages = [];
let chatInterval = null;

export async function renderClanPage(container, clanId) {
    container.innerHTML = `
        <div class="section">
            <div class="container">
                <div class="clan-detail-loading">
                    <div class="spinner"></div>
                    <p>Cargando clan...</p>
                </div>
            </div>
        </div>
    `;

    try {
        // Load clan data
        const clanResponse = await API.clans.getById(clanId);
        currentClan = clanResponse.data;

        // Check if current user is a member
        if (isAuthenticated()) {
            const user = getStoredUser();
            const membership = currentClan.members.find(m => m.user_id === user.id);
            userMembership = membership ? {
                ...membership,
                isLeader: currentClan.leader_id === user.id
            } : null;
        }

        renderClanDetail(container);
    } catch (error) {
        console.error('Error loading clan:', error);
        container.innerHTML = `
            <div class="section">
                <div class="container">
                    <div class="error-state">
                        <i class="fas fa-exclamation-triangle"></i>
                        <h3>Clan no encontrado</h3>
                        <p>${error.message}</p>
                        <a href="#clans" class="btn btn-primary">Volver a Clanes</a>
                    </div>
                </div>
            </div>
        `;
    }
}

function renderClanDetail(container) {
    const clan = currentClan;
    const isMember = !!userMembership;
    const isLeader = userMembership?.isLeader;
    const isOfficer = userMembership?.role === 'OFFICER';
    const canManage = isLeader || isOfficer;

    container.innerHTML = `
        <div class="clan-detail">
            <!-- Banner -->
            <div class="clan-detail-banner" style="${clan.banner_url ? `background-image: url('${clan.banner_url}')` : ''}">
                <div class="clan-detail-banner-overlay">
                    <a href="#clans" class="btn btn-secondary back-btn">
                        <i class="fas fa-arrow-left"></i> Volver
                    </a>
                    <div class="clan-detail-header">
                        <h1 class="clan-detail-name">${clan.name}</h1>
                        <span class="clan-detail-tag">[${clan.tag}]</span>
                        <div class="clan-access-badge ${clan.access_type.toLowerCase()}">
                            <i class="fas ${getAccessIcon(clan.access_type)}"></i>
                            ${getAccessLabel(clan.access_type)}
                        </div>
                    </div>
                </div>
            </div>

            <div class="container">
                <div class="clan-detail-grid">
                    <!-- Main Info -->
                    <div class="clan-detail-main">
                        <!-- Description -->
                        <div class="clan-card-section">
                            <h3><i class="fas fa-info-circle"></i> Descripción</h3>
                            <p>${clan.description || 'Este clan no tiene descripción aún.'}</p>
                        </div>

                        ${clan.requirements ? `
                            <div class="clan-card-section">
                                <h3><i class="fas fa-clipboard-list"></i> Requisitos</h3>
                                <p>${clan.requirements}</p>
                            </div>
                        ` : ''}

                        <!-- Members -->
                        <div class="clan-card-section">
                            <h3><i class="fas fa-users"></i> Miembros (${clan.members.length}/${clan.max_members})</h3>
                            <div class="clan-members-list">
                                ${clan.members.map(member => `
                                    <div class="clan-member-item">
                                        <div class="clan-member-avatar">
                                            ${member.user.username.charAt(0).toUpperCase()}
                                        </div>
                                        <div class="clan-member-info">
                                            <span class="clan-member-name">${member.user.username}</span>
                                            <span class="clan-member-role ${member.role.toLowerCase()}">
                                                ${getRoleLabel(member.role)}
                                            </span>
                                        </div>
                                        ${canManage && member.role !== 'LEADER' ? `
                                            <div class="clan-member-actions">
                                                <button class="btn btn-sm btn-secondary" data-action="role" data-user-id="${member.user_id}">
                                                    <i class="fas fa-user-tag"></i>
                                                </button>
                                                <button class="btn btn-sm btn-danger" data-action="kick" data-user-id="${member.user_id}">
                                                    <i class="fas fa-times"></i>
                                                </button>
                                            </div>
                                        ` : ''}
                                    </div>
                                `).join('')}
                            </div>
                        </div>

                        <!-- Chat (members only) -->
                        ${isMember ? `
                            <div class="clan-card-section clan-chat-section">
                                <h3><i class="fas fa-comments"></i> Chat del Clan</h3>
                                <div class="clan-chat" id="clanChat">
                                    <div class="clan-chat-messages" id="chatMessages">
                                        <div class="loading-spinner-small"></div>
                                    </div>
                                    <div class="clan-chat-input">
                                        <input type="text" id="chatInput" placeholder="Escribe un mensaje..." maxlength="1000">
                                        <button class="btn btn-primary" id="sendMessage">
                                            <i class="fas fa-paper-plane"></i>
                                        </button>
                                        ${canManage ? `
                                            <button class="btn btn-accent" id="sendAnnouncement" title="Enviar como anuncio">
                                                <i class="fas fa-bullhorn"></i>
                                            </button>
                                        ` : ''}
                                    </div>
                                </div>
                            </div>
                        ` : ''}
                    </div>

                    <!-- Sidebar -->
                    <div class="clan-detail-sidebar">
                        <div class="clan-info-card">
                            <div class="clan-info-item">
                                <i class="fas fa-crown"></i>
                                <div>
                                    <span class="label">Líder</span>
                                    <span class="value">${clan.leader.username}</span>
                                </div>
                            </div>
                            ${clan.location ? `
                                <div class="clan-info-item">
                                    <i class="fas fa-map-marker-alt"></i>
                                    <div>
                                        <span class="label">Región</span>
                                        <span class="value">${clan.location}</span>
                                    </div>
                                </div>
                            ` : ''}
                            <div class="clan-info-item">
                                <i class="fas fa-users"></i>
                                <div>
                                    <span class="label">Miembros</span>
                                    <span class="value">${clan.members.length} / ${clan.max_members}</span>
                                </div>
                            </div>
                            <div class="clan-info-item">
                                <i class="fas fa-calendar"></i>
                                <div>
                                    <span class="label">Creado</span>
                                    <span class="value">${new Date(clan.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>

                        <!-- Actions -->
                        <div class="clan-actions">
                            ${renderActionButtons()}
                        </div>

                        <!-- Pending Requests (for leaders) -->
                        ${isLeader && clan.requests?.length > 0 ? `
                            <div class="clan-requests-card">
                                <h4><i class="fas fa-envelope"></i> Solicitudes Pendientes</h4>
                                <div class="clan-requests-list">
                                    ${clan.requests.map(req => `
                                        <div class="clan-request-item" data-request-id="${req.id}">
                                            <div class="request-header">
                                                <strong>${req.user.username}</strong>
                                                <span class="request-date">${new Date(req.created_at).toLocaleDateString()}</span>
                                            </div>
                                            <div class="request-title">${req.title}</div>
                                            <div class="request-message">${req.message}</div>
                                            <div class="request-actions">
                                                <button class="btn btn-sm btn-success" data-action="approve" data-id="${req.id}">
                                                    <i class="fas fa-check"></i> Aprobar
                                                </button>
                                                <button class="btn btn-sm btn-danger" data-action="reject" data-id="${req.id}">
                                                    <i class="fas fa-times"></i> Rechazar
                                                </button>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        </div>
    `;

    setupEventListeners();

    // Load chat if member
    if (isMember) {
        loadChat();
    }
}

function renderActionButtons() {
    const clan = currentClan;
    const user = isAuthenticated() ? getStoredUser() : null;
    const isMember = !!userMembership;
    const isLeader = userMembership?.isLeader;

    if (!isAuthenticated()) {
        return `
            <a href="#login" class="btn btn-primary btn-block">
                <i class="fas fa-sign-in-alt"></i> Inicia sesión para unirte
            </a>
        `;
    }

    if (isLeader) {
        return `
            <button class="btn btn-secondary btn-block" id="btnEditClan">
                <i class="fas fa-edit"></i> Editar Clan
            </button>
            <button class="btn btn-danger btn-block" id="btnDeleteClan">
                <i class="fas fa-trash"></i> Eliminar Clan
            </button>
        `;
    }

    if (isMember) {
        return `
            <button class="btn btn-danger btn-block" id="btnLeaveClan">
                <i class="fas fa-door-open"></i> Abandonar Clan
            </button>
        `;
    }

    // Not a member
    if (clan.access_type === 'OPEN') {
        return `
            <button class="btn btn-primary btn-block" id="btnJoinClan">
                <i class="fas fa-user-plus"></i> Unirse al Clan
            </button>
        `;
    }

    if (clan.access_type === 'INVITE_ONLY') {
        return `
            <button class="btn btn-primary btn-block" id="btnRequestJoin">
                <i class="fas fa-envelope"></i> Solicitar Unirse
            </button>
        `;
    }

    return `
        <div class="clan-closed-notice">
            <i class="fas fa-lock"></i>
            <p>Este clan no acepta nuevos miembros</p>
        </div>
    `;
}

function getAccessIcon(type) {
    switch (type) {
        case 'OPEN': return 'fa-unlock';
        case 'INVITE_ONLY': return 'fa-envelope';
        case 'CLOSED': return 'fa-lock';
        default: return 'fa-shield-alt';
    }
}

function getAccessLabel(type) {
    switch (type) {
        case 'OPEN': return 'Abierto';
        case 'INVITE_ONLY': return 'Por Invitación';
        case 'CLOSED': return 'Cerrado';
        default: return type;
    }
}

function getRoleLabel(role) {
    switch (role) {
        case 'LEADER': return '👑 Líder';
        case 'OFFICER': return '⭐ Oficial';
        case 'MEMBER': return 'Miembro';
        default: return role;
    }
}

async function loadChat() {
    try {
        const response = await API.clans.getMessages(currentClan.id);
        chatMessages = response.data || [];
        renderChatMessages();
    } catch (error) {
        console.error('Error loading chat:', error);
    }
}

function renderChatMessages() {
    const container = document.getElementById('chatMessages');
    if (!container) return;

    const user = getStoredUser();

    if (chatMessages.length === 0) {
        container.innerHTML = `
            <div class="chat-empty">
                <i class="fas fa-comments"></i>
                <p>No hay mensajes aún. ¡Sé el primero en escribir!</p>
            </div>
        `;
        return;
    }

    container.innerHTML = chatMessages.map(msg => `
        <div class="chat-message ${msg.user_id === user.id ? 'own' : ''} ${msg.is_announcement ? 'announcement' : ''}">
            ${msg.is_announcement ? '<div class="announcement-badge"><i class="fas fa-bullhorn"></i> Anuncio</div>' : ''}
            <div class="chat-message-header">
                <span class="chat-username">${msg.user.username}</span>
                <span class="chat-time">${formatTime(msg.created_at)}</span>
            </div>
            <div class="chat-message-content">${escapeHtml(msg.content)}</div>
        </div>
    `).join('');

    // Scroll to bottom
    container.scrollTop = container.scrollHeight;
}

function formatTime(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function setupEventListeners() {
    const user = isAuthenticated() ? getStoredUser() : null;

    // Join clan
    document.getElementById('btnJoinClan')?.addEventListener('click', async () => {
        try {
            await API.clans.join(currentClan.id, user.id);
            showToast('success', '¡Te has unido al clan!');
            location.reload();
        } catch (error) {
            showToast('error', error.message || 'Error al unirse');
        }
    });

    // Request to join
    document.getElementById('btnRequestJoin')?.addEventListener('click', () => {
        showRequestModal();
    });

    // Leave clan
    document.getElementById('btnLeaveClan')?.addEventListener('click', async () => {
        if (!confirm('¿Estás seguro de abandonar el clan?')) return;
        try {
            await API.clans.removeMember(currentClan.id, user.id);
            showToast('success', 'Has abandonado el clan');
            window.location.hash = '#clans';
        } catch (error) {
            showToast('error', error.message || 'Error al abandonar');
        }
    });

    // Delete clan
    document.getElementById('btnDeleteClan')?.addEventListener('click', async () => {
        if (!confirm('¿Estás seguro de eliminar el clan? Esta acción no se puede deshacer.')) return;
        try {
            await API.clans.delete(currentClan.id);
            showToast('success', 'Clan eliminado');
            window.location.hash = '#clans';
        } catch (error) {
            showToast('error', error.message || 'Error al eliminar');
        }
    });

    // Edit clan
    document.getElementById('btnEditClan')?.addEventListener('click', () => {
        window.location.hash = `#edit-clan/${currentClan.id}`;
    });

    // Send message
    document.getElementById('sendMessage')?.addEventListener('click', () => sendChatMessage(false));
    document.getElementById('sendAnnouncement')?.addEventListener('click', () => sendChatMessage(true));
    document.getElementById('chatInput')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendChatMessage(false);
    });

    // Approve/Reject requests
    document.querySelectorAll('[data-action="approve"]').forEach(btn => {
        btn.addEventListener('click', async () => {
            const requestId = btn.dataset.id;
            try {
                await API.clans.approveRequest(currentClan.id, requestId);
                showToast('success', 'Solicitud aprobada');
                location.reload();
            } catch (error) {
                showToast('error', error.message);
            }
        });
    });

    document.querySelectorAll('[data-action="reject"]').forEach(btn => {
        btn.addEventListener('click', async () => {
            const requestId = btn.dataset.id;
            try {
                await API.clans.rejectRequest(currentClan.id, requestId);
                showToast('success', 'Solicitud rechazada');
                location.reload();
            } catch (error) {
                showToast('error', error.message);
            }
        });
    });

    // Kick member
    document.querySelectorAll('[data-action="kick"]').forEach(btn => {
        btn.addEventListener('click', async () => {
            const userId = btn.dataset.userId;
            if (!confirm('¿Expulsar a este miembro?')) return;
            try {
                await API.clans.removeMember(currentClan.id, userId);
                showToast('success', 'Miembro expulsado');
                location.reload();
            } catch (error) {
                showToast('error', error.message);
            }
        });
    });
}

async function sendChatMessage(isAnnouncement) {
    const input = document.getElementById('chatInput');
    const content = input?.value.trim();

    if (!content) return;

    const user = getStoredUser();

    try {
        await API.clans.sendMessage(currentClan.id, user.id, content, isAnnouncement);
        input.value = '';
        await loadChat();
    } catch (error) {
        showToast('error', error.message || 'Error al enviar mensaje');
    }
}

function showRequestModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal clan-request-modal">
            <div class="modal-header">
                <h3><i class="fas fa-envelope"></i> Solicitar unirse a ${currentClan.name}</h3>
                <button class="modal-close" id="closeModal">&times;</button>
            </div>
            <form id="requestForm">
                <div class="form-group">
                    <label class="form-label">Título de tu solicitud *</label>
                    <input type="text" class="form-control" name="title" required minlength="5" maxlength="100"
                           placeholder="Ej: Jugador experimentado busca equipo">
                </div>
                <div class="form-group">
                    <label class="form-label">¿Por qué quieres unirte? *</label>
                    <textarea class="form-control" name="message" required minlength="10" maxlength="500" rows="4"
                              placeholder="Cuéntales un poco sobre ti y por qué te gustaría unirte..."></textarea>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" id="cancelRequest">Cancelar</button>
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-paper-plane"></i> Enviar Solicitud
                    </button>
                </div>
            </form>
        </div>
    `;

    document.body.appendChild(modal);

    // Close modal
    const closeModal = () => modal.remove();
    modal.querySelector('#closeModal').addEventListener('click', closeModal);
    modal.querySelector('#cancelRequest').addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    // Submit form
    modal.querySelector('#requestForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const user = getStoredUser();

        try {
            await API.clans.sendRequest(currentClan.id, {
                user_id: user.id,
                title: formData.get('title'),
                message: formData.get('message')
            });
            showToast('success', 'Solicitud enviada correctamente');
            closeModal();
        } catch (error) {
            showToast('error', error.message || 'Error al enviar solicitud');
        }
    });
}

// Cleanup when leaving page
export function cleanup() {
    if (chatInterval) {
        clearInterval(chatInterval);
        chatInterval = null;
    }
}

export default { renderClanPage, cleanup };

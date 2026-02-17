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
        const clanResponse = await API.clans.getById(clanId);
        currentClan = clanResponse.data || {};

        // Ensure arrays and required fields exist
        if (!currentClan.members) currentClan.members = [];
        if (!currentClan.requests) currentClan.requests = [];
        if (!currentClan.access_type) currentClan.access_type = 'OPEN';
        if (!currentClan.name) currentClan.name = 'Sin nombre';
        if (!currentClan.tag) currentClan.tag = 'N/A';

        // Check if current user is a member
        if (isAuthenticated()) {
            const user = getStoredUser();
            if (user && user.id) {
                const membership = currentClan.members.find(m => m && m.user_id === user.id);
                userMembership = membership ? {
                    ...membership,
                    isLeader: currentClan.leader_id === user.id
                } : null;
            }
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
                        <p>${error.message || 'Error desconocido'}</p>
                        <a href="#/clanes" class="btn btn-primary">Volver a Clanes</a>
                    </div>
                </div>
            </div>
        `;
    }
}

function renderClanDetail(container) {
    const clan = currentClan;
    const isMember = !!userMembership;
    const isLeader = userMembership?.isLeader || false;
    const isOfficer = userMembership?.role === 'OFFICER';
    const canManage = isLeader || isOfficer;

    const accessType = clan.access_type || 'OPEN';
    const clanName = clan.name || 'Sin nombre';
    const clanTag = clan.tag || 'N/A';
    const memberCount = clan.members ? clan.members.length : 0;
    const maxMembers = clan.max_members || 50;
    const leaderName = clan.leader?.username || 'N/A';

    container.innerHTML = `
        <div class="clan-detail">
            <!-- Banner -->
            <div class="clan-detail-banner" style="${clan.banner_url ? "background-image: url('" + clan.banner_url + "')" : ''}">
                <div class="clan-detail-banner-overlay">
                    <a href="#/clanes" class="btn btn-secondary back-btn">
                        <i class="fas fa-arrow-left"></i> Volver
                    </a>
                    <div class="clan-detail-header">
                        <h1 class="clan-detail-name">${clanName}</h1>
                        <span class="clan-detail-tag">[${clanTag}]</span>
                        <div class="clan-access-badge ${accessType.toLowerCase()}">
                            <i class="fas ${getAccessIcon(accessType)}"></i>
                            ${getAccessLabel(accessType)}
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
                            <h3><i class="fas fa-info-circle"></i> Descripcion</h3>
                            <p>${clan.description || 'Este clan no tiene descripcion aun.'}</p>
                        </div>

                        ${clan.requirements ? '<div class="clan-card-section"><h3><i class="fas fa-clipboard-list"></i> Requisitos</h3><p>' + clan.requirements + '</p></div>' : ''}

                        <!-- Members -->
                        <div class="clan-card-section">
                            <h3><i class="fas fa-users"></i> Miembros (${memberCount}/${maxMembers})</h3>
                            <div class="clan-members-list">
                                ${renderMembersList(clan.members || [], canManage)}
                            </div>
                        </div>

                        <!-- Chat (members only) -->
                        ${isMember ? renderChatSection(canManage) : ''}
                    </div>

                    <!-- Sidebar -->
                    <div class="clan-detail-sidebar">
                        <div class="clan-info-card">
                            <div class="clan-info-item">
                                <i class="fas fa-crown"></i>
                                <div>
                                    <span class="label">Lider</span>
                                    <span class="value">${leaderName}</span>
                                </div>
                            </div>
                            ${clan.location ? '<div class="clan-info-item"><i class="fas fa-map-marker-alt"></i><div><span class="label">Region</span><span class="value">' + clan.location + '</span></div></div>' : ''}
                            <div class="clan-info-item">
                                <i class="fas fa-users"></i>
                                <div>
                                    <span class="label">Miembros</span>
                                    <span class="value">${memberCount} / ${maxMembers}</span>
                                </div>
                            </div>
                            <div class="clan-info-item">
                                <i class="fas fa-calendar"></i>
                                <div>
                                    <span class="label">Creado</span>
                                    <span class="value">${clan.created_at ? new Date(clan.created_at).toLocaleDateString() : 'N/A'}</span>
                                </div>
                            </div>
                        </div>

                        <!-- Actions -->
                        <div class="clan-actions">
                            ${renderActionButtons()}
                        </div>

                        <!-- Pending Requests (for leaders) -->
                        ${isLeader && clan.requests && clan.requests.length > 0 ? renderPendingRequests(clan.requests) : ''}
                    </div>
                </div>
            </div>
        </div>
    `;

    setupEventListeners();

    if (isMember) {
        loadChat();
    }
}

function renderMembersList(members, canManage) {
    if (!members || members.length === 0) {
        return '<p style="color: var(--text-secondary); padding: 12px;">No hay miembros registrados.</p>';
    }

    return members.map(function(member) {
        if (!member) return '';
        var username = member.user?.username || member.username || 'Usuario';
        var role = member.role || 'MEMBER';
        var userId = member.user_id || '';

        return '<div class="clan-member-item">' +
            '<div class="clan-member-profile-click" data-user-id="' + userId + '" style="display:flex; align-items:center; flex-grow:1; cursor:pointer;" title="Ver perfil de ' + username + '">' +
                '<div class="clan-member-avatar">' + username.charAt(0).toUpperCase() + '</div>' +
                '<div class="clan-member-info">' +
                    '<span class="clan-member-name">' + username + '</span>' +
                    '<span class="clan-member-role ' + role.toLowerCase() + '">' + getRoleLabel(role) + '</span>' +
                '</div>' +
            '</div>' +
            (canManage && role !== 'LEADER' ?
                '<div class="clan-member-actions">' +
                    '<button class="btn btn-sm btn-secondary" data-action="role" data-user-id="' + userId + '"><i class="fas fa-user-tag"></i></button>' +
                    '<button class="btn btn-sm btn-danger" data-action="kick" data-user-id="' + userId + '"><i class="fas fa-times"></i></button>' +
                '</div>' : '') +
        '</div>';
    }).join('');
}

function renderChatSection(canManage) {
    return '<div class="clan-card-section clan-chat-section">' +
        '<h3><i class="fas fa-comments"></i> Chat del Clan</h3>' +
        '<div class="clan-chat" id="clanChat">' +
            '<div class="clan-chat-messages" id="chatMessages">' +
                '<div class="loading-spinner-small"></div>' +
            '</div>' +
            '<div class="clan-chat-input">' +
                '<input type="text" id="chatInput" placeholder="Escribe un mensaje..." maxlength="1000">' +
                '<button class="btn btn-primary" id="sendMessage"><i class="fas fa-paper-plane"></i></button>' +
                (canManage ? '<button class="btn btn-accent" id="sendAnnouncement" title="Enviar como anuncio"><i class="fas fa-bullhorn"></i></button>' : '') +
            '</div>' +
        '</div>' +
    '</div>';
}

function renderPendingRequests(requests) {
    if (!requests || requests.length === 0) return '';

    var requestItems = requests.map(function(req) {
        if (!req) return '';
        var reqUsername = req.user?.username || 'Usuario';
        var reqDate = req.created_at ? new Date(req.created_at).toLocaleDateString() : '';
        var reqTitle = req.title || 'Sin titulo';
        var reqMessage = req.message || '';
        var reqId = req.id || '';

        return '<div class="clan-request-item" data-request-id="' + reqId + '">' +
            '<div class="request-header">' +
                '<strong>' + reqUsername + '</strong>' +
                '<span class="request-date">' + reqDate + '</span>' +
            '</div>' +
            '<div class="request-title">' + reqTitle + '</div>' +
            '<div class="request-message">' + reqMessage + '</div>' +
            '<div class="request-actions">' +
                '<button class="btn btn-sm btn-success" data-action="approve" data-id="' + reqId + '"><i class="fas fa-check"></i> Aprobar</button>' +
                '<button class="btn btn-sm btn-danger" data-action="reject" data-id="' + reqId + '"><i class="fas fa-times"></i> Rechazar</button>' +
            '</div>' +
        '</div>';
    }).join('');

    return '<div class="clan-requests-card">' +
        '<h4><i class="fas fa-envelope"></i> Solicitudes Pendientes</h4>' +
        '<div class="clan-requests-list">' + requestItems + '</div>' +
    '</div>';
}

function renderActionButtons() {
    var clan = currentClan;
    var isMember = !!userMembership;
    var isLeader = userMembership?.isLeader || false;
    var accessType = clan.access_type || 'OPEN';

    if (!isAuthenticated()) {
        return '<a href="#login" class="btn btn-primary btn-block"><i class="fas fa-sign-in-alt"></i> Inicia sesion para unirte</a>';
    }

    if (isLeader) {
        return '<button class="btn btn-secondary btn-block" id="btnEditClan"><i class="fas fa-edit"></i> Editar Clan</button>' +
            '<button class="btn btn-danger btn-block" id="btnDeleteClan"><i class="fas fa-trash"></i> Eliminar Clan</button>';
    }

    if (isMember) {
        return '<button class="btn btn-danger btn-block" id="btnLeaveClan"><i class="fas fa-door-open"></i> Abandonar Clan</button>';
    }

    if (accessType === 'OPEN') {
        return '<button class="btn btn-primary btn-block" id="btnJoinClan"><i class="fas fa-user-plus"></i> Unirse al Clan</button>';
    }

    if (accessType === 'INVITE_ONLY') {
        return '<button class="btn btn-primary btn-block" id="btnRequestJoin"><i class="fas fa-envelope"></i> Solicitar Unirse</button>';
    }

    return '<div class="clan-closed-notice"><i class="fas fa-lock"></i><p>Este clan no acepta nuevos miembros</p></div>';
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
        case 'INVITE_ONLY': return 'Por Invitacion';
        case 'CLOSED': return 'Cerrado';
        default: return type || 'Desconocido';
    }
}

function getRoleLabel(role) {
    switch (role) {
        case 'LEADER': return 'Lider';
        case 'OFFICER': return 'Oficial';
        case 'MEMBER': return 'Miembro';
        default: return role || 'Miembro';
    }
}

async function loadChat() {
    try {
        var response = await API.clans.getMessages(currentClan.id);
        chatMessages = response.data || [];
        renderChatMessages();
    } catch (error) {
        console.error('Error loading chat:', error);
    }
}

function renderChatMessages() {
    var msgContainer = document.getElementById('chatMessages');
    if (!msgContainer) return;

    var user = getStoredUser();

    if (!chatMessages || chatMessages.length === 0) {
        msgContainer.innerHTML = '<div class="chat-empty"><i class="fas fa-comments"></i><p>No hay mensajes aun. Sea el primero en escribir!</p></div>';
        return;
    }

    msgContainer.innerHTML = chatMessages.map(function(msg) {
        if (!msg) return '';
        var msgUsername = msg.user?.username || 'Usuario';
        var isOwn = user && msg.user_id === user.id;
        var isAnnouncement = msg.is_announcement || false;
        var msgTime = msg.created_at ? formatTime(msg.created_at) : '';
        var msgContent = msg.content ? escapeHtml(msg.content) : '';

        return '<div class="chat-message ' + (isOwn ? 'own' : '') + ' ' + (isAnnouncement ? 'announcement' : '') + '">' +
            (isAnnouncement ? '<div class="announcement-badge"><i class="fas fa-bullhorn"></i> Anuncio</div>' : '') +
            '<div class="chat-message-header">' +
                '<span class="chat-username">' + msgUsername + '</span>' +
                '<span class="chat-time">' + msgTime + '</span>' +
            '</div>' +
            '<div class="chat-message-content">' + msgContent + '</div>' +
        '</div>';
    }).join('');

    msgContainer.scrollTop = msgContainer.scrollHeight;
}

function formatTime(dateStr) {
    try {
        var date = new Date(dateStr);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
        return '';
    }
}

function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function setupEventListeners() {
    var user = isAuthenticated() ? getStoredUser() : null;

    // Join clan
    document.getElementById('btnJoinClan')?.addEventListener('click', async function() {
        if (!user) return;
        try {
            await API.clans.join(currentClan.id, user.id);
            showToast('success', 'Te has unido al clan!');
            location.reload();
        } catch (error) {
            showToast('error', error.message || 'Error al unirse');
        }
    });

    // Request to join
    document.getElementById('btnRequestJoin')?.addEventListener('click', function() {
        showRequestModal();
    });

    // Leave clan
    document.getElementById('btnLeaveClan')?.addEventListener('click', function() {
        showLeaveClanModal();
    });

    // Delete clan
    document.getElementById('btnDeleteClan')?.addEventListener('click', function() {
        showDeleteClanModal();
    });

    // Edit clan
    document.getElementById('btnEditClan')?.addEventListener('click', function() {
        showEditClanModal();
    });

    // Send message
    document.getElementById('sendMessage')?.addEventListener('click', function() { sendChatMessage(false); });
    document.getElementById('sendAnnouncement')?.addEventListener('click', function() { sendChatMessage(true); });
    document.getElementById('chatInput')?.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') sendChatMessage(false);
    });

    // Approve/Reject requests
    document.querySelectorAll('[data-action="approve"]').forEach(function(btn) {
        btn.addEventListener('click', async function() {
            var requestId = btn.dataset.id;
            try {
                await API.clans.approveRequest(currentClan.id, requestId);
                showToast('success', 'Solicitud aprobada');
                location.reload();
            } catch (error) {
                showToast('error', error.message || 'Error al aprobar');
            }
        });
    });

    document.querySelectorAll('[data-action="reject"]').forEach(function(btn) {
        btn.addEventListener('click', async function() {
            var requestId = btn.dataset.id;
            try {
                await API.clans.rejectRequest(currentClan.id, requestId);
                showToast('success', 'Solicitud rechazada');
                location.reload();
            } catch (error) {
                showToast('error', error.message || 'Error al rechazar');
            }
        });
    });

    // Kick member
    document.querySelectorAll('[data-action="kick"]').forEach(function(btn) {
        btn.addEventListener('click', async function() {
            var userId = btn.dataset.userId;
            if (!confirm('Expulsar a este miembro?')) return;
            try {
                await API.clans.removeMember(currentClan.id, userId);
                showToast('success', 'Miembro expulsado');
                location.reload();
            } catch (error) {
                showToast('error', error.message || 'Error al expulsar');
            }
        });
    });

    // View Member Profile
    document.querySelectorAll('.clan-member-profile-click').forEach(function(item) {
        item.addEventListener('click', function() {
            var userId = item.dataset.userId;
            if (window.showPlayerProfile) {
                window.showPlayerProfile(userId);
            }
        });
    });
}

async function sendChatMessage(isAnnouncement) {
    var input = document.getElementById('chatInput');
    if (!input) return;
    var content = input.value.trim();
    if (!content) return;

    var user = getStoredUser();
    if (!user) return;

    try {
        await API.clans.sendMessage(currentClan.id, user.id, content, isAnnouncement);
        input.value = '';
        await loadChat();
    } catch (error) {
        showToast('error', error.message || 'Error al enviar mensaje');
    }
}

function showRequestModal() {
    var clanName = currentClan.name || 'este clan';
    var modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = '<div class="modal clan-request-modal">' +
        '<div class="modal-header">' +
            '<h3><i class="fas fa-envelope"></i> Solicitar unirse a ' + clanName + '</h3>' +
            '<button class="modal-close" id="closeModal">&times;</button>' +
        '</div>' +
        '<form id="requestForm">' +
            '<div class="form-group">' +
                '<label class="form-label">Titulo de tu solicitud *</label>' +
                '<input type="text" class="form-control" name="title" required minlength="5" maxlength="100" placeholder="Ej: Jugador experimentado busca equipo">' +
            '</div>' +
            '<div class="form-group">' +
                '<label class="form-label">Por que quieres unirte? *</label>' +
                '<textarea class="form-control" name="message" required minlength="10" maxlength="500" rows="4" placeholder="Cuentales un poco sobre ti y por que te gustaria unirte..."></textarea>' +
            '</div>' +
            '<div class="modal-footer">' +
                '<button type="button" class="btn btn-secondary" id="cancelRequest">Cancelar</button>' +
                '<button type="submit" class="btn btn-primary"><i class="fas fa-paper-plane"></i> Enviar Solicitud</button>' +
            '</div>' +
        '</form>' +
    '</div>';

    document.body.appendChild(modal);

    var closeModal = function() { modal.remove(); };
    modal.querySelector('#closeModal').addEventListener('click', closeModal);
    modal.querySelector('#cancelRequest').addEventListener('click', closeModal);
    modal.addEventListener('click', function(e) {
        if (e.target === modal) closeModal();
    });

    modal.querySelector('#requestForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        var formData = new FormData(e.target);
        var user = getStoredUser();
        if (!user) return;

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

// =====================================================
// Modal de Edicion de Clan
// =====================================================
function showEditClanModal() {
    var clan = currentClan;
    var clanName = clan.name || '';
    var clanTag = clan.tag || '';
    var clanDesc = clan.description || '';
    var clanReqs = clan.requirements || '';
    var clanAccess = clan.access_type || 'OPEN';
    var clanMaxMembers = clan.max_members || 50;
    var clanBanner = clan.banner_url || '';

    var modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = '<div class="modal edit-clan-modal">' +
        '<div class="modal-header">' +
            '<h3><i class="fas fa-edit"></i> Editar Clan</h3>' +
            '<button class="modal-close" id="closeModal">&times;</button>' +
        '</div>' +
        '<form id="editClanForm" class="edit-clan-form">' +
            '<div class="form-group">' +
                '<label class="form-label">Nombre del Clan *</label>' +
                '<input type="text" class="form-control" name="name" value="' + clanName + '" required minlength="3" maxlength="30">' +
            '</div>' +
            '<div class="form-group">' +
                '<label class="form-label">Tag del Clan *</label>' +
                '<input type="text" class="form-control" name="tag" value="' + clanTag + '" required minlength="2" maxlength="5">' +
                '<span class="form-hint">2-5 caracteres, ej: [APEX]</span>' +
            '</div>' +
            '<div class="form-group">' +
                '<label class="form-label">Descripcion</label>' +
                '<textarea class="form-control" name="description" rows="4" maxlength="500">' + clanDesc + '</textarea>' +
            '</div>' +
            '<div class="form-group">' +
                '<label class="form-label">Requisitos para unirse</label>' +
                '<textarea class="form-control" name="requirements" rows="3" maxlength="300">' + clanReqs + '</textarea>' +
            '</div>' +
            '<div class="form-group">' +
                '<label class="form-label">Tipo de Acceso</label>' +
                '<select class="form-control" name="access_type">' +
                    '<option value="OPEN"' + (clanAccess === 'OPEN' ? ' selected' : '') + '>Abierto - Cualquiera puede unirse</option>' +
                    '<option value="INVITE_ONLY"' + (clanAccess === 'INVITE_ONLY' ? ' selected' : '') + '>Por Invitacion - Requiere aprobacion</option>' +
                    '<option value="CLOSED"' + (clanAccess === 'CLOSED' ? ' selected' : '') + '>Cerrado - No acepta miembros</option>' +
                '</select>' +
            '</div>' +
            '<div class="form-group">' +
                '<label class="form-label">Maximo de Miembros</label>' +
                '<select class="form-control" name="max_members">' +
                    '<option value="25"' + (clanMaxMembers === 25 ? ' selected' : '') + '>25 miembros</option>' +
                    '<option value="50"' + (clanMaxMembers === 50 ? ' selected' : '') + '>50 miembros</option>' +
                    '<option value="100"' + (clanMaxMembers === 100 ? ' selected' : '') + '>100 miembros</option>' +
                '</select>' +
            '</div>' +
            '<div class="form-group">' +
                '<label class="form-label">URL del Banner (opcional)</label>' +
                '<input type="url" class="form-control" name="banner_url" value="' + clanBanner + '" placeholder="https://...">' +
            '</div>' +
            '<div class="modal-footer">' +
                '<button type="button" class="btn btn-secondary" id="cancelEdit">Cancelar</button>' +
                '<button type="submit" class="btn btn-primary" id="saveEditBtn"><i class="fas fa-save"></i> Guardar Cambios</button>' +
            '</div>' +
        '</form>' +
    '</div>';

    document.body.appendChild(modal);

    var closeModal = function() { modal.remove(); };
    modal.querySelector('#closeModal').addEventListener('click', closeModal);
    modal.querySelector('#cancelEdit').addEventListener('click', closeModal);
    modal.addEventListener('click', function(e) {
        if (e.target === modal) closeModal();
    });

    modal.querySelector('#editClanForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        var formData = new FormData(e.target);
        var saveBtn = modal.querySelector('#saveEditBtn');

        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';

        try {
            await API.clans.update(clan.id, {
                name: formData.get('name'),
                tag: formData.get('tag'),
                description: formData.get('description'),
                requirements: formData.get('requirements'),
                access_type: formData.get('access_type'),
                max_members: parseInt(formData.get('max_members')),
                banner_url: formData.get('banner_url') || null
            });
            showToast('success', 'Clan actualizado correctamente!');
            closeModal();
            location.reload();
        } catch (error) {
            showToast('error', error.message || 'Error al actualizar el clan');
            saveBtn.disabled = false;
            saveBtn.innerHTML = '<i class="fas fa-save"></i> Guardar Cambios';
        }
    });
}

// =====================================================
// Modal de Confirmacion para Eliminar Clan
// =====================================================
function showDeleteClanModal() {
    var clan = currentClan;
    var clanName = clan.name || 'este clan';
    var clanTag = clan.tag || '';
    var memberCount = clan.members ? clan.members.length : 0;

    var modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = '<div class="modal confirm-modal danger-modal">' +
        '<div class="confirm-modal-icon danger"><i class="fas fa-exclamation-triangle"></i></div>' +
        '<h3 class="confirm-modal-title">Eliminar ' + clanName + '?</h3>' +
        '<p class="confirm-modal-text">Esta accion <strong>no se puede deshacer</strong>. Se eliminara:</p>' +
        '<ul class="confirm-modal-list">' +
            '<li><i class="fas fa-times-circle"></i> El clan y toda su informacion</li>' +
            '<li><i class="fas fa-times-circle"></i> Todos los ' + memberCount + ' miembros seran removidos</li>' +
            '<li><i class="fas fa-times-circle"></i> El historial de chat completo</li>' +
            '<li><i class="fas fa-times-circle"></i> Todas las solicitudes pendientes</li>' +
        '</ul>' +
        (clanTag ? '<div class="confirm-modal-input"><label>Escribe <strong>' + clanTag + '</strong> para confirmar:</label><input type="text" id="confirmDeleteInput" placeholder="Escribe el tag del clan" autocomplete="off"></div>' : '') +
        '<div class="confirm-modal-actions">' +
            '<button class="btn btn-secondary" id="cancelDelete"><i class="fas fa-arrow-left"></i> Cancelar</button>' +
            '<button class="btn btn-danger" id="confirmDelete"' + (clanTag ? ' disabled' : '') + '><i class="fas fa-trash"></i> Eliminar Clan</button>' +
        '</div>' +
    '</div>';

    document.body.appendChild(modal);

    var confirmInput = modal.querySelector('#confirmDeleteInput');
    var confirmBtn = modal.querySelector('#confirmDelete');

    if (confirmInput && clanTag) {
        confirmInput.addEventListener('input', function() {
            confirmBtn.disabled = confirmInput.value.toUpperCase() !== clanTag.toUpperCase();
        });
    }

    var closeModal = function() { modal.remove(); };
    modal.querySelector('#cancelDelete').addEventListener('click', closeModal);
    modal.addEventListener('click', function(e) {
        if (e.target === modal) closeModal();
    });

    confirmBtn.addEventListener('click', async function() {
        confirmBtn.disabled = true;
        confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Eliminando...';

        try {
            await API.clans.delete(clan.id);
            showToast('success', 'Clan eliminado permanentemente');
            closeModal();
            window.location.hash = '#/clanes';
        } catch (error) {
            showToast('error', error.message || 'Error al eliminar el clan');
            confirmBtn.disabled = false;
            confirmBtn.innerHTML = '<i class="fas fa-trash"></i> Eliminar Clan';
        }
    });
}

// =====================================================
// Modal de Confirmacion para Abandonar Clan
// =====================================================
function showLeaveClanModal() {
    var clan = currentClan;
    var clanName = clan.name || 'este clan';
    var user = getStoredUser();

    var modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = '<div class="modal confirm-modal warning-modal">' +
        '<div class="confirm-modal-icon warning"><i class="fas fa-door-open"></i></div>' +
        '<h3 class="confirm-modal-title">Abandonar ' + clanName + '?</h3>' +
        '<p class="confirm-modal-text">Estas a punto de abandonar el clan. Ten en cuenta que:</p>' +
        '<ul class="confirm-modal-list warning">' +
            '<li><i class="fas fa-info-circle"></i> Perderas acceso al chat del clan</li>' +
            '<li><i class="fas fa-info-circle"></i> Tu historial de mensajes permanecera</li>' +
            '<li><i class="fas fa-info-circle"></i> Podras volver a unirte si el clan es abierto</li>' +
        '</ul>' +
        '<div class="confirm-modal-actions">' +
            '<button class="btn btn-secondary" id="cancelLeave"><i class="fas fa-times"></i> Cancelar</button>' +
            '<button class="btn btn-warning" id="confirmLeave"><i class="fas fa-door-open"></i> Si, Abandonar</button>' +
        '</div>' +
    '</div>';

    document.body.appendChild(modal);

    var closeModal = function() { modal.remove(); };
    modal.querySelector('#cancelLeave').addEventListener('click', closeModal);
    modal.addEventListener('click', function(e) {
        if (e.target === modal) closeModal();
    });

    modal.querySelector('#confirmLeave').addEventListener('click', async function() {
        var confirmBtn = modal.querySelector('#confirmLeave');
        confirmBtn.disabled = true;
        confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saliendo...';

        try {
            await API.clans.removeMember(clan.id, user.id);
            showToast('success', 'Has abandonado el clan');
            closeModal();
            window.location.hash = '#/clanes';
        } catch (error) {
            showToast('error', error.message || 'Error al abandonar el clan');
            confirmBtn.disabled = false;
            confirmBtn.innerHTML = '<i class="fas fa-door-open"></i> Si, Abandonar';
        }
    });
}

export default { renderClanPage, cleanup };

// =====================================================
// PAGE - Clan Detail — Solo Líder + Miembros
// Líder invita, jugador acepta/rechaza, miembros reportan
// =====================================================

import API from '../api.js';
import { getStoredUser, isAuthenticated } from '../auth.js';
import { showToast } from '../ui-helpers.js';

var currentClan = null;
var userMembership = null;
var chatMessages = [];
var chatInterval = null;

// =====================================================
// DEMO DATA
// =====================================================
var DEMO_MEMBERS = [
    { user_id: 'u1', user: { username: 'PhantomX' }, username: 'PhantomX', role: 'LEADER', joined_at: '2025-08-15T10:00:00Z' },
    { user_id: 'u2', user: { username: 'NightViper' }, username: 'NightViper', role: 'MEMBER', joined_at: '2025-08-20T10:00:00Z' },
    { user_id: 'u3', user: { username: 'StormBreaker' }, username: 'StormBreaker', role: 'MEMBER', joined_at: '2025-09-01T10:00:00Z' },
    { user_id: 'u4', user: { username: 'LunaEclipse' }, username: 'LunaEclipse', role: 'MEMBER', joined_at: '2025-09-15T10:00:00Z' },
    { user_id: 'u5', user: { username: 'BlazeFury' }, username: 'BlazeFury', role: 'MEMBER', joined_at: '2025-10-01T10:00:00Z' },
    { user_id: 'u6', user: { username: 'ShadowHawk' }, username: 'ShadowHawk', role: 'MEMBER', joined_at: '2025-10-10T10:00:00Z' },
    { user_id: 'u7', user: { username: 'CyberNinja' }, username: 'CyberNinja', role: 'MEMBER', joined_at: '2025-10-20T10:00:00Z' },
    { user_id: 'u8', user: { username: 'ArcticWolf' }, username: 'ArcticWolf', role: 'MEMBER', joined_at: '2025-11-01T10:00:00Z' },
    { user_id: 'u9', user: { username: 'ThunderBolt' }, username: 'ThunderBolt', role: 'MEMBER', joined_at: '2025-11-15T10:00:00Z' },
    { user_id: 'u10', user: { username: 'PixelKnight' }, username: 'PixelKnight', role: 'MEMBER', joined_at: '2025-12-01T10:00:00Z' },
    { user_id: 'u11', user: { username: 'VortexRider' }, username: 'VortexRider', role: 'MEMBER', joined_at: '2025-12-10T10:00:00Z' },
    { user_id: 'u12', user: { username: 'NovaFlare' }, username: 'NovaFlare', role: 'MEMBER', joined_at: '2026-01-05T10:00:00Z' }
];

var DEMO_CHAT = [
    { user_id: 'u1', user: { username: 'PhantomX' }, content: 'Bienvenidos a Shadow Reapers! El torneo empieza este sabado a las 8PM.', is_announcement: true, created_at: '2026-02-20T18:00:00Z' },
    { user_id: 'u2', user: { username: 'NightViper' }, content: 'Alguien quiere practicar ranked hoy?', is_announcement: false, created_at: '2026-02-20T19:30:00Z' },
    { user_id: 'u4', user: { username: 'LunaEclipse' }, content: 'Yo me apunto! Dame 10 minutos.', is_announcement: false, created_at: '2026-02-20T19:32:00Z' },
    { user_id: 'u5', user: { username: 'BlazeFury' }, content: 'Ya vieron el nuevo parche? Nerfearon bastante a mi main.', is_announcement: false, created_at: '2026-02-20T20:00:00Z' },
    { user_id: 'u3', user: { username: 'StormBreaker' }, content: 'Si, pero buffaron a otros. Toca adaptarse al nuevo meta.', is_announcement: false, created_at: '2026-02-20T20:05:00Z' },
    { user_id: 'u7', user: { username: 'CyberNinja' }, content: 'GG la partida de hoy, tremendo clutch de NightViper!', is_announcement: false, created_at: '2026-02-20T21:30:00Z' },
    { user_id: 'u2', user: { username: 'NightViper' }, content: 'Jaja gracias! Fue pura suerte pero no le digan a nadie.', is_announcement: false, created_at: '2026-02-20T21:32:00Z' },
    { user_id: 'u1', user: { username: 'PhantomX' }, content: 'Lineup para el torneo: NightViper, StormBreaker, LunaEclipse, BlazeFury y yo. Suplentes: ShadowHawk y CyberNinja.', is_announcement: true, created_at: '2026-02-21T10:00:00Z' },
    { user_id: 'u8', user: { username: 'ArcticWolf' }, content: 'Puedo ser suplente tambien? He estado practicando mucho.', is_announcement: false, created_at: '2026-02-21T10:15:00Z' },
    { user_id: 'u1', user: { username: 'PhantomX' }, content: 'Claro Arctic, te agrego a la lista. Vamos con todo!', is_announcement: false, created_at: '2026-02-21T10:20:00Z' },
    { user_id: 'u6', user: { username: 'ShadowHawk' }, content: 'Alguien me explica la nueva estrategia? Me perdi la reunion.', is_announcement: false, created_at: '2026-02-21T12:00:00Z' },
    { user_id: 'u3', user: { username: 'StormBreaker' }, content: 'Te la explico por Discord, conectate en 5.', is_announcement: false, created_at: '2026-02-21T12:02:00Z' }
];

var DEMO_PENDING_INVITES = [
    { id: 'inv1', username: 'GameMaster42', status: 'PENDING', sent_at: '2026-02-20T14:00:00Z' },
    { id: 'inv2', username: 'RocketPunch', status: 'PENDING', sent_at: '2026-02-21T09:00:00Z' }
];

function getDemoClan(clanId) {
    return {
        id: clanId,
        name: 'Shadow Reapers',
        tag: 'SHR',
        description: 'Somos un clan competitivo de alto nivel enfocado en torneos de Apex Legends y Valorant. Buscamos jugadores dedicados con mentalidad ganadora. Fundados en agosto de 2025, hemos crecido hasta convertirnos en uno de los clanes mas respetados de la comunidad.',
        requirements: 'Minimo nivel 50 en el juego\nDisponibilidad para entrenar 3 veces por semana\nMicrofono y Discord obligatorio\nActitud positiva y trabajo en equipo',
        access_type: 'INVITE_ONLY',
        member_count: 12,
        max_members: 50,
        location: 'Latinoamerica',
        banner_url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&q=80',
        leader: { username: 'PhantomX' },
        leader_id: 'u1',
        created_at: '2025-08-15T10:00:00Z',
        members: DEMO_MEMBERS,
        pending_invites: DEMO_PENDING_INVITES
    };
}

// =====================================================
// MAIN RENDER
// =====================================================

export function renderClanPage(container, clanId) {
    container.innerHTML = '<div class="section"><div class="container">' +
        '<div style="text-align:center;padding:60px 0"><div class="spinner"></div><p style="margin-top:12px;color:rgba(255,255,255,0.5)">Cargando clan...</p></div>' +
        '</div></div>';

    loadClanData(container, clanId);
}

async function loadClanData(container, clanId) {
    try {
        var clanData;
        if (clanId && clanId.indexOf('demo-') === 0) {
            clanData = getDemoClan(clanId);
        } else {
            try {
                var resp = await API.clans.getById(clanId);
                clanData = resp.data || resp || {};
            } catch (e) {
                clanData = getDemoClan(clanId);
            }
        }

        currentClan = clanData;
        if (!currentClan.members) currentClan.members = [];
        if (!currentClan.pending_invites) currentClan.pending_invites = [];
        if (!currentClan.access_type) currentClan.access_type = 'OPEN';
        if (!currentClan.name) currentClan.name = 'Sin nombre';
        if (!currentClan.tag) currentClan.tag = 'N/A';

        // Determine user membership
        var isDemo = clanId && clanId.indexOf('demo-') === 0;
        if (isDemo) {
            userMembership = { user_id: 'u1', role: 'LEADER', isLeader: true };
        } else if (isAuthenticated()) {
            var user = getStoredUser();
            if (user && user.id) {
                var found = null;
                for (var i = 0; i < currentClan.members.length; i++) {
                    if (currentClan.members[i] && currentClan.members[i].user_id === user.id) {
                        found = currentClan.members[i];
                        break;
                    }
                }
                userMembership = found ? {
                    user_id: found.user_id,
                    role: found.role,
                    isLeader: currentClan.leader_id === user.id
                } : null;
            }
        } else {
            userMembership = null;
        }

        renderFullPage(container);
    } catch (error) {
        container.innerHTML = '<div class="section"><div class="container">' +
            '<div class="error-state"><i class="fas fa-exclamation-triangle"></i>' +
            '<h3>Clan no encontrado</h3><p>' + (error.message || 'Error desconocido') + '</p>' +
            '<a href="#/clanes" class="btn btn-primary" style="margin-top:16px">Volver a Clanes</a></div></div></div>';
    }
}

function renderFullPage(container) {
    var clan = currentClan;
    var isMember = !!userMembership;
    var isLeader = userMembership ? userMembership.isLeader : false;
    var accessType = clan.access_type || 'OPEN';
    var memberCount = clan.members ? clan.members.length : 0;
    var maxMembers = clan.max_members || 50;
    var memberPercent = Math.min(100, Math.round((memberCount / maxMembers) * 100));
    var leaderName = clan.leader ? clan.leader.username : 'N/A';
    var bannerStyle = clan.banner_url ? "background-image:url('" + clan.banner_url + "');background-size:cover;background-position:center;" : '';

    var accessIcon = getAccessIcon(accessType);
    var accessLabel = getAccessLabel(accessType);

    // Build tabs
    var tabsHtml = '<button class="clan-tab active" data-tab="info"><i class="fas fa-info-circle"></i> Info</button>' +
        '<button class="clan-tab" data-tab="members"><i class="fas fa-users"></i> Miembros <span class="tab-badge">' + memberCount + '</span></button>';
    if (isMember) {
        tabsHtml += '<button class="clan-tab" data-tab="chat"><i class="fas fa-comments"></i> Chat</button>';
    }
    if (isLeader) {
        tabsHtml += '<button class="clan-tab" data-tab="manage"><i class="fas fa-cog"></i> Gestion</button>';
    }

    // Build page
    container.innerHTML = '<div class="clan-detail">' +
        '<div class="clan-detail-banner" style="' + bannerStyle + '">' +
        '<div class="clan-detail-banner-overlay">' +
        '<a href="#/clanes" class="btn btn-secondary back-btn"><i class="fas fa-arrow-left"></i> Volver</a>' +
        '<div class="clan-detail-header">' +
        '<h1 class="clan-detail-name">' + (clan.name || 'Sin nombre') + '</h1>' +
        '<span class="clan-detail-tag">[' + (clan.tag || 'N/A') + ']</span>' +
        '<div class="clan-access-badge ' + accessType.toLowerCase() + '">' +
        '<i class="fas ' + accessIcon + '"></i> ' + accessLabel +
        '</div>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '<div class="container"><div class="clan-detail-grid">' +
        '<div class="clan-detail-main">' +
        '<div class="clan-tabs">' + tabsHtml + '</div>' +
        buildTabInfo(clan) +
        buildTabMembers(clan, isLeader) +
        (isMember ? buildTabChat(isLeader) : '') +
        (isLeader ? buildTabManage(clan) : '') +
        '</div>' +
        '<div class="clan-detail-sidebar">' +
        buildSidebar(clan, accessType, accessIcon, accessLabel, leaderName, memberCount, maxMembers, memberPercent) +
        buildActionButtons(clan, isMember, isLeader, accessType) +
        '</div>' +
        '</div></div>' +
        '</div>';

    setupTabs();
    setupEvents();
    if (isMember) loadChat();
}

// =====================================================
// TAB BUILDERS
// =====================================================

function buildTabInfo(clan) {
    var reqHtml = '';
    if (clan.requirements) {
        reqHtml = '<div class="clan-card-section" style="margin-top:16px">' +
            '<h3><i class="fas fa-clipboard-list"></i> Requisitos</h3>' +
            '<p style="white-space:pre-line">' + (clan.requirements || '') + '</p></div>';
    }
    return '<div class="clan-tab-content active" id="tab-info">' +
        '<div class="clan-card-section">' +
        '<h3><i class="fas fa-info-circle"></i> Descripcion</h3>' +
        '<p>' + (clan.description || 'Este clan no tiene descripcion aun.') + '</p>' +
        '</div>' + reqHtml + '</div>';
}

function buildTabMembers(clan, isLeader) {
    var members = clan.members || [];
    var count = members.length;
    var max = clan.max_members || 50;
    var pct = Math.min(100, Math.round((count / max) * 100));

    var listHtml = '';
    if (members.length === 0) {
        listHtml = '<p style="color:rgba(255,255,255,0.5);padding:12px">No hay miembros registrados.</p>';
    } else {
        for (var i = 0; i < members.length; i++) {
            var m = members[i];
            if (!m) continue;
            var uname = (m.user && m.user.username) ? m.user.username : (m.username || 'Usuario');
            var role = m.role || 'MEMBER';
            var uid = m.user_id || '';
            var initial = uname.charAt(0).toUpperCase();

            var roleHtml = '';
            if (role === 'LEADER') {
                roleHtml = '<span class="clan-member-role leader"><i class="fas fa-crown" style="margin-right:4px;font-size:9px"></i>Lider</span>';
            } else {
                roleHtml = '<span class="clan-member-role member">Miembro</span>';
            }

            var actionsHtml = '';
            if (isLeader && role !== 'LEADER') {
                actionsHtml = '<div class="clan-member-actions">' +
                    '<button class="btn btn-sm btn-danger" data-action="kick" data-user-id="' + uid + '" title="Expulsar"><i class="fas fa-times"></i></button>' +
                    '</div>';
            }

            listHtml += '<div class="clan-member-item">' +
                '<div class="clan-member-profile-click" data-user-id="' + uid + '">' +
                '<div class="clan-member-avatar">' + initial + '</div>' +
                '<div class="clan-member-info">' +
                '<span class="clan-member-name">' + uname + '</span>' +
                roleHtml +
                '</div>' +
                '</div>' +
                actionsHtml +
                '</div>';
        }
    }

    return '<div class="clan-tab-content" id="tab-members">' +
        '<div class="clan-card-section">' +
        '<h3><i class="fas fa-users"></i> Miembros (' + count + '/' + max + ')</h3>' +
        '<div class="clan-members-bar" style="margin-bottom:16px"><div class="clan-members-bar-fill" style="width:' + pct + '%"></div></div>' +
        '<div class="clan-members-list">' + listHtml + '</div>' +
        '</div>' +
        '</div>';
}

function buildTabChat(isLeader) {
    var announceBtnHtml = isLeader ? '<button class="btn btn-accent" id="sendAnnouncement" title="Enviar como anuncio"><i class="fas fa-bullhorn"></i></button>' : '';

    return '<div class="clan-tab-content" id="tab-chat">' +
        '<div class="clan-card-section">' +
        '<h3><i class="fas fa-comments"></i> Chat del Clan</h3>' +
        '<div class="clan-chat">' +
        '<div class="clan-chat-messages" id="chatMessages"><div style="text-align:center;padding:20px;color:rgba(255,255,255,0.4)">Cargando mensajes...</div></div>' +
        '<div class="clan-chat-input">' +
        '<input type="text" id="chatInput" placeholder="Escribe un mensaje..." maxlength="1000">' +
        '<button class="btn btn-primary" id="sendMessage" title="Enviar"><i class="fas fa-paper-plane"></i></button>' +
        announceBtnHtml +
        '</div>' +
        '</div>' +
        '</div>' +
        '</div>';
}

function buildTabManage(clan) {
    // Invite section
    var inviteHtml = '<div class="invite-section">' +
        '<h3><i class="fas fa-user-plus"></i> Invitar Jugador</h3>' +
        '<p style="font-size:0.85rem;color:rgba(255,255,255,0.5);margin-bottom:10px">Busca un jugador por su nombre de usuario y enviale una invitacion.</p>' +
        '<div class="invite-form">' +
        '<input type="text" id="inviteUsername" placeholder="Nombre de usuario...">' +
        '<button class="btn btn-primary" id="btnSendInvite"><i class="fas fa-paper-plane"></i> Invitar</button>' +
        '</div>';

    // Pending invites
    var invites = clan.pending_invites || [];
    if (invites.length > 0) {
        inviteHtml += '<h4 style="margin-top:16px;font-size:0.85rem;color:rgba(255,255,255,0.6)"><i class="fas fa-clock"></i> Invitaciones Pendientes (' + invites.length + ')</h4>';
        for (var i = 0; i < invites.length; i++) {
            var inv = invites[i];
            var invName = inv.username || 'Usuario';
            inviteHtml += '<div class="pending-invite">' +
                '<div class="invite-info">' +
                '<div class="invite-avatar">' + invName.charAt(0).toUpperCase() + '</div>' +
                '<div><div class="invite-name">' + invName + '</div><div class="invite-status">Pendiente</div></div>' +
                '</div>' +
                '<button class="btn btn-sm btn-danger" data-action="cancel-invite" data-invite-id="' + (inv.id || '') + '" title="Cancelar"><i class="fas fa-times"></i></button>' +
                '</div>';
        }
    }
    inviteHtml += '</div>';

    // Clan management
    var manageHtml = '<div class="clan-card-section" style="margin-top:16px">' +
        '<h3><i class="fas fa-cog"></i> Administracion</h3>' +
        '<p style="margin-bottom:16px;color:rgba(255,255,255,0.6);font-size:0.85rem">Como lider, tienes control total del clan.</p>' +
        '<div style="display:flex;flex-direction:column;gap:10px">' +
        '<button class="btn btn-secondary" id="btnEditClan" style="justify-content:flex-start;padding:14px 20px"><i class="fas fa-edit"></i> Editar informacion del clan</button>' +
        '<button class="btn btn-danger" id="btnDeleteClan" style="justify-content:flex-start;padding:14px 20px"><i class="fas fa-trash"></i> Eliminar clan permanentemente</button>' +
        '</div>' +
        '</div>';

    return '<div class="clan-tab-content" id="tab-manage">' +
        '<div class="clan-card-section">' + inviteHtml + '</div>' +
        manageHtml +
        '</div>';
}

// =====================================================
// SIDEBAR
// =====================================================

function buildSidebar(clan, accessType, accessIcon, accessLabel, leaderName, memberCount, maxMembers, memberPercent) {
    var createdDate = 'N/A';
    if (clan.created_at) {
        try {
            createdDate = new Date(clan.created_at).toLocaleDateString('es', { year: 'numeric', month: 'long', day: 'numeric' });
        } catch (e) { }
    }

    var locationHtml = '';
    if (clan.location) {
        locationHtml = '<div class="clan-info-item"><i class="fas fa-map-marker-alt"></i><div><span class="label">Region</span><span class="value">' + clan.location + '</span></div></div>';
    }

    return '<div class="clan-info-card">' +
        '<div class="clan-info-item"><i class="fas fa-crown"></i><div><span class="label">Lider</span><span class="value">' + leaderName + '</span></div></div>' +
        locationHtml +
        '<div class="clan-info-item"><i class="fas fa-users"></i><div><span class="label">Miembros</span><span class="value">' + memberCount + ' / ' + maxMembers + '</span><div class="clan-members-bar"><div class="clan-members-bar-fill" style="width:' + memberPercent + '%"></div></div></div></div>' +
        '<div class="clan-info-item"><i class="fas fa-calendar"></i><div><span class="label">Creado</span><span class="value">' + createdDate + '</span></div></div>' +
        '<div class="clan-info-item"><i class="fas ' + accessIcon + '"></i><div><span class="label">Acceso</span><span class="value">' + accessLabel + '</span></div></div>' +
        '</div>';
}

function buildActionButtons(clan, isMember, isLeader, accessType) {
    var html = '<div class="clan-actions">';

    if (!isAuthenticated() && !(clan.id && clan.id.indexOf('demo-') === 0)) {
        html += '<a href="#/login" class="btn btn-primary btn-block"><i class="fas fa-sign-in-alt"></i> Inicia sesion para unirte</a>';
    } else if (isLeader) {
        // Leader actions are in Manage tab
        html += '<p style="font-size:0.8rem;color:rgba(255,255,255,0.4);text-align:center">Gestiona desde la pestana Gestion</p>';
    } else if (isMember) {
        html += '<button class="btn btn-danger btn-block" id="btnLeaveClan"><i class="fas fa-door-open"></i> Abandonar Clan</button>';
        html += '<button class="report-btn" id="btnReportLeader"><i class="fas fa-flag"></i> Reportar Lider</button>';
    } else if (accessType === 'OPEN') {
        html += '<button class="btn btn-primary btn-block" id="btnJoinClan"><i class="fas fa-user-plus"></i> Unirse al Clan</button>';
    } else {
        html += '<div style="text-align:center;padding:12px;color:rgba(255,255,255,0.4);font-size:0.85rem"><i class="fas fa-envelope"></i><p style="margin-top:8px">Solo por invitacion del lider</p></div>';
    }

    html += '</div>';
    return html;
}

// =====================================================
// HELPERS
// =====================================================

function getAccessIcon(type) {
    if (type === 'OPEN') return 'fa-unlock';
    if (type === 'INVITE_ONLY') return 'fa-envelope';
    if (type === 'CLOSED') return 'fa-lock';
    return 'fa-shield-alt';
}

function getAccessLabel(type) {
    if (type === 'OPEN') return 'Abierto';
    if (type === 'INVITE_ONLY') return 'Por Invitacion';
    if (type === 'CLOSED') return 'Cerrado';
    return type || 'Desconocido';
}

function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatTime(dateStr) {
    try {
        var d = new Date(dateStr);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
        return '';
    }
}

// =====================================================
// TABS
// =====================================================

function setupTabs() {
    var tabs = document.querySelectorAll('.clan-tab');
    for (var i = 0; i < tabs.length; i++) {
        tabs[i].addEventListener('click', function () {
            var tabName = this.getAttribute('data-tab');
            // Deactivate all
            var allTabs = document.querySelectorAll('.clan-tab');
            for (var j = 0; j < allTabs.length; j++) allTabs[j].classList.remove('active');
            this.classList.add('active');

            var allContents = document.querySelectorAll('.clan-tab-content');
            for (var k = 0; k < allContents.length; k++) allContents[k].classList.remove('active');

            var target = document.getElementById('tab-' + tabName);
            if (target) target.classList.add('active');

            if (tabName === 'chat') {
                loadChat();
                if (!chatInterval) chatInterval = setInterval(loadChat, 3000); // Polling cada 3s
            } else {
                if (chatInterval) {
                    clearInterval(chatInterval);
                    chatInterval = null;
                }
            }
        });
    }
}

// =====================================================
// CHAT
// =====================================================

function loadChat() {
    var isDemo = currentClan.id && currentClan.id.indexOf('demo-') === 0;
    if (isDemo) {
        chatMessages = DEMO_CHAT.slice();
        renderChatMessages();
        return;
    }

    API.clans.getMessages(currentClan.id).then(function (resp) {
        chatMessages = resp.data || resp || [];
        renderChatMessages();
    }).catch(function () {
        chatMessages = DEMO_CHAT.slice();
        renderChatMessages();
    });
}

function renderChatMessages() {
    var container = document.getElementById('chatMessages');
    if (!container) return;

    var user = getStoredUser() || { id: 'u1', username: 'PhantomX' };

    if (!chatMessages || chatMessages.length === 0) {
        container.innerHTML = '<div class="chat-empty"><i class="fas fa-comments"></i><p>No hay mensajes aun. Se el primero en escribir!</p></div>';
        return;
    }

    var html = '';
    for (var i = 0; i < chatMessages.length; i++) {
        var msg = chatMessages[i];
        if (!msg) continue;
        var msgUser = (msg.user && msg.user.username) ? msg.user.username : 'Usuario';
        var isOwn = msg.user_id === user.id;
        var isAnn = msg.is_announcement || false;
        var time = msg.created_at ? formatTime(msg.created_at) : '';
        var content = msg.content ? escapeHtml(msg.content) : '';

        var classes = 'chat-message';
        if (isOwn) classes += ' own';
        if (isAnn) classes += ' announcement';

        html += '<div class="' + classes + '">';
        if (isAnn) html += '<div class="announcement-badge"><i class="fas fa-bullhorn"></i> Anuncio</div>';
        html += '<div class="chat-message-header"><span class="chat-username">' + msgUser + '</span><span class="chat-time">' + time + '</span></div>';
        html += '<div class="chat-message-content">' + content + '</div></div>';
    }

    container.innerHTML = html;
    container.scrollTop = container.scrollHeight;
}

function sendChatMsg(isAnn) {
    var input = document.getElementById('chatInput');
    if (!input) return;
    var content = input.value.trim();
    if (!content) return;

    var user = getStoredUser() || { id: 'u1', username: 'PhantomX' };

    chatMessages.push({
        user_id: user.id,
        user: { username: user.username || 'Tu' },
        content: content,
        is_announcement: isAnn,
        created_at: new Date().toISOString()
    });

    input.value = '';
    renderChatMessages();

    if (currentClan.id && currentClan.id.indexOf('demo-') !== 0) {
        API.clans.sendMessage(currentClan.id, user.id, content, isAnn).catch(function () { });
    }
}

// =====================================================
// EVENT LISTENERS
// =====================================================

function setupEvents() {
    // Send chat message
    var sendBtn = document.getElementById('sendMessage');
    if (sendBtn) sendBtn.addEventListener('click', function () { sendChatMsg(false); });

    var annBtn = document.getElementById('sendAnnouncement');
    if (annBtn) annBtn.addEventListener('click', function () { sendChatMsg(true); });

    var chatInput = document.getElementById('chatInput');
    if (chatInput) chatInput.addEventListener('keypress', function (e) { if (e.key === 'Enter') sendChatMsg(false); });

    // Join clan (open)
    var joinBtn = document.getElementById('btnJoinClan');
    if (joinBtn) joinBtn.addEventListener('click', function () {
        showToast('success', 'Te has unido al clan! (Demo)');
    });

    // Leave clan
    var leaveBtn = document.getElementById('btnLeaveClan');
    if (leaveBtn) leaveBtn.addEventListener('click', function () { showLeaveModal(); });

    // Report leader
    var reportBtn = document.getElementById('btnReportLeader');
    if (reportBtn) reportBtn.addEventListener('click', function () { showReportModal(); });

    // Edit clan
    var editBtn = document.getElementById('btnEditClan');
    if (editBtn) editBtn.addEventListener('click', function () { showEditModal(); });

    // Delete clan
    var deleteBtn = document.getElementById('btnDeleteClan');
    if (deleteBtn) deleteBtn.addEventListener('click', function () { showDeleteModal(); });

    // Send invite
    var inviteBtn = document.getElementById('btnSendInvite');
    if (inviteBtn) inviteBtn.addEventListener('click', function () {
        var input = document.getElementById('inviteUsername');
        if (!input) return;
        var username = input.value.trim();
        if (!username) {
            showToast('error', 'Escribe un nombre de usuario');
            return;
        }
        showToast('success', 'Invitacion enviada a ' + username + '! El jugador puede aceptar o rechazar. (Demo)');
        input.value = '';
    });

    // Kick members
    var kickBtns = document.querySelectorAll('[data-action="kick"]');
    for (var i = 0; i < kickBtns.length; i++) {
        kickBtns[i].addEventListener('click', function () {
            if (!confirm('Expulsar a este miembro?')) return;
            showToast('success', 'Miembro expulsado (Demo)');
            var item = this.closest('.clan-member-item');
            if (item) item.remove();
        });
    }

    // Cancel invites
    var cancelBtns = document.querySelectorAll('[data-action="cancel-invite"]');
    for (var j = 0; j < cancelBtns.length; j++) {
        cancelBtns[j].addEventListener('click', function () {
            showToast('info', 'Invitacion cancelada (Demo)');
            var inv = this.closest('.pending-invite');
            if (inv) inv.remove();
        });
    }
}

// =====================================================
// MODALS
// =====================================================

function createModal(content) {
    var overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = content;
    document.body.appendChild(overlay);

    var closeOnOverlay = function (e) { if (e.target === overlay) overlay.remove(); };
    overlay.addEventListener('click', closeOnOverlay);

    var closeBtn = overlay.querySelector('.modal-close');
    if (closeBtn) closeBtn.addEventListener('click', function () { overlay.remove(); });

    var cancelBtns = overlay.querySelectorAll('[data-dismiss="modal"]');
    for (var i = 0; i < cancelBtns.length; i++) {
        cancelBtns[i].addEventListener('click', function () { overlay.remove(); });
    }

    return overlay;
}

function showReportModal() {
    var leaderName = currentClan.leader ? currentClan.leader.username : 'el lider';
    var modal = createModal(
        '<div class="modal">' +
        '<div class="modal-header">' +
        '<h3><i class="fas fa-flag"></i> Reportar a ' + leaderName + '</h3>' +
        '<button class="modal-close">&times;</button>' +
        '</div>' +
        '<form id="reportForm" style="padding:24px">' +
        '<div class="form-group">' +
        '<label class="form-label">Razon del reporte *</label>' +
        '<select class="form-control" name="reason" required>' +
        '<option value="">Selecciona una razon...</option>' +
        '<option value="abuse">Abuso de poder</option>' +
        '<option value="harassment">Acoso o bullying</option>' +
        '<option value="discrimination">Discriminacion</option>' +
        '<option value="inactivity">Inactividad prolongada</option>' +
        '<option value="other">Otro motivo</option>' +
        '</select>' +
        '</div>' +
        '<div class="form-group">' +
        '<label class="form-label">Describe la situacion *</label>' +
        '<textarea class="form-control" name="description" required minlength="20" maxlength="500" rows="4" placeholder="Explica con detalle lo sucedido..."></textarea>' +
        '</div>' +
        '<div class="modal-footer">' +
        '<button type="button" class="btn btn-secondary" data-dismiss="modal">Cancelar</button>' +
        '<button type="submit" class="btn btn-danger"><i class="fas fa-flag"></i> Enviar Reporte</button>' +
        '</div>' +
        '</form>' +
        '</div>'
    );

    var form = modal.querySelector('#reportForm');
    if (form) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            showToast('success', 'Reporte enviado. Lo revisaremos lo antes posible. (Demo)');
            modal.remove();
        });
    }
}

function showLeaveModal() {
    var clanName = currentClan.name || 'este clan';
    var modal = createModal(
        '<div class="modal confirm-modal warning-modal">' +
        '<div class="confirm-modal-icon warning"><i class="fas fa-door-open"></i></div>' +
        '<h3 class="confirm-modal-title">Abandonar ' + clanName + '?</h3>' +
        '<p class="confirm-modal-text">Estas a punto de abandonar el clan.</p>' +
        '<ul class="confirm-modal-list warning">' +
        '<li><i class="fas fa-info-circle"></i> Perderas acceso al chat del clan</li>' +
        '<li><i class="fas fa-info-circle"></i> Podras volver si el clan es abierto</li>' +
        '</ul>' +
        '<div class="confirm-modal-actions">' +
        '<button class="btn btn-secondary" data-dismiss="modal"><i class="fas fa-times"></i> Cancelar</button>' +
        '<button class="btn btn-warning" id="confirmLeave"><i class="fas fa-door-open"></i> Si, Abandonar</button>' +
        '</div>' +
        '</div>'
    );

    var confirmBtn = modal.querySelector('#confirmLeave');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', function () {
            showToast('success', 'Has abandonado el clan (Demo)');
            modal.remove();
            window.location.hash = '#/clanes';
        });
    }
}

function showDeleteModal() {
    var clanName = currentClan.name || 'este clan';
    var memberCount = currentClan.members ? currentClan.members.length : 0;
    var modal = createModal(
        '<div class="modal confirm-modal danger-modal">' +
        '<div class="confirm-modal-icon danger"><i class="fas fa-exclamation-triangle"></i></div>' +
        '<h3 class="confirm-modal-title">Eliminar ' + clanName + '?</h3>' +
        '<p class="confirm-modal-text">Esta accion no se puede deshacer. Se eliminara:</p>' +
        '<ul class="confirm-modal-list">' +
        '<li><i class="fas fa-times-circle"></i> El clan y toda su informacion</li>' +
        '<li><i class="fas fa-times-circle"></i> Los ' + memberCount + ' miembros seran removidos</li>' +
        '<li><i class="fas fa-times-circle"></i> El historial de chat completo</li>' +
        '</ul>' +
        '<div class="confirm-modal-actions">' +
        '<button class="btn btn-secondary" data-dismiss="modal"><i class="fas fa-arrow-left"></i> Cancelar</button>' +
        '<button class="btn btn-danger" id="confirmDelete"><i class="fas fa-trash"></i> Eliminar</button>' +
        '</div>' +
        '</div>'
    );

    var confirmBtn = modal.querySelector('#confirmDelete');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', function () {
            showToast('success', 'Clan eliminado (Demo)');
            modal.remove();
            window.location.hash = '#/clanes';
        });
    }
}

function showEditModal() {
    var clan = currentClan;
    var modal = createModal(
        '<div class="modal">' +
        '<div class="modal-header">' +
        '<h3><i class="fas fa-edit"></i> Editar Clan</h3>' +
        '<button class="modal-close">&times;</button>' +
        '</div>' +
        '<form id="editClanForm" style="padding:24px">' +
        '<div class="form-group"><label class="form-label">Nombre</label>' +
        '<input type="text" class="form-control" name="name" value="' + (clan.name || '') + '" required minlength="3" maxlength="30"></div>' +
        '<div class="form-group"><label class="form-label">Tag</label>' +
        '<input type="text" class="form-control" name="tag" value="' + (clan.tag || '') + '" required minlength="2" maxlength="5"></div>' +
        '<div class="form-group"><label class="form-label">Descripcion</label>' +
        '<textarea class="form-control" name="description" rows="3" maxlength="500">' + (clan.description || '') + '</textarea></div>' +
        '<div class="form-group"><label class="form-label">Requisitos</label>' +
        '<textarea class="form-control" name="requirements" rows="3" maxlength="300">' + (clan.requirements || '') + '</textarea></div>' +
        '<div class="form-group"><label class="form-label">Tipo de Acceso</label>' +
        '<select class="form-control" name="access_type">' +
        '<option value="OPEN"' + (clan.access_type === 'OPEN' ? ' selected' : '') + '>Abierto</option>' +
        '<option value="INVITE_ONLY"' + (clan.access_type === 'INVITE_ONLY' ? ' selected' : '') + '>Por Invitacion</option>' +
        '<option value="CLOSED"' + (clan.access_type === 'CLOSED' ? ' selected' : '') + '>Cerrado</option>' +
        '</select></div>' +
        '<div class="form-group"><label class="form-label">URL del Banner</label>' +
        '<input type="url" class="form-control" name="banner_url" value="' + (clan.banner_url || '') + '" placeholder="https://..."></div>' +
        '<div class="modal-footer">' +
        '<button type="button" class="btn btn-secondary" data-dismiss="modal">Cancelar</button>' +
        '<button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> Guardar</button>' +
        '</div>' +
        '</form>' +
        '</div>'
    );

    var form = modal.querySelector('#editClanForm');
    if (form) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            showToast('success', 'Clan actualizado! (Demo)');
            modal.remove();
        });
    }
}

// =====================================================
// CLEANUP & EXPORT
// =====================================================

export function cleanup() {
    if (chatInterval) {
        clearInterval(chatInterval);
        chatInterval = null;
    }
}

export default { renderClanPage: renderClanPage, cleanup: cleanup };

// =====================================================
// PAGE - Clanes (Explorador) — Solo Líder + Miembros
// =====================================================

import API from '../api.js';
import { isAuthenticated } from '../auth.js';

// Demo clans data
const DEMO_CLANS = [
    {
        id: 'demo-1',
        name: 'Shadow Reapers',
        tag: 'SHR',
        description: 'Clan competitivo de Apex Legends y Valorant. Buscamos jugadores dedicados con mentalidad ganadora para dominar los torneos.',
        banner_url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80',
        location: 'Latinoamérica',
        access_type: 'INVITE_ONLY',
        member_count: 12,
        max_members: 50,
        leader: { username: 'PhantomX' },
        created_at: '2025-08-15T10:00:00Z'
    },
    {
        id: 'demo-2',
        name: 'Neon Vipers',
        tag: 'NVP',
        description: 'Equipo casual con ganas de competir. Si te gusta jugar en equipo y divertirte, este es tu lugar.',
        banner_url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&q=80',
        location: 'México',
        access_type: 'OPEN',
        member_count: 23,
        max_members: 50,
        leader: { username: 'ViperQueen' },
        created_at: '2025-09-10T10:00:00Z'
    },
    {
        id: 'demo-3',
        name: 'Frost Legion',
        tag: 'FRL',
        description: 'Legión élite de jugadores estratégicos. Nos especializamos en shooters tácticos y battle royale.',
        banner_url: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=800&q=80',
        location: 'Argentina',
        access_type: 'INVITE_ONLY',
        member_count: 35,
        max_members: 50,
        leader: { username: 'IceCommand' },
        created_at: '2025-07-20T10:00:00Z'
    },
    {
        id: 'demo-4',
        name: 'Thunder Squad',
        tag: 'THU',
        description: 'Escuadrón dedicado a torneos semanales. Entrenamos juntos y competimos como un equipo unido.',
        banner_url: 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=800&q=80',
        location: 'Colombia',
        access_type: 'OPEN',
        member_count: 18,
        max_members: 30,
        leader: { username: 'StormRider' },
        created_at: '2025-10-05T10:00:00Z'
    },
    {
        id: 'demo-5',
        name: 'Omega Force',
        tag: 'OMG',
        description: 'Fuerza Omega — los mejores del servidor. Solo se entra por invitación del líder.',
        banner_url: 'https://images.unsplash.com/photo-1552820728-8b83bb6b2b28?w=800&q=80',
        location: 'España',
        access_type: 'CLOSED',
        member_count: 50,
        max_members: 50,
        leader: { username: 'OmegaBoss' },
        created_at: '2025-06-01T10:00:00Z'
    },
    {
        id: 'demo-6',
        name: 'Pixel Warriors',
        tag: 'PXW',
        description: 'Comunidad gamer amigable para jugadores de todos los niveles. ¡Aprende, juega y crece con nosotros!',
        banner_url: 'https://images.unsplash.com/photo-1542751110-97427bbecf20?w=800&q=80',
        location: 'Chile',
        access_type: 'OPEN',
        member_count: 8,
        max_members: 50,
        leader: { username: 'PixelKing' },
        created_at: '2026-01-15T10:00:00Z'
    }
];

function getAccessIcon(type) {
    if (type === 'OPEN') return 'fa-unlock';
    if (type === 'INVITE_ONLY') return 'fa-envelope';
    if (type === 'CLOSED') return 'fa-lock';
    return 'fa-shield-alt';
}

function getAccessLabel(type) {
    if (type === 'OPEN') return 'Abierto';
    if (type === 'INVITE_ONLY') return 'Por Invitación';
    if (type === 'CLOSED') return 'Cerrado';
    return type || 'Desconocido';
}

export async function renderClansPage(container) {
    // Render skeleton first
    container.innerHTML = '<div class="section"><div class="container">' +
        '<div class="clans-hero"><div class="clans-hero-content">' +
        '<h1 class="clans-hero-title"><i class="fas fa-shield-alt"></i> <span class="gradient-text">Clanes</span></h1>' +
        '<p class="clans-hero-subtitle">Encuentra tu equipo perfecto o crea el tuyo. El líder elige a su equipo y los jugadores deciden si aceptan.</p>' +
        '<div class="clans-hero-actions">' +
        (isAuthenticated() ? '<a href="#/crear-clan" class="btn btn-primary"><i class="fas fa-plus"></i> Crear Clan</a>' : '') +
        '</div>' +
        '<div class="clans-hero-stats">' +
        '<div class="clans-hero-stat"><div class="stat-value" id="totalClansCount">...</div><div class="stat-label">Clanes Activos</div></div>' +
        '<div class="clans-hero-stat"><div class="stat-value" id="totalPlayersCount">...</div><div class="stat-label">Jugadores</div></div>' +
        '<div class="clans-hero-stat"><div class="stat-value" id="openClansCount">...</div><div class="stat-label">Clanes Abiertos</div></div>' +
        '</div>' +
        '</div></div>' +
        '<div class="clans-filters">' +
        '<div class="search-box"><i class="fas fa-search"></i><input type="text" class="search-input" id="clanSearch" placeholder="Buscar clan por nombre..."></div>' +
        '<div class="filter-group">' +
        '<select class="filter-select" id="accessFilter"><option value="">Todos los accesos</option><option value="OPEN">Abierto</option><option value="INVITE_ONLY">Por Invitación</option><option value="CLOSED">Cerrado</option></select>' +
        '</div>' +
        '</div>' +
        '<div class="loading-skeleton" id="clansLoading">' +
        '<div class="clan-card-skeleton"></div><div class="clan-card-skeleton"></div><div class="clan-card-skeleton"></div>' +
        '</div>' +
        '<div class="clans-grid hidden" id="clansGrid"></div>' +
        '<div class="empty-state hidden" id="emptyState"><i class="fas fa-users-slash"></i><h3>No se encontraron clanes</h3><p>Intenta con otros filtros o crea tu propio clan</p></div>' +
        '</div></div>';

    // Load clans
    var allClans = [];
    try {
        var response = await API.clans.getAll();
        allClans = response.data || response || [];
    } catch (e) {
        // API not available, use demo only
    }

    // Merge demo clans
    var demoIds = new Set(DEMO_CLANS.map(function (c) { return c.id; }));
    var merged = DEMO_CLANS.concat(allClans.filter(function (c) { return !demoIds.has(c.id); }));

    // Update stats
    var totalEl = document.getElementById('totalClansCount');
    var playersEl = document.getElementById('totalPlayersCount');
    var openEl = document.getElementById('openClansCount');
    if (totalEl) totalEl.textContent = merged.length;
    var totalPlayers = 0;
    var openCount = 0;
    for (var i = 0; i < merged.length; i++) {
        totalPlayers += merged[i].member_count || 0;
        if (merged[i].access_type === 'OPEN') openCount++;
    }
    if (playersEl) playersEl.textContent = totalPlayers;
    if (openEl) openEl.textContent = openCount;

    // Render clans
    renderClanCards(merged);

    // Setup filters
    var searchInput = document.getElementById('clanSearch');
    var accessSelect = document.getElementById('accessFilter');

    function filterClans() {
        var searchTerm = (searchInput ? searchInput.value : '').toLowerCase().trim();
        var accessType = accessSelect ? accessSelect.value : '';

        var filtered = merged.filter(function (clan) {
            var matchesSearch = !searchTerm || (clan.name || '').toLowerCase().includes(searchTerm) || (clan.tag || '').toLowerCase().includes(searchTerm);
            var matchesAccess = !accessType || clan.access_type === accessType;
            return matchesSearch && matchesAccess;
        });

        renderClanCards(filtered);
    }

    if (searchInput) searchInput.addEventListener('input', filterClans);
    if (accessSelect) accessSelect.addEventListener('change', filterClans);
}

function renderClanCards(clans) {
    var loading = document.getElementById('clansLoading');
    var grid = document.getElementById('clansGrid');
    var empty = document.getElementById('emptyState');

    if (loading) loading.classList.add('hidden');

    if (!clans || clans.length === 0) {
        if (grid) grid.classList.add('hidden');
        if (empty) empty.classList.remove('hidden');
        return;
    }

    if (empty) empty.classList.add('hidden');
    if (grid) grid.classList.remove('hidden');

    var html = '';
    for (var i = 0; i < clans.length; i++) {
        var clan = clans[i];
        var name = clan.name || 'Sin nombre';
        var tag = clan.tag || '???';
        var desc = clan.description || 'Sin descripción disponible.';
        var access = clan.access_type || 'OPEN';
        var members = clan.member_count || 0;
        var maxMembers = clan.max_members || 50;
        var leader = (clan.leader && clan.leader.username) ? clan.leader.username : 'N/A';
        var location = clan.location || '';
        var bannerStyle = clan.banner_url ? "background-image:url('" + clan.banner_url + "');background-size:cover;background-position:center;" : '';

        html += '<div class="clan-card">' +
            '<div class="clan-banner" style="' + bannerStyle + '">' +
            (clan.banner_url ? '' : '<i class="fas fa-shield-alt"></i>') +
            '<div class="clan-access-badge ' + access.toLowerCase() + '"><i class="fas ' + getAccessIcon(access) + '"></i> ' + getAccessLabel(access) + '</div>' +
            '</div>' +
            '<div class="clan-content">' +
            '<div class="clan-header">' +
            '<span class="clan-name">' + name + '</span>' +
            '<span class="clan-tag">[' + tag + ']</span>' +
            '</div>' +
            '<p class="clan-description">' + desc + '</p>' +
            '<div class="clan-leader"><i class="fas fa-crown"></i> Líder: <strong>' + leader + '</strong></div>' +
            '<div class="clan-meta">' +
            '<span><i class="fas fa-users"></i> ' + members + '/' + maxMembers + '</span>' +
            (location ? '<span><i class="fas fa-map-marker-alt"></i> ' + location + '</span>' : '') +
            '</div>' +
            '</div>' +
            '<div class="clan-footer">' +
            '<a href="#/clan/' + clan.id + '" class="btn btn-primary btn-block"><i class="fas fa-eye"></i> Ver Clan</a>' +
            '</div>' +
            '</div>';
    }

    if (grid) grid.innerHTML = html;
}

export default { renderClansPage };

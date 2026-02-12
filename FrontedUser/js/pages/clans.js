// =====================================================
// PAGE - Clanes (Explorar y buscar clanes)
// =====================================================

import API from '../api.js';
import { getStoredUser, isAuthenticated } from '../auth.js';
import { showToast } from '../ui-helpers.js';

let allClans = [];
let filteredClans = [];

export async function renderClansPage(container) {
    container.innerHTML = `
        <div class="section">
            <div class="container">
                <!-- Hero Section -->
                <div class="clans-hero">
                    <div class="clans-hero-content">
                        <h1 class="clans-hero-title">
                            <i class="fas fa-shield-alt"></i>
                            Encuentra tu <span class="gradient-text">Clan</span>
                        </h1>
                        <p class="clans-hero-subtitle">
                            Únete a una comunidad de jugadores, compite en equipo y conquista torneos juntos
                        </p>
                        ${isAuthenticated() ? `
                            <div class="clans-hero-actions">
                                <button class="btn btn-primary" id="btnCreateClan">
                                    <i class="fas fa-plus"></i> Crear Clan
                                </button>
                                <button class="btn btn-outline" id="btnMyClan">
                                    <i class="fas fa-users"></i> Mi Clan
                                </button>
                            </div>
                        ` : `
                            <p class="clans-hero-login">
                                <a href="#/login" class="btn btn-primary">Inicia sesión</a> para crear o unirte a un clan
                            </p>
                        `}
                    </div>
                </div>

                <!-- Filters -->
                <div class="clans-filters">
                    <div class="search-box">
                        <i class="fas fa-search"></i>
                        <input type="text" id="searchClans" placeholder="Buscar clanes..." class="search-input">
                    </div>
                    <div class="filter-group">
                        <select id="filterAccess" class="filter-select">
                            <option value="">Todos los tipos</option>
                            <option value="OPEN">Abiertos</option>
                            <option value="INVITE_ONLY">Por invitación</option>
                            <option value="CLOSED">Cerrados</option>
                        </select>
                        <input type="text" id="filterLocation" placeholder="Región..." class="filter-input">
                    </div>
                </div>

                <!-- Clans Grid -->
                <div class="clans-grid" id="clansGrid">
                    <div class="loading-skeleton">
                        ${Array(6).fill('<div class="clan-card-skeleton"></div>').join('')}
                    </div>
                </div>

                <!-- Empty State -->
                <div class="empty-state hidden" id="emptyState">
                    <i class="fas fa-shield-alt"></i>
                    <h3>No se encontraron clanes</h3>
                    <p>Intenta ajustar los filtros o crea el primero</p>
                </div>
            </div>
        </div>
    `;

    // Load clans
    await loadClans();

    // Event listeners
    setupEventListeners();
}

async function loadClans() {
    try {
        const response = await API.clans.getAll();
        allClans = response.data || [];
        filteredClans = [...allClans];

        // Handle empty clans with a friendly message
        if (allClans.length === 0) {
            document.getElementById('clansGrid').innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
                    <i class="fas fa-shield-alt" style="font-size: 48px; color: var(--primary); margin-bottom: 20px;"></i>
                    <h3 style="margin-bottom: 10px;">¡Sé el primero en crear un clan!</h3>
                    <p style="color: var(--text-secondary);">Aún no hay clanes registrados. Crea el tuyo y lidera la comunidad.</p>
                </div>
            `;
            return;
        }

        renderClansGrid();
    } catch (error) {
        console.error('Error loading clans:', error);
        document.getElementById('clansGrid').innerHTML = `
            <div class="error-state" style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
                <i class="fas fa-exclamation-triangle" style="font-size: 48px; color: var(--warning); margin-bottom: 20px;"></i>
                <h3 style="margin-bottom: 10px;">No se pudieron cargar los clanes</h3>
                <p style="color: var(--text-secondary);">Verifica tu conexión e intenta de nuevo.</p>
                <button class="btn btn-primary" onclick="location.reload()" style="margin-top: 16px;">
                    <i class="fas fa-sync"></i> Reintentar
                </button>
            </div>
        `;
    }
}

function renderClansGrid() {
    const grid = document.getElementById('clansGrid');
    const emptyState = document.getElementById('emptyState');

    if (filteredClans.length === 0) {
        grid.classList.add('hidden');
        emptyState.classList.remove('hidden');
        return;
    }

    grid.classList.remove('hidden');
    emptyState.classList.add('hidden');

    grid.innerHTML = filteredClans.map(clan => `
        <div class="clan-card" data-id="${clan.id}">
            <div class="clan-banner" style="${clan.banner_url ? `background-image: url('${clan.banner_url}')` : ''}">
                ${!clan.banner_url ? `<i class="fas fa-shield-alt"></i>` : ''}
                <div class="clan-access-badge ${clan.access_type.toLowerCase()}">
                    <i class="fas ${getAccessIcon(clan.access_type)}"></i>
                    ${getAccessLabel(clan.access_type)}
                </div>
            </div>
            <div class="clan-content">
                <div class="clan-header">
                    <h3 class="clan-name">${clan.name}</h3>
                    <span class="clan-tag">[${clan.tag}]</span>
                </div>
                <p class="clan-description">${clan.description || 'Sin descripción'}</p>
                <div class="clan-meta">
                    <span><i class="fas fa-users"></i> ${clan.member_count} miembros</span>
                    ${clan.location ? `<span><i class="fas fa-map-marker-alt"></i> ${clan.location}</span>` : ''}
                </div>
                <div class="clan-leader">
                    <i class="fas fa-crown"></i>
                    <span>Líder: ${clan.leader?.username || 'N/A'}</span>
                </div>
            </div>
            <div class="clan-footer">
                <a href="#/clan/${clan.id}" class="btn btn-primary btn-block">
                    <i class="fas fa-eye"></i> Ver Clan
                </a>
            </div>
        </div>
    `).join('');
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
        case 'INVITE_ONLY': return 'Invitación';
        case 'CLOSED': return 'Cerrado';
        default: return type;
    }
}

function setupEventListeners() {
    // Search
    document.getElementById('searchClans')?.addEventListener('input', (e) => {
        filterClans();
    });

    // Access filter
    document.getElementById('filterAccess')?.addEventListener('change', (e) => {
        filterClans();
    });

    // Location filter
    document.getElementById('filterLocation')?.addEventListener('input', (e) => {
        filterClans();
    });

    // Create clan button
    document.getElementById('btnCreateClan')?.addEventListener('click', () => {
        window.location.hash = '#/crear-clan';
    });

    // My clan button
    document.getElementById('btnMyClan')?.addEventListener('click', async () => {
        if (!isAuthenticated()) {
            showToast('error', 'Debes iniciar sesión');
            return;
        }
        const user = getStoredUser();
        try {
            const response = await API.users.getClan(user.id);
            if (response.data) {
                window.location.hash = `#/clan/${response.data.id}`;
            } else {
                showToast('info', 'No perteneces a ningún clan');
            }
        } catch (error) {
            showToast('info', 'No perteneces a ningún clan');
        }
    });
}

function filterClans() {
    const search = document.getElementById('searchClans')?.value.toLowerCase() || '';
    const accessType = document.getElementById('filterAccess')?.value || '';
    const location = document.getElementById('filterLocation')?.value.toLowerCase() || '';

    filteredClans = allClans.filter(clan => {
        const matchesSearch = !search ||
            clan.name.toLowerCase().includes(search) ||
            clan.tag.toLowerCase().includes(search) ||
            (clan.description && clan.description.toLowerCase().includes(search));

        const matchesAccess = !accessType || clan.access_type === accessType;

        const matchesLocation = !location ||
            (clan.location && clan.location.toLowerCase().includes(location));

        return matchesSearch && matchesAccess && matchesLocation;
    });

    renderClansGrid();
}

export default { renderClansPage };

// =====================================================
// Favorites Page
// =====================================================

import API from '../api.js';
import { showLoading, formatDate } from '../ui-helpers.js';
import { getAllFavorites, removeFavorite, initFavoriteButtons, createFavoriteButton } from '../favorites.js';

export async function renderFavorites(container) {
    showLoading(container);

    const favorites = getAllFavorites();
    const hasFavorites = (favorites.tournaments?.length > 0) ||
        (favorites.teams?.length > 0) ||
        (favorites.matches?.length > 0);

    if (!hasFavorites) {
        renderEmptyState(container);
        return;
    }

    try {
        // Fetch details for favorited items
        const [tournamentsRes, teamsRes] = await Promise.all([
            API.tournaments.getAll(),
            API.teams.getAll()
        ]);

        const allTournaments = tournamentsRes.data || [];
        const allTeams = teamsRes.data || [];

        // Get favorited items with full data
        const favoriteTournaments = favorites.tournaments
            .map(fav => allTournaments.find(t => t.id === fav.id))
            .filter(Boolean);

        const favoriteTeams = favorites.teams
            .map(fav => allTeams.find(t => t.id === fav.id))
            .filter(Boolean);

        container.innerHTML = `
            <div class="container section">
                <div class="page-header">
                    <h1 class="page-title">
                        <i class="fas fa-heart"></i>
                        Mis Favoritos
                    </h1>
                    <p class="page-subtitle">Tus torneos y equipos guardados</p>
                </div>
                
                ${favoriteTournaments.length > 0 ? `
                    <section class="favorites-section">
                        <h2 class="favorites-section-title">
                            <i class="fas fa-trophy"></i>
                            Torneos (${favoriteTournaments.length})
                        </h2>
                        <div class="tournaments-grid">
                            ${favoriteTournaments.map(tournament => renderTournamentCard(tournament)).join('')}
                        </div>
                    </section>
                ` : ''}
                
                ${favoriteTeams.length > 0 ? `
                    <section class="favorites-section">
                        <h2 class="favorites-section-title">
                            <i class="fas fa-users"></i>
                            Equipos (${favoriteTeams.length})
                        </h2>
                        <div class="teams-grid">
                            ${favoriteTeams.map(team => renderTeamCard(team)).join('')}
                        </div>
                    </section>
                ` : ''}
            </div>
            
            <style>
                .favorites-section {
                    margin-bottom: 48px;
                }
                
                .favorites-section-title {
                    font-family: var(--font-display);
                    font-size: 22px;
                    font-weight: 700;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 24px;
                }
                
                .favorites-section-title i {
                    color: var(--primary);
                }
                
                .teams-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                    gap: 20px;
                }
                
                .team-card {
                    background: var(--bg-card);
                    border: 1px solid var(--border-color);
                    border-radius: var(--border-radius);
                    padding: 24px;
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                    transition: var(--transition);
                }
                
                .team-card:hover {
                    border-color: var(--primary);
                    transform: translateY(-2px);
                }
                
                .team-card-header {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }
                
                .team-avatar {
                    width: 56px;
                    height: 56px;
                    background: linear-gradient(135deg, var(--primary), var(--accent));
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 24px;
                    color: white;
                }
                
                .team-info h3 {
                    font-size: 18px;
                    font-weight: 700;
                    margin-bottom: 4px;
                }
                
                .team-info p {
                    font-size: 13px;
                    color: var(--text-secondary);
                }
                
                .team-card-actions {
                    display: flex;
                    gap: 12px;
                    margin-top: auto;
                }
                
                .favorite-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 16px;
                    background: transparent;
                    border: 1px solid var(--border-color);
                    border-radius: 8px;
                    color: var(--text-secondary);
                    font-size: 14px;
                    cursor: pointer;
                    transition: var(--transition);
                }
                
                .favorite-btn:hover {
                    border-color: var(--danger);
                    color: var(--danger);
                }
                
                .favorite-btn.active {
                    color: var(--danger);
                    border-color: var(--danger);
                }
                
                .favorite-btn.active i {
                    color: var(--danger);
                }
            </style>
        `;

        initFavoriteButtons(container);

    } catch (error) {
        console.error('Error loading favorites:', error);
        container.innerHTML = `
            <div class="container section">
                <div class="empty-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Error al cargar favoritos</h3>
                    <p>${error.message}</p>
                </div>
            </div>
        `;
    }
}

function renderEmptyState(container) {
    container.innerHTML = `
        <div class="container section">
            <div class="empty-state-large">
                <div class="empty-icon">
                    <i class="far fa-heart"></i>
                </div>
                <h2>No tienes favoritos</h2>
                <p>Guarda torneos y equipos para acceder a ellos rápidamente</p>
                <div class="empty-actions">
                    <a href="#/torneos" class="btn btn-primary">
                        <i class="fas fa-trophy"></i>
                        Explorar Torneos
                    </a>
                </div>
            </div>
        </div>
        
        <style>
            .empty-state-large {
                text-align: center;
                padding: 80px 24px;
                max-width: 400px;
                margin: 0 auto;
            }
            
            .empty-icon {
                width: 80px;
                height: 80px;
                background: var(--bg-tertiary);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 24px;
            }
            
            .empty-icon i {
                font-size: 36px;
                color: var(--text-muted);
            }
            
            .empty-state-large h2 {
                font-size: 24px;
                font-weight: 700;
                margin-bottom: 8px;
            }
            
            .empty-state-large p {
                color: var(--text-secondary);
                margin-bottom: 24px;
            }
            
            .empty-actions {
                display: flex;
                justify-content: center;
                gap: 12px;
            }
        </style>
    `;
}

function renderTournamentCard(tournament) {
    const statusLabels = {
        'DRAFT': 'Borrador',
        'PUBLISHED': 'Publicado',
        'REGISTRATION_OPEN': 'Inscripciones',
        'REGISTRATION_CLOSED': 'Cerrado',
        'IN_PROGRESS': 'En Curso',
        'COMPLETED': 'Finalizado',
        'CANCELLED': 'Cancelado'
    };
    const statusClass = tournament.status === 'REGISTRATION_OPEN' ? 'open' :
        tournament.status === 'IN_PROGRESS' ? 'live' : 'closed';

    return `
        <a href="#/torneo/${tournament.id}" class="tournament-card">
            <div class="tournament-banner">
                <i class="fas fa-trophy"></i>
                <span class="tournament-status ${statusClass}">${statusLabels[tournament.status] || tournament.status}</span>
            </div>
            <div class="tournament-content">
                <h3 class="tournament-name">${tournament.name}</h3>
                <div class="tournament-meta">
                    <span><i class="fas fa-calendar"></i> ${formatDate(tournament.start_date)}</span>
                    <span><i class="fas fa-map-marker-alt"></i> ${tournament.region || 'Global'}</span>
                </div>
                <div class="tournament-footer">
                    ${createFavoriteButton('tournaments', tournament.id, { name: tournament.name })}
                </div>
            </div>
        </a>
    `;
}

function renderTeamCard(team) {
    return `
        <div class="team-card">
            <div class="team-card-header">
                <div class="team-avatar">
                    <i class="fas fa-shield-alt"></i>
                </div>
                <div class="team-info">
                    <h3>${team.name}</h3>
                    <p>Equipo</p>
                </div>
            </div>
            <div class="team-card-actions">
                ${createFavoriteButton('teams', team.id, { name: team.name })}
            </div>
        </div>
    `;
}

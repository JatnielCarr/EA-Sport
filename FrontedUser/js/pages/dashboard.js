// =====================================================
// User Dashboard Page
// =====================================================

import API from '../api.js';
import { getStoredUser, isAuthenticated } from '../auth.js';
import { showLoading, formatDate, formatCurrency } from '../ui-helpers.js';

export async function renderDashboard(container) {
    if (!isAuthenticated()) {
        window.location.hash = '#/login';
        return;
    }

    showLoading(container);

    try {
        const user = getStoredUser();
        const [tournamentsRes, teamsRes, matchesRes] = await Promise.all([
            API.tournaments.getAll(),
            API.teams.getAll(),
            API.matches.getAll()
        ]);

        const tournaments = tournamentsRes.data || [];
        const allTeams = teamsRes.data || [];
        const matches = matchesRes.data || [];

        // Filter user's teams (where user is captain or player)
        const myTeams = allTeams.filter(team =>
            team.captain_id === user.id ||
            team.players?.some(p => p.user_id === user.id)
        );

        // Get tournaments where user has a team
        const myTournamentIds = myTeams.map(t => t.tournament_id);
        const myTournaments = tournaments.filter(t => myTournamentIds.includes(t.id));

        // Get upcoming matches for user's teams
        const myTeamIds = myTeams.map(t => t.id);
        const myMatches = matches.filter(m =>
            myTeamIds.includes(m.home_team_id) || myTeamIds.includes(m.away_team_id)
        ).slice(0, 5);

        container.innerHTML = `
        <div class="dashboard-page">
            <div class="container">
                <div class="dashboard-header">
                    <h1 class="page-title">
                        <i class="fas fa-gamepad"></i>
                        Mi Dashboard
                    </h1>
                    <p class="page-subtitle">Bienvenido, ${user.username}</p>
                </div>

                <div class="dashboard-stats">
                    <div class="stat-card primary">
                        <i class="fas fa-trophy"></i>
                        <div class="stat-info">
                            <span class="stat-value">${myTournaments.length}</span>
                            <span class="stat-label">Torneos Activos</span>
                        </div>
                    </div>
                    <div class="stat-card secondary">
                        <i class="fas fa-users"></i>
                        <div class="stat-info">
                            <span class="stat-value">${myTeams.length}</span>
                            <span class="stat-label">Mi equipo actual</span>
                        </div>
                    </div>
                    <div class="stat-card accent">
                        <i class="fas fa-calendar"></i>
                        <div class="stat-info">
                            <span class="stat-value">${myMatches.filter(m => m.status === 'SCHEDULED').length}</span>
                            <span class="stat-label">Próximas Partidas</span>
                        </div>
                    </div>
                </div>

                <div class="dashboard-grid">
                    <div class="dashboard-section">
                        <div class="section-header">
                            <h2 class="section-title">
                                <i class="fas fa-users"></i>
                                Mi equipo actual
                            </h2>
                            <a href="#/torneos" class="btn btn-secondary btn-sm">
                                <i class="fas fa-plus"></i>
                                Crear Equipo
                            </a>
                        </div>
                        <div class="teams-list">
                            ${myTeams.length > 0 ? myTeams.map(team => `
                                <div class="team-card-mini">
                                    <div class="team-avatar">
                                        ${team.logo_url
                ? `<img src="${team.logo_url}" alt="${team.name}">`
                : `<i class="fas fa-shield-alt"></i>`}
                                    </div>
                                    <div class="team-info">
                                        <span class="team-name">[${team.tag}] ${team.name}</span>
                                        <span class="team-meta">${team.players?.length || 1} jugadores</span>
                                    </div>
                                    <span class="team-status ${team.approved ? 'approved' : 'pending'}">
                                        ${team.approved ? 'Aprobado' : 'Pendiente'}
                                    </span>
                                </div>
                            `).join('') : `
                                <div class="empty-state-small">
                                    <i class="fas fa-users"></i>
                                    <p>No tienes equipos aún</p>
                                    <a href="#/torneos" class="btn btn-secondary btn-sm">Buscar Torneos</a>
                                </div>
                            `}
                        </div>
                    </div>

                    <div class="dashboard-section">
                        <div class="section-header">
                            <h2 class="section-title">
                                <i class="fas fa-calendar-alt"></i>
                                Próximas Partidas
                            </h2>
                        </div>
                        <div class="matches-list">
                            ${myMatches.length > 0 ? myMatches.map(match => `
                                <div class="match-card-mini">
                                    <div class="match-teams">
                                        <span class="team">${match.home_team?.tag || 'TBD'}</span>
                                        <span class="vs">vs</span>
                                        <span class="team">${match.away_team?.tag || 'TBD'}</span>
                                    </div>
                                    <div class="match-info">
                                        <span class="match-date">${match.scheduled_datetime ? formatDate(match.scheduled_datetime) : 'Por definir'}</span>
                                        <span class="match-status ${match.status.toLowerCase()}">${getStatusLabel(match.status)}</span>
                                    </div>
                                </div>
                            `).join('') : `
                                <div class="empty-state-small">
                                    <i class="fas fa-calendar"></i>
                                    <p>No hay partidas programadas</p>
                                </div>
                            `}
                        </div>
                    </div>

                    <div class="dashboard-section full-width">
                        <div class="section-header">
                            <h2 class="section-title">
                                <i class="fas fa-trophy"></i>
                                Mis Torneos
                            </h2>
                            <a href="#/torneos" class="btn btn-outline btn-sm">Ver Todos</a>
                        </div>
                        <div class="tournaments-list">
                            ${myTournaments.length > 0 ? myTournaments.map(tournament => `
                                <a href="#/torneo/${tournament.id}" class="tournament-card-mini">
                                    <div class="tournament-icon">
                                        <i class="fas fa-trophy"></i>
                                    </div>
                                    <div class="tournament-info">
                                        <span class="tournament-name">${tournament.name}</span>
                                        <span class="tournament-meta">
                                            <i class="fas fa-calendar"></i> ${formatDate(tournament.start_date)}
                                            <i class="fas fa-users"></i> ${tournament.max_participants} equipos
                                        </span>
                                    </div>
                                    <span class="tournament-status ${tournament.status.toLowerCase()}">${getStatusLabel(tournament.status)}</span>
                                </a>
                            `).join('') : `
                                <div class="empty-state-small">
                                    <i class="fas fa-trophy"></i>
                                    <p>No estás participando en ningún torneo</p>
                                    <a href="#/torneos" class="btn btn-primary">Explorar Torneos</a>
                                </div>
                            `}
                        </div>
                    </div>
                </div>

                <!-- AI Insights Section -->
                <div class="dashboard-section full-width ai-insights-section" id="aiInsightsSection">
                    <div class="section-header">
                        <h2 class="section-title">
                            <i class="fas fa-robot"></i>
                            Insights de IA
                            <span class="ai-badge-small">BETA</span>
                        </h2>
                    </div>
                    <div class="ai-insights-content" id="aiInsightsContent">
                        <div class="ai-loading">
                            <div class="ai-loading-icon"><i class="fas fa-brain fa-spin"></i></div>
                            <p>Analizando tu rendimiento...</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        `;

        // Load AI insights asynchronously
        loadAIInsights(user.id);
    } catch (error) {
        console.error('Dashboard error:', error);
        container.innerHTML = `
        <div class="container">
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Error al cargar el dashboard</h3>
                <p>${error.message}</p>
                <a href="#/" class="btn btn-primary">Volver al inicio</a>
            </div>
        </div>
        `;
    }
}

function getStatusLabel(status) {
    const labels = {
        'DRAFT': 'Borrador',
        'PUBLISHED': 'Publicado',
        'REGISTRATION_OPEN': 'Inscripciones Abiertas',
        'REGISTRATION_CLOSED': 'Inscripciones Cerradas',
        'IN_PROGRESS': 'En Curso',
        'COMPLETED': 'Finalizado',
        'CANCELLED': 'Cancelado',
        'SCHEDULED': 'Programada',
        'CHECK_IN': 'Check-in',
        'LIVE': 'En Vivo',
        'DISPUTED': 'Disputada'
    };
    return labels[status] || status;
}

async function loadAIInsights(userId) {
    const container = document.getElementById('aiInsightsContent');
    if (!container) return;

    try {
        const response = await fetch(`${API.baseUrl || 'http://localhost:3000'}/ai/insights/${userId}`);
        const data = await response.json();

        if (data.success && data.data) {
            const { summary, tips, strengths, weaknesses } = data.data;
            container.innerHTML = `
                <div class="ai-insight-summary">
                    <i class="fas fa-robot"></i>
                    <p>${summary}</p>
                </div>
                ${strengths.length > 0 ? `
                <div class="ai-insight-group">
                    <h4><i class="fas fa-arrow-up" style="color:#00ff88"></i> Fortalezas</h4>
                    <ul>${strengths.map(s => `<li>${s}</li>`).join('')}</ul>
                </div>` : ''}
                ${weaknesses.length > 0 ? `
                <div class="ai-insight-group">
                    <h4><i class="fas fa-arrow-down" style="color:#ff6b6b"></i> Áreas de Mejora</h4>
                    <ul>${weaknesses.map(w => `<li>${w}</li>`).join('')}</ul>
                </div>` : ''}
                ${tips.length > 0 ? `
                <div class="ai-insight-group tips">
                    <h4><i class="fas fa-lightbulb" style="color:#ffd93d"></i> Consejos de IA</h4>
                    <ul>${tips.map(t => `<li>${t}</li>`).join('')}</ul>
                </div>` : ''}
            `;
        } else {
            container.innerHTML = `<p class="ai-insight-empty"><i class="fas fa-info-circle"></i> Participa en torneos para generar insights personalizados.</p>`;
        }
    } catch (error) {
        console.warn('AI Insights not available:', error.message);
        container.innerHTML = `<p class="ai-insight-empty"><i class="fas fa-info-circle"></i> Insights de IA no disponible en este momento.</p>`;
    }
}

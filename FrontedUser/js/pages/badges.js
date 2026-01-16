// =====================================================
// Badges / Achievements Page
// =====================================================

import { isAuthenticated, getStoredUser } from '../auth.js';
import { showLoading } from '../app.js';
import { launchConfetti } from '../confetti.js';

// Badge definitions
const BADGES = [
    // Participation badges
    {
        id: 'first_match',
        name: 'Primera Partida',
        description: 'Juega tu primera partida',
        icon: 'fas fa-play',
        category: 'participation',
        rarity: 'common',
        requirement: 1,
        type: 'matches'
    },
    {
        id: 'match_10',
        name: 'Jugador Activo',
        description: 'Juega 10 partidas',
        icon: 'fas fa-gamepad',
        category: 'participation',
        rarity: 'common',
        requirement: 10,
        type: 'matches'
    },
    {
        id: 'match_50',
        name: 'Veterano',
        description: 'Juega 50 partidas',
        icon: 'fas fa-medal',
        category: 'participation',
        rarity: 'rare',
        requirement: 50,
        type: 'matches'
    },
    {
        id: 'match_100',
        name: 'Leyenda',
        description: 'Juega 100 partidas',
        icon: 'fas fa-crown',
        category: 'participation',
        rarity: 'legendary',
        requirement: 100,
        type: 'matches'
    },
    // Win badges
    {
        id: 'first_win',
        name: 'Primera Victoria',
        description: 'Gana tu primera partida',
        icon: 'fas fa-trophy',
        category: 'wins',
        rarity: 'common',
        requirement: 1,
        type: 'wins'
    },
    {
        id: 'win_10',
        name: 'Ganador',
        description: 'Gana 10 partidas',
        icon: 'fas fa-award',
        category: 'wins',
        rarity: 'uncommon',
        requirement: 10,
        type: 'wins'
    },
    {
        id: 'win_25',
        name: 'Campeón',
        description: 'Gana 25 partidas',
        icon: 'fas fa-star',
        category: 'wins',
        rarity: 'rare',
        requirement: 25,
        type: 'wins'
    },
    {
        id: 'win_50',
        name: 'Dominador',
        description: 'Gana 50 partidas',
        icon: 'fas fa-bolt',
        category: 'wins',
        rarity: 'epic',
        requirement: 50,
        type: 'wins'
    },
    // Streak badges
    {
        id: 'streak_3',
        name: 'Racha Inicial',
        description: 'Gana 3 partidas seguidas',
        icon: 'fas fa-fire',
        category: 'streaks',
        rarity: 'uncommon',
        requirement: 3,
        type: 'streak'
    },
    {
        id: 'streak_5',
        name: 'En Fuego',
        description: 'Gana 5 partidas seguidas',
        icon: 'fas fa-fire-alt',
        category: 'streaks',
        rarity: 'rare',
        requirement: 5,
        type: 'streak'
    },
    {
        id: 'streak_10',
        name: 'Imparable',
        description: 'Gana 10 partidas seguidas',
        icon: 'fas fa-meteor',
        category: 'streaks',
        rarity: 'legendary',
        requirement: 10,
        type: 'streak'
    },
    // Tournament badges
    {
        id: 'first_tournament',
        name: 'Competidor',
        description: 'Participa en tu primer torneo',
        icon: 'fas fa-chess',
        category: 'tournaments',
        rarity: 'common',
        requirement: 1,
        type: 'tournaments'
    },
    {
        id: 'tournament_5',
        name: 'Aspirante',
        description: 'Participa en 5 torneos',
        icon: 'fas fa-chess-knight',
        category: 'tournaments',
        rarity: 'uncommon',
        requirement: 5,
        type: 'tournaments'
    },
    {
        id: 'tournament_win',
        name: 'Campeón de Torneo',
        description: 'Gana un torneo',
        icon: 'fas fa-crown',
        category: 'tournaments',
        rarity: 'epic',
        requirement: 1,
        type: 'tournament_wins'
    },
    {
        id: 'tournament_win_3',
        name: 'Tricampeón',
        description: 'Gana 3 torneos',
        icon: 'fas fa-gem',
        category: 'tournaments',
        rarity: 'legendary',
        requirement: 3,
        type: 'tournament_wins'
    },
    // Social badges
    {
        id: 'team_join',
        name: 'Jugador de Equipo',
        description: 'Únete a un equipo',
        icon: 'fas fa-users',
        category: 'social',
        rarity: 'common',
        requirement: 1,
        type: 'teams'
    },
    {
        id: 'team_create',
        name: 'Líder',
        description: 'Crea tu propio equipo',
        icon: 'fas fa-user-shield',
        category: 'social',
        rarity: 'uncommon',
        requirement: 1,
        type: 'teams_created'
    }
];

// Rarity colors
const RARITY_COLORS = {
    common: { bg: 'rgba(148, 163, 184, 0.1)', border: '#94a3b8', text: '#94a3b8' },
    uncommon: { bg: 'rgba(34, 197, 94, 0.1)', border: '#22c55e', text: '#22c55e' },
    rare: { bg: 'rgba(59, 130, 246, 0.1)', border: '#3b82f6', text: '#3b82f6' },
    epic: { bg: 'rgba(168, 85, 247, 0.1)', border: '#a855f7', text: '#a855f7' },
    legendary: { bg: 'rgba(255, 184, 0, 0.1)', border: '#ffb800', text: '#ffb800' }
};

export async function renderBadges(container) {
    if (!isAuthenticated()) {
        window.location.hash = '#/login';
        return;
    }

    showLoading(container);

    try {
        // Simulate user stats (in real app, fetch from API)
        const userStats = {
            matches: 45,
            wins: 28,
            streak: 4,
            tournaments: 8,
            tournament_wins: 2,
            teams: 1,
            teams_created: 0
        };

        // Calculate unlocked badges
        const unlockedBadges = BADGES.filter(badge => {
            const stat = userStats[badge.type] || 0;
            return stat >= badge.requirement;
        }).map(b => b.id);

        // Calculate progress for each badge
        const badgesWithProgress = BADGES.map(badge => ({
            ...badge,
            unlocked: unlockedBadges.includes(badge.id),
            progress: Math.min(100, Math.round((userStats[badge.type] || 0) / badge.requirement * 100)),
            current: userStats[badge.type] || 0
        }));

        // Group by category
        const categories = {
            participation: { name: 'Participación', icon: 'fas fa-gamepad', badges: [] },
            wins: { name: 'Victorias', icon: 'fas fa-trophy', badges: [] },
            streaks: { name: 'Rachas', icon: 'fas fa-fire', badges: [] },
            tournaments: { name: 'Torneos', icon: 'fas fa-chess', badges: [] },
            social: { name: 'Social', icon: 'fas fa-users', badges: [] }
        };

        badgesWithProgress.forEach(badge => {
            if (categories[badge.category]) {
                categories[badge.category].badges.push(badge);
            }
        });

        const totalBadges = BADGES.length;
        const unlockedCount = unlockedBadges.length;
        const completionRate = Math.round((unlockedCount / totalBadges) * 100);

        container.innerHTML = `
        <div class="badges-page">
            <div class="container section">
                <div class="page-header">
                    <h1 class="page-title">
                        <i class="fas fa-award"></i>
                        Logros y Medallas
                    </h1>
                    <p class="page-subtitle">Desbloquea logros completando desafíos</p>
                </div>

                <!-- Progress Overview -->
                <div class="badges-overview">
                    <div class="overview-content">
                        <div class="overview-stats">
                            <div class="overview-stat">
                                <span class="overview-value">${unlockedCount}</span>
                                <span class="overview-label">de ${totalBadges} logros</span>
                            </div>
                            <div class="overview-progress-container">
                                <div class="overview-progress-bar">
                                    <div class="overview-progress-fill" style="width: ${completionRate}%"></div>
                                </div>
                                <span class="overview-percentage">${completionRate}%</span>
                            </div>
                        </div>
                        <div class="rarity-legend">
                            ${Object.entries(RARITY_COLORS).map(([rarity, colors]) => `
                                <span class="rarity-item" style="color: ${colors.text}">
                                    <i class="fas fa-circle"></i> ${rarity.charAt(0).toUpperCase() + rarity.slice(1)}
                                </span>
                            `).join('')}
                        </div>
                    </div>
                </div>

                <!-- Badge Categories -->
                ${Object.entries(categories).map(([key, category]) => `
                    <div class="badge-category">
                        <h2 class="category-title">
                            <i class="${category.icon}"></i>
                            ${category.name}
                            <span class="category-count">${category.badges.filter(b => b.unlocked).length}/${category.badges.length}</span>
                        </h2>
                        <div class="badges-grid">
                            ${category.badges.map(badge => renderBadgeCard(badge)).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>

        <style>
            .badges-page {
                min-height: calc(100vh - 70px);
            }

            .badges-overview {
                background: var(--bg-card);
                border: 1px solid var(--border-color);
                border-radius: var(--border-radius);
                padding: 24px;
                margin-bottom: 40px;
            }

            .overview-content {
                display: flex;
                justify-content: space-between;
                align-items: center;
                flex-wrap: wrap;
                gap: 20px;
            }

            .overview-stats {
                display: flex;
                align-items: center;
                gap: 24px;
            }

            .overview-stat {
                display: flex;
                flex-direction: column;
            }

            .overview-value {
                font-family: var(--font-display);
                font-size: 36px;
                font-weight: 800;
                color: var(--primary);
            }

            .overview-label {
                font-size: 14px;
                color: var(--text-secondary);
            }

            .overview-progress-container {
                display: flex;
                align-items: center;
                gap: 12px;
            }

            .overview-progress-bar {
                width: 200px;
                height: 10px;
                background: var(--bg-tertiary);
                border-radius: 5px;
                overflow: hidden;
            }

            .overview-progress-fill {
                height: 100%;
                background: linear-gradient(90deg, var(--primary), var(--secondary));
                border-radius: 5px;
                transition: width 0.5s ease;
            }

            .overview-percentage {
                font-weight: 600;
                color: var(--secondary);
            }

            .rarity-legend {
                display: flex;
                gap: 16px;
                flex-wrap: wrap;
            }

            .rarity-item {
                display: flex;
                align-items: center;
                gap: 6px;
                font-size: 12px;
            }

            .rarity-item i {
                font-size: 8px;
            }

            .badge-category {
                margin-bottom: 40px;
            }

            .category-title {
                font-family: var(--font-display);
                font-size: 20px;
                font-weight: 600;
                display: flex;
                align-items: center;
                gap: 12px;
                margin-bottom: 20px;
            }

            .category-title i {
                color: var(--primary);
            }

            .category-count {
                font-size: 14px;
                color: var(--text-secondary);
                font-weight: 400;
            }

            .badges-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                gap: 16px;
            }

            .badge-card {
                background: var(--bg-card);
                border: 2px solid var(--border-color);
                border-radius: var(--border-radius);
                padding: 20px;
                display: flex;
                gap: 16px;
                transition: var(--transition);
                position: relative;
                overflow: hidden;
            }

            .badge-card.locked {
                opacity: 0.6;
            }

            .badge-card.unlocked:hover {
                transform: translateY(-4px);
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            }

            .badge-icon {
                width: 60px;
                height: 60px;
                border-radius: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 24px;
                flex-shrink: 0;
            }

            .badge-card.locked .badge-icon {
                filter: grayscale(1);
            }

            .badge-info {
                flex: 1;
                min-width: 0;
            }

            .badge-name {
                font-weight: 600;
                font-size: 16px;
                margin-bottom: 4px;
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .badge-rarity {
                font-size: 10px;
                padding: 2px 8px;
                border-radius: 100px;
                font-weight: 600;
                text-transform: uppercase;
            }

            .badge-description {
                font-size: 13px;
                color: var(--text-secondary);
                margin-bottom: 8px;
            }

            .badge-progress {
                width: 100%;
                height: 6px;
                background: var(--bg-tertiary);
                border-radius: 3px;
                overflow: hidden;
            }

            .badge-progress-fill {
                height: 100%;
                border-radius: 3px;
                transition: width 0.3s ease;
            }

            .badge-progress-text {
                font-size: 11px;
                color: var(--text-muted);
                margin-top: 4px;
            }

            .badge-checkmark {
                position: absolute;
                top: 12px;
                right: 12px;
                width: 24px;
                height: 24px;
                background: var(--secondary);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #000;
                font-size: 12px;
            }

            .badge-card.locked .badge-checkmark {
                display: none;
            }

            .shine-effect {
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100%;
                background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
                animation: shine 3s infinite;
            }

            @keyframes shine {
                0%, 100% { left: -100%; }
                50% { left: 100%; }
            }

            @media (max-width: 768px) {
                .overview-content {
                    flex-direction: column;
                    align-items: flex-start;
                }

                .overview-progress-bar {
                    width: 150px;
                }
            }
        </style>
        `;

        // Add click handlers for unlocked badges (show celebration)
        document.querySelectorAll('.badge-card.unlocked').forEach(card => {
            card.addEventListener('click', () => {
                launchConfetti({ particleCount: 50, spread: 60 });
            });
        });

    } catch (error) {
        container.innerHTML = `
        <div class="container">
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Error al cargar los logros</h3>
                <p>${error.message}</p>
                <a href="#/perfil" class="btn btn-primary">Volver al perfil</a>
            </div>
        </div>
        `;
    }
}

function renderBadgeCard(badge) {
    const colors = RARITY_COLORS[badge.rarity];

    return `
        <div class="badge-card ${badge.unlocked ? 'unlocked' : 'locked'}" 
             style="border-color: ${badge.unlocked ? colors.border : 'var(--border-color)'}">
            ${badge.unlocked ? '<div class="shine-effect"></div>' : ''}
            <div class="badge-icon" style="background: ${colors.bg}; color: ${colors.text}">
                <i class="${badge.icon}"></i>
            </div>
            <div class="badge-info">
                <div class="badge-name">
                    ${badge.name}
                    <span class="badge-rarity" style="background: ${colors.bg}; color: ${colors.text}">
                        ${badge.rarity}
                    </span>
                </div>
                <p class="badge-description">${badge.description}</p>
                ${!badge.unlocked ? `
                    <div class="badge-progress">
                        <div class="badge-progress-fill" style="width: ${badge.progress}%; background: ${colors.border}"></div>
                    </div>
                    <span class="badge-progress-text">${badge.current}/${badge.requirement}</span>
                ` : ''}
            </div>
            ${badge.unlocked ? '<div class="badge-checkmark"><i class="fas fa-check"></i></div>' : ''}
        </div>
    `;
}

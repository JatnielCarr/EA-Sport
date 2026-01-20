// =====================================================
// Match History Page
// =====================================================

import API from '../api.js';
import { isAuthenticated, getStoredUser } from '../auth.js';
import { showLoading, formatDate } from '../ui-helpers.js';

export async function renderHistory(container) {
    if (!isAuthenticated()) {
        window.location.hash = '#/login';
        return;
    }

    showLoading(container);

    try {
        const user = getStoredUser();

        // Try to fetch user's match history (if endpoint exists)
        let matches = [];
        try {
            const response = await API.matches.getByUser(user.id);
            matches = response.data || [];
        } catch (e) {
            // Generate sample data if no endpoint
            matches = generateSampleHistory();
        }

        // Calculate stats
        const stats = calculateStats(matches);

        container.innerHTML = `
        <div class="history-page">
            <div class="container section">
                <div class="page-header">
                    <h1 class="page-title">
                        <i class="fas fa-history"></i>
                        Historial de Partidas
                    </h1>
                    <p class="page-subtitle">Revisa tu desempeño en partidas anteriores</p>
                </div>

                <!-- Quick Stats -->
                <div class="history-stats">
                    <div class="history-stat-card">
                        <div class="stat-icon"><i class="fas fa-gamepad"></i></div>
                        <div class="stat-info">
                            <span class="stat-value">${stats.totalMatches}</span>
                            <span class="stat-label">Partidas Totales</span>
                        </div>
                    </div>
                    <div class="history-stat-card win">
                        <div class="stat-icon"><i class="fas fa-trophy"></i></div>
                        <div class="stat-info">
                            <span class="stat-value">${stats.wins}</span>
                            <span class="stat-label">Victorias</span>
                        </div>
                    </div>
                    <div class="history-stat-card loss">
                        <div class="stat-icon"><i class="fas fa-times-circle"></i></div>
                        <div class="stat-info">
                            <span class="stat-value">${stats.losses}</span>
                            <span class="stat-label">Derrotas</span>
                        </div>
                    </div>
                    <div class="history-stat-card">
                        <div class="stat-icon"><i class="fas fa-percentage"></i></div>
                        <div class="stat-info">
                            <span class="stat-value">${stats.winRate}%</span>
                            <span class="stat-label">Win Rate</span>
                        </div>
                    </div>
                </div>

                <!-- Filters -->
                <div class="history-filters">
                    <div class="filter-group">
                        <select id="filterResult" class="filter-select">
                            <option value="">Todos los resultados</option>
                            <option value="win">Victorias</option>
                            <option value="loss">Derrotas</option>
                        </select>
                        <select id="filterGame" class="filter-select">
                            <option value="">Todos los juegos</option>
                            <option value="FC 25">FC 25</option>
                            <option value="Madden 25">Madden 25</option>
                            <option value="NHL 25">NHL 25</option>
                        </select>
                        <input type="date" id="filterDateFrom" class="filter-input" placeholder="Desde">
                        <input type="date" id="filterDateTo" class="filter-input" placeholder="Hasta">
                    </div>
                    <button class="btn btn-secondary" id="clearFilters">
                        <i class="fas fa-times"></i> Limpiar
                    </button>
                </div>

                <!-- Match List -->
                <div class="history-list" id="historyList">
                    ${matches.length > 0 ? renderMatchList(matches) : renderEmptyState()}
                </div>
            </div>
        </div>

        <style>
            .history-page {
                min-height: calc(100vh - 70px);
            }

            .history-stats {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 20px;
                margin-bottom: 32px;
            }

            .history-stat-card {
                background: var(--bg-card);
                border: 1px solid var(--border-color);
                border-radius: var(--border-radius);
                padding: 20px;
                display: flex;
                align-items: center;
                gap: 16px;
                transition: var(--transition);
            }

            .history-stat-card:hover {
                transform: translateY(-2px);
                border-color: var(--primary);
            }

            .history-stat-card .stat-icon {
                width: 50px;
                height: 50px;
                background: rgba(0, 212, 255, 0.1);
                border-radius: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 20px;
                color: var(--primary);
            }

            .history-stat-card.win .stat-icon {
                background: rgba(0, 255, 136, 0.1);
                color: var(--secondary);
            }

            .history-stat-card.loss .stat-icon {
                background: rgba(255, 51, 102, 0.1);
                color: var(--danger);
            }

            .history-stat-card .stat-info {
                display: flex;
                flex-direction: column;
            }

            .history-stat-card .stat-value {
                font-family: var(--font-display);
                font-size: 28px;
                font-weight: 700;
            }

            .history-stat-card .stat-label {
                font-size: 13px;
                color: var(--text-secondary);
            }

            .history-filters {
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 16px;
                margin-bottom: 24px;
                padding: 16px;
                background: var(--bg-card);
                border: 1px solid var(--border-color);
                border-radius: var(--border-radius);
                flex-wrap: wrap;
            }

            .history-filters .filter-group {
                display: flex;
                gap: 12px;
                flex-wrap: wrap;
            }

            .filter-input {
                padding: 10px 16px;
                background: var(--bg-tertiary);
                border: 1px solid var(--border-color);
                border-radius: 8px;
                color: var(--text-primary);
                font-size: 14px;
            }

            .filter-input:focus {
                border-color: var(--primary);
                outline: none;
            }

            .history-list {
                display: flex;
                flex-direction: column;
                gap: 12px;
            }

            .match-card {
                background: var(--bg-card);
                border: 1px solid var(--border-color);
                border-radius: var(--border-radius);
                padding: 20px;
                display: grid;
                grid-template-columns: auto 1fr auto auto;
                gap: 20px;
                align-items: center;
                transition: var(--transition);
            }

            .match-card:hover {
                border-color: var(--primary);
                transform: translateX(4px);
            }

            .match-result {
                width: 60px;
                height: 60px;
                border-radius: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 24px;
            }

            .match-result.win {
                background: rgba(0, 255, 136, 0.1);
                color: var(--secondary);
                border: 2px solid var(--secondary);
            }

            .match-result.loss {
                background: rgba(255, 51, 102, 0.1);
                color: var(--danger);
                border: 2px solid var(--danger);
            }

            .match-info h3 {
                font-size: 16px;
                font-weight: 600;
                margin-bottom: 4px;
            }

            .match-opponent {
                font-size: 14px;
                color: var(--text-secondary);
            }

            .match-game {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                padding: 4px 10px;
                background: rgba(0, 212, 255, 0.1);
                border-radius: 6px;
                font-size: 12px;
                color: var(--primary);
                margin-top: 8px;
            }

            .match-score {
                text-align: center;
            }

            .match-score-value {
                font-family: var(--font-display);
                font-size: 24px;
                font-weight: 700;
            }

            .match-score-label {
                font-size: 12px;
                color: var(--text-muted);
            }

            .match-date {
                text-align: right;
                font-size: 13px;
                color: var(--text-secondary);
            }

            .match-date i {
                margin-right: 4px;
            }

            .match-tournament {
                font-size: 12px;
                color: var(--text-muted);
                margin-top: 4px;
            }

            @media (max-width: 768px) {
                .match-card {
                    grid-template-columns: auto 1fr;
                    grid-template-rows: auto auto;
                }

                .match-score,
                .match-date {
                    grid-column: span 1;
                }
            }
        </style>
        `;

        initHistoryEvents(matches);

    } catch (error) {
        container.innerHTML = `
        <div class="container">
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Error al cargar el historial</h3>
                <p>${error.message}</p>
                <a href="#/perfil" class="btn btn-primary">Volver al perfil</a>
            </div>
        </div>
        `;
    }
}

function calculateStats(matches) {
    const wins = matches.filter(m => m.result === 'win').length;
    const losses = matches.filter(m => m.result === 'loss').length;
    const totalMatches = matches.length;
    const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;

    return { totalMatches, wins, losses, winRate };
}

function generateSampleHistory() {
    const games = ['FC 25', 'Madden 25', 'NHL 25'];
    const opponents = ['Team Alpha', 'Los Guerreros', 'Phoenix Rising', 'Thunder Strike', 'Elite Squad', 'Victory Legion'];
    const tournaments = ['Liga Premier', 'Copa América', 'Champions League', 'Torneo Nacional'];

    const matches = [];
    const now = new Date();

    for (let i = 0; i < 15; i++) {
        const isWin = Math.random() > 0.4;
        const myScore = isWin ? Math.floor(Math.random() * 3) + 2 : Math.floor(Math.random() * 2);
        const oppScore = isWin ? Math.floor(Math.random() * myScore) : myScore + 1 + Math.floor(Math.random() * 2);

        matches.push({
            id: i + 1,
            game: games[Math.floor(Math.random() * games.length)],
            opponent: opponents[Math.floor(Math.random() * opponents.length)],
            tournament: tournaments[Math.floor(Math.random() * tournaments.length)],
            result: isWin ? 'win' : 'loss',
            myScore,
            oppScore,
            date: new Date(now - (i * 24 * 60 * 60 * 1000 * Math.random() * 7)).toISOString()
        });
    }

    return matches.sort((a, b) => new Date(b.date) - new Date(a.date));
}

function renderMatchList(matches) {
    return matches.map(match => `
        <div class="match-card" data-result="${match.result}" data-game="${match.game}">
            <div class="match-result ${match.result}">
                <i class="fas ${match.result === 'win' ? 'fa-trophy' : 'fa-times'}"></i>
            </div>
            <div class="match-info">
                <h3>${match.result === 'win' ? 'Victoria' : 'Derrota'} vs ${match.opponent}</h3>
                <span class="match-opponent"><i class="fas fa-shield-alt"></i> ${match.opponent}</span>
                <span class="match-game"><i class="fas fa-gamepad"></i> ${match.game}</span>
            </div>
            <div class="match-score">
                <div class="match-score-value">${match.myScore} - ${match.oppScore}</div>
                <div class="match-score-label">Marcador</div>
            </div>
            <div class="match-date">
                <i class="fas fa-calendar"></i> ${formatDate(match.date)}
                <div class="match-tournament"><i class="fas fa-trophy"></i> ${match.tournament}</div>
            </div>
        </div>
    `).join('');
}

function renderEmptyState() {
    return `
        <div class="empty-state">
            <i class="fas fa-history"></i>
            <h3>Sin historial de partidas</h3>
            <p>Aún no has jugado ninguna partida</p>
            <a href="#/torneos" class="btn btn-primary">Buscar torneos</a>
        </div>
    `;
}

function initHistoryEvents(allMatches) {
    const filterResult = document.getElementById('filterResult');
    const filterGame = document.getElementById('filterGame');
    const filterDateFrom = document.getElementById('filterDateFrom');
    const filterDateTo = document.getElementById('filterDateTo');
    const clearBtn = document.getElementById('clearFilters');
    const historyList = document.getElementById('historyList');

    function applyFilters() {
        let filtered = [...allMatches];

        const resultFilter = filterResult.value;
        const gameFilter = filterGame.value;
        const dateFrom = filterDateFrom.value;
        const dateTo = filterDateTo.value;

        if (resultFilter) {
            filtered = filtered.filter(m => m.result === resultFilter);
        }
        if (gameFilter) {
            filtered = filtered.filter(m => m.game === gameFilter);
        }
        if (dateFrom) {
            filtered = filtered.filter(m => new Date(m.date) >= new Date(dateFrom));
        }
        if (dateTo) {
            filtered = filtered.filter(m => new Date(m.date) <= new Date(dateTo));
        }

        historyList.innerHTML = filtered.length > 0 ? renderMatchList(filtered) : renderEmptyState();
    }

    filterResult?.addEventListener('change', applyFilters);
    filterGame?.addEventListener('change', applyFilters);
    filterDateFrom?.addEventListener('change', applyFilters);
    filterDateTo?.addEventListener('change', applyFilters);

    clearBtn?.addEventListener('click', () => {
        filterResult.value = '';
        filterGame.value = '';
        filterDateFrom.value = '';
        filterDateTo.value = '';
        historyList.innerHTML = renderMatchList(allMatches);
    });
}

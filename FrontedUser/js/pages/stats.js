// =====================================================
// Player Statistics Page — Detailed personal stats
// =====================================================

import API from '../api.js';
import { getStoredUser } from '../auth.js';

export async function renderStats(container) {
    const currentUser = getStoredUser();
    if (!currentUser) { container.innerHTML = '<p>Inicia sesión para ver tus estadísticas.</p>'; return; }

    container.innerHTML = '<div class="page-loading"><i class="fas fa-spinner fa-spin"></i> Cargando estadísticas...</div>';

    try {
        const res = await API.get(`/users/${currentUser.id}/profile`);
        const user = res.data || res;

        const stats = user.player_stats || [];
        const totalMatches = stats.reduce((s, st) => s + st.total_matches, 0);
        const totalWins = stats.reduce((s, st) => s + st.wins, 0);
        const totalLosses = stats.reduce((s, st) => s + st.losses, 0);
        const overallWinRate = totalMatches > 0 ? (totalWins / totalMatches * 100).toFixed(1) : 0;
        const maxRating = stats.length > 0 ? Math.max(...stats.map(s => s.rating)) : 0;
        const bestRank = stats.length > 0 ? stats.reduce((best, s) => s.rating > best.rating ? s : best).rank : '—';

        container.innerHTML = `
        <div class="stats-page">
            <div class="content-header">
                <h1><i class="fas fa-chart-line"></i> Mis Estadísticas</h1>
                <p>Rendimiento detallado en todos los juegos</p>
            </div>

            <!-- Overview Cards -->
            <div class="stats-overview">
                <div class="so-card">
                    <div class="so-icon" style="background:rgba(0,212,255,0.15);color:#00d4ff;"><i class="fas fa-gamepad"></i></div>
                    <div class="so-value">${totalMatches}</div>
                    <div class="so-label">Partidas Jugadas</div>
                </div>
                <div class="so-card">
                    <div class="so-icon" style="background:rgba(0,255,136,0.15);color:#00ff88;"><i class="fas fa-trophy"></i></div>
                    <div class="so-value">${totalWins}</div>
                    <div class="so-label">Victorias</div>
                </div>
                <div class="so-card">
                    <div class="so-icon" style="background:rgba(255,51,102,0.15);color:#ff3366;"><i class="fas fa-skull"></i></div>
                    <div class="so-value">${totalLosses}</div>
                    <div class="so-label">Derrotas</div>
                </div>
                <div class="so-card">
                    <div class="so-icon" style="background:rgba(255,184,0,0.15);color:#ffb800;"><i class="fas fa-percentage"></i></div>
                    <div class="so-value">${overallWinRate}%</div>
                    <div class="so-label">Win Rate</div>
                </div>
                <div class="so-card">
                    <div class="so-icon" style="background:rgba(138,43,226,0.15);color:#8a2be2;"><i class="fas fa-star"></i></div>
                    <div class="so-value">${maxRating}</div>
                    <div class="so-label">Rating Máximo</div>
                </div>
                <div class="so-card">
                    <div class="so-icon" style="background:rgba(255,215,0,0.15);color:#ffd700;"><i class="fas fa-medal"></i></div>
                    <div class="so-value">${bestRank || '—'}</div>
                    <div class="so-label">Mejor Rango</div>
                </div>
            </div>

            <!-- Win Rate Visual -->
            <div class="stats-section">
                <h2><i class="fas fa-chart-pie"></i> Distribución de Resultados</h2>
                <div class="wr-bar-container">
                    <div class="wr-bar" style="width:${overallWinRate}%;">
                        <span>${totalWins}W (${overallWinRate}%)</span>
                    </div>
                    <div class="wr-bar loss" style="width:${totalMatches > 0 ? (totalLosses / totalMatches * 100).toFixed(1) : 0}%;">
                        <span>${totalLosses}L</span>
                    </div>
                </div>
            </div>

            <!-- Per-Game Stats -->
            <div class="stats-section">
                <h2><i class="fas fa-gamepad"></i> Stats por Juego</h2>
                ${stats.length === 0 ? '<p style="color:var(--text-muted);">Aún no tienes estadísticas. ¡Juega un torneo!</p>' : ''}
                <div class="game-stats-grid">
                    ${stats.map(s => `
                        <div class="gs-card">
                            <div class="gs-header">
                                ${s.game?.icon_url ? `<img src="${s.game.icon_url}" class="gs-icon"/>` : '<i class="fas fa-gamepad" style="font-size:24px;color:var(--primary);"></i>'}
                                <div>
                                    <h3>${s.game?.name || 'Juego'}</h3>
                                    <span class="gs-rank">${getRankBadge(s.rank, s.rating)}</span>
                                </div>
                            </div>
                            <div class="gs-rating">
                                <div class="gs-rating-value">${s.rating}</div>
                                <div class="gs-rating-label">ELO Rating</div>
                            </div>
                            <div class="gs-details">
                                <div class="gs-row"><span>Partidas</span><span>${s.total_matches}</span></div>
                                <div class="gs-row"><span>Victorias</span><span style="color:#00ff88;">${s.wins}</span></div>
                                <div class="gs-row"><span>Derrotas</span><span style="color:#ff3366;">${s.losses}</span></div>
                                <div class="gs-row"><span>Win Rate</span><span style="color:#ffd700;">${s.win_rate.toFixed(1)}%</span></div>
                            </div>
                            <div class="gs-bar-mini">
                                <div class="gs-bar-fill" style="width:${s.win_rate}%;"></div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- Tournaments Played -->
            <div class="stats-section">
                <h2><i class="fas fa-trophy"></i> Participación</h2>
                <div class="so-card" style="max-width:300px;">
                    <div class="so-icon" style="background:rgba(0,212,255,0.15);color:#00d4ff;"><i class="fas fa-flag-checkered"></i></div>
                    <div class="so-value">${user.tournamentsPlayed || 0}</div>
                    <div class="so-label">Torneos Participados</div>
                </div>
            </div>
        </div>

        <style>
            .stats-page { max-width: 1000px; margin: 0 auto; }
            .stats-overview { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 14px; margin-bottom: 28px; }
            .so-card { background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 14px; padding: 20px; text-align: center; }
            .so-icon { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 18px; margin: 0 auto 10px; }
            .so-value { font-size: 26px; font-weight: 900; font-family: 'Orbitron', mono; }
            .so-label { font-size: 12px; color: var(--text-muted); margin-top: 4px; }
            .stats-section { margin-bottom: 28px; }
            .stats-section h2 { font-size: 16px; margin-bottom: 14px; }
            .stats-section h2 i { color: var(--primary); margin-right: 8px; }
            .wr-bar-container { display: flex; height: 36px; border-radius: 10px; overflow: hidden; background: var(--bg-tertiary); }
            .wr-bar { background: linear-gradient(90deg, #00d4ff, #00ff88); display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; color: #000; min-width: 40px; }
            .wr-bar.loss { background: linear-gradient(90deg, #ff3366, #ff6b35); color: #fff; }
            .game-stats-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
            .gs-card { background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 14px; padding: 20px; }
            .gs-header { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; }
            .gs-header h3 { margin: 0; font-size: 15px; }
            .gs-icon { width: 36px; height: 36px; border-radius: 8px; }
            .gs-rank { font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 4px; background: rgba(255,215,0,0.15); color: #ffd700; }
            .gs-rating { text-align: center; margin: 12px 0; }
            .gs-rating-value { font-size: 36px; font-weight: 900; font-family: 'Orbitron', mono; background: linear-gradient(135deg, #00d4ff, #ffd700); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
            .gs-rating-label { font-size: 11px; color: var(--text-muted); text-transform: uppercase; }
            .gs-details { margin-top: 12px; }
            .gs-row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 13px; border-bottom: 1px solid var(--border-color); }
            .gs-row:last-child { border-bottom: none; }
            .gs-row span:first-child { color: var(--text-muted); }
            .gs-row span:last-child { font-weight: 700; }
            .gs-bar-mini { height: 4px; background: var(--bg-tertiary); border-radius: 2px; margin-top: 10px; }
            .gs-bar-fill { height: 100%; background: linear-gradient(90deg, #00d4ff, #00ff88); border-radius: 2px; }
        </style>
        `;
    } catch (err) {
        container.innerHTML = `<div class="error-state"><p>Error cargando estadísticas: ${err.message}</p></div>`;
    }
}

function getRankBadge(rank, rating) {
    const colors = {
        'Apex Predator': '#ff3366',
        'Master': '#9b59b6',
        'Diamond': '#00d4ff',
        'Platinum': '#3498db',
        'Gold': '#ffd700',
        'Silver': '#bdc3c7',
        'Bronze': '#cd6a32',
        'Rookie': '#95a5a6',
    };
    const color = colors[rank] || '#8b95a5';
    return `<span style="color:${color};">${rank || 'Sin Rango'} (${rating})</span>`;
}

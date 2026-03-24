// =====================================================
// Public Profile Page — View any player's profile
// =====================================================

import API from '../api.js';

export async function renderPublicProfile(container, userId) {
    container.innerHTML = '<div class="page-loading"><i class="fas fa-spinner fa-spin"></i> Cargando perfil...</div>';

    try {
        const res = await API.get(`/users/${userId}/profile`);
        const user = res.data || res;

        const primaryClan = user.clan_memberships?.[0];
        const memberSince = new Date(user.created_at).toLocaleDateString('es-MX', { year: 'numeric', month: 'long' });

        container.innerHTML = `
        <div class="profile-public-page">
            <!-- Banner + Avatar -->
            <div class="pp-banner" style="background-image:url('${user.banner_url || ''}');">
                <div class="pp-banner-overlay"></div>
                <div class="pp-avatar-area">
                    <img class="pp-avatar" src="${user.avatar_url || 'https://via.placeholder.com/120'}" onerror="this.src='https://via.placeholder.com/120'" />
                    <div class="pp-name-area">
                        <h1>${user.username}</h1>
                        <div class="pp-meta">
                            ${user.role === 'ADMIN' ? '<span class="pp-badge admin"><i class="fas fa-shield-alt"></i> Admin</span>' : ''}
                            ${primaryClan ? `<span class="pp-badge clan"><i class="fas fa-shield-alt"></i> [${primaryClan.clan.tag}] ${primaryClan.clan.name}</span>` : ''}
                            <span class="pp-since"><i class="fas fa-calendar-alt"></i> Desde ${memberSince}</span>
                        </div>
                    </div>
                </div>
            </div>

            ${user.description ? `<div class="pp-bio">${user.description}</div>` : ''}

            <!-- Stats Grid -->
            <div class="pp-stats-grid">
                <div class="pp-stat-card">
                    <div class="pp-stat-value">${user.tournamentsPlayed || 0}</div>
                    <div class="pp-stat-label">Torneos</div>
                </div>
                <div class="pp-stat-card">
                    <div class="pp-stat-value">${(user.player_stats || []).reduce((sum, s) => sum + s.wins, 0)}</div>
                    <div class="pp-stat-label">Victorias</div>
                </div>
                <div class="pp-stat-card">
                    <div class="pp-stat-value">${(user.player_stats || []).reduce((sum, s) => sum + s.total_matches, 0)}</div>
                    <div class="pp-stat-label">Partidas</div>
                </div>
                <div class="pp-stat-card">
                    <div class="pp-stat-value">${getOverallWinRate(user.player_stats)}%</div>
                    <div class="pp-stat-label">Win Rate</div>
                </div>
            </div>

            <!-- Game Stats -->
            ${(user.player_stats || []).length > 0 ? `
                <div class="pp-section">
                    <h2><i class="fas fa-gamepad"></i> Estadísticas por Juego</h2>
                    <div class="pp-games-grid">
                        ${user.player_stats.map(s => `
                            <div class="pp-game-card">
                                <div class="pp-game-header">
                                    ${s.game?.icon_url ? `<img src="${s.game.icon_url}" class="pp-game-icon"/>` : '<i class="fas fa-gamepad"></i>'}
                                    <h3>${s.game?.name || 'Juego'}</h3>
                                </div>
                                <div class="pp-game-stats">
                                    <div><span class="label">Rating:</span> <span class="value" style="color:#ffd700;">${s.rating}</span></div>
                                    <div><span class="label">Rango:</span> <span class="value">${s.rank || 'Sin rango'}</span></div>
                                    <div><span class="label">W/L:</span> <span class="value">${s.wins}W - ${s.losses}L</span></div>
                                    <div><span class="label">Win Rate:</span> <span class="value">${s.win_rate.toFixed(1)}%</span></div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}

            <!-- Game Accounts -->
            ${(user.game_accounts || []).length > 0 ? `
                <div class="pp-section">
                    <h2><i class="fas fa-link"></i> Cuentas Vinculadas</h2>
                    <div class="pp-accounts">
                        ${user.game_accounts.map(a => `
                            <div class="pp-account">
                                ${a.game?.icon_url ? `<img src="${a.game.icon_url}" class="pp-game-icon"/>` : '<i class="fas fa-gamepad"></i>'}
                                <div>
                                    <strong>${a.game?.name}</strong>
                                    <div style="font-size:12px;color:var(--text-muted);">${a.game_username} ${a.rank ? `· ${a.rank}` : ''}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}

            <!-- Recent Teams -->
            ${(user.captained_teams || []).length > 0 ? `
                <div class="pp-section">
                    <h2><i class="fas fa-users"></i> Equipos Recientes</h2>
                    <div class="pp-teams">
                        ${user.captained_teams.map(t => `
                            <div class="pp-team-item">
                                <strong>${t.name}</strong> [${t.tag}]
                                <span style="font-size:12px;color:var(--text-muted);"> — ${t.tournament?.name || ''}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
        </div>

        <style>
            .profile-public-page { max-width: 900px; margin: 0 auto; }
            .pp-banner { position: relative; height: 200px; border-radius: 16px; overflow: hidden; background: linear-gradient(135deg, #0a0e17, #141926); background-size: cover; background-position: center; margin-bottom: 24px; }
            .pp-banner-overlay { position: absolute; inset: 0; background: linear-gradient(transparent 30%, rgba(10,14,23,0.95)); }
            .pp-avatar-area { position: absolute; bottom: 20px; left: 24px; display: flex; align-items: flex-end; gap: 16px; z-index: 2; }
            .pp-avatar { width: 80px; height: 80px; border-radius: 16px; border: 3px solid var(--primary); object-fit: cover; }
            .pp-name-area h1 { margin: 0; font-size: 24px; }
            .pp-meta { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; margin-top: 4px; }
            .pp-badge { padding: 3px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; }
            .pp-badge.admin { background: rgba(255,51,102,0.2); color: #ff3366; }
            .pp-badge.clan { background: rgba(138,43,226,0.2); color: #8a2be2; }
            .pp-since { font-size: 12px; color: var(--text-muted); }
            .pp-bio { background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 12px; padding: 16px; margin-bottom: 20px; font-size: 14px; line-height: 1.6; }
            .pp-stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
            .pp-stat-card { background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 12px; padding: 20px; text-align: center; }
            .pp-stat-value { font-size: 28px; font-weight: 900; font-family: 'Orbitron', mono; color: var(--primary); }
            .pp-stat-label { font-size: 12px; color: var(--text-muted); margin-top: 4px; }
            .pp-section { margin-bottom: 24px; }
            .pp-section h2 { font-size: 16px; margin-bottom: 14px; }
            .pp-section h2 i { color: var(--primary); margin-right: 8px; }
            .pp-games-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 14px; }
            .pp-game-card { background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 12px; padding: 16px; }
            .pp-game-header { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
            .pp-game-header h3 { margin: 0; font-size: 14px; }
            .pp-game-icon { width: 28px; height: 28px; border-radius: 6px; }
            .pp-game-stats div { display: flex; justify-content: space-between; padding: 3px 0; font-size: 13px; }
            .pp-game-stats .label { color: var(--text-muted); }
            .pp-game-stats .value { font-weight: 700; }
            .pp-accounts { display: flex; flex-wrap: wrap; gap: 12px; }
            .pp-account { display: flex; align-items: center; gap: 10px; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 10px; padding: 10px 16px; }
            .pp-team-item { padding: 10px 16px; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 10px; margin-bottom: 8px; }
            @media (max-width: 768px) { .pp-stats-grid { grid-template-columns: repeat(2, 1fr); } }
        </style>
        `;
    } catch (err) {
        container.innerHTML = `<div class="error-state"><h2>Usuario no encontrado</h2><p>${err.message}</p><a href="#/ranking" class="btn">Ver Ranking</a></div>`;
    }
}

function getOverallWinRate(stats) {
    if (!stats || stats.length === 0) return 0;
    const totalWins = stats.reduce((s, st) => s + st.wins, 0);
    const totalMatches = stats.reduce((s, st) => s + st.total_matches, 0);
    return totalMatches > 0 ? (totalWins / totalMatches * 100).toFixed(1) : 0;
}

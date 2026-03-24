// =====================================================
// PAGES - Leaderboard / Rankings
// =====================================================

import API from '../api.js';
import { showLoading, showToast, formatDate } from '../ui.js';

let allUsers = [];
let allTeams = [];
let allMatches = [];
let allGames = [];

export async function renderLeaderboard(container) {
    showLoading(container);

    try {
        // Fetch all data in parallel
        const [usersRes, teamsRes, matchesRes, gamesRes] = await Promise.all([
            API.users.getAll(),
            API.teams.getAll(),
            API.matches.getAll(),
            API.games.getAll()
        ]);

        allUsers = usersRes.data || [];
        allTeams = teamsRes.data || [];
        allMatches = matchesRes.data || [];
        allGames = gamesRes.data || [];

        // Calculate player stats from matches
        const playerStats = calculatePlayerStats(allUsers, allTeams, allMatches);

        container.innerHTML = `
      <div class="leaderboard-page">
        <!-- Page Header -->
        <div class="leaderboard-header">
          <div class="leaderboard-title-section">
            <h1 class="leaderboard-main-title">
              <i class="fas fa-crown" style="color: #ffd700;"></i>
              Leaderboard Global
            </h1>
            <p class="leaderboard-subtitle">Clasificación de los mejores jugadores</p>
          </div>
          <div class="leaderboard-filters">
            <select class="form-control" id="filterGame" style="width: 180px;">
              <option value="">Todos los juegos</option>
              ${allGames.map(g => `<option value="${g.id}">${g.name}</option>`).join('')}
            </select>
            <select class="form-control" id="filterPeriod" style="width: 150px;">
              <option value="all">Todo el tiempo</option>
              <option value="month">Este mes</option>
              <option value="week">Esta semana</option>
            </select>
          </div>
        </div>

        <!-- Top 3 Podium -->
        <div class="podium-section">
          ${renderPodium(playerStats.slice(0, 3))}
        </div>

        <!-- Full Leaderboard Table -->
        <div class="leaderboard-card">
          <div class="leaderboard-card-header">
            <h2>
              <i class="fas fa-list-ol"></i>
              Clasificación Completa
            </h2>
            <span class="player-count">${playerStats.length} jugadores</span>
          </div>
          <div class="leaderboard-table-container">
            <table class="leaderboard-table">
              <thead>
                <tr>
                  <th class="rank-col">Pos.</th>
                  <th class="player-col">Jugador</th>
                  <th class="stats-col">Partidas</th>
                  <th class="stats-col">Victorias</th>
                  <th class="stats-col">Derrotas</th>
                  <th class="stats-col">Win Rate</th>
                  <th class="rating-col">Rating</th>
                </tr>
              </thead>
              <tbody id="leaderboardBody">
                ${renderLeaderboardRows(playerStats)}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <style>
        .leaderboard-page {
          animation: fadeIn 0.3s ease;
        }

        .leaderboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          flex-wrap: wrap;
          gap: 20px;
        }

        .leaderboard-main-title {
          font-family: 'Orbitron', sans-serif;
          font-size: 28px;
          font-weight: 800;
          margin-bottom: 8px;
          background: linear-gradient(90deg, #ffd700, #ff6b35, #00d4ff);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .leaderboard-main-title i {
          -webkit-text-fill-color: #ffd700;
        }

        .leaderboard-subtitle {
          color: var(--text-secondary);
          font-size: 14px;
        }

        .leaderboard-filters {
          display: flex;
          gap: 12px;
        }

        /* Podium Section */
        .podium-section {
          display: flex;
          justify-content: center;
          align-items: flex-end;
          gap: 20px;
          margin-bottom: 40px;
          padding: 40px 20px;
          background: linear-gradient(180deg, rgba(255, 215, 0, 0.05) 0%, transparent 100%);
          border-radius: var(--border-radius);
          border: 1px solid var(--border-color);
        }

        .podium-player {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          transition: transform 0.3s ease;
        }

        .podium-player:hover {
          transform: translateY(-10px);
        }

        .podium-player.first {
          order: 2;
        }
        .podium-player.second {
          order: 1;
        }
        .podium-player.third {
          order: 3;
        }

        .podium-crown {
          font-size: 32px;
          margin-bottom: 10px;
          animation: float 3s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        .podium-avatar {
          width: 80px;
          height: 80px;
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          color: white;
          margin-bottom: 15px;
          position: relative;
          overflow: hidden;
        }

        .podium-player.first .podium-avatar {
          width: 100px;
          height: 100px;
          font-size: 36px;
          background: linear-gradient(135deg, #ffd700, #ff6b35);
          box-shadow: 0 0 40px rgba(255, 215, 0, 0.5);
        }

        .podium-player.second .podium-avatar {
          background: linear-gradient(135deg, #c0c0c0, #a0a0a0);
          box-shadow: 0 0 30px rgba(192, 192, 192, 0.5);
        }

        .podium-player.third .podium-avatar {
          background: linear-gradient(135deg, #cd7f32, #b87333);
          box-shadow: 0 0 30px rgba(205, 127, 50, 0.5);
        }

        .podium-name {
          font-weight: 700;
          font-size: 16px;
          margin-bottom: 5px;
        }

        .podium-stats {
          font-size: 12px;
          color: var(--text-secondary);
        }

        .podium-rating {
          font-family: 'Orbitron', sans-serif;
          font-size: 24px;
          font-weight: 900;
          margin-top: 10px;
        }

        .podium-player.first .podium-rating {
          color: #ffd700;
          text-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
        }

        .podium-player.second .podium-rating {
          color: #c0c0c0;
        }

        .podium-player.third .podium-rating {
          color: #cd7f32;
        }

        .podium-base {
          width: 100%;
          margin-top: 15px;
          border-radius: 8px 8px 0 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Orbitron', sans-serif;
          font-size: 24px;
          font-weight: 900;
          color: rgba(255,255,255,0.8);
        }

        .podium-player.first .podium-base {
          height: 100px;
          background: linear-gradient(180deg, rgba(255, 215, 0, 0.3), rgba(255, 215, 0, 0.1));
          border: 1px solid rgba(255, 215, 0, 0.3);
        }

        .podium-player.second .podium-base {
          height: 70px;
          background: linear-gradient(180deg, rgba(192, 192, 192, 0.3), rgba(192, 192, 192, 0.1));
          border: 1px solid rgba(192, 192, 192, 0.3);
        }

        .podium-player.third .podium-base {
          height: 50px;
          background: linear-gradient(180deg, rgba(205, 127, 50, 0.3), rgba(205, 127, 50, 0.1));
          border: 1px solid rgba(205, 127, 50, 0.3);
        }

        /* Leaderboard Card */
        .leaderboard-card {
          background: var(--bg-card);
          border-radius: var(--border-radius);
          border: 1px solid var(--border-color);
          overflow: hidden;
        }

        .leaderboard-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          background: var(--bg-tertiary);
          border-bottom: 1px solid var(--border-color);
        }

        .leaderboard-card-header h2 {
          font-size: 18px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .leaderboard-card-header h2 i {
          color: var(--primary);
        }

        .player-count {
          font-size: 13px;
          color: var(--text-muted);
          padding: 6px 12px;
          background: var(--bg-secondary);
          border-radius: 20px;
        }

        /* Leaderboard Table */
        .leaderboard-table-container {
          overflow-x: auto;
        }

        .leaderboard-table {
          width: 100%;
          border-collapse: collapse;
        }

        .leaderboard-table th {
          padding: 16px 20px;
          text-align: left;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--text-muted);
          background: var(--bg-secondary);
          border-bottom: 1px solid var(--border-color);
        }

        .leaderboard-table td {
          padding: 16px 20px;
          font-size: 14px;
          color: var(--text-primary);
          border-bottom: 1px solid var(--border-color);
        }

        .leaderboard-table tbody tr {
          transition: all 0.2s ease;
        }

        .leaderboard-table tbody tr:hover {
          background: rgba(0, 212, 255, 0.05);
        }

        .rank-col {
          width: 80px;
          text-align: center !important;
        }

        .player-col {
          min-width: 200px;
        }

        .stats-col {
          width: 100px;
          text-align: center !important;
        }

        .rating-col {
          width: 120px;
          text-align: center !important;
        }

        /* Rank Badge */
        .rank-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 10px;
          font-weight: 700;
          font-size: 14px;
        }

        .rank-badge.rank-1 {
          background: linear-gradient(135deg, #ffd700, #ff6b35);
          color: white;
          box-shadow: 0 0 15px rgba(255, 215, 0, 0.4);
        }

        .rank-badge.rank-2 {
          background: linear-gradient(135deg, #c0c0c0, #a0a0a0);
          color: white;
        }

        .rank-badge.rank-3 {
          background: linear-gradient(135deg, #cd7f32, #b87333);
          color: white;
        }

        .rank-badge.rank-other {
          background: var(--bg-tertiary);
          color: var(--text-secondary);
          border: 1px solid var(--border-color);
        }

        /* Player Info */
        .player-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .player-avatar-small {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: linear-gradient(135deg, var(--primary), var(--accent));
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 16px;
        }

        .player-details {
          display: flex;
          flex-direction: column;
        }

        .player-name-text {
          font-weight: 600;
          color: var(--text-primary);
        }

        .player-role-text {
          font-size: 12px;
          color: var(--text-muted);
        }

        /* Win Rate Bar */
        .winrate-bar {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .winrate-progress {
          width: 60px;
          height: 6px;
          background: var(--bg-tertiary);
          border-radius: 3px;
          overflow: hidden;
        }

        .winrate-fill {
          height: 100%;
          border-radius: 3px;
          transition: width 1s ease;
        }

        .winrate-fill.high {
          background: linear-gradient(90deg, #00ff88, #00d4ff);
        }

        .winrate-fill.medium {
          background: linear-gradient(90deg, #ffb800, #ffd700);
        }

        .winrate-fill.low {
          background: linear-gradient(90deg, #ff3366, #ff6b35);
        }

        .winrate-text {
          font-weight: 600;
          min-width: 45px;
        }

        /* Rating Badge */
        .rating-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          background: rgba(0, 212, 255, 0.1);
          border: 1px solid rgba(0, 212, 255, 0.2);
          border-radius: 20px;
          font-family: 'Orbitron', sans-serif;
          font-weight: 700;
          color: var(--primary);
        }

        .rating-badge i {
          font-size: 12px;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .leaderboard-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .podium-section {
            flex-direction: column;
            align-items: center;
            gap: 30px;
          }

          .podium-player {
            order: unset !important;
          }

          .podium-player.first {
            order: -1 !important;
          }
        }
      </style>
    `;

        // Event listeners for filters
        document.getElementById('filterGame').addEventListener('change', () => filterLeaderboard(playerStats));
        document.getElementById('filterPeriod').addEventListener('change', () => filterLeaderboard(playerStats));

    } catch (error) {
        console.error('Error loading leaderboard:', error);
        container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-exclamation-triangle"></i>
        <h3>Error al cargar el leaderboard</h3>
        <p>${error.message}</p>
      </div>
    `;
    }
}

function calculatePlayerStats(users, teams, matches) {
    // Create stats for each user
    const stats = users.map(user => {
        // Find teams where user is captain or member
        const userTeams = teams.filter(t =>
            t.captain_id === user.id ||
            t.players?.some(p => p.user_id === user.id)
        );

        const teamIds = userTeams.map(t => t.id);

        // Find matches for those teams
        const userMatches = matches.filter(m =>
            teamIds.includes(m.home_team_id) || teamIds.includes(m.away_team_id)
        );

        // Calculate wins and losses
        let wins = 0;
        let losses = 0;

        userMatches.forEach(match => {
            if (match.status === 'COMPLETED' && match.winner_id) {
                if (teamIds.includes(match.winner_id)) {
                    wins++;
                } else {
                    losses++;
                }
            }
        });

        const totalMatches = wins + losses;
        const winRate = totalMatches > 0 ? (wins / totalMatches * 100) : 0;

        // Calculate rating (simple ELO-like)
        const baseRating = 1000;
        const rating = baseRating + (wins * 25) - (losses * 15) + (winRate * 2);

        return {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            matches: totalMatches,
            wins,
            losses,
            winRate: Math.round(winRate),
            rating: Math.round(rating)
        };
    });

    // Sort by rating descending
    return stats.sort((a, b) => b.rating - a.rating);
}

function renderPodium(topThree) {
    if (topThree.length === 0) {
        return `<p class="text-muted text-center" style="width: 100%;">No hay datos suficientes para el podio</p>`;
    }

    const positions = ['first', 'second', 'third'];
    const medals = ['🥇', '🥈', '🥉'];

    return topThree.map((player, index) => `
    <div class="podium-player ${positions[index] || ''}">
      <div class="podium-crown">${medals[index] || ''}</div>
      <div class="podium-avatar">
        <i class="fas fa-user"></i>
      </div>
      <div class="podium-name">${player.username}</div>
      <div class="podium-stats">${player.wins}W - ${player.losses}L</div>
      <div class="podium-rating">${player.rating}</div>
      <div class="podium-base">${index + 1}</div>
    </div>
  `).join('');
}

function renderLeaderboardRows(players) {
    if (players.length === 0) {
        return `<tr><td colspan="7" class="text-center text-muted">No hay jugadores registrados</td></tr>`;
    }

    return players.map((player, index) => {
        const rank = index + 1;
        const rankClass = rank <= 3 ? `rank-${rank}` : 'rank-other';
        const winRateClass = player.winRate >= 60 ? 'high' : player.winRate >= 40 ? 'medium' : 'low';

        return `
      <tr>
        <td class="rank-col">
          <span class="rank-badge ${rankClass}">${rank}</span>
        </td>
        <td class="player-col">
          <div class="player-info">
            <div class="player-avatar-small">
              <i class="fas fa-user"></i>
            </div>
            <div class="player-details">
              <span class="player-name-text">${player.username}</span>
              <span class="player-role-text">${getRoleLabel(player.role)}</span>
            </div>
          </div>
        </td>
        <td class="stats-col">${player.matches}</td>
        <td class="stats-col" style="color: var(--success);">${player.wins}</td>
        <td class="stats-col" style="color: var(--danger);">${player.losses}</td>
        <td class="stats-col">
          <div class="winrate-bar">
            <div class="winrate-progress">
              <div class="winrate-fill ${winRateClass}" style="width: ${player.winRate}%"></div>
            </div>
            <span class="winrate-text">${player.winRate}%</span>
          </div>
        </td>
        <td class="rating-col">
          <span class="rating-badge">
            <i class="fas fa-star"></i>
            ${player.rating}
          </span>
        </td>
      </tr>
    `;
    }).join('');
}

function getRoleLabel(role) {
    const labels = {
        'ADMIN': 'Administrador',
        'ORGANIZER': 'Organizador',
        'USER': 'Jugador'
    };
    return labels[role] || role;
}

function filterLeaderboard(allPlayers) {
    const gameFilter = document.getElementById('filterGame').value;
    const periodFilter = document.getElementById('filterPeriod').value;

    // For now, just show all players (filtering would need more data)
    // In a real implementation, you'd filter based on game and period
    let filtered = [...allPlayers];

    // Re-render the table
    document.getElementById('leaderboardBody').innerHTML = renderLeaderboardRows(filtered);
}

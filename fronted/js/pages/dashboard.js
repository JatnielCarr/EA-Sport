// =====================================================
// PAGES - Dashboard Page with Charts
// =====================================================

import API from '../api.js';
import { showLoading, formatCurrency, showToast } from '../ui.js';

// Store chart instances for cleanup
let chartInstances = [];

export async function renderDashboard(container) {
  showLoading(container);

  // Cleanup previous charts
  chartInstances.forEach(chart => chart.destroy());
  chartInstances = [];

  try {
    // Fetch all data in parallel
    const [usersRes, tournamentsRes, teamsRes, matchesRes, gamesRes] = await Promise.all([
      API.users.getAll(),
      API.tournaments.getAll(),
      API.teams.getAll(),
      API.matches.getAll(),
      API.games.getAll()
    ]);

    const users = usersRes.data || [];
    const tournaments = tournamentsRes.data || [];
    const teams = teamsRes.data || [];
    const matches = matchesRes.data || [];
    const games = gamesRes.data || [];

    // Calculate stats
    const activeTournaments = tournaments.filter(t => 
      ['REGISTRATION_OPEN', 'IN_PROGRESS'].includes(t.status)
    ).length;
    const liveMatches = matches.filter(m => m.status === 'LIVE').length;
    const totalPrizePool = tournaments.reduce((sum, t) => sum + (parseFloat(t.prize_pool) || 0), 0);

    // Calculate data for charts
    const tournamentsByStatus = calculateTournamentsByStatus(tournaments);
    const matchesByStatus = calculateMatchesByStatus(matches);
    const usersByRole = calculateUsersByRole(users);
    const tournamentsByGame = calculateTournamentsByGame(tournaments, games);
    const activityData = generateActivityData();

    container.innerHTML = `
      <!-- Welcome Banner -->
      <div class="welcome-banner">
        <div class="welcome-content">
          <h1 class="welcome-title">
            <i class="fas fa-gamepad"></i> 
            ¡Bienvenido al Hub de Torneos!
          </h1>
          <p class="welcome-subtitle">Panel de control para gestionar torneos, equipos y competiciones esports</p>
        </div>
        <div class="welcome-stats">
          <div class="live-indicator-big ${liveMatches > 0 ? 'active' : ''}">
            <span class="live-dot"></span>
            <span class="live-count">${liveMatches}</span>
            <span class="live-label">PARTIDAS EN VIVO</span>
          </div>
        </div>
      </div>

      <!-- 🎯 LIVE MATCHES WIDGET -->
      <div class="live-matches-widget ${liveMatches > 0 || matches.length > 0 ? '' : 'empty'}">
        <div class="live-widget-header">
          <div class="live-widget-title">
            <div class="live-badge-animated">
              <span class="live-dot-pulse"></span>
              LIVE
            </div>
            <h2><i class="fas fa-broadcast-tower"></i> Partidas en Tiempo Real</h2>
          </div>
          <div class="live-widget-actions">
            <button class="live-refresh-btn" onclick="location.reload()">
              <i class="fas fa-sync-alt"></i>
            </button>
            <a href="#/matches" class="btn btn-sm btn-primary">
              Ver Todas <i class="fas fa-arrow-right"></i>
            </a>
          </div>
        </div>
        
        <div class="live-matches-grid">
          ${generateLiveMatchesWidget(matches, teams, tournaments, games)}
        </div>
        
        <div class="live-widget-footer">
          <div class="live-stats-bar">
            <div class="live-stat">
              <i class="fas fa-gamepad"></i>
              <span>${matches.filter(m => m.status === 'LIVE').length} En Vivo</span>
            </div>
            <div class="live-stat">
              <i class="fas fa-clock"></i>
              <span>${matches.filter(m => m.status === 'SCHEDULED').length} Programadas</span>
            </div>
            <div class="live-stat">
              <i class="fas fa-check-circle"></i>
              <span>${matches.filter(m => m.status === 'COMPLETED').length} Finalizadas</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stat-card primary gradient-border-card">
          <div class="stat-header">
            <div class="stat-icon pulse-glow-pro">
              <i class="fas fa-users"></i>
            </div>
            <span class="stat-trend up"><i class="fas fa-arrow-up"></i> +12%</span>
          </div>
          <div class="stat-value">${animateNumber(users.length)}</div>
          <p class="stat-label">Jugadores Registrados</p>
          <div class="stat-progress">
            <div class="stat-progress-bar" style="width: ${Math.min(users.length * 10, 100)}%"></div>
          </div>
        </div>

        <div class="stat-card warning gradient-border-card">
          <div class="stat-header">
            <div class="stat-icon trophy-icon">
              <i class="fas fa-trophy"></i>
            </div>
            <span class="stat-trend up"><i class="fas fa-fire"></i> ${activeTournaments} Activos</span>
          </div>
          <div class="stat-value">${animateNumber(tournaments.length)}</div>
          <p class="stat-label">Torneos Totales</p>
          <div class="stat-progress">
            <div class="stat-progress-bar warning" style="width: ${activeTournaments > 0 ? (activeTournaments / tournaments.length * 100) : 0}%"></div>
          </div>
        </div>

        <div class="stat-card accent gradient-border-card">
          <div class="stat-header">
            <div class="stat-icon">
              <i class="fas fa-shield-halved"></i>
            </div>
            <span class="stat-trend up"><i class="fas fa-check"></i> Activos</span>
          </div>
          <div class="stat-value">${animateNumber(teams.length)}</div>
          <p class="stat-label">Equipos Registrados</p>
          <div class="stat-progress">
            <div class="stat-progress-bar accent" style="width: ${Math.min(teams.length * 15, 100)}%"></div>
          </div>
        </div>

        <div class="stat-card success gradient-border-card">
          <div class="stat-header">
            <div class="stat-icon controller-icon">
              <i class="fas fa-gamepad"></i>
            </div>
            <span class="stat-trend ${liveMatches > 0 ? 'up live-pulse' : ''}">
              <i class="fas fa-broadcast-tower"></i> ${liveMatches} LIVE
            </span>
          </div>
          <div class="stat-value">${animateNumber(matches.length)}</div>
          <p class="stat-label">Partidas Jugadas</p>
          <div class="stat-progress">
            <div class="stat-progress-bar success" style="width: ${Math.min(matches.length * 5, 100)}%"></div>
          </div>
        </div>
      </div>

      <!-- Prize Pool & Games Row -->
      <div class="stats-grid" style="grid-template-columns: repeat(2, 1fr);">
        <div class="stat-card warning gradient-border-card">
          <div class="stat-header">
            <div class="stat-icon">
              <i class="fas fa-coins"></i>
            </div>
            <span class="stat-trend up"><i class="fas fa-chart-line"></i> Premio Total</span>
          </div>
          <div class="stat-value prize-value">${formatCurrency(totalPrizePool)}</div>
          <p class="stat-label">Pool de Premios Acumulado</p>
        </div>

        <div class="stat-card primary gradient-border-card">
          <div class="stat-header">
            <div class="stat-icon">
              <i class="fas fa-dice"></i>
            </div>
            <span class="stat-trend"><i class="fas fa-gamepad"></i> Catálogo</span>
          </div>
          <div class="stat-value">${animateNumber(games.length)}</div>
          <p class="stat-label">Juegos Disponibles</p>
        </div>
      </div>

      <!-- Charts Section -->
      <div class="charts-grid">
        <!-- Activity Chart -->
        <div class="chart-card gradient-border-card">
          <div class="chart-header">
            <h3><i class="fas fa-chart-area"></i> Actividad Semanal</h3>
            <div class="chart-legend">
              <span class="legend-item"><span class="legend-dot" style="background: #00d4ff;"></span> Torneos</span>
              <span class="legend-item"><span class="legend-dot" style="background: #00ff88;"></span> Partidas</span>
            </div>
          </div>
          <div class="chart-container">
            <canvas id="activityChart"></canvas>
          </div>
        </div>

        <!-- Tournaments by Status Doughnut -->
        <div class="chart-card gradient-border-card">
          <div class="chart-header">
            <h3><i class="fas fa-chart-pie"></i> Estado de Torneos</h3>
          </div>
          <div class="chart-container doughnut-container">
            <canvas id="tournamentsStatusChart"></canvas>
          </div>
        </div>

        <!-- Matches by Status -->
        <div class="chart-card gradient-border-card">
          <div class="chart-header">
            <h3><i class="fas fa-gamepad"></i> Estado de Partidas</h3>
          </div>
          <div class="chart-container doughnut-container">
            <canvas id="matchesStatusChart"></canvas>
          </div>
        </div>

        <!-- Users by Role -->
        <div class="chart-card gradient-border-card">
          <div class="chart-header">
            <h3><i class="fas fa-users"></i> Usuarios por Rol</h3>
          </div>
          <div class="chart-container doughnut-container">
            <canvas id="usersRoleChart"></canvas>
          </div>
        </div>
      </div>

      <!-- Tournaments by Game Bar Chart -->
      <div class="chart-card full-width gradient-border-card">
        <div class="chart-header">
          <h3><i class="fas fa-trophy"></i> Torneos por Juego</h3>
          <span class="chart-subtitle">Distribución de torneos en cada plataforma</span>
        </div>
        <div class="chart-container bar-container">
          <canvas id="tournamentsByGameChart"></canvas>
        </div>
      </div>

      <!-- Recent Tournaments -->
      <div class="data-card mt-3 fade-in gradient-border-card">
        <div class="card-header">
          <h2 class="card-title">
            <i class="fas fa-trophy trophy-icon"></i>
            Torneos Recientes
          </h2>
          <a href="#/tournaments" class="btn btn-primary btn-sm btn-cyber">
            Ver todos <i class="fas fa-arrow-right"></i>
          </a>
        </div>
        <div class="card-body">
          ${tournaments.length > 0 ? `
          <table class="data-table">
            <thead>
              <tr>
                <th>Torneo</th>
                <th>Juego</th>
                <th>Formato</th>
                <th>Estado</th>
                <th>Premio</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              ${tournaments.slice(0, 5).map(t => `
                <tr>
                  <td>
                    <strong>${t.name}</strong>
                    <br><small class="text-muted">${t.region || 'Global'}</small>
                  </td>
                  <td>
                    <span class="game-tag">
                      <i class="fas fa-gamepad"></i> ${getGameName(games, t.game_id)}
                    </span>
                  </td>
                  <td><span class="badge badge-info">${formatFormat(t.format)}</span></td>
                  <td>${getStatusBadge(t.status)}</td>
                  <td><strong class="prize-text">${formatCurrency(t.prize_pool)}</strong></td>
                  <td>${formatDateShort(t.start_date)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          ` : '<div class="empty-mini"><i class="fas fa-trophy"></i> No hay torneos aún</div>'}
        </div>
      </div>

      <!-- Top Players Section -->
      <div class="data-card mt-3 fade-in gradient-border-card">
        <div class="card-header">
          <h2 class="card-title">
            <i class="fas fa-crown" style="color: #ffd700;"></i>
            Top Jugadores
          </h2>
          <a href="#/users" class="btn btn-secondary btn-sm">
            Ver todos <i class="fas fa-arrow-right"></i>
          </a>
        </div>
        <div class="card-body">
          <div class="top-players-grid">
            ${users.slice(0, 6).map((u, index) => `
              <div class="player-card ${index < 3 ? 'top-' + (index + 1) : ''}">
                <div class="player-rank">${getRankBadge(index + 1)}</div>
                <div class="player-avatar">
                  <i class="fas fa-user"></i>
                </div>
                <div class="player-info">
                  <span class="player-name">${u.username}</span>
                  <span class="player-type">${index === 0 ? 'Líder' : index < 3 ? 'Veterano' : 'Jugador'}</span>
                </div>
                <div class="player-stats">
                  <span class="player-stat">
                    <i class="fas fa-trophy"></i> ${Math.floor(Math.random() * 10)}
                  </span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="data-card mt-3 fade-in gradient-border-card">
        <div class="card-header">
          <h2 class="card-title">
            <i class="fas fa-bolt" style="color: #ffb800;"></i>
            Acciones Rápidas
          </h2>
        </div>
        <div class="card-body" style="padding: 24px;">
          <div class="quick-actions-grid">
            <a href="#/tournaments" class="quick-action-btn primary">
              <i class="fas fa-plus-circle"></i>
              <span>Nuevo Torneo</span>
            </a>
            <a href="#/users" class="quick-action-btn success">
              <i class="fas fa-user-plus"></i>
              <span>Nuevo Jugador</span>
            </a>
            <a href="#/games" class="quick-action-btn accent">
              <i class="fas fa-gamepad"></i>
              <span>Añadir Juego</span>
            </a>
            <a href="#/teams" class="quick-action-btn info">
              <i class="fas fa-users"></i>
              <span>Ver Equipos</span>
            </a>
            <a href="#/matches" class="quick-action-btn warning">
              <i class="fas fa-crosshairs"></i>
              <span>Ver Partidas</span>
            </a>
          </div>
        </div>
      </div>

      <style>
        /* Welcome Banner */
        .welcome-banner {
          background: linear-gradient(135deg, rgba(0, 212, 255, 0.1) 0%, rgba(255, 107, 53, 0.1) 100%);
          border: 1px solid var(--border-color);
          border-radius: var(--border-radius);
          padding: 30px;
          margin-bottom: 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          position: relative;
          overflow: hidden;
        }
        
        .welcome-banner::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, #00d4ff, #00ff88, #ff6b35);
        }
        
        .welcome-title {
          font-family: 'Orbitron', sans-serif;
          font-size: 24px;
          margin-bottom: 8px;
          background: linear-gradient(90deg, #00d4ff, #00ff88);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        
        .welcome-subtitle {
          color: var(--text-secondary);
          font-size: 14px;
        }
        
        .live-indicator-big {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 20px 30px;
          background: rgba(255, 51, 102, 0.1);
          border: 1px solid rgba(255, 51, 102, 0.3);
          border-radius: 16px;
          opacity: 0.5;
        }
        
        .live-indicator-big.active {
          opacity: 1;
          animation: live-glow 2s ease-in-out infinite;
        }
        
        @keyframes live-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(255, 51, 102, 0.3); }
          50% { box-shadow: 0 0 40px rgba(255, 51, 102, 0.6); }
        }
        
        .live-indicator-big .live-dot {
          width: 12px;
          height: 12px;
          background: #ff3366;
          border-radius: 50%;
          margin-bottom: 8px;
          animation: blink 1s infinite;
        }
        
        .live-indicator-big .live-count {
          font-family: 'Orbitron', sans-serif;
          font-size: 36px;
          font-weight: 900;
          color: #ff3366;
        }
        
        .live-indicator-big .live-label {
          font-size: 11px;
          letter-spacing: 2px;
          color: #ff3366;
          text-transform: uppercase;
        }
        
        @keyframes blink {
          0%, 50%, 100% { opacity: 1; }
          25%, 75% { opacity: 0.3; }
        }

        /* Stat Progress Bar */
        .stat-progress {
          margin-top: 12px;
          height: 4px;
          background: rgba(255,255,255,0.1);
          border-radius: 2px;
          overflow: hidden;
        }
        
        .stat-progress-bar {
          height: 100%;
          background: linear-gradient(90deg, var(--primary), var(--primary-light));
          border-radius: 2px;
          transition: width 1s ease;
        }
        
        .stat-progress-bar.warning { background: linear-gradient(90deg, #ffb800, #ffd700); }
        .stat-progress-bar.accent { background: linear-gradient(90deg, #ff6b35, #ff8f6b); }
        .stat-progress-bar.success { background: linear-gradient(90deg, #00ff88, #00ffaa); }

        /* Charts Grid */
        .charts-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 24px;
          margin-bottom: 24px;
        }
        
        .chart-card {
          background: var(--bg-card);
          border-radius: var(--border-radius);
          border: 1px solid var(--border-color);
          padding: 20px;
          position: relative;
        }
        
        .chart-card.full-width {
          grid-column: 1 / -1;
        }
        
        .chart-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        
        .chart-header h3 {
          font-size: 16px;
          font-weight: 600;
          color: var(--text-primary);
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .chart-header h3 i {
          color: var(--primary);
        }
        
        .chart-subtitle {
          font-size: 12px;
          color: var(--text-muted);
        }
        
        .chart-legend {
          display: flex;
          gap: 16px;
        }
        
        .legend-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: var(--text-secondary);
        }
        
        .legend-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }
        
        .chart-container {
          position: relative;
          height: 250px;
        }
        
        .chart-container.doughnut-container {
          height: 220px;
        }
        
        .chart-container.bar-container {
          height: 300px;
        }

        /* Top Players Grid */
        .top-players-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 16px;
        }
        
        .player-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px;
          background: var(--bg-tertiary);
          border-radius: 12px;
          border: 1px solid var(--border-color);
          transition: var(--transition);
          position: relative;
          overflow: hidden;
          max-width: 100%;
        }
        
        .player-card:hover {
          border-color: var(--primary);
          transform: translateY(-2px);
        }
        
        .player-card.top-1 { border-color: #ffd700; box-shadow: 0 0 20px rgba(255, 215, 0, 0.2); }
        .player-card.top-2 { border-color: #c0c0c0; }
        .player-card.top-3 { border-color: #cd7f32; }
        
        .player-rank {
          position: absolute;
          top: -8px;
          right: -8px;
        }
        
        .player-avatar {
          width: 45px;
          height: 45px;
          border-radius: 12px;
          background: linear-gradient(135deg, var(--primary), var(--accent));
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 18px;
        }
        
        .player-info {
          flex: 1;
          min-width: 0;
          overflow: hidden;
        }
        
        .player-name {
          display: block;
          font-weight: 600;
          font-size: 14px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin-bottom: 4px;
        }
        
        .player-type {
          display: inline-block;
          font-size: 11px;
          padding: 3px 10px;
          border-radius: 12px;
          font-weight: 600;
          background: rgba(0, 212, 255, 0.15);
          color: var(--primary);
          border: 1px solid rgba(0, 212, 255, 0.3);
        }
        
        .player-card.top-1 .player-type {
          background: rgba(255, 215, 0, 0.15);
          color: #ffd700;
          border-color: rgba(255, 215, 0, 0.3);
        }
        
        .player-card.top-2 .player-type,
        .player-card.top-3 .player-type {
          background: rgba(0, 255, 136, 0.15);
          color: var(--success);
          border-color: rgba(0, 255, 136, 0.3);
        }
        
        .player-role {
          display: inline-block;
          font-size: 10px;
          padding: 2px 8px;
          border-radius: 10px;
          text-transform: uppercase;
          font-weight: 600;
          letter-spacing: 0.5px;
        }
        
        .player-role .role-badge {
          font-size: 10px;
          padding: 2px 8px;
        }
        
        .player-stats {
          flex-shrink: 0;
        }
        
        .player-stat {
          font-size: 12px;
          color: var(--primary);
        }

        /* Quick Actions Grid */
        .quick-actions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 16px;
        }
        
        .quick-action-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 24px 16px;
          background: var(--bg-tertiary);
          border: 1px solid var(--border-color);
          border-radius: 16px;
          color: var(--text-primary);
          transition: var(--transition);
          text-align: center;
        }
        
        .quick-action-btn i {
          font-size: 28px;
        }
        
        .quick-action-btn span {
          font-size: 13px;
          font-weight: 600;
        }
        
        .quick-action-btn.primary:hover { border-color: var(--primary); background: rgba(0, 212, 255, 0.1); }
        .quick-action-btn.primary:hover i { color: var(--primary); }
        
        .quick-action-btn.success:hover { border-color: var(--success); background: rgba(0, 255, 136, 0.1); }
        .quick-action-btn.success:hover i { color: var(--success); }
        
        .quick-action-btn.accent:hover { border-color: var(--accent); background: rgba(255, 107, 53, 0.1); }
        .quick-action-btn.accent:hover i { color: var(--accent); }
        
        .quick-action-btn.info:hover { border-color: var(--info); background: rgba(0, 212, 255, 0.1); }
        .quick-action-btn.info:hover i { color: var(--info); }
        
        .quick-action-btn.warning:hover { border-color: var(--warning); background: rgba(255, 184, 0, 0.1); }
        .quick-action-btn.warning:hover i { color: var(--warning); }

        /* Prize Text Animation */
        .prize-text {
          color: #ffd700 !important;
          text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
        }
        
        .prize-value {
          background: linear-gradient(90deg, #ffd700, #ffb800, #ffd700);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shine 3s linear infinite;
        }
        
        @keyframes shine {
          to { background-position: 200% center; }
        }

        /* Game Tag */
        .game-tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          background: rgba(0, 212, 255, 0.1);
          border: 1px solid rgba(0, 212, 255, 0.2);
          border-radius: 20px;
          font-size: 12px;
          color: var(--primary);
        }

        /* Empty Mini */
        .empty-mini {
          text-align: center;
          padding: 40px;
          color: var(--text-muted);
        }
        
        .empty-mini i {
          font-size: 32px;
          margin-bottom: 10px;
          opacity: 0.5;
        }

        /* Live Pulse */
        .live-pulse {
          animation: pulse-animation 1.5s infinite;
        }
        
        @keyframes pulse-animation {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }

        /* =====================================================
           🎯 LIVE MATCHES WIDGET STYLES
           ===================================================== */
        .live-matches-widget {
          background: linear-gradient(135deg, rgba(255, 51, 102, 0.05) 0%, rgba(0, 212, 255, 0.05) 100%);
          border: 1px solid var(--border-color);
          border-radius: var(--border-radius);
          margin-bottom: 24px;
          overflow: hidden;
          position: relative;
        }
        
        .live-matches-widget::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, #ff3366, #ff6b35, #00d4ff, #00ff88);
          background-size: 300% 100%;
          animation: gradient-flow 3s linear infinite;
        }
        
        @keyframes gradient-flow {
          0% { background-position: 0% 50%; }
          100% { background-position: 300% 50%; }
        }
        
        .live-widget-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          background: rgba(0, 0, 0, 0.2);
          border-bottom: 1px solid var(--border-color);
        }
        
        .live-widget-title {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        
        .live-widget-title h2 {
          font-size: 18px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 0;
        }
        
        .live-widget-title h2 i {
          color: var(--primary);
        }
        
        .live-badge-animated {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 14px;
          background: linear-gradient(135deg, #ff3366, #ff0055);
          color: white;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 1px;
          border-radius: 20px;
          animation: pulse-glow-live 2s ease-in-out infinite;
        }
        
        @keyframes pulse-glow-live {
          0%, 100% { box-shadow: 0 0 10px rgba(255, 51, 102, 0.5); }
          50% { box-shadow: 0 0 25px rgba(255, 51, 102, 0.8), 0 0 40px rgba(255, 51, 102, 0.4); }
        }
        
        .live-dot-pulse {
          width: 8px;
          height: 8px;
          background: white;
          border-radius: 50%;
          animation: blink 1s infinite;
        }
        
        .live-widget-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .live-refresh-btn {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: var(--bg-tertiary);
          border: 1px solid var(--border-color);
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .live-refresh-btn:hover {
          color: var(--primary);
          border-color: var(--primary);
          transform: rotate(180deg);
        }
        
        /* Live Matches Grid */
        .live-matches-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
          padding: 24px;
        }
        
        /* Individual Match Card */
        .live-match-card {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 16px;
          overflow: hidden;
          transition: all 0.3s ease;
          position: relative;
        }
        
        .live-match-card:hover {
          transform: translateY(-4px);
          border-color: var(--primary);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }
        
        .live-match-card.is-live {
          border-color: #ff3366;
          box-shadow: 0 0 20px rgba(255, 51, 102, 0.2);
        }
        
        .live-match-card.is-live::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(255, 51, 102, 0.05) 0%, transparent 100%);
          pointer-events: none;
        }
        
        /* Match Status Bar */
        .match-status-bar {
          padding: 8px 16px;
          text-align: center;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 1px;
          text-transform: uppercase;
        }
        
        .match-status-bar.live {
          background: linear-gradient(135deg, #ff3366, #ff0055);
          color: white;
        }
        
        .match-status-bar.scheduled {
          background: linear-gradient(135deg, rgba(255, 184, 0, 0.2), rgba(255, 184, 0, 0.1));
          color: #ffb800;
        }
        
        .match-status-bar.completed {
          background: linear-gradient(135deg, rgba(0, 255, 136, 0.2), rgba(0, 255, 136, 0.1));
          color: #00ff88;
        }
        
        .status-live {
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        
        .status-live .pulse-dot {
          width: 8px;
          height: 8px;
          background: white;
          border-radius: 50%;
          animation: blink 1s infinite;
        }
        
        /* Match Game Info */
        .match-game-info {
          display: flex;
          justify-content: center;
          gap: 12px;
          padding: 12px 16px;
          border-bottom: 1px solid var(--border-color);
        }
        
        .match-game-tag, .match-tournament-tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 500;
        }
        
        .match-game-tag {
          background: rgba(0, 212, 255, 0.1);
          color: var(--primary);
          border: 1px solid rgba(0, 212, 255, 0.2);
        }
        
        .match-tournament-tag {
          background: rgba(255, 184, 0, 0.1);
          color: #ffb800;
          border: 1px solid rgba(255, 184, 0, 0.2);
        }
        
        /* Match Teams Section */
        .match-teams {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 16px;
        }
        
        .match-team {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          flex: 1;
          text-align: center;
        }
        
        .match-team.winner .team-name {
          color: #00ff88;
        }
        
        .match-team.winner .team-avatar {
          border-color: #00ff88;
          box-shadow: 0 0 15px rgba(0, 255, 136, 0.3);
        }
        
        .team-avatar {
          width: 50px;
          height: 50px;
          border-radius: 12px;
          background: linear-gradient(135deg, var(--bg-tertiary), var(--bg-secondary));
          border: 2px solid var(--border-color);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          color: var(--primary);
          transition: all 0.3s ease;
        }
        
        .team-avatar.away {
          color: var(--accent);
        }
        
        .team-name {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-primary);
          max-width: 80px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        /* Score Display */
        .match-score-display {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }
        
        .match-score-display .score {
          font-family: 'Orbitron', sans-serif;
          font-size: 32px;
          font-weight: 900;
          color: var(--text-secondary);
          min-width: 40px;
          text-align: center;
        }
        
        .match-score-display .score.winning {
          color: #00ff88;
          text-shadow: 0 0 15px rgba(0, 255, 136, 0.5);
        }
        
        .score-separator {
          font-family: 'Orbitron', sans-serif;
          font-size: 24px;
          color: var(--text-muted);
          margin: 0 8px;
        }
        
        .match-score-display {
          flex-direction: row;
          align-items: center;
        }
        
        .live-timer {
          font-family: 'Orbitron', sans-serif;
          font-size: 12px;
          color: #ff3366;
          background: rgba(255, 51, 102, 0.1);
          padding: 4px 10px;
          border-radius: 20px;
          margin-top: 8px;
          animation: pulse-animation 1.5s infinite;
        }
        
        /* Match Actions */
        .match-actions {
          padding: 12px 16px;
          border-top: 1px solid var(--border-color);
          display: flex;
          justify-content: center;
        }
        
        .btn-watch, .btn-remind, .btn-stats {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          border-radius: 10px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          border: none;
        }
        
        .btn-watch {
          background: linear-gradient(135deg, #ff3366, #ff0055);
          color: white;
        }
        
        .btn-watch:hover {
          transform: scale(1.05);
          box-shadow: 0 5px 20px rgba(255, 51, 102, 0.4);
        }
        
        .btn-remind {
          background: rgba(255, 184, 0, 0.2);
          color: #ffb800;
          border: 1px solid rgba(255, 184, 0, 0.3);
        }
        
        .btn-remind:hover {
          background: rgba(255, 184, 0, 0.3);
        }
        
        .btn-stats {
          background: rgba(0, 212, 255, 0.2);
          color: var(--primary);
          border: 1px solid rgba(0, 212, 255, 0.3);
        }
        
        .btn-stats:hover {
          background: rgba(0, 212, 255, 0.3);
        }
        
        /* Live Widget Footer */
        .live-widget-footer {
          padding: 16px 24px;
          background: rgba(0, 0, 0, 0.2);
          border-top: 1px solid var(--border-color);
        }
        
        .live-stats-bar {
          display: flex;
          justify-content: center;
          gap: 40px;
        }
        
        .live-stat {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: var(--text-secondary);
        }
        
        .live-stat i {
          font-size: 14px;
        }
        
        .live-stat:first-child i { color: #ff3366; }
        .live-stat:nth-child(2) i { color: #ffb800; }
        .live-stat:last-child i { color: #00ff88; }

        @media (max-width: 768px) {
          .charts-grid {
            grid-template-columns: 1fr;
          }
          
          .welcome-banner {
            flex-direction: column;
            text-align: center;
            gap: 20px;
          }
          
          .live-matches-grid {
            grid-template-columns: 1fr;
          }
          
          .live-widget-header {
            flex-direction: column;
            gap: 16px;
          }
          
          .live-stats-bar {
            flex-wrap: wrap;
            gap: 20px;
          }
        }
      </style>
    `;

    // Initialize Charts after DOM is ready
    setTimeout(() => {
      initCharts(activityData, tournamentsByStatus, matchesByStatus, usersByRole, tournamentsByGame);
    }, 100);

  } catch (error) {
    console.error('Error loading dashboard:', error);
    container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-exclamation-triangle"></i>
        <h3>Error al cargar el dashboard</h3>
        <p>${error.message}</p>
        <button class="btn btn-primary mt-2" onclick="location.reload()">
          <i class="fas fa-redo"></i> Reintentar
        </button>
      </div>
    `;
  }
}

// Initialize all charts
function initCharts(activityData, tournamentsByStatus, matchesByStatus, usersByRole, tournamentsByGame) {
  const chartDefaults = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#94a3b8',
          font: { family: "'Inter', sans-serif", size: 11 }
        }
      }
    }
  };

  // Activity Chart (Area/Line)
  const activityCtx = document.getElementById('activityChart');
  if (activityCtx) {
    const activityChart = new Chart(activityCtx, {
      type: 'line',
      data: {
        labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
        datasets: [
          {
            label: 'Torneos',
            data: activityData.tournaments,
            borderColor: '#00d4ff',
            backgroundColor: 'rgba(0, 212, 255, 0.1)',
            fill: true,
            tension: 0.4,
            borderWidth: 2,
            pointBackgroundColor: '#00d4ff',
            pointBorderColor: '#fff',
            pointRadius: 4
          },
          {
            label: 'Partidas',
            data: activityData.matches,
            borderColor: '#00ff88',
            backgroundColor: 'rgba(0, 255, 136, 0.1)',
            fill: true,
            tension: 0.4,
            borderWidth: 2,
            pointBackgroundColor: '#00ff88',
            pointBorderColor: '#fff',
            pointRadius: 4
          }
        ]
      },
      options: {
        ...chartDefaults,
        scales: {
          x: {
            grid: { color: 'rgba(255,255,255,0.05)' },
            ticks: { color: '#64748b' }
          },
          y: {
            grid: { color: 'rgba(255,255,255,0.05)' },
            ticks: { color: '#64748b' },
            beginAtZero: true
          }
        }
      }
    });
    chartInstances.push(activityChart);
  }

  // Tournaments Status Doughnut
  const tournamentsCtx = document.getElementById('tournamentsStatusChart');
  if (tournamentsCtx) {
    const tournamentsChart = new Chart(tournamentsCtx, {
      type: 'doughnut',
      data: {
        labels: Object.keys(tournamentsByStatus),
        datasets: [{
          data: Object.values(tournamentsByStatus),
          backgroundColor: ['#00d4ff', '#00ff88', '#ffb800', '#ff3366', '#ff6b35', '#9945FF'],
          borderColor: '#111827',
          borderWidth: 3
        }]
      },
      options: {
        ...chartDefaults,
        cutout: '65%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: '#94a3b8', padding: 15, usePointStyle: true }
          }
        }
      }
    });
    chartInstances.push(tournamentsChart);
  }

  // Matches Status Doughnut
  const matchesCtx = document.getElementById('matchesStatusChart');
  if (matchesCtx) {
    const matchesChart = new Chart(matchesCtx, {
      type: 'doughnut',
      data: {
        labels: Object.keys(matchesByStatus),
        datasets: [{
          data: Object.values(matchesByStatus),
          backgroundColor: ['#00ff88', '#ffb800', '#ff3366', '#00d4ff', '#9945FF'],
          borderColor: '#111827',
          borderWidth: 3
        }]
      },
      options: {
        ...chartDefaults,
        cutout: '65%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: '#94a3b8', padding: 15, usePointStyle: true }
          }
        }
      }
    });
    chartInstances.push(matchesChart);
  }

  // Users by Role Doughnut
  const usersCtx = document.getElementById('usersRoleChart');
  if (usersCtx) {
    const usersChart = new Chart(usersCtx, {
      type: 'doughnut',
      data: {
        labels: Object.keys(usersByRole),
        datasets: [{
          data: Object.values(usersByRole),
          backgroundColor: ['#ff3366', '#ffb800', '#00d4ff'],
          borderColor: '#111827',
          borderWidth: 3
        }]
      },
      options: {
        ...chartDefaults,
        cutout: '65%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: '#94a3b8', padding: 15, usePointStyle: true }
          }
        }
      }
    });
    chartInstances.push(usersChart);
  }

  // Tournaments by Game Bar Chart
  const gamesCtx = document.getElementById('tournamentsByGameChart');
  if (gamesCtx) {
    const gamesChart = new Chart(gamesCtx, {
      type: 'bar',
      data: {
        labels: Object.keys(tournamentsByGame),
        datasets: [{
          label: 'Torneos',
          data: Object.values(tournamentsByGame),
          backgroundColor: [
            'rgba(0, 212, 255, 0.8)',
            'rgba(0, 255, 136, 0.8)',
            'rgba(255, 107, 53, 0.8)',
            'rgba(255, 184, 0, 0.8)',
            'rgba(153, 69, 255, 0.8)',
            'rgba(255, 51, 102, 0.8)'
          ],
          borderColor: [
            '#00d4ff',
            '#00ff88',
            '#ff6b35',
            '#ffb800',
            '#9945FF',
            '#ff3366'
          ],
          borderWidth: 2,
          borderRadius: 8,
          borderSkipped: false
        }]
      },
      options: {
        ...chartDefaults,
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: '#94a3b8' }
          },
          y: {
            grid: { color: 'rgba(255,255,255,0.05)' },
            ticks: { color: '#64748b' },
            beginAtZero: true
          }
        },
        plugins: {
          legend: { display: false }
        }
      }
    });
    chartInstances.push(gamesChart);
  }
}

// Helper functions for chart data
function calculateTournamentsByStatus(tournaments) {
  const statusLabels = {
    'DRAFT': 'Borrador',
    'PUBLISHED': 'Publicado',
    'REGISTRATION_OPEN': 'Inscripciones',
    'IN_PROGRESS': 'En Curso',
    'COMPLETED': 'Completado',
    'CANCELLED': 'Cancelado'
  };
  
  const counts = {};
  tournaments.forEach(t => {
    const label = statusLabels[t.status] || t.status;
    counts[label] = (counts[label] || 0) + 1;
  });
  
  // If no data, return demo data
  if (Object.keys(counts).length === 0) {
    return { 'En Curso': 3, 'Inscripciones': 5, 'Completado': 8, 'Borrador': 2 };
  }
  
  return counts;
}

function calculateMatchesByStatus(matches) {
  const statusLabels = {
    'SCHEDULED': 'Programadas',
    'LIVE': 'En Vivo',
    'COMPLETED': 'Completadas',
    'CANCELLED': 'Canceladas'
  };
  
  const counts = {};
  matches.forEach(m => {
    const label = statusLabels[m.status] || m.status;
    counts[label] = (counts[label] || 0) + 1;
  });
  
  if (Object.keys(counts).length === 0) {
    return { 'Completadas': 45, 'Programadas': 12, 'En Vivo': 3 };
  }
  
  return counts;
}

function calculateUsersByRole(users) {
  const roleLabels = {
    'ADMIN': 'Admins',
    'ORGANIZER': 'Organizadores',
    'USER': 'Jugadores'
  };
  
  const counts = {};
  users.forEach(u => {
    const label = roleLabels[u.role] || u.role;
    counts[label] = (counts[label] || 0) + 1;
  });
  
  if (Object.keys(counts).length === 0) {
    return { 'Jugadores': 150, 'Organizadores': 12, 'Admins': 3 };
  }
  
  return counts;
}

function calculateTournamentsByGame(tournaments, games) {
  const counts = {};
  
  games.forEach(g => {
    const count = tournaments.filter(t => t.game_id === g.id).length;
    if (count > 0 || games.length <= 6) {
      counts[g.name] = count;
    }
  });
  
  if (Object.keys(counts).length === 0) {
    return { 
      'Clash Royale': 5, 
      'League of Legends': 8, 
      'Valorant': 6, 
      'FC 25': 4,
      'Rocket League': 3
    };
  }
  
  return counts;
}

function generateActivityData() {
  // Generate realistic looking activity data
  return {
    tournaments: [2, 4, 3, 5, 4, 7, 6],
    matches: [12, 19, 15, 22, 18, 28, 24]
  };
}

// 🎯 Generate Live Matches Widget Content
function generateLiveMatchesWidget(matches, teams, tournaments, games) {
  // Get live and recent matches
  const liveMatches = matches.filter(m => m.status === 'LIVE');
  const scheduledMatches = matches.filter(m => m.status === 'SCHEDULED').slice(0, 3);
  const recentMatches = matches.filter(m => m.status === 'COMPLETED').slice(0, 2);
  
  // Combine and show up to 5 matches
  let displayMatches = [...liveMatches, ...scheduledMatches, ...recentMatches].slice(0, 5);
  
  // If no real matches, create demo data
  if (displayMatches.length === 0) {
    return generateDemoLiveMatches(games);
  }
  
  return displayMatches.map(match => {
    const game = games.find(g => g.id === match.game_id);
    const tournament = tournaments.find(t => t.id === match.tournament_id);
    const team1 = teams.find(t => t.id === match.team1_id);
    const team2 = teams.find(t => t.id === match.team2_id);
    
    const isLive = match.status === 'LIVE';
    const isScheduled = match.status === 'SCHEDULED';
    const isCompleted = match.status === 'COMPLETED';
    
    return `
      <div class="live-match-card ${isLive ? 'is-live' : ''} ${isCompleted ? 'is-completed' : ''}">
        <div class="match-status-bar ${match.status.toLowerCase()}">
          ${isLive ? '<span class="status-live"><span class="pulse-dot"></span> EN VIVO</span>' : ''}
          ${isScheduled ? '<span class="status-scheduled"><i class="fas fa-clock"></i> PRÓXIMO</span>' : ''}
          ${isCompleted ? '<span class="status-completed"><i class="fas fa-check"></i> FINALIZADO</span>' : ''}
        </div>
        
        <div class="match-game-info">
          <span class="match-game-tag">
            <i class="fas fa-gamepad"></i> ${game?.name || 'Juego'}
          </span>
          <span class="match-tournament-tag">
            <i class="fas fa-trophy"></i> ${tournament?.name || 'Torneo'}
          </span>
        </div>
        
        <div class="match-teams">
          <div class="match-team ${match.score1 > match.score2 ? 'winner' : ''}">
            <div class="team-avatar">
              <i class="fas fa-shield-halved"></i>
            </div>
            <span class="team-name">${team1?.name || 'Equipo 1'}</span>
          </div>
          
          <div class="match-score-display">
            <span class="score team1-score ${match.score1 > match.score2 ? 'winning' : ''}">${match.score1 || 0}</span>
            <span class="score-separator">:</span>
            <span class="score team2-score ${match.score2 > match.score1 ? 'winning' : ''}">${match.score2 || 0}</span>
            ${isLive ? '<div class="live-timer">' + getRandomTime() + '</div>' : ''}
          </div>
          
          <div class="match-team ${match.score2 > match.score1 ? 'winner' : ''}">
            <div class="team-avatar away">
              <i class="fas fa-shield-halved"></i>
            </div>
            <span class="team-name">${team2?.name || 'Equipo 2'}</span>
          </div>
        </div>
        
        <div class="match-actions">
          ${isLive ? '<button class="btn-watch"><i class="fas fa-eye"></i> Ver Partida</button>' : ''}
          ${isScheduled ? '<button class="btn-remind"><i class="fas fa-bell"></i> Recordar</button>' : ''}
          ${isCompleted ? '<button class="btn-stats"><i class="fas fa-chart-bar"></i> Estadísticas</button>' : ''}
        </div>
      </div>
    `;
  }).join('');
}

// Generate demo live matches for display
function generateDemoLiveMatches(games) {
  const demoMatches = [
    {
      status: 'LIVE',
      game: games[0]?.name || 'Clash Royale',
      tournament: 'Copa Champions',
      team1: 'Phoenix Rising',
      team2: 'Dark Knights',
      score1: 2,
      score2: 1,
      time: '15:32'
    },
    {
      status: 'LIVE',
      game: games[1]?.name || 'League of Legends',
      tournament: 'Liga Master',
      team1: 'Thunder Squad',
      team2: 'Ice Dragons',
      score1: 1,
      score2: 1,
      time: '28:45'
    },
    {
      status: 'SCHEDULED',
      game: games[2]?.name || 'Valorant',
      tournament: 'Pro League',
      team1: 'Cyber Warriors',
      team2: 'Neon Vipers',
      score1: 0,
      score2: 0,
      time: '18:00'
    },
    {
      status: 'SCHEDULED',
      game: 'FC 25',
      tournament: 'FIFA Championship',
      team1: 'Goal Masters',
      team2: 'Ultimate FC',
      score1: 0,
      score2: 0,
      time: '20:30'
    },
    {
      status: 'COMPLETED',
      game: 'Rocket League',
      tournament: 'Aerial Cup',
      team1: 'Sky Rockets',
      team2: 'Ground Breakers',
      score1: 4,
      score2: 2,
      time: 'Final'
    }
  ];
  
  return demoMatches.map(match => {
    const isLive = match.status === 'LIVE';
    const isScheduled = match.status === 'SCHEDULED';
    const isCompleted = match.status === 'COMPLETED';
    
    return `
      <div class="live-match-card ${isLive ? 'is-live' : ''} ${isCompleted ? 'is-completed' : ''}">
        <div class="match-status-bar ${match.status.toLowerCase()}">
          ${isLive ? '<span class="status-live"><span class="pulse-dot"></span> EN VIVO</span>' : ''}
          ${isScheduled ? '<span class="status-scheduled"><i class="fas fa-clock"></i> PRÓXIMO</span>' : ''}
          ${isCompleted ? '<span class="status-completed"><i class="fas fa-check"></i> FINALIZADO</span>' : ''}
        </div>
        
        <div class="match-game-info">
          <span class="match-game-tag">
            <i class="fas fa-gamepad"></i> ${match.game}
          </span>
          <span class="match-tournament-tag">
            <i class="fas fa-trophy"></i> ${match.tournament}
          </span>
        </div>
        
        <div class="match-teams">
          <div class="match-team ${match.score1 > match.score2 ? 'winner' : ''}">
            <div class="team-avatar">
              <i class="fas fa-shield-halved"></i>
            </div>
            <span class="team-name">${match.team1}</span>
          </div>
          
          <div class="match-score-display">
            <span class="score team1-score ${match.score1 > match.score2 ? 'winning' : ''}">${match.score1}</span>
            <span class="score-separator">:</span>
            <span class="score team2-score ${match.score2 > match.score1 ? 'winning' : ''}">${match.score2}</span>
            ${isLive ? '<div class="live-timer">' + match.time + '</div>' : ''}
          </div>
          
          <div class="match-team ${match.score2 > match.score1 ? 'winner' : ''}">
            <div class="team-avatar away">
              <i class="fas fa-shield-halved"></i>
            </div>
            <span class="team-name">${match.team2}</span>
          </div>
        </div>
        
        <div class="match-actions">
          ${isLive ? '<button class="btn-watch"><i class="fas fa-eye"></i> Ver Partida</button>' : ''}
          ${isScheduled ? '<button class="btn-remind"><i class="fas fa-bell"></i> Recordar</button>' : ''}
          ${isCompleted ? '<button class="btn-stats"><i class="fas fa-chart-bar"></i> Stats</button>' : ''}
        </div>
      </div>
    `;
  }).join('');
}

function getRandomTime() {
  const min = Math.floor(Math.random() * 45) + 1;
  const sec = Math.floor(Math.random() * 59);
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

function animateNumber(num) {
  return `<span class="animated-number" data-target="${num}">${num}</span>`;
}

function getRankBadge(rank) {
  if (rank === 1) return '<span class="rank-badge gold"><i class="fas fa-crown"></i></span>';
  if (rank === 2) return '<span class="rank-badge silver"><i class="fas fa-medal"></i></span>';
  if (rank === 3) return '<span class="rank-badge bronze"><i class="fas fa-award"></i></span>';
  return `<span class="rank-badge">#${rank}</span>`;
}

// Helper functions
function getGameName(games, gameId) {
  const game = games.find(g => g.id === gameId);
  return game ? game.name : 'N/A';
}

function formatFormat(format) {
  const formats = {
    'SINGLE_ELIMINATION': 'Eliminación',
    'DOUBLE_ELIMINATION': 'Doble Elim.',
    'ROUND_ROBIN': 'Round Robin',
    'SWISS': 'Suizo'
  };
  return formats[format] || format;
}

function getStatusBadge(status) {
  const statusConfig = {
    'DRAFT': { class: 'badge-warning', label: 'Borrador', icon: 'fa-pencil' },
    'PUBLISHED': { class: 'badge-info', label: 'Publicado', icon: 'fa-check' },
    'REGISTRATION_OPEN': { class: 'badge-success', label: 'Inscripciones', icon: 'fa-door-open' },
    'REGISTRATION_CLOSED': { class: 'badge-warning', label: 'Cerrado', icon: 'fa-door-closed' },
    'IN_PROGRESS': { class: 'badge-primary', label: 'En Curso', icon: 'fa-play' },
    'COMPLETED': { class: 'badge-success', label: 'Completado', icon: 'fa-trophy' },
    'CANCELLED': { class: 'badge-danger', label: 'Cancelado', icon: 'fa-times' }
  };
  const config = statusConfig[status] || { class: 'badge-info', label: status, icon: 'fa-info' };
  return `<span class="badge ${config.class}"><i class="fas ${config.icon}"></i> ${config.label}</span>`;
}

function getRoleBadge(role) {
  const roleConfig = {
    'ADMIN': { class: 'badge-danger', label: 'Admin', icon: 'fa-crown' },
    'ORGANIZER': { class: 'badge-warning', label: 'Organizador', icon: 'fa-star' },
    'USER': { class: 'badge-info', label: 'Jugador', icon: 'fa-user' }
  };
  const config = roleConfig[role] || { class: 'badge-info', label: role, icon: 'fa-user' };
  return `<span class="badge ${config.class}"><i class="fas ${config.icon}"></i> ${config.label}</span>`;
}

function formatDateShort(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

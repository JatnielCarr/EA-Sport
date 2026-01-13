// =====================================================
// Live Matches Page
// =====================================================

import API from '../api.js';
import { showLoading } from '../app.js';

export async function renderLive(container) {
    showLoading(container);

    try {
        const [matchesRes, teamsRes, tournamentsRes, gamesRes] = await Promise.all([
            API.matches.getAll(),
            API.teams.getAll(),
            API.tournaments.getAll(),
            API.games.getAll()
        ]);

        const matches = matchesRes.data || [];
        const teams = teamsRes.data || [];
        const tournaments = tournamentsRes.data || [];
        const games = gamesRes.data || [];

        const liveMatches = matches.filter(m => m.status === 'LIVE' || m.status === 'IN_PROGRESS');
        const upcomingMatches = matches.filter(m => m.status === 'SCHEDULED' || m.status === 'PENDING').slice(0, 6);
        const recentMatches = matches.filter(m => m.status === 'COMPLETED').slice(0, 6);

        container.innerHTML = `
      <div class="container section">
        <div class="page-header">
          <h1 class="page-title">
            <i class="fas fa-broadcast-tower"></i>
            Partidas en Vivo
          </h1>
          <p class="page-subtitle">Sigue las partidas en tiempo real</p>
        </div>
        
        <!-- Live Now -->
        <div class="live-section-block">
          <div class="section-header">
            <h2 class="section-title">
              <span class="live-indicator"><span class="pulse-dot"></span> EN VIVO</span>
            </h2>
          </div>
          
          ${liveMatches.length > 0 ? `
            <div class="live-grid">
              ${liveMatches.map(m => renderMatchCard(m, teams, tournaments, games, 'live')).join('')}
            </div>
          ` : `
            <div class="no-live-banner">
              <i class="fas fa-tv"></i>
              <h3>No hay partidas en vivo</h3>
              <p>Vuelve más tarde o revisa las próximas partidas</p>
            </div>
          `}
        </div>
        
        <!-- Upcoming -->
        <div class="matches-section">
          <div class="section-header">
            <h2 class="section-title">
              <i class="fas fa-clock"></i>
              Próximas Partidas
            </h2>
          </div>
          
          ${upcomingMatches.length > 0 ? `
            <div class="matches-grid">
              ${upcomingMatches.map(m => renderMatchCard(m, teams, tournaments, games, 'upcoming')).join('')}
            </div>
          ` : `
            <div class="empty-state">
              <i class="fas fa-calendar"></i>
              <h3>No hay partidas programadas</h3>
            </div>
          `}
        </div>
        
        <!-- Recent -->
        <div class="matches-section">
          <div class="section-header">
            <h2 class="section-title">
              <i class="fas fa-history"></i>
              Partidas Recientes
            </h2>
          </div>
          
          ${recentMatches.length > 0 ? `
            <div class="matches-grid">
              ${recentMatches.map(m => renderMatchCard(m, teams, tournaments, games, 'completed')).join('')}
            </div>
          ` : `
            <div class="empty-state">
              <i class="fas fa-trophy"></i>
              <h3>No hay partidas recientes</h3>
            </div>
          `}
        </div>
      </div>
      
      <style>
        .page-header {
          text-align: center;
          margin-bottom: 40px;
        }
        
        .page-title {
          font-family: var(--font-display);
          font-size: 36px;
          font-weight: 800;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
        }
        
        .page-title i {
          color: var(--primary);
        }
        
        .page-subtitle {
          font-size: 16px;
          color: var(--text-secondary);
        }
        
        .live-section-block {
          margin-bottom: 48px;
        }
        
        .live-indicator {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 8px 16px;
          background: rgba(255, 51, 102, 0.2);
          border: 1px solid rgba(255, 51, 102, 0.3);
          border-radius: 100px;
          color: var(--danger);
          font-size: 14px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        
        .pulse-dot {
          width: 10px;
          height: 10px;
          background: var(--danger);
          border-radius: 50%;
          animation: pulse 1.5s infinite;
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(0.8); opacity: 0.5; }
        }
        
        .no-live-banner {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--border-radius);
          padding: 60px 24px;
          text-align: center;
        }
        
        .no-live-banner i {
          font-size: 48px;
          color: var(--text-muted);
          margin-bottom: 16px;
        }
        
        .no-live-banner h3 {
          font-size: 20px;
          margin-bottom: 8px;
        }
        
        .no-live-banner p {
          color: var(--text-secondary);
        }
        
        .matches-section {
          margin-bottom: 48px;
        }
        
        .matches-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 20px;
        }
        
        .match-card {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--border-radius);
          padding: 20px;
          transition: var(--transition);
        }
        
        .match-card:hover {
          border-color: var(--primary);
          transform: translateY(-2px);
        }
        
        .match-card.live {
          border-color: var(--danger);
          box-shadow: 0 0 30px rgba(255, 51, 102, 0.2);
        }
        
        .match-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        
        .match-card-game {
          font-size: 13px;
          color: var(--text-secondary);
        }
        
        .match-card-status {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          padding: 4px 10px;
          border-radius: 100px;
        }
        
        .match-card-status.live {
          background: rgba(255, 51, 102, 0.2);
          color: var(--danger);
        }
        
        .match-card-status.upcoming {
          background: rgba(255, 184, 0, 0.2);
          color: var(--warning);
        }
        
        .match-card-status.completed {
          background: rgba(0, 255, 136, 0.2);
          color: var(--secondary);
        }
        
        .match-card-teams {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 16px;
        }
        
        .match-card-team {
          flex: 1;
          text-align: center;
        }
        
        .match-card-team-avatar {
          width: 50px;
          height: 50px;
          background: linear-gradient(135deg, var(--primary), var(--accent));
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 10px;
          font-size: 20px;
          color: white;
        }
        
        .match-card-team:last-child .match-card-team-avatar {
          background: linear-gradient(135deg, var(--accent), var(--danger));
        }
        
        .match-card-team-name {
          font-weight: 600;
          font-size: 14px;
        }
        
        .match-card-score {
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: var(--font-display);
        }
        
        .match-card-score-value {
          font-size: 28px;
          font-weight: 900;
        }
        
        .match-card-score-value.winning {
          color: var(--secondary);
        }
        
        .match-card-score-separator {
          font-size: 20px;
          color: var(--text-muted);
        }
        
        .match-card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 16px;
          border-top: 1px solid var(--border-color);
          font-size: 13px;
          color: var(--text-secondary);
        }
        
        @media (max-width: 768px) {
          .matches-grid {
            grid-template-columns: 1fr;
          }
        }
      </style>
    `;

    } catch (error) {
        console.error('Error loading live matches:', error);
        container.innerHTML = `
      <div class="container">
        <div class="empty-state">
          <i class="fas fa-exclamation-triangle"></i>
          <h3>Error al cargar partidas</h3>
          <p>${error.message}</p>
        </div>
      </div>
    `;
    }
}

function renderMatchCard(match, teams, tournaments, games, type) {
    const tournament = tournaments.find(t => t.id === match.tournament_id);
    const game = games.find(g => g.id === tournament?.game_id);
    const team1 = teams.find(t => t.id === match.home_team_id);
    const team2 = teams.find(t => t.id === match.away_team_id);

    const score1 = match.home_score || 0;
    const score2 = match.away_score || 0;

    const statusLabels = {
        'live': 'En Vivo',
        'upcoming': 'Próximo',
        'completed': 'Finalizado'
    };

    return `
    <a href="#/torneo/${match.tournament_id}" class="match-card ${type}">
      <div class="match-card-header">
        <span class="match-card-game">
          <i class="fas fa-gamepad"></i> ${game?.name || 'Juego'}
        </span>
        <span class="match-card-status ${type}">${statusLabels[type]}</span>
      </div>
      
      <div class="match-card-teams">
        <div class="match-card-team">
          <div class="match-card-team-avatar">
            <i class="fas fa-shield-halved"></i>
          </div>
          <span class="match-card-team-name">${team1?.name || 'Equipo 1'}</span>
        </div>
        
        <div class="match-card-score">
          <span class="match-card-score-value ${score1 > score2 ? 'winning' : ''}">${score1}</span>
          <span class="match-card-score-separator">:</span>
          <span class="match-card-score-value ${score2 > score1 ? 'winning' : ''}">${score2}</span>
        </div>
        
        <div class="match-card-team">
          <div class="match-card-team-avatar">
            <i class="fas fa-shield-halved"></i>
          </div>
          <span class="match-card-team-name">${team2?.name || 'Equipo 2'}</span>
        </div>
      </div>
      
      <div class="match-card-footer">
        <span><i class="fas fa-trophy"></i> ${tournament?.name || 'Torneo'}</span>
        <span>Ronda ${match.round || 1}</span>
      </div>
    </a>
  `;
}

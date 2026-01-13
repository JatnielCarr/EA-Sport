// =====================================================
// Home Page
// =====================================================

import API from '../api.js';
import { showLoading, formatDate, formatCurrency } from '../app.js';

export async function renderHome(container) {
    showLoading(container);

    try {
        const [tournamentsRes, matchesRes, gamesRes, teamsRes] = await Promise.all([
            API.tournaments.getAll(),
            API.matches.getAll(),
            API.games.getAll(),
            API.teams.getAll()
        ]);

        const tournaments = tournamentsRes.data || [];
        const matches = matchesRes.data || [];
        const games = gamesRes.data || [];
        const teams = teamsRes.data || [];

        // Stats
        const liveMatches = matches.filter(m => m.status === 'LIVE' || m.status === 'IN_PROGRESS');
        const activeTournaments = tournaments.filter(t =>
            ['REGISTRATION_OPEN', 'IN_PROGRESS'].includes(t.status)
        );

        // Featured tournaments (latest 3)
        const featuredTournaments = tournaments.slice(0, 3);

        container.innerHTML = `
      <!-- Hero Section -->
      <section class="hero">
        <div class="container">
          <div class="hero-content">
            <div class="hero-badge">
              <span class="pulse-dot"></span>
              ${liveMatches.length > 0 ? `${liveMatches.length} partidas en vivo` : 'Plataforma de torneos'}
            </div>
            
            <h1 class="hero-title">
              Compite en los mejores<br>
              <span class="gradient-text">torneos de esports</span>
            </h1>
            
            <p class="hero-subtitle">
              Únete a la comunidad más grande de torneos competitivos. 
              Participa, compite y gana premios increíbles.
            </p>
            
            <div class="hero-actions">
              <a href="#/torneos" class="btn btn-primary">
                <i class="fas fa-trophy"></i> Ver Torneos
              </a>
              <a href="#/live" class="btn btn-outline">
                <i class="fas fa-broadcast-tower"></i> En Vivo
              </a>
            </div>
            
            <div class="hero-stats">
              <div class="hero-stat">
                <div class="hero-stat-value">${tournaments.length}</div>
                <div class="hero-stat-label">Torneos</div>
              </div>
              <div class="hero-stat">
                <div class="hero-stat-value">${teams.length}</div>
                <div class="hero-stat-label">Equipos</div>
              </div>
              <div class="hero-stat">
                <div class="hero-stat-value">${matches.length}</div>
                <div class="hero-stat-label">Partidas</div>
              </div>
              <div class="hero-stat">
                <div class="hero-stat-value">${games.length}</div>
                <div class="hero-stat-label">Juegos</div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      <!-- Featured Tournaments -->
      <section class="section container">
        <div class="section-header">
          <h2 class="section-title">
            <i class="fas fa-star"></i>
            Torneos Destacados
          </h2>
          <a href="#/torneos" class="btn btn-outline">
            Ver todos <i class="fas fa-arrow-right"></i>
          </a>
        </div>
        
        <div class="tournaments-grid">
          ${featuredTournaments.length > 0 ?
                featuredTournaments.map(t => renderTournamentCard(t, games)).join('') :
                '<div class="empty-state"><i class="fas fa-trophy"></i><h3>No hay torneos</h3><p>Próximamente nuevos torneos</p></div>'
            }
        </div>
      </section>
      
      <!-- Live Matches -->
      ${liveMatches.length > 0 ? `
        <section class="section live-section">
          <div class="container">
            <div class="section-header">
              <h2 class="section-title">
                <i class="fas fa-broadcast-tower"></i>
                Partidas en Vivo
              </h2>
              <a href="#/live" class="btn btn-accent">
                <i class="fas fa-play"></i> Ver todas
              </a>
            </div>
            
            <div class="live-grid">
              ${liveMatches.slice(0, 4).map(m => renderLiveCard(m, teams, tournaments, games)).join('')}
            </div>
          </div>
        </section>
      ` : ''}
      
      <!-- All Games -->
      <section class="section container">
        <div class="section-header">
          <h2 class="section-title">
            <i class="fas fa-gamepad"></i>
            Juegos Disponibles
          </h2>
        </div>
        
        <div class="games-grid">
          ${games.map(g => `
            <div class="game-card">
              <div class="game-icon">
                <i class="fas fa-gamepad"></i>
              </div>
              <div class="game-info">
                <h3 class="game-name">${g.name}</h3>
                <p class="game-developer">${g.developer || 'Desarrollador'}</p>
                <span class="game-tournaments">${tournaments.filter(t => t.game_id === g.id).length} torneos</span>
              </div>
            </div>
          `).join('')}
        </div>
      </section>
      
      <style>
        .games-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 20px;
        }
        
        .game-card {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--border-radius);
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          transition: var(--transition);
          cursor: pointer;
        }
        
        .game-card:hover {
          border-color: var(--primary);
          transform: translateY(-2px);
        }
        
        .game-icon {
          width: 60px;
          height: 60px;
          background: linear-gradient(135deg, var(--primary), var(--secondary));
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          color: #000;
        }
        
        .game-name {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 4px;
        }
        
        .game-developer {
          font-size: 13px;
          color: var(--text-secondary);
          margin-bottom: 8px;
        }
        
        .game-tournaments {
          font-size: 12px;
          padding: 4px 10px;
          background: rgba(0, 212, 255, 0.1);
          border-radius: 100px;
          color: var(--primary);
        }
      </style>
    `;

    } catch (error) {
        console.error('Error loading home:', error);
        container.innerHTML = `
      <div class="container">
        <div class="empty-state">
          <i class="fas fa-exclamation-triangle"></i>
          <h3>Error al cargar</h3>
          <p>${error.message}</p>
          <button class="btn btn-primary" onclick="location.reload()">Reintentar</button>
        </div>
      </div>
    `;
    }
}

function renderTournamentCard(tournament, games) {
    const game = games.find(g => g.id === tournament.game_id);
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
        <span class="tournament-game">
          <i class="fas fa-gamepad"></i> ${game?.name || 'Juego'}
        </span>
        <h3 class="tournament-name">${tournament.name}</h3>
        <div class="tournament-meta">
          <span><i class="fas fa-calendar"></i> ${formatDate(tournament.start_date)}</span>
          <span><i class="fas fa-users"></i> ${tournament.max_participants || '∞'} equipos</span>
          <span><i class="fas fa-map-marker-alt"></i> ${tournament.region || 'Global'}</span>
        </div>
        ${tournament.prize_pool ? `<div class="tournament-prize">${formatCurrency(tournament.prize_pool)}</div>` : ''}
        <div class="tournament-footer">
          <div class="tournament-teams">
            <div class="tournament-teams-avatars">
              <span><i class="fas fa-user"></i></span>
              <span><i class="fas fa-user"></i></span>
              <span><i class="fas fa-user"></i></span>
            </div>
            <span>Equipos inscritos</span>
          </div>
          <span class="btn btn-secondary btn-sm">Ver más</span>
        </div>
      </div>
    </a>
  `;
}

function renderLiveCard(match, teams, tournaments, games) {
    const tournament = tournaments.find(t => t.id === match.tournament_id);
    const game = games.find(g => g.id === tournament?.game_id);
    const team1 = teams.find(t => t.id === match.home_team_id);
    const team2 = teams.find(t => t.id === match.away_team_id);

    const score1 = match.home_score || 0;
    const score2 = match.away_score || 0;

    return `
    <div class="live-card">
      <div class="live-header">
        <span class="live-badge">
          <span class="dot"></span> EN VIVO
        </span>
        <span class="live-game">${game?.name || 'Juego'}</span>
      </div>
      
      <div class="live-teams">
        <div class="live-team">
          <div class="live-team-avatar">
            <i class="fas fa-shield-halved"></i>
          </div>
          <span class="live-team-name">${team1?.name || 'Equipo 1'}</span>
        </div>
        
        <div class="live-score">
          <span class="live-score-value ${score1 > score2 ? 'winning' : ''}">${score1}</span>
          <span class="live-score-separator">:</span>
          <span class="live-score-value ${score2 > score1 ? 'winning' : ''}">${score2}</span>
        </div>
        
        <div class="live-team">
          <div class="live-team-avatar">
            <i class="fas fa-shield-halved"></i>
          </div>
          <span class="live-team-name">${team2?.name || 'Equipo 2'}</span>
        </div>
      </div>
      
      <div class="live-footer">
        <span class="live-time">
          <i class="fas fa-clock"></i> ${tournament?.name || 'Torneo'}
        </span>
        <a href="#/torneo/${match.tournament_id}" class="btn btn-secondary btn-sm">Ver partido</a>
      </div>
    </div>
  `;
}

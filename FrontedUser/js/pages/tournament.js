// =====================================================
// Tournament Detail Page (Bracket View)
// =====================================================

import API from '../api.js';
import { showLoading, formatDate, formatCurrency } from '../ui-helpers.js';
import { isAuthenticated, getStoredUser } from '../auth.js';

export async function renderTournament(container, tournamentId) {
  showLoading(container);

  try {
    const [tournamentRes, bracketRes, gamesRes, teamsRes] = await Promise.all([
      API.tournaments.getById(tournamentId),
      API.tournaments.getBracket(tournamentId),
      API.games.getAll(),
      API.teams.getByTournament(tournamentId)
    ]);

    const tournament = tournamentRes.data;
    const bracket = bracketRes.data;
    const games = gamesRes.data || [];
    const teams = teamsRes.data || [];
    const matches = bracket?.matches || [];
    const game = games.find(g => g.id === tournament?.game_id);

    if (!tournament) {
      container.innerHTML = `
        <div class="container">
          <div class="empty-state">
            <i class="fas fa-trophy"></i>
            <h3>Torneo no encontrado</h3>
            <a href="#/torneos" class="btn btn-primary">Ver torneos</a>
          </div>
        </div>
      `;
      return;
    }

    const statusLabels = {
      'DRAFT': 'Borrador',
      'PUBLISHED': 'Publicado',
      'REGISTRATION_OPEN': 'Inscripciones',
      'REGISTRATION_CLOSED': 'Cerrado',
      'IN_PROGRESS': 'En Curso',
      'COMPLETED': 'Finalizado',
      'CANCELLED': 'Cancelado'
    };

    // Check if user can register
    const canRegister = isAuthenticated() && tournament.status === 'REGISTRATION_OPEN';
    const user = getStoredUser();
    const userHasTeam = user && teams.some(t =>
      t.captain_id === user.id || t.players?.some(p => p.user_id === user.id)
    );

    container.innerHTML = `
      <div class="tournament-detail">
        <!-- Header -->
        <div class="tournament-header">
          <div class="container">
            <a href="#/torneos" class="back-link">
              <i class="fas fa-arrow-left"></i> Volver a torneos
            </a>
            
            <div class="tournament-header-content">
              <div class="tournament-header-info">
                <span class="tournament-game-badge">
                  <i class="fas fa-gamepad"></i> ${game?.name || 'Juego'}
                </span>
                <h1 class="tournament-title">${tournament.name}</h1>
                <div class="tournament-header-meta">
                  <span><i class="fas fa-calendar"></i> ${formatDate(tournament.start_date)}</span>
                  <span><i class="fas fa-users"></i> ${teams.length}/${tournament.max_participants || '∞'} equipos</span>
                  <span><i class="fas fa-map-marker-alt"></i> ${tournament.region || 'Global'}</span>
                  <span class="status-badge ${(tournament.status || 'draft').toLowerCase()}">${statusLabels[tournament.status] || tournament.status || 'Desconocido'}</span>
                </div>
              </div>
              
              <div class="tournament-header-actions">
                ${tournament.prize_pool ? `
                  <div class="tournament-header-prize">
                    <div class="prize-label">Premio Total</div>
                    <div class="prize-value">${formatCurrency(tournament.prize_pool)}</div>
                  </div>
                ` : ''}
                ${canRegister && !userHasTeam ? `
                  <button class="btn btn-primary btn-lg" id="registerTeamBtn">
                    <i class="fas fa-plus"></i>
                    Inscribir Equipo
                  </button>
                ` : ''}
                ${canRegister && userHasTeam ? `
                  <span class="already-registered">
                    <i class="fas fa-check-circle"></i>
                    Ya estás inscrito
                  </span>
                ` : ''}
                ${!isAuthenticated() && tournament.status === 'REGISTRATION_OPEN' ? `
                  <a href="#/login" class="btn btn-primary btn-lg">
                    <i class="fas fa-sign-in-alt"></i>
                    Inicia sesión para inscribirte
                  </a>
                ` : ''}
              </div>
            </div>
          </div>
        </div>
        
        <!-- Tabs -->
        <div class="tournament-tabs">
          <div class="container">
            <button class="tab-btn active" data-tab="bracket">
              <i class="fas fa-sitemap"></i> Bracket
            </button>
            <button class="tab-btn" data-tab="teams">
              <i class="fas fa-users"></i> Equipos (${teams.length})
            </button>
            <button class="tab-btn" data-tab="info">
              <i class="fas fa-info-circle"></i> Información
            </button>
          </div>
        </div>
        
        <!-- Tab Content -->
        <div class="tournament-content">
          <div class="container">
            <!-- Bracket Tab -->
            <div id="tab-bracket" class="tab-content active">
              ${renderBracket(matches, teams)}
            </div>
            
            <!-- Teams Tab -->
            <div id="tab-teams" class="tab-content">
              ${renderTeamsList(teams)}
            </div>
            
            <!-- Info Tab -->
            <div id="tab-info" class="tab-content">
              ${renderTournamentInfo(tournament, game)}
            </div>
          </div>
        </div>
      </div>
      
      <!-- Registration Modal -->
      <div class="modal" id="registerModal">
        <div class="modal-overlay"></div>
        <div class="modal-content">
          <div class="modal-header">
            <h3><i class="fas fa-users"></i> Inscribir Equipo</h3>
            <button class="modal-close" id="closeRegisterModal">&times;</button>
          </div>
          <form id="registerTeamForm" class="modal-body">
            <div class="form-group">
              <label for="teamName">
                <i class="fas fa-shield-alt"></i>
                Nombre del Equipo
              </label>
              <input type="text" id="teamName" placeholder="Mi Equipo Pro" required minlength="3" maxlength="30">
              <span class="form-hint">3-30 caracteres</span>
            </div>
            
            <div class="form-group">
              <label for="teamTag">
                <i class="fas fa-tag"></i>
                Tag del Equipo
              </label>
              <input type="text" id="teamTag" placeholder="MEP" required minlength="2" maxlength="5">
              <span class="form-hint">2-5 caracteres (ej: NaVi, FaZe)</span>
            </div>
            
            <div class="form-group">
              <label for="teamLogo">
                <i class="fas fa-image"></i>
                URL del Logo (opcional)
              </label>
              <input type="url" id="teamLogo" placeholder="https://ejemplo.com/logo.png">
            </div>
            
            <div class="registration-info">
              <i class="fas fa-info-circle"></i>
              <p>Serás el capitán del equipo. Podrás agregar jugadores después del registro.</p>
            </div>
            
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" id="cancelRegister">Cancelar</button>
              <button type="submit" class="btn btn-primary">
                <i class="fas fa-check"></i>
                Inscribir Equipo
              </button>
            </div>
          </form>
        </div>
      </div>
      
      <style>
        .tournament-detail {
          min-height: 100vh;
        }
        
        .tournament-header {
          background: linear-gradient(135deg, rgba(0, 212, 255, 0.1), rgba(255, 107, 53, 0.1));
          padding: 40px 0;
          border-bottom: 1px solid var(--border-color);
        }
        
        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: var(--text-secondary);
          font-size: 14px;
          margin-bottom: 24px;
          transition: var(--transition);
        }
        
        .back-link:hover {
          color: var(--primary);
        }
        
        .tournament-header-content {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 32px;
        }
        
        .tournament-header-actions {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 16px;
        }
        
        .btn-lg {
          padding: 16px 32px;
          font-size: 16px;
        }
        
        .already-registered {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--secondary);
          font-weight: 600;
          padding: 12px 20px;
          background: rgba(0, 255, 136, 0.1);
          border-radius: 8px;
        }
        
        .tournament-game-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 14px;
          background: rgba(0, 212, 255, 0.2);
          border: 1px solid rgba(0, 212, 255, 0.3);
          border-radius: 100px;
          font-size: 13px;
          color: var(--primary);
          margin-bottom: 16px;
        }
        
        .tournament-title {
          font-family: var(--font-display);
          font-size: 36px;
          font-weight: 800;
          margin-bottom: 16px;
        }
        
        .tournament-header-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 20px;
          font-size: 14px;
          color: var(--text-secondary);
        }
        
        .tournament-header-meta span {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .tournament-header-meta i {
          color: var(--text-muted);
        }
        
        .status-badge {
          padding: 4px 12px;
          border-radius: 100px;
          font-size: 12px;
          font-weight: 600;
        }
        
        .status-badge.registration_open {
          background: rgba(0, 255, 136, 0.2);
          color: var(--secondary);
        }
        
        .status-badge.in_progress {
          background: rgba(255, 51, 102, 0.2);
          color: var(--danger);
        }
        
        .status-badge.completed {
          background: rgba(0, 212, 255, 0.2);
          color: var(--primary);
        }
        
        .tournament-header-prize {
          text-align: right;
        }
        
        .prize-label {
          font-size: 13px;
          color: var(--text-secondary);
          margin-bottom: 4px;
        }
        
        .prize-value {
          font-family: var(--font-display);
          font-size: 32px;
          font-weight: 800;
          color: var(--warning);
        }
        
        .tournament-tabs {
          background: var(--bg-card);
          border-bottom: 1px solid var(--border-color);
          position: sticky;
          top: 70px;
          z-index: 100;
        }
        
        .tournament-tabs .container {
          display: flex;
          gap: 8px;
        }
        
        .tab-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 16px 24px;
          background: none;
          border: none;
          color: var(--text-secondary);
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: var(--transition);
          border-bottom: 2px solid transparent;
        }
        
        .tab-btn:hover {
          color: var(--text-primary);
        }
        
        .tab-btn.active {
          color: var(--primary);
          border-bottom-color: var(--primary);
        }
        
        .tournament-content {
          padding: 40px 0;
        }
        
        .tab-content {
          display: none;
        }
        
        .tab-content.active {
          display: block;
        }
        
        /* Registration Modal Extras */
        .registration-info {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 16px;
          background: rgba(0, 212, 255, 0.1);
          border-radius: 8px;
          color: var(--text-secondary);
          font-size: 14px;
        }
        
        .registration-info i {
          color: var(--primary);
          margin-top: 2px;
        }
        
        /* Bracket Styles */
        .bracket-container {
          overflow-x: auto;
          padding: 20px 0;
        }
        
        .bracket-rounds {
          display: flex;
          gap: 40px;
          min-width: max-content;
        }
        
        .bracket-round {
          min-width: 280px;
        }
        
        .round-title {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 20px;
          text-align: center;
        }
        
        .bracket-match {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          margin-bottom: 16px;
          overflow: hidden;
        }
        
        .bracket-match.live {
          border-color: var(--danger);
          box-shadow: 0 0 20px rgba(255, 51, 102, 0.2);
        }
        
        .match-team {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          border-bottom: 1px solid var(--border-color);
        }
        
        .match-team:last-child {
          border-bottom: none;
        }
        
        .match-team.winner {
          background: rgba(0, 255, 136, 0.1);
        }
        
        .match-team-name {
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 500;
        }
        
        .match-team-avatar {
          width: 28px;
          height: 28px;
          background: var(--bg-tertiary);
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          color: var(--primary);
        }
        
        .match-team-score {
          font-family: var(--font-display);
          font-size: 18px;
          font-weight: 700;
        }
        
        .match-team.winner .match-team-score {
          color: var(--secondary);
        }
        
        /* Teams List */
        .teams-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 20px;
        }
        
        .team-card {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          transition: var(--transition);
        }
        
        .team-card:hover {
          border-color: var(--primary);
        }
        
        .team-avatar {
          width: 50px;
          height: 50px;
          background: linear-gradient(135deg, var(--primary), var(--accent));
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          color: white;
        }
        
        .team-info h3 {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 4px;
        }
        
        .team-info p {
          font-size: 13px;
          color: var(--text-secondary);
        }
        
        /* Info Section */
        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 24px;
        }
        
        .info-card {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          padding: 24px;
        }
        
        .info-card h3 {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .info-card h3 i {
          color: var(--primary);
        }
        
        .info-row {
          display: flex;
          justify-content: space-between;
          padding: 12px 0;
          border-bottom: 1px solid var(--border-color);
        }
        
        .info-row:last-child {
          border-bottom: none;
        }
        
        .info-label {
          color: var(--text-secondary);
        }
        
        .info-value {
          font-weight: 600;
        }
        
        @media (max-width: 768px) {
          .tournament-header-content {
            flex-direction: column;
          }
          
          .tournament-header-actions {
            align-items: flex-start;
            width: 100%;
          }
          
          .tournament-header-price {
            text-align: left;
          }
          
          .tournament-title {
            font-size: 28px;
          }
        }
      </style>
    `;

    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
      });
    });

    // Registration modal
    const registerBtn = document.getElementById('registerTeamBtn');
    const modal = document.getElementById('registerModal');
    const closeBtn = document.getElementById('closeRegisterModal');
    const cancelBtn = document.getElementById('cancelRegister');
    const overlay = modal?.querySelector('.modal-overlay');
    const registerForm = document.getElementById('registerTeamForm');

    const openModal = () => modal?.classList.add('show');
    const closeModal = () => modal?.classList.remove('show');

    registerBtn?.addEventListener('click', openModal);
    closeBtn?.addEventListener('click', closeModal);
    cancelBtn?.addEventListener('click', closeModal);
    overlay?.addEventListener('click', closeModal);

    registerForm?.addEventListener('submit', async (e) => {
      e.preventDefault();

      const teamName = document.getElementById('teamName').value.trim();
      const teamTag = document.getElementById('teamTag').value.trim().toUpperCase();
      const teamLogo = document.getElementById('teamLogo').value.trim();
      const user = getStoredUser();

      try {
        const response = await API.teams.create({
          tournament_id: tournamentId,
          name: teamName,
          tag: teamTag,
          captain_id: user.id,
          logo_url: teamLogo || null
        });

        if (response.success) {
          window.showToast('success', '¡Equipo registrado!', 'Tu equipo ha sido inscrito en el torneo');
          closeModal();
          // Refresh the page to show updated team list
          renderTournament(container, tournamentId);
        }
      } catch (error) {
        window.showToast('error', 'Error', error.message || 'No se pudo registrar el equipo');
      }
    });

  } catch (error) {
    console.error('Error loading tournament:', error);
    container.innerHTML = `
      <div class="container">
        <div class="empty-state">
          <i class="fas fa-exclamation-triangle"></i>
          <h3>Error al cargar torneo</h3>
          <p>${error.message}</p>
          <a href="#/torneos" class="btn btn-primary">Volver</a>
        </div>
      </div>
    `;
  }
}

function renderBracket(matches, teams) {
  if (matches.length === 0) {
    return `
      <div class="empty-state">
        <i class="fas fa-sitemap"></i>
        <h3>Bracket no disponible</h3>
        <p>El bracket se generará cuando inicie el torneo</p>
      </div>
    `;
  }

  // Group matches by round
  const rounds = {};
  matches.forEach(match => {
    const round = match.round || 1;
    if (!rounds[round]) rounds[round] = [];
    rounds[round].push(match);
  });

  const roundNames = ['Primera Ronda', 'Cuartos', 'Semifinal', 'Final'];

  return `
    <div class="bracket-container">
      <div class="bracket-rounds">
        ${Object.entries(rounds).map(([roundNum, roundMatches], idx) => `
          <div class="bracket-round">
            <div class="round-title">${roundNames[idx] || `Ronda ${roundNum}`}</div>
            ${roundMatches.map(match => {
    const team1 = teams.find(t => t.id === match.home_team_id);
    const team2 = teams.find(t => t.id === match.away_team_id);
    const isLive = match.status === 'LIVE' || match.status === 'IN_PROGRESS';
    const score1 = match.home_score || 0;
    const score2 = match.away_score || 0;

    return `
                <div class="bracket-match ${isLive ? 'live' : ''}">
                  <div class="match-team ${match.winner_id === match.home_team_id ? 'winner' : ''}">
                    <span class="match-team-name">
                      <span class="match-team-avatar"><i class="fas fa-shield-halved"></i></span>
                      ${team1?.name || 'TBD'}
                    </span>
                    <span class="match-team-score">${score1}</span>
                  </div>
                  <div class="match-team ${match.winner_id === match.away_team_id ? 'winner' : ''}">
                    <span class="match-team-name">
                      <span class="match-team-avatar"><i class="fas fa-shield-halved"></i></span>
                      ${team2?.name || 'TBD'}
                    </span>
                    <span class="match-team-score">${score2}</span>
                  </div>
                </div>
              `;
  }).join('')}
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function renderTeamsList(teams) {
  if (teams.length === 0) {
    return `
      <div class="empty-state">
        <i class="fas fa-users"></i>
        <h3>No hay equipos inscritos</h3>
        <p>Sé el primero en registrar tu equipo</p>
      </div>
    `;
  }

  return `
    <div class="teams-grid">
      ${teams.map((team, idx) => `
        <div class="team-card">
          <div class="team-avatar">
            ${team.logo_url ? `<img src="${team.logo_url}" alt="${team.name}" style="width:100%;height:100%;object-fit:cover;border-radius:12px">` : '<i class="fas fa-shield-halved"></i>'}
          </div>
          <div class="team-info">
            <h3>[${team.tag}] ${team.name}</h3>
            <p>${team.players?.length || 1} jugador(es) • ${team.approved ? 'Aprobado' : 'Pendiente'}</p>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderTournamentInfo(tournament, game) {
  const formatLabels = {
    'SINGLE_ELIMINATION': 'Eliminación Simple',
    'DOUBLE_ELIMINATION': 'Doble Eliminación',
    'ROUND_ROBIN': 'Round Robin',
    'SWISS': 'Sistema Suizo'
  };

  return `
    <div class="info-grid">
      <div class="info-card">
        <h3><i class="fas fa-info-circle"></i> Detalles</h3>
        <div class="info-row">
          <span class="info-label">Formato</span>
          <span class="info-value">${formatLabels[tournament.format] || tournament.format}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Tamaño de equipo</span>
          <span class="info-value">${tournament.team_size || 5} jugadores</span>
        </div>
        <div class="info-row">
          <span class="info-label">Máximo participantes</span>
          <span class="info-value">${tournament.max_participants || 'Sin límite'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Región</span>
          <span class="info-value">${tournament.region || 'Global'}</span>
        </div>
      </div>
      
      <div class="info-card">
        <h3><i class="fas fa-calendar"></i> Fechas</h3>
        <div class="info-row">
          <span class="info-label">Inicio</span>
          <span class="info-value">${formatDate(tournament.start_date)}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Cierre inscripciones</span>
          <span class="info-value">${formatDate(tournament.registration_deadline)}</span>
        </div>
      </div>
      
      <div class="info-card">
        <h3><i class="fas fa-gamepad"></i> Juego</h3>
        <div class="info-row">
          <span class="info-label">Nombre</span>
          <span class="info-value">${game?.name || 'N/A'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Desarrollador</span>
          <span class="info-value">${game?.developer || 'N/A'}</span>
        </div>
      </div>
    </div>
  `;
}

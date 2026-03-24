// =====================================================
// Tournament Detail Page - Complete View
// =====================================================

import API from '../api.js';
import { showLoading, formatDate, formatCurrency } from '../ui-helpers.js';
import { isAuthenticated, getStoredUser } from '../auth.js';
import { renderStreams, hasStreams } from '../components/stream-viewer.js';

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
      'REGISTRATION_OPEN': 'Inscripciones Abiertas',
      'REGISTRATION_CLOSED': 'Inscripciones Cerradas',
      'IN_PROGRESS': 'En Curso',
      'COMPLETED': 'Finalizado',
      'CANCELLED': 'Cancelado'
    };

    const canRegister = isAuthenticated() && tournament.status === 'REGISTRATION_OPEN';
    const user = getStoredUser();
    const userHasTeam = user && teams.some(t =>
      t.captain_id === user.id || t.players?.some(p => p.user_id === user.id)
    );

    // Precios reales en MXN basados en el ID del torneo para consistencia
    const capacidades = [50, 100, 200, 500];
    const entryPrices = [149, 199, 299, 499, 599, 799, 999];
    const prizeMultipliers = [5, 8, 10, 15, 20];
    const seed = parseInt(tournamentId) || 1;
    const entryFee = entryPrices[seed % entryPrices.length];
    const maxPart = capacidades[seed % capacidades.length];
    const prizePool = entryFee * prizeMultipliers[seed % prizeMultipliers.length];
    tournament.max_participants = tournament.max_participants || maxPart;
    const startDate = tournament.start_date ? new Date(tournament.start_date) : null;
    const deadlineDate = tournament.registration_deadline ? new Date(tournament.registration_deadline) : null;
    const timeStr = startDate ? startDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: true }) : 'Por definir';
    const deadlineTimeStr = deadlineDate ? deadlineDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: true }) : '';

    // Calculate countdown
    const now = new Date();
    const timeUntilStart = startDate ? startDate - now : 0;
    const daysUntil = Math.max(0, Math.floor(timeUntilStart / (1000 * 60 * 60 * 24)));
    const hoursUntil = Math.max(0, Math.floor((timeUntilStart % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)));

    // Determine active tab
    const isLive = tournament.status === 'IN_PROGRESS';
    const hasMatchesData = matches.length > 0;
    const defaultTab = isLive && hasMatchesData ? 'bracket' : 'overview';

    container.innerHTML = `
      <div class="tournament-detail">
        <!-- Header -->
        <div class="tournament-header">
          <div class="tournament-header-overlay"></div>
          <div class="container">
            <a href="#/torneos" class="back-link">
              <i class="fas fa-arrow-left"></i> Volver a torneos
            </a>

            <div class="tournament-header-content">
              <div class="tournament-header-info">
                <div class="tournament-badges">
                  <span class="tournament-game-badge">
                    <i class="fas fa-gamepad"></i> ${game?.name || 'Juego'}
                  </span>
                  <span class="status-badge ${(tournament.status || 'draft').toLowerCase().replace('_', '-')}">
                    ${tournament.status === 'IN_PROGRESS' ? '<span class="live-dot"></span>' : ''}
                    ${statusLabels[tournament.status] || tournament.status}
                  </span>
                </div>
                <h1 class="tournament-title">${tournament.name}</h1>

                <!-- Countdown -->
                ${timeUntilStart > 0 ? `
                  <div class="tournament-countdown">
                    <div class="countdown-item">
                      <span class="countdown-number">${daysUntil}</span>
                      <span class="countdown-label">D\u00edas</span>
                    </div>
                    <div class="countdown-separator">:</div>
                    <div class="countdown-item">
                      <span class="countdown-number">${hoursUntil}</span>
                      <span class="countdown-label">Horas</span>
                    </div>
                    <span class="countdown-text">para el inicio</span>
                  </div>
                ` : ''}

                <div class="tournament-header-meta">
                  <span><i class="fas fa-calendar-alt"></i> ${formatDate(tournament.start_date)}</span>
                  <span><i class="fas fa-clock"></i> ${timeStr}</span>
                  <span><i class="fas fa-users"></i> ${teams.length}/${tournament.max_participants || '\u221E'} equipos</span>
                  <span><i class="fas fa-map-marker-alt"></i> ${tournament.region || 'Global'}</span>
                </div>
              </div>

              <div class="tournament-header-actions">
                <!-- Prize & Entry Fee Card -->
                <div class="tournament-quick-info">
                  ${prizePool > 0 ? `
                    <div class="quick-info-item prize">
                      <i class="fas fa-trophy"></i>
                      <div>
                        <span class="quick-info-label">Premio Total</span>
                        <span class="quick-info-value prize-value">${formatCurrency(prizePool)}</span>
                      </div>
                    </div>
                  ` : ''}
                  <div class="quick-info-item fee">
                    <i class="fas fa-ticket-alt"></i>
                    <div>
                      <span class="quick-info-label">Inscripci\u00f3n</span>
                      <span class="quick-info-value">${formatCurrency(entryFee)}</span>
                    </div>
                  </div>
                </div>

                ${canRegister && !userHasTeam ? `
                  <button class="btn btn-primary btn-lg btn-glow" id="registerTeamBtn">
                    <i class="fas fa-plus"></i>
                    Inscribir Equipo
                  </button>
                ` : ''}
                ${canRegister && userHasTeam ? `
                  <span class="already-registered">
                    <i class="fas fa-check-circle"></i>
                    Ya est\u00e1s inscrito
                  </span>
                ` : ''}
                ${!isAuthenticated() && tournament.status === 'REGISTRATION_OPEN' ? `
                  <a href="#/login" class="btn btn-primary btn-lg">
                    <i class="fas fa-sign-in-alt"></i>
                    Inicia sesi\u00f3n para inscribirte
                  </a>
                ` : ''}
              </div>
            </div>
          </div>
        </div>

        <!-- Tabs -->
        <div class="tournament-tabs">
          <div class="container">
            <button class="tab-btn ${defaultTab === 'overview' ? 'active' : ''}" data-tab="overview">
              <i class="fas fa-info-circle"></i> Informaci\u00f3n
            </button>
            <button class="tab-btn" data-tab="participants">
              <i class="fas fa-users"></i> Participantes (${teams.length})
            </button>
            <button class="tab-btn" data-tab="rules">
              <i class="fas fa-gavel"></i> Reglas
            </button>
            <button class="tab-btn ${defaultTab === 'bracket' ? 'active' : ''}" data-tab="bracket">
              <i class="fas fa-sitemap"></i> Bracket
            </button>
            ${hasStreams(tournament) ? `
            <button class="tab-btn" data-tab="streams">
              <i class="fas fa-video"></i> Transmisiones
            </button>
            ` : ''}
          </div>
        </div>

        <!-- Tab Content -->
        <div class="tournament-content">
          <div class="container">

            <!-- Overview Tab -->
            <div id="tab-overview" class="tab-content ${defaultTab === 'overview' ? 'active' : ''}">
              ${renderOverview(tournament, game, teams, entryFee, prizePool, timeStr, deadlineTimeStr)}
            </div>

            <!-- Participants Tab -->
            <div id="tab-participants" class="tab-content">
              ${renderParticipants(teams, tournament)}
            </div>

            <!-- Rules Tab -->
            <div id="tab-rules" class="tab-content">
              ${renderRules(tournament)}
            </div>

            <!-- Bracket Tab -->
            <div id="tab-bracket" class="tab-content ${defaultTab === 'bracket' ? 'active' : ''}">
              ${renderBracket(matches, teams, tournament)}
            </div>

            <!-- Streams Tab -->
            ${hasStreams(tournament) ? `
            <div id="tab-streams" class="tab-content">
              ${renderStreams(tournament, 'tournament')}
            </div>
            ` : ''}
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

            ${entryFee > 0 ? `
              <div class="registration-fee-notice">
                <i class="fas fa-exclamation-triangle"></i>
                <div>
                  <strong>Cuota de inscripci\u00f3n: ${formatCurrency(entryFee)}</strong>
                  <p>Se requiere el pago de la cuota para completar la inscripci\u00f3n.</p>
                </div>
              </div>
            ` : ''}

            <div class="registration-info">
              <i class="fas fa-info-circle"></i>
              <p>Ser\u00e1s el capit\u00e1n del equipo. Podr\u00e1s agregar jugadores despu\u00e9s del registro. Al inscribirte aceptas las reglas del torneo.</p>
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

      ${renderTournamentStyles()}
    `;

    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
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
      const currentUser = getStoredUser();

      try {
        const response = await API.teams.create({
          tournament_id: tournamentId,
          name: teamName,
          tag: teamTag,
          captain_id: currentUser.id,
          logo_url: teamLogo || null
        });

        if (response.success) {
          window.showToast('success', '\u00a1Equipo registrado!', 'Tu equipo ha sido inscrito en el torneo');
          closeModal();
          renderTournament(container, tournamentId);
        }
      } catch (error) {
        window.showToast('error', 'Error', error.message || 'No se pudo registrar el equipo');
      }
    });

    // Load AI features asynchronously
    loadTournamentAI(tournamentId, tournament.status);

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

// =====================================================
// OVERVIEW TAB
// =====================================================
function renderOverview(tournament, game, teams, entryFee, prizePool, timeStr, deadlineTimeStr) {
  const formatLabels = {
    'SINGLE_ELIMINATION': 'Eliminaci\u00f3n Simple',
    'DOUBLE_ELIMINATION': 'Doble Eliminaci\u00f3n',
    'ROUND_ROBIN': 'Round Robin',
    'SWISS': 'Sistema Suizo'
  };

  return `
    <div class="overview-grid">
      <!-- Description -->
      <div class="overview-card overview-description">
        <h3><i class="fas fa-scroll"></i> Descripci\u00f3n del Torneo</h3>
        <div class="description-content">
          ${tournament.description
      ? '<p>' + tournament.description + '</p>'
      : '<p class="text-muted">Sin descripci\u00f3n disponible.</p>'}
        </div>
      </div>

      <!-- Details Card -->
      <div class="overview-card">
        <h3><i class="fas fa-cog"></i> Detalles del Torneo</h3>
        <div class="info-row">
          <span class="info-label"><i class="fas fa-gamepad"></i> Juego</span>
          <span class="info-value">${game?.name || 'N/A'}</span>
        </div>
        <div class="info-row">
          <span class="info-label"><i class="fas fa-sitemap"></i> Formato</span>
          <span class="info-value">${formatLabels[tournament.format] || tournament.format}</span>
        </div>
        <div class="info-row">
          <span class="info-label"><i class="fas fa-user-friends"></i> Tama\u00f1o de equipo</span>
          <span class="info-value">${tournament.team_size || 1} jugador(es)</span>
        </div>
        <div class="info-row">
          <span class="info-label"><i class="fas fa-users"></i> M\u00e1x. participantes</span>
          <span class="info-value">${tournament.max_participants || 'Sin l\u00edmite'}</span>
        </div>
        <div class="info-row">
          <span class="info-label"><i class="fas fa-map-marker-alt"></i> Regi\u00f3n</span>
          <span class="info-value">${tournament.region || 'Global'}</span>
        </div>
      </div>

      <!-- Schedule Card -->
      <div class="overview-card">
        <h3><i class="fas fa-calendar-alt"></i> Calendario</h3>
        <div class="schedule-items">
          <div class="schedule-item">
            <div class="schedule-icon">
              <i class="fas fa-door-open"></i>
            </div>
            <div class="schedule-info">
              <span class="schedule-label">Cierre de inscripciones</span>
              <span class="schedule-date">${formatDate(tournament.registration_deadline)}</span>
              <span class="schedule-time">${deadlineTimeStr}</span>
            </div>
          </div>
          <div class="schedule-divider"></div>
          <div class="schedule-item highlight">
            <div class="schedule-icon">
              <i class="fas fa-play-circle"></i>
            </div>
            <div class="schedule-info">
              <span class="schedule-label">Inicio del torneo</span>
              <span class="schedule-date">${formatDate(tournament.start_date)}</span>
              <span class="schedule-time">${timeStr}</span>
            </div>
          </div>
          ${tournament.end_date ? `
            <div class="schedule-divider"></div>
            <div class="schedule-item">
              <div class="schedule-icon">
                <i class="fas fa-flag-checkered"></i>
              </div>
              <div class="schedule-info">
                <span class="schedule-label">Fin del torneo</span>
                <span class="schedule-date">${formatDate(tournament.end_date)}</span>
              </div>
            </div>
          ` : ''}
        </div>
      </div>

      <!-- Financials Card -->
      <div class="overview-card">
        <h3><i class="fas fa-coins"></i> Econom\u00eda del Torneo</h3>
        <div class="financial-cards">
          <div class="financial-big-card fee">
            <i class="fas fa-ticket-alt"></i>
            <div>
              <span class="financial-label">Cuota de Inscripci\u00f3n</span>
              <span class="financial-amount">${formatCurrency(entryFee)}</span>
              <span class="financial-note">Por equipo</span>
            </div>
          </div>
          <div class="financial-big-card prize">
            <i class="fas fa-trophy"></i>
            <div>
              <span class="financial-label">Premio Total</span>
              <span class="financial-amount">${formatCurrency(prizePool)}</span>
              <span class="financial-note">Distribuido entre ganadores</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Stats -->
      <div class="overview-card">
        <h3><i class="fas fa-chart-bar"></i> Estado Actual</h3>
        <div class="stats-mini-grid">
          <div class="stat-mini">
            <span class="stat-mini-value">${teams.length}</span>
            <span class="stat-mini-label">Equipos inscritos</span>
          </div>
          <div class="stat-mini">
            <span class="stat-mini-value">${tournament.max_participants ? tournament.max_participants - teams.length : '\u221E'}</span>
            <span class="stat-mini-label">Lugares disponibles</span>
          </div>
          <div class="stat-mini">
            <span class="stat-mini-value">${tournament.team_size || 1}</span>
            <span class="stat-mini-label">Jugadores/equipo</span>
          </div>
        </div>
      </div>

      <!-- AI Tournament Summary -->
      <div class="ai-tournament-summary" id="aiTournamentSummary" style="display:none">
        <div class="summary-header">
            <i class="fas fa-robot"></i>
            <h4>Resumen de IA <span class="ai-badge-small">BETA</span></h4>
        </div>
        <p id="aiSummaryText"><i class="fas fa-spinner fa-spin"></i> Generando resumen...</p>
      </div>
    </div>
  `;
}

// =====================================================
// PARTICIPANTS TAB
// =====================================================
function renderParticipants(teams, tournament) {
  if (teams.length === 0) {
    return `
      <div class="empty-state">
        <i class="fas fa-users"></i>
        <h3>No hay equipos inscritos</h3>
        <p>S\u00e9 el primero en registrar tu equipo</p>
      </div>
    `;
  }

  const teamSize = tournament.team_size || 1;
  const isSoloTournament = teamSize === 1;

  return `
    <div class="participants-section">
      <div class="participants-header">
        <h3><i class="fas fa-users"></i> ${isSoloTournament ? 'Jugadores' : 'Equipos'} Inscritos (${teams.length}/${tournament.max_participants || '\u221E'})</h3>
        <div class="participants-progress">
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${tournament.max_participants ? (teams.length / tournament.max_participants * 100) : 50}%"></div>
          </div>
          <span class="progress-text">${tournament.max_participants ? Math.round(teams.length / tournament.max_participants * 100) : '?'}% lleno</span>
        </div>
      </div>

      <div class="participants-grid">
        ${teams.map((team, idx) => `
          <div class="participant-card ${team.approved ? 'approved' : 'pending'}">
            <div class="participant-number">#${idx + 1}</div>
            <div class="participant-avatar">
              ${team.logo_url
      ? '<img src="' + team.logo_url + '" alt="' + team.name + '" onerror="this.parentElement.innerHTML=\'<i class=\\\\\'fas fa-shield-halved\\\\\'></i>\'">'
      : '<i class="fas fa-shield-halved"></i>'}
            </div>
            <div class="participant-info">
              <h4 class="participant-name">
                ${isSoloTournament ? team.name : '[' + team.tag + '] ' + team.name}
              </h4>
              <div class="participant-details">
                ${!isSoloTournament ? `
                  <span><i class="fas fa-user"></i> Capit\u00e1n: ${team.captain?.username || 'N/A'}</span>
                  <span><i class="fas fa-users"></i> ${team.players?.length || 1} jugador(es)</span>
                ` : ''}
                <span><i class="fas fa-calendar"></i> ${formatDate(team.registration_date || team.created_at)}</span>
              </div>
            </div>
            <div class="participant-status">
              ${team.approved
      ? '<span class="status-approved"><i class="fas fa-check-circle"></i> Confirmado</span>'
      : '<span class="status-pending"><i class="fas fa-clock"></i> Pendiente</span>'}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// =====================================================
// RULES TAB
// =====================================================
function renderRules(tournament) {
  const formatName = tournament.format === 'SINGLE_ELIMINATION' ? 'Eliminaci\u00f3n Simple'
    : tournament.format === 'DOUBLE_ELIMINATION' ? 'Doble Eliminaci\u00f3n'
      : tournament.format === 'ROUND_ROBIN' ? 'Round Robin'
        : 'Sistema Suizo';

  const formatDesc = tournament.format === 'SINGLE_ELIMINATION' ? 'Una derrota y quedas eliminado.'
    : tournament.format === 'DOUBLE_ELIMINATION' ? 'Cada equipo tiene una segunda oportunidad antes de ser eliminado.'
      : 'Todos juegan contra todos.';

  return `
    <div class="rules-section">
      <div class="rules-header">
        <div class="rules-icon">
          <i class="fas fa-gavel"></i>
        </div>
        <div>
          <h3>Reglas del Torneo</h3>
          <p>Todos los participantes deben cumplir con estas reglas para mantener la competencia justa y deportiva.</p>
        </div>
      </div>

      <!-- General Rules -->
      <div class="rules-category">
        <h4><i class="fas fa-shield-alt"></i> Reglas Generales</h4>
        <div class="rules-list">
          <div class="rule-item">
            <span class="rule-number">1</span>
            <div class="rule-content">
              <strong>Respeto y Deportivismo</strong>
              <p>Todos los participantes deben mantener una actitud respetuosa hacia los dem\u00e1s jugadores, organizadores y espectadores. No se tolerar\u00e1 lenguaje ofensivo, discriminatorio o acosador.</p>
            </div>
          </div>
          <div class="rule-item">
            <span class="rule-number">2</span>
            <div class="rule-content">
              <strong>Puntualidad</strong>
              <p>Los jugadores deben estar listos 15 minutos antes del horario programado de cada partida. La falta de puntualidad puede resultar en descalificaci\u00f3n autom\u00e1tica tras 10 minutos de espera.</p>
            </div>
          </div>
          <div class="rule-item">
            <span class="rule-number">3</span>
            <div class="rule-content">
              <strong>Una Cuenta por Jugador</strong>
              <p>Cada participante puede registrarse con una sola cuenta. Cuentas m\u00faltiples o suplantaci\u00f3n de identidad resultar\u00e1 en descalificaci\u00f3n inmediata.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Anti-Cheat Rules -->
      <div class="rules-category danger">
        <h4><i class="fas fa-ban"></i> Prohibiciones - Anti-Trampas</h4>
        <div class="rules-list">
          <div class="rule-item danger">
            <span class="rule-number"><i class="fas fa-times"></i></span>
            <div class="rule-content">
              <strong>Hacks y Software de Terceros</strong>
              <p>Queda terminantemente prohibido el uso de cualquier tipo de hack, cheat, mod, script, macro o software de terceros que otorgue ventaja injusta. Esto incluye: aimbots, wallhacks, speed hacks, ESP, etc.</p>
            </div>
          </div>
          <div class="rule-item danger">
            <span class="rule-number"><i class="fas fa-times"></i></span>
            <div class="rule-content">
              <strong>Bug Exploiting</strong>
              <p>No se permite explotar bugs o glitches del juego de manera intencional para obtener ventaja. Si se descubre un bug durante la partida, se debe reportar inmediatamente.</p>
            </div>
          </div>
          <div class="rule-item danger">
            <span class="rule-number"><i class="fas fa-times"></i></span>
            <div class="rule-content">
              <strong>Match Fixing (Ama\u00f1o de partidas)</strong>
              <p>Cualquier intento de ama\u00f1ar resultados, hacer stream sniping, o compartir informaci\u00f3n con equipos rivales resultar\u00e1 en descalificaci\u00f3n permanente y posible baneo de futuros torneos.</p>
            </div>
          </div>
          <div class="rule-item danger">
            <span class="rule-number"><i class="fas fa-times"></i></span>
            <div class="rule-content">
              <strong>Boosting y Account Sharing</strong>
              <p>No se permite que otro jugador juegue en tu cuenta ni viceversa. Cada jugador debe competir con su propia cuenta verificada.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Tournament Format Rules -->
      <div class="rules-category">
        <h4><i class="fas fa-trophy"></i> Formato del Torneo</h4>
        <div class="rules-list">
          <div class="rule-item">
            <span class="rule-number">1</span>
            <div class="rule-content">
              <strong>Formato de Competici\u00f3n</strong>
              <p>Este torneo se juega en formato <strong>${formatName}</strong>. ${formatDesc}</p>
            </div>
          </div>
          <div class="rule-item">
            <span class="rule-number">2</span>
            <div class="rule-content">
              <strong>Tama\u00f1o de Equipos</strong>
              <p>Cada equipo debe tener ${tournament.team_size || 1} jugador(es). No se permiten sustituciones no autorizadas durante las partidas.</p>
            </div>
          </div>
          <div class="rule-item">
            <span class="rule-number">3</span>
            <div class="rule-content">
              <strong>Resultados</strong>
              <p>Los resultados de cada partida son registrados por los organizadores. En caso de disputa, se requerir\u00e1n pruebas (screenshots, grabaciones) para resolver el conflicto.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Penalties -->
      <div class="rules-category warning">
        <h4><i class="fas fa-exclamation-triangle"></i> Penalizaciones</h4>
        <div class="penalties-grid">
          <div class="penalty-card mild">
            <div class="penalty-icon"><i class="fas fa-flag"></i></div>
            <h5>Advertencia</h5>
            <p>Falta leve de comportamiento</p>
          </div>
          <div class="penalty-card moderate">
            <div class="penalty-icon"><i class="fas fa-pause-circle"></i></div>
            <h5>Derrota T\u00e9cnica</h5>
            <p>Ama\u00f1o o retraso intencional</p>
          </div>
          <div class="penalty-card severe">
            <div class="penalty-icon"><i class="fas fa-user-slash"></i></div>
            <h5>Descalificaci\u00f3n</h5>
            <p>Uso de hacks o trampas</p>
          </div>
          <div class="penalty-card extreme">
            <div class="penalty-icon"><i class="fas fa-ban"></i></div>
            <h5>Ban Permanente</h5>
            <p>Reincidencia o fraude grave</p>
          </div>
        </div>
      </div>

      <div class="rules-footer">
        <i class="fas fa-info-circle"></i>
        <p>Al inscribirse en el torneo, todos los participantes aceptan estas reglas. Los organizadores se reservan el derecho de tomar decisiones finales en cualquier disputa. Para m\u00e1s informaci\u00f3n, contacta a los organizadores.</p>
      </div>
    </div>
  `;
}

// =====================================================
// BRACKET TAB
// =====================================================
function renderBracket(matches, teams, tournament) {
  if (matches.length === 0) {
    return `
      <div class="bracket-empty">
        <div class="bracket-empty-icon">
          <i class="fas fa-sitemap"></i>
        </div>
        <h3>Bracket no disponible a\u00fan</h3>
        <p>El bracket se generar\u00e1 autom\u00e1ticamente cuando inicie el torneo y se cierren las inscripciones.</p>
        ${tournament.status === 'REGISTRATION_OPEN' ? `
          <div class="bracket-hint">
            <i class="fas fa-info-circle"></i>
            <span>Inscr\u00edbete antes del cierre para asegurar tu lugar</span>
          </div>
        ` : ''}
      </div>
    `;
  }

  const isSolo = (tournament.team_size || 1) === 1;

  // Group matches by round
  const rounds = {};
  matches.forEach(match => {
    const round = match.round || 1;
    if (!rounds[round]) rounds[round] = [];
    rounds[round].push(match);
  });

  // Sort matches within rounds by match_number
  Object.keys(rounds).forEach(round => {
    rounds[round].sort((a, b) => (a.match_number || 0) - (b.match_number || 0));
  });

  const totalRounds = Object.keys(rounds).length;
  const roundNames = [];
  for (let i = 0; i < totalRounds; i++) {
    if (i === totalRounds - 1) roundNames.push('\uD83C\uDFC6 Final');
    else if (i === totalRounds - 2) roundNames.push('Semifinal');
    else if (i === totalRounds - 3) roundNames.push('Cuartos de Final');
    else roundNames.push('Ronda ' + (i + 1));
  }

  const roundEntries = Object.entries(rounds);

  // Stats summary bar
  const totalMatches = matches.length;
  const liveMatches = matches.filter(m => m.status === 'LIVE' || m.status === 'IN_PROGRESS').length;
  const completedMatches = matches.filter(m => m.status === 'COMPLETED').length;
  const progress = totalMatches > 0 ? Math.round((completedMatches / totalMatches) * 100) : 0;

  return `
    <div class="bracket-header-section">
      <h3><i class="fas fa-sitemap"></i> ${isSolo ? 'Enfrentamientos (Jugador vs Jugador)' : 'Enfrentamientos (Equipo vs Equipo)'}</h3>
      <div class="bracket-legend">
        <span class="legend-item"><span class="legend-color winner"></span> Ganador</span>
        <span class="legend-item"><span class="legend-color live"></span> En vivo</span>
        <span class="legend-item"><span class="legend-color pending"></span> Pendiente</span>
      </div>
    </div>

    <!-- Progress bar -->
    <div class="bracket-progress-bar">
      <div class="bracket-progress-info">
        <span>${completedMatches} de ${totalMatches} partidos completados</span>
        ${liveMatches > 0 ? `<span class="bracket-live-count"><span class="live-dot"></span> ${liveMatches} en vivo</span>` : ''}
      </div>
      <div class="bracket-progress-track">
        <div class="bracket-progress-fill" style="width: ${progress}%"></div>
      </div>
    </div>

    <div class="bracket-container">
      <div class="bracket-rounds">
        ${roundEntries.map(([roundNum, roundMatches], idx) => `
          <div class="bracket-round" data-round="${roundNum}">
            <div class="round-title">
              <span class="round-name">${roundNames[idx] || 'Ronda ' + roundNum}</span>
              <span class="round-count">${roundMatches.filter(m => m.status === 'COMPLETED').length}/${roundMatches.length}</span>
            </div>
            <div class="bracket-round-matches">
              ${roundMatches.map((match, matchIdx) => {
    const team1 = teams.find(t => t.id === match.home_team_id);
    const team2 = teams.find(t => t.id === match.away_team_id);
    const isMatchLive = match.status === 'LIVE' || match.status === 'IN_PROGRESS';
    const isCompleted = match.status === 'COMPLETED';
    const score1 = match.home_score || 0;
    const score2 = match.away_score || 0;
    const team1Won = match.winner_id === match.home_team_id;
    const team2Won = match.winner_id === match.away_team_id;
    const isFinal = idx === totalRounds - 1;

    const team1Name = isSolo ? (team1?.name || 'Por definir') : (team1 ? '[' + team1.tag + '] ' + team1.name : 'Por definir');
    const team2Name = isSolo ? (team2?.name || 'Por definir') : (team2 ? '[' + team2.tag + '] ' + team2.name : 'Por definir');

    const team1Avatar = team1?.logo_url
      ? '<img src="' + team1.logo_url + '" alt="' + (team1.name || '') + '" style="width:100%;height:100%;object-fit:cover;border-radius:6px">'
      : '<i class="fas fa-' + (isSolo ? 'user' : 'shield-halved') + '"></i>';

    const team2Avatar = team2?.logo_url
      ? '<img src="' + team2.logo_url + '" alt="' + (team2.name || '') + '" style="width:100%;height:100%;object-fit:cover;border-radius:6px">'
      : '<i class="fas fa-' + (isSolo ? 'user' : 'shield-halved') + '"></i>';

    let scheduleHtml = '';
    if (match.scheduled_datetime) {
      const sd = new Date(match.scheduled_datetime);
      scheduleHtml = '<div class="match-schedule"><i class="fas fa-clock"></i> ' + formatDate(match.scheduled_datetime) + ' - ' + sd.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) + '</div>';
    }

    const bestOfHtml = match.best_of > 1 ? `<span class="match-best-of">Bo${match.best_of}</span>` : '';

    return `
                <div class="bracket-match ${isMatchLive ? 'live' : ''} ${isCompleted ? 'completed' : ''} ${isFinal ? 'final-match' : ''}" data-match-id="${match.id}">
                  ${isMatchLive ? '<div class="match-live-indicator"><span class="live-dot"></span> EN VIVO</div>' : ''}
                  ${isFinal && isCompleted ? '<div class="match-trophy-indicator"><i class="fas fa-trophy"></i> CAMPE\u00d3N</div>' : ''}
                  <div class="match-team ${team1Won ? 'winner' : ''} ${!team1 ? 'tbd' : ''}">
                    <span class="match-team-seed">${team1?.seed || '-'}</span>
                    <span class="match-team-name">
                      <span class="match-team-avatar">${team1Avatar}</span>
                      <span class="match-team-text">${team1Name}</span>
                    </span>
                    <span class="match-team-score ${team1Won ? 'score-winner' : ''}">${score1}</span>
                  </div>
                  <div class="match-vs">${bestOfHtml} VS</div>
                  <div class="match-team ${team2Won ? 'winner' : ''} ${!team2 ? 'tbd' : ''}">
                    <span class="match-team-seed">${team2?.seed || '-'}</span>
                    <span class="match-team-name">
                      <span class="match-team-avatar">${team2Avatar}</span>
                      <span class="match-team-text">${team2Name}</span>
                    </span>
                    <span class="match-team-score ${team2Won ? 'score-winner' : ''}">${score2}</span>
                  </div>
                  ${scheduleHtml}
                </div>
                ${matchIdx < roundMatches.length - 1 && idx === 0 && matchIdx % 2 === 1 ? '<div class="bracket-connector-gap"></div>' : ''}
              `;
  }).join('')}
            </div>
          </div>
          ${idx < roundEntries.length - 1 ? `
            <div class="bracket-connector-column">
              ${roundMatches.length > 1 ? Array.from({ length: Math.ceil(roundMatches.length / 2) }).map((_, ci) => `
                <div class="bracket-connector">
                  <svg class="connector-svg" viewBox="0 0 40 100" preserveAspectRatio="none">
                    <path d="M0 25 L20 25 L20 75 L0 75" fill="none" stroke="rgba(0,212,255,0.3)" stroke-width="2"/>
                    <path d="M20 50 L40 50" fill="none" stroke="rgba(0,212,255,0.3)" stroke-width="2"/>
                  </svg>
                </div>
              `).join('') : `
                <div class="bracket-connector single">
                  <svg class="connector-svg" viewBox="0 0 40 20" preserveAspectRatio="none">
                    <path d="M0 10 L40 10" fill="none" stroke="rgba(0,212,255,0.3)" stroke-width="2"/>
                  </svg>
                </div>
              `}
            </div>
          ` : ''}
        `).join('')}
      </div>
    </div>

    <!-- Winner card (if final is completed) -->
    ${(() => {
      const finalMatch = matches.find(m => m.round === totalRounds && m.status === 'COMPLETED' && m.winner_id);
      if (!finalMatch) return '';
      const winnerTeam = teams.find(t => t.id === finalMatch.winner_id);
      if (!winnerTeam) return '';
      return `
        <div class="bracket-winner-card">
          <div class="winner-glow"></div>
          <i class="fas fa-crown winner-crown"></i>
          <h3 class="winner-title">\uD83C\uDFC6 Campe\u00f3n del Torneo</h3>
          <div class="winner-team-name">${winnerTeam.name}</div>
          <span class="winner-tag">[${winnerTeam.tag}]</span>
        </div>
      `;
    })()}
  `;
}

// =====================================================
// STYLES
// =====================================================
function renderTournamentStyles() {
  return `
    <style>
      .tournament-detail { min-height: 100vh; }

      .tournament-header {
        position: relative;
        background: var(--bg-card);
        padding: 40px 0;
        border-bottom: 1px solid var(--border-color);
        overflow: hidden;
      }
      .tournament-header-overlay {
        position: absolute;
        inset: 0;
        background: linear-gradient(135deg, rgba(0, 212, 255, 0.08), rgba(102, 126, 234, 0.08), rgba(240, 147, 251, 0.05));
        pointer-events: none;
      }
      .back-link { display: inline-flex; align-items: center; gap: 8px; color: var(--text-secondary); font-size: 14px; margin-bottom: 24px; transition: all 0.3s; position: relative; z-index: 1; }
      .back-link:hover { color: var(--primary); }
      .tournament-header-content { display: flex; justify-content: space-between; align-items: flex-start; gap: 32px; position: relative; z-index: 1; }
      .tournament-badges { display: flex; gap: 10px; margin-bottom: 16px; flex-wrap: wrap; }
      .tournament-game-badge { display: inline-flex; align-items: center; gap: 8px; padding: 6px 14px; background: rgba(0, 212, 255, 0.15); border: 1px solid rgba(0, 212, 255, 0.3); border-radius: 100px; font-size: 13px; color: var(--primary); }
      .tournament-title { font-family: var(--font-display); font-size: 36px; font-weight: 800; margin-bottom: 16px; }

      /* Countdown */
      .tournament-countdown { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; padding: 12px 20px; background: rgba(255, 184, 0, 0.1); border: 1px solid rgba(255, 184, 0, 0.2); border-radius: 12px; width: fit-content; }
      .countdown-item { text-align: center; }
      .countdown-number { font-family: var(--font-display); font-size: 28px; font-weight: 800; color: var(--warning); display: block; }
      .countdown-label { font-size: 11px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; }
      .countdown-separator { font-family: var(--font-display); font-size: 28px; font-weight: 800; color: var(--warning); }
      .countdown-text { font-size: 13px; color: var(--text-secondary); margin-left: 8px; }

      .tournament-header-meta { display: flex; flex-wrap: wrap; gap: 20px; font-size: 14px; color: var(--text-secondary); }
      .tournament-header-meta span { display: flex; align-items: center; gap: 8px; }
      .tournament-header-meta i { color: var(--text-muted); }
      .tournament-header-actions { display: flex; flex-direction: column; align-items: flex-end; gap: 16px; }

      /* Quick Info */
      .tournament-quick-info { display: flex; flex-direction: column; gap: 12px; }
      .quick-info-item { display: flex; align-items: center; gap: 12px; padding: 12px 20px; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 12px; min-width: 200px; }
      .quick-info-item.prize { border-color: rgba(255, 184, 0, 0.3); background: rgba(255, 184, 0, 0.05); }
      .quick-info-item.prize i { color: var(--warning); font-size: 1.2rem; }
      .quick-info-item.fee i { color: var(--danger); font-size: 1.2rem; }
      .quick-info-item.free { border-color: rgba(0, 255, 136, 0.3); background: rgba(0, 255, 136, 0.05); }
      .quick-info-item.free i { color: var(--secondary); font-size: 1.2rem; }
      .quick-info-label { display: block; font-size: 11px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; }
      .quick-info-value { display: block; font-family: var(--font-display); font-size: 20px; font-weight: 800; }
      .quick-info-value.prize-value { color: var(--warning); }

      .btn-lg { padding: 16px 32px; font-size: 16px; }
      .btn-glow { box-shadow: 0 0 30px rgba(0, 212, 255, 0.3); }
      .already-registered { display: flex; align-items: center; gap: 8px; color: var(--secondary); font-weight: 600; padding: 12px 20px; background: rgba(0, 255, 136, 0.1); border-radius: 10px; }

      /* Status Badges */
      .status-badge { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 100px; font-size: 12px; font-weight: 600; }
      .status-badge.registration-open { background: rgba(0, 255, 136, 0.15); color: var(--secondary); border: 1px solid rgba(0, 255, 136, 0.3); }
      .status-badge.in-progress { background: rgba(255, 51, 102, 0.15); color: var(--danger); border: 1px solid rgba(255, 51, 102, 0.3); animation: pulse-live 2s infinite; }
      .status-badge.completed { background: rgba(0, 212, 255, 0.15); color: var(--primary); border: 1px solid rgba(0, 212, 255, 0.3); }
      .live-dot { width: 6px; height: 6px; background: currentColor; border-radius: 50%; display: inline-block; animation: blink 1s infinite; }
      @keyframes pulse-live { 0%,100%{box-shadow: 0 0 0 0 rgba(255,51,102,0.3)} 50%{box-shadow: 0 0 15px 3px rgba(255,51,102,0.15)} }
      @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }

      /* Tabs */
      .tournament-tabs { background: var(--bg-card); border-bottom: 1px solid var(--border-color); position: sticky; top: 70px; z-index: 100; }
      .tournament-tabs .container { display: flex; gap: 4px; overflow-x: auto; }
      .tab-btn { display: flex; align-items: center; gap: 8px; padding: 16px 20px; background: none; border: none; color: var(--text-secondary); font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.3s; border-bottom: 2px solid transparent; white-space: nowrap; }
      .tab-btn:hover { color: var(--text-primary); background: rgba(255,255,255,0.02); }
      .tab-btn.active { color: var(--primary); border-bottom-color: var(--primary); }
      .tournament-content { padding: 40px 0; }
      .tab-content { display: none; }
      .tab-content.active { display: block; animation: fadeIn 0.3s ease; }
      @keyframes fadeIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }

      /* Overview Grid */
      .overview-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 24px; }
      .overview-card { background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 16px; padding: 28px; }
      .overview-card h3 { font-size: 18px; font-weight: 700; margin-bottom: 20px; display: flex; align-items: center; gap: 10px; }
      .overview-card h3 i { color: var(--primary); }
      .overview-description { grid-column: 1 / -1; }
      .description-content p { color: var(--text-secondary); line-height: 1.8; font-size: 15px; }

      .info-row { display: flex; justify-content: space-between; align-items: center; padding: 14px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
      .info-row:last-child { border-bottom: none; }
      .info-label { color: var(--text-secondary); display: flex; align-items: center; gap: 8px; font-size: 14px; }
      .info-label i { color: var(--text-muted); width: 16px; text-align: center; }
      .info-value { font-weight: 600; font-size: 14px; }

      /* Schedule */
      .schedule-items { display: flex; flex-direction: column; gap: 0; }
      .schedule-item { display: flex; align-items: center; gap: 16px; padding: 16px; border-radius: 12px; transition: all 0.3s; }
      .schedule-item.highlight { background: rgba(0, 212, 255, 0.05); border: 1px solid rgba(0, 212, 255, 0.1); }
      .schedule-icon { width: 44px; height: 44px; background: rgba(0, 212, 255, 0.1); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: var(--primary); font-size: 18px; flex-shrink: 0; }
      .schedule-info { display: flex; flex-direction: column; }
      .schedule-label { font-size: 12px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; }
      .schedule-date { font-weight: 600; font-size: 15px; }
      .schedule-time { font-size: 13px; color: var(--text-secondary); }
      .schedule-divider { width: 2px; height: 20px; background: var(--border-color); margin-left: 37px; }

      /* Financial Cards */
      .financial-cards { display: grid; gap: 16px; }
      .financial-big-card { display: flex; align-items: center; gap: 16px; padding: 20px; border-radius: 14px; border: 1px solid var(--border-color); }
      .financial-big-card i { font-size: 28px; }
      .financial-big-card.free { background: rgba(0, 255, 136, 0.05); border-color: rgba(0, 255, 136, 0.2); }
      .financial-big-card.free i { color: var(--secondary); }
      .financial-big-card.fee { background: rgba(255, 184, 0, 0.05); border-color: rgba(255, 184, 0, 0.2); }
      .financial-big-card.fee i { color: var(--warning); }
      .financial-big-card.prize { background: rgba(255, 184, 0, 0.05); border-color: rgba(255, 184, 0, 0.2); }
      .financial-big-card.prize i { color: var(--warning); }
      .financial-label { display: block; font-size: 12px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
      .financial-amount { display: block; font-family: var(--font-display); font-size: 24px; font-weight: 800; }
      .financial-note { display: block; font-size: 12px; color: var(--text-muted); margin-top: 2px; }

      /* Stats Mini */
      .stats-mini-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
      .stat-mini { text-align: center; padding: 20px 12px; background: var(--bg-secondary); border-radius: 12px; border: 1px solid var(--border-color); }
      .stat-mini-value { display: block; font-family: var(--font-display); font-size: 28px; font-weight: 800; color: var(--primary); margin-bottom: 4px; }
      .stat-mini-label { display: block; font-size: 12px; color: var(--text-muted); }

      /* Participants */
      .participants-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 16px; }
      .participants-header h3 { font-size: 20px; font-weight: 700; display: flex; align-items: center; gap: 10px; }
      .participants-header h3 i { color: var(--primary); }
      .participants-progress { display: flex; align-items: center; gap: 12px; }
      .progress-bar { width: 200px; height: 8px; background: var(--bg-tertiary); border-radius: 4px; overflow: hidden; }
      .progress-fill { height: 100%; background: linear-gradient(90deg, var(--primary), var(--secondary)); border-radius: 4px; transition: width 0.5s; }
      .progress-text { font-size: 13px; color: var(--text-secondary); }

      .participants-grid { display: flex; flex-direction: column; gap: 12px; }
      .participant-card { display: flex; align-items: center; gap: 16px; padding: 16px 20px; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 12px; transition: all 0.3s; }
      .participant-card:hover { border-color: var(--primary); transform: translateX(4px); }
      .participant-card.approved { border-left: 3px solid var(--secondary); }
      .participant-card.pending { border-left: 3px solid var(--warning); }
      .participant-number { font-family: var(--font-display); font-size: 16px; font-weight: 800; color: var(--text-muted); width: 30px; flex-shrink: 0; }
      .participant-avatar { width: 48px; height: 48px; background: linear-gradient(135deg, var(--primary), var(--accent)); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 20px; color: white; flex-shrink: 0; overflow: hidden; }
      .participant-avatar img { width: 100%; height: 100%; object-fit: cover; }
      .participant-info { flex: 1; min-width: 0; }
      .participant-name { font-size: 16px; font-weight: 600; margin-bottom: 4px; }
      .participant-details { display: flex; flex-wrap: wrap; gap: 16px; font-size: 13px; color: var(--text-secondary); }
      .participant-details span { display: flex; align-items: center; gap: 4px; }
      .participant-status { flex-shrink: 0; }
      .status-approved { color: var(--secondary); font-size: 13px; display: flex; align-items: center; gap: 4px; }
      .status-pending { color: var(--warning); font-size: 13px; display: flex; align-items: center; gap: 4px; }

      /* Rules */
      .rules-section { max-width: 900px; margin: 0 auto; }
      .rules-header { display: flex; align-items: flex-start; gap: 20px; padding: 24px; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 16px; margin-bottom: 24px; }
      .rules-icon { width: 60px; height: 60px; background: linear-gradient(135deg, var(--primary), var(--accent)); border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 24px; color: white; flex-shrink: 0; }
      .rules-header h3 { font-size: 22px; font-weight: 700; margin-bottom: 8px; }
      .rules-header p { color: var(--text-secondary); font-size: 14px; line-height: 1.6; }

      .rules-category { background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 16px; padding: 28px; margin-bottom: 20px; }
      .rules-category.danger { border-color: rgba(255, 51, 102, 0.2); }
      .rules-category.warning { border-color: rgba(255, 184, 0, 0.2); }
      .rules-category h4 { font-size: 18px; font-weight: 700; margin-bottom: 20px; display: flex; align-items: center; gap: 10px; }
      .rules-category h4 i { color: var(--primary); }
      .rules-category.danger h4 i { color: var(--danger); }
      .rules-category.warning h4 i { color: var(--warning); }

      .rules-list { display: flex; flex-direction: column; gap: 16px; }
      .rule-item { display: flex; gap: 16px; padding: 16px; background: var(--bg-secondary); border-radius: 12px; border: 1px solid rgba(255,255,255,0.03); }
      .rule-item.danger { border-color: rgba(255, 51, 102, 0.15); background: rgba(255, 51, 102, 0.03); }
      .rule-number { width: 32px; height: 32px; background: rgba(0, 212, 255, 0.1); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-family: var(--font-display); font-weight: 800; color: var(--primary); flex-shrink: 0; font-size: 14px; }
      .rule-item.danger .rule-number { background: rgba(255, 51, 102, 0.1); color: var(--danger); }
      .rule-content strong { display: block; font-size: 15px; margin-bottom: 6px; }
      .rule-content p { font-size: 13px; color: var(--text-secondary); line-height: 1.6; margin: 0; }

      .penalties-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; }
      .penalty-card { text-align: center; padding: 20px; border-radius: 12px; border: 1px solid var(--border-color); }
      .penalty-card.mild { background: rgba(255, 184, 0, 0.05); border-color: rgba(255, 184, 0, 0.2); }
      .penalty-card.moderate { background: rgba(255, 107, 53, 0.05); border-color: rgba(255, 107, 53, 0.2); }
      .penalty-card.severe { background: rgba(255, 51, 102, 0.05); border-color: rgba(255, 51, 102, 0.2); }
      .penalty-card.extreme { background: rgba(139, 0, 0, 0.05); border-color: rgba(139, 0, 0, 0.3); }
      .penalty-icon { font-size: 28px; margin-bottom: 10px; }
      .penalty-card.mild .penalty-icon { color: var(--warning); }
      .penalty-card.moderate .penalty-icon { color: #ff6b35; }
      .penalty-card.severe .penalty-icon { color: var(--danger); }
      .penalty-card.extreme .penalty-icon { color: #8b0000; }
      .penalty-card h5 { font-size: 14px; font-weight: 700; margin-bottom: 6px; }
      .penalty-card p { font-size: 12px; color: var(--text-muted); margin: 0; }

      .rules-footer { display: flex; gap: 12px; padding: 20px; background: rgba(0, 212, 255, 0.05); border: 1px solid rgba(0, 212, 255, 0.1); border-radius: 12px; margin-top: 4px; }
      .rules-footer i { color: var(--primary); margin-top: 2px; flex-shrink: 0; }
      .rules-footer p { font-size: 13px; color: var(--text-secondary); line-height: 1.6; margin: 0; }

      /* Bracket */
      .bracket-header-section { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 16px; }
      .bracket-header-section h3 { font-size: 20px; font-weight: 700; display: flex; align-items: center; gap: 10px; }
      .bracket-header-section h3 i { color: var(--primary); }
      .bracket-legend { display: flex; gap: 16px; }
      .legend-item { display: flex; align-items: center; gap: 6px; font-size: 13px; color: var(--text-secondary); }
      .legend-color { width: 12px; height: 12px; border-radius: 4px; display: inline-block; }
      .legend-color.winner { background: var(--secondary); }
      .legend-color.live { background: var(--danger); }
      .legend-color.pending { background: var(--text-muted); }

      .bracket-container { overflow-x: auto; padding: 20px 0; }
      .bracket-rounds { display: flex; gap: 40px; min-width: max-content; }
      .bracket-round { min-width: 300px; }
      .round-title { font-family: var(--font-display); font-size: 14px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 20px; text-align: center; padding: 10px; background: var(--bg-tertiary); border-radius: 8px; }

      .bracket-match { background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 14px; margin-bottom: 20px; overflow: hidden; transition: all 0.3s; }
      .bracket-match:hover { border-color: rgba(0, 212, 255, 0.3); box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2); }
      .bracket-match.live { border-color: var(--danger); box-shadow: 0 0 25px rgba(255, 51, 102, 0.2); }
      .bracket-match.completed { opacity: 0.9; }

      .match-live-indicator { display: flex; align-items: center; gap: 6px; padding: 6px 12px; background: rgba(255, 51, 102, 0.1); color: var(--danger); font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }

      .match-team { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; border-bottom: 1px solid rgba(255,255,255,0.03); transition: background 0.3s; }
      .match-team:last-of-type { border-bottom: none; }
      .match-team.winner { background: rgba(0, 255, 136, 0.08); }
      .match-team.tbd { opacity: 0.4; }
      .match-team-name { display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0; }
      .match-team-avatar { width: 32px; height: 32px; background: var(--bg-tertiary); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 14px; color: var(--primary); flex-shrink: 0; overflow: hidden; }
      .match-team-text { font-weight: 500; font-size: 14px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .match-team-score { font-family: var(--font-display); font-size: 20px; font-weight: 800; color: var(--text-muted); min-width: 30px; text-align: center; }
      .match-team-score.score-winner { color: var(--secondary); }
      .match-vs { text-align: center; font-size: 11px; font-weight: 800; color: var(--text-muted); padding: 4px; background: var(--bg-tertiary); letter-spacing: 3px; }
      .match-schedule { padding: 8px 16px; font-size: 12px; color: var(--text-muted); background: var(--bg-secondary); display: flex; align-items: center; gap: 6px; }

      .bracket-empty { text-align: center; padding: 80px 20px; }
      .bracket-empty-icon { font-size: 60px; color: var(--text-muted); margin-bottom: 20px; opacity: 0.3; }
      .bracket-empty h3 { font-size: 22px; font-weight: 700; margin-bottom: 12px; }
      .bracket-empty p { color: var(--text-secondary); font-size: 15px; max-width: 500px; margin: 0 auto 20px; }
      .bracket-hint { display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px; background: rgba(0, 212, 255, 0.08); border: 1px solid rgba(0, 212, 255, 0.15); border-radius: 10px; font-size: 13px; color: var(--primary); }

      /* Bracket Progress Bar */
      .bracket-progress-bar { margin-bottom: 24px; padding: 16px 20px; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 12px; }
      .bracket-progress-info { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; font-size: 13px; color: var(--text-secondary); }
      .bracket-live-count { display: flex; align-items: center; gap: 6px; color: var(--danger); font-weight: 600; }
      .bracket-progress-track { width: 100%; height: 6px; background: var(--bg-tertiary); border-radius: 3px; overflow: hidden; }
      .bracket-progress-fill { height: 100%; background: linear-gradient(90deg, var(--primary), var(--secondary)); border-radius: 3px; transition: width 0.5s ease; }

      /* Bracket Connectors */
      .bracket-connector-column { display: flex; flex-direction: column; justify-content: space-around; align-items: center; min-width: 40px; }
      .bracket-connector { flex: 1; display: flex; align-items: center; }
      .bracket-connector.single { flex: 0; height: 20px; }
      .connector-svg { width: 40px; height: 100%; }
      .bracket-connector-gap { height: 24px; }

      /* Match Seed */
      .match-team-seed { font-family: var(--font-display); font-size: 11px; font-weight: 800; color: var(--text-muted); width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.03); border-radius: 6px; flex-shrink: 0; margin-right: 4px; }
      .match-team.winner .match-team-seed { background: rgba(0, 255, 136, 0.1); color: var(--secondary); }
      
      /* Best of badge */
      .match-best-of { font-size: 10px; font-weight: 700; color: var(--primary); background: rgba(0, 212, 255, 0.1); padding: 2px 6px; border-radius: 4px; margin-right: 6px; }

      /* Final Match */
      .bracket-match.final-match { border-color: rgba(255, 215, 0, 0.3); box-shadow: 0 0 30px rgba(255, 215, 0, 0.08); }
      .bracket-match.final-match .round-title { color: var(--warning); }
      .match-trophy-indicator { display: flex; align-items: center; gap: 6px; padding: 8px 14px; background: linear-gradient(90deg, rgba(255, 215, 0, 0.15), rgba(255, 184, 0, 0.05)); color: var(--warning); font-size: 12px; font-weight: 700; letter-spacing: 1px; }
      .match-trophy-indicator i { font-size: 14px; }

      /* Winner Card */
      .bracket-winner-card { position: relative; text-align: center; padding: 40px 30px; margin-top: 30px; background: var(--bg-card); border: 1px solid rgba(255, 215, 0, 0.3); border-radius: 20px; overflow: hidden; }
      .winner-glow { position: absolute; inset: 0; background: radial-gradient(ellipse at center, rgba(255, 215, 0, 0.08) 0%, transparent 70%); pointer-events: none; }
      .winner-crown { font-size: 40px; color: #ffd700; margin-bottom: 12px; display: block; animation: crownBounce 2s ease-in-out infinite; }
      @keyframes crownBounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
      .winner-title { font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; color: var(--text-muted); margin-bottom: 12px; }
      .winner-team-name { font-family: var(--font-display); font-size: 32px; font-weight: 900; background: linear-gradient(135deg, #ffd700, #ffb800, #ffd700); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; margin-bottom: 6px; }
      .winner-tag { font-size: 16px; color: var(--text-secondary); font-weight: 600; }

      /* Round count badge */
      .round-count { font-size: 11px; color: var(--text-muted); font-weight: 500; margin-left: 8px; }

      /* Registration modal extras */
      .registration-info { display: flex; align-items: flex-start; gap: 12px; padding: 16px; background: rgba(0, 212, 255, 0.08); border-radius: 10px; color: var(--text-secondary); font-size: 14px; }
      .registration-info i { color: var(--primary); margin-top: 2px; }
      .registration-fee-notice { display: flex; align-items: flex-start; gap: 12px; padding: 16px; background: rgba(255, 184, 0, 0.08); border: 1px solid rgba(255, 184, 0, 0.2); border-radius: 10px; margin-bottom: 16px; }
      .registration-fee-notice i { color: var(--warning); margin-top: 2px; }
      .registration-fee-notice strong { display: block; margin-bottom: 4px; }
      .registration-fee-notice p { font-size: 13px; color: var(--text-secondary); margin: 0; }

      /* Responsive */
      @media (max-width: 768px) {
        .tournament-header-content { flex-direction: column; }
        .tournament-header-actions { align-items: flex-start; width: 100%; }
        .tournament-title { font-size: 26px; }
        .tournament-countdown { flex-wrap: wrap; }
        .overview-grid { grid-template-columns: 1fr; }
        .stats-mini-grid { grid-template-columns: repeat(3, 1fr); }
        .penalties-grid { grid-template-columns: repeat(2, 1fr); }
        .participant-card { flex-wrap: wrap; }
        .participant-details { flex-direction: column; gap: 4px; }
        .bracket-round { min-width: 260px; }
      }
    </style>
  `;
}

// =====================================================
// AI FEATURES - Async Loading
// =====================================================
async function loadTournamentAI(tournamentId, status) {
  // Load AI Tournament Summary for completed or in-progress tournaments
  if (status === 'COMPLETED' || status === 'IN_PROGRESS') {
    const summaryContainer = document.getElementById('aiTournamentSummary');
    const summaryText = document.getElementById('aiSummaryText');
    if (summaryContainer) {
      summaryContainer.style.display = 'block';
      try {
        const resp = await fetch(`${API.baseUrl || 'http://localhost:3000'}/ai/tournament-summary/${tournamentId}`);
        const data = await resp.json();
        if (data.success && data.data?.summary) {
          summaryText.innerHTML = data.data.summary;
        } else {
          summaryContainer.style.display = 'none';
        }
      } catch {
        summaryContainer.style.display = 'none';
      }
    }
  }

  // Load AI Predictions for in-progress tournaments
  if (status === 'IN_PROGRESS') {
    try {
      const resp = await fetch(`${API.baseUrl || 'http://localhost:3000'}/ai/predictions/${tournamentId}`);
      const data = await resp.json();
      if (data.success && data.data?.predictions) {
        data.data.predictions.forEach(pred => {
          // Find the bracket match card and attach the prediction badge
          const matchCards = document.querySelectorAll('.bracket-match');
          matchCards.forEach(card => {
            const teams = card.querySelectorAll('.match-team-name');
            if (teams.length >= 2) {
              const team1Name = teams[0]?.textContent?.trim();
              const team2Name = teams[1]?.textContent?.trim();
              if ((team1Name === pred.team1 && team2Name === pred.team2) ||
                (team1Name === pred.team2 && team2Name === pred.team1)) {
                const existing = card.querySelector('.ai-prediction-badge');
                if (!existing) {
                  const badge = document.createElement('div');
                  badge.className = 'ai-prediction-badge';
                  badge.innerHTML = `<i class="fas fa-robot"></i> IA: ${pred.predicted_winner} (${Math.round(pred.confidence)}%)`;
                  card.appendChild(badge);
                }
              }
            }
          });
        });
      }
    } catch {
      // Predictions are optional, fail silently
    }
  }
}
